import { CollisionUtils } from '../../utils/CollisionUtils.js';

/**
 * MeleeSystem — 近战攻击系统
 * 管理攻击状态机、扇形/戳刺命中检测、刀光VFX、体力消耗
 */
export class MeleeSystem {
    constructor({ player, enemies, breakableObjects, walls, camera, particles, handSystem, particleSpawner }) {
        this.player = player;
        this.enemies = enemies;
        this.breakableObjects = breakableObjects;
        this.walls = walls || [];
        this.camera = camera;
        this.particles = particles;
        this.handSystem = handSystem;
        this.particleSpawner = particleSpawner;

        // Attack state: 'idle' | 'windup' | 'swing' | 'recovery'
        this.attackState = 'idle';
        this.attackTimer = 0;

        // Swing data (arc attacks)
        this.aimAngleAtAttack = 0;
        this.swingStartAngle = 0;
        this.swingEndAngle = 0;
        this.swingCurrentAngle = 0;
        this.swingDirection = 1; // Alternates: 1 = CW, -1 = CCW
        this.hitEnemies = [];
        this.prevSwingAngle = 0;

        // Thrust data (spear)
        this.isThrust = false;
        this.thrustProgress = 0; // 0 = retracted, 1 = fully extended

        this.lastAttackTime = 0;
    }

    get isAttacking() {
        return this.attackState !== 'idle';
    }

    getSwingAngle() {
        return this.swingCurrentAngle;
    }

    getThrustProgress() {
        return this.thrustProgress;
    }

    tryAttack() {
        const weapon = this.handSystem.currentWeapon;
        if (!weapon || !weapon.isMelee) return false;

        const now = Date.now();
        if (now - this.lastAttackTime < (weapon.fireRate || 400)) return false;

        this.lastAttackTime = now;
        this.aimAngleAtAttack = this.handSystem.angle;
        this.hitEnemies = [];
        this.attackTimer = 0;

        if (weapon.thrustAttack) {
            // Thrust attack (Spear): keep angle fixed, animate extension
            this.isThrust = true;
            this.swingCurrentAngle = this.aimAngleAtAttack;
            this.prevSwingAngle = this.aimAngleAtAttack;
            this.thrustProgress = -0.3; // Pull back slightly
            this._enterPhase('windup');
        } else {
            // Arc attack (Katana, Dagger, Greatsword, Battle Axe)
            this.isThrust = false;
            this.swingDirection *= -1;

            const halfArc = (weapon.swingArcDegrees || 150) * Math.PI / 180 / 2;
            this.swingStartAngle = this.aimAngleAtAttack - halfArc * this.swingDirection;
            this.swingEndAngle = this.aimAngleAtAttack + halfArc * this.swingDirection;

            const windupPull = 30 * Math.PI / 180;
            this.swingCurrentAngle = this.aimAngleAtAttack - (halfArc + windupPull) * this.swingDirection;
            this.prevSwingAngle = this.swingCurrentAngle;
            this._enterPhase('windup');
        }

        return true;
    }

    cancelAttack() {
        this.attackState = 'idle';
        this.attackTimer = 0;
        this.thrustProgress = 0;
    }

    update() {
        if (this.attackState === 'idle') return;
        if (this.player.hp <= 0 || this.player.state === 'roll') {
            this.cancelAttack();
            return;
        }

        this.attackTimer++;

        if (this.isThrust) {
            switch (this.attackState) {
                case 'windup':
                    this._updateThrustWindup();
                    break;
                case 'swing':
                    this._updateThrustSwing();
                    break;
                case 'recovery':
                    this._updateThrustRecovery();
                    break;
            }
        } else {
            switch (this.attackState) {
                case 'windup':
                    this._updateWindup();
                    break;
                case 'swing':
                    this._updateSwing();
                    break;
                case 'recovery':
                    this._updateRecovery();
                    break;
            }
        }
    }

    _enterPhase(phase) {
        this.attackState = phase;
        this.attackTimer = 0;
    }

    // ── Arc attack phases ──

    _updateWindup() {
        const weapon = this.handSystem.currentWeapon;
        const frames = weapon.windupFrames || 4;

        const t = Math.min(1, this.attackTimer / frames);
        this.prevSwingAngle = this.swingCurrentAngle;
        this.swingCurrentAngle = this._lerpAngle(
            this.aimAngleAtAttack - ((weapon.swingArcDegrees || 150) * Math.PI / 180 / 2 + 30 * Math.PI / 180) * this.swingDirection,
            this.swingStartAngle,
            t
        );

        if (this.attackTimer >= frames) {
            this._enterPhase('swing');
            this.prevSwingAngle = this.swingStartAngle;
            this.swingCurrentAngle = this.swingStartAngle;
        }
    }

    _updateSwing() {
        const weapon = this.handSystem.currentWeapon;
        const frames = weapon.swingFrames || 8;

        const rawT = Math.min(1, this.attackTimer / frames);
        const t = 1 - Math.pow(1 - rawT, 3);

        this.prevSwingAngle = this.swingCurrentAngle;
        this.swingCurrentAngle = this._lerpAngle(this.swingStartAngle, this.swingEndAngle, t);

        this._performHitDetection();
        this._spawnSlashTrail();

        if (this.attackTimer >= frames) {
            this._enterPhase('recovery');
        }
    }

    _updateRecovery() {
        const weapon = this.handSystem.currentWeapon;
        const frames = weapon.recoveryFrames || 6;

        const t = Math.min(1, this.attackTimer / frames);
        this.prevSwingAngle = this.swingCurrentAngle;
        this.swingCurrentAngle = this._lerpAngle(this.swingEndAngle, this.handSystem.angle, t);

        if (this.attackTimer >= frames) {
            this.attackState = 'idle';
            this.attackTimer = 0;
        }
    }

    // ── Thrust attack phases (Spear) ──

    _updateThrustWindup() {
        const weapon = this.handSystem.currentWeapon;
        const frames = weapon.windupFrames || 3;

        const t = Math.min(1, this.attackTimer / frames);
        // Pull back from -0.3 to 0
        this.thrustProgress = -0.3 * (1 - t);
        // Keep angle fixed at aim direction
        this.swingCurrentAngle = this.aimAngleAtAttack;

        if (this.attackTimer >= frames) {
            this._enterPhase('swing');
            this.thrustProgress = 0;
        }
    }

    _updateThrustSwing() {
        const weapon = this.handSystem.currentWeapon;
        const frames = weapon.swingFrames || 6;

        // Fast thrust out with ease-out
        const rawT = Math.min(1, this.attackTimer / frames);
        this.thrustProgress = 1 - Math.pow(1 - rawT, 3);
        this.swingCurrentAngle = this.aimAngleAtAttack;

        this._performThrustHitDetection();
        this._spawnThrustTrail();

        if (this.attackTimer >= frames) {
            this._enterPhase('recovery');
        }
    }

    _updateThrustRecovery() {
        const weapon = this.handSystem.currentWeapon;
        const frames = weapon.recoveryFrames || 5;

        const t = Math.min(1, this.attackTimer / frames);
        // Retract from 1 back to 0
        this.thrustProgress = 1 - t;
        this.swingCurrentAngle = this._lerpAngle(this.aimAngleAtAttack, this.handSystem.angle, t);

        if (this.attackTimer >= frames) {
            this.attackState = 'idle';
            this.attackTimer = 0;
            this.thrustProgress = 0;
        }
    }

    // ── Thrust hit detection ──

    _performThrustHitDetection() {
        const weapon = this.handSystem.currentWeapon;
        const range = weapon.meleeRange || 80;
        const thrustWidth = 16; // Width of the thrust corridor (pixels)
        const baseDamage = weapon.damage || 9;
        const kb = weapon.knockback || 3;

        // Current reach based on thrust progress
        const currentReach = range * this.thrustProgress;
        if (currentReach <= 0) return;

        const cosA = Math.cos(this.aimAngleAtAttack);
        const sinA = Math.sin(this.aimAngleAtAttack);

        // Critical hit roll
        let finalDamage = baseDamage;
        let isCritical = false;
        if (weapon.criticalHitChance && Math.random() < weapon.criticalHitChance) {
            finalDamage = baseDamage * (weapon.criticalMultiplier || 3);
            isCritical = true;
        }

        // Check enemies in a narrow corridor along thrust direction
        for (const enemy of this.enemies) {
            if (enemy.hp <= 0) continue;
            if (this.hitEnemies.includes(enemy)) continue;

            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > currentReach) continue;

            // Project onto thrust axis (dot product)
            const along = dx * cosA + dy * sinA;
            if (along < 0) continue; // Behind player

            // Perpendicular distance from thrust line
            const perp = Math.abs(-dx * sinA + dy * cosA);
            if (perp > thrustWidth) continue;

            if (this._isBlockedByWall(enemy.x, enemy.y)) continue;

            this.hitEnemies.push(enemy);
            const angle = Math.atan2(dy, dx);
            enemy.takeDamage(finalDamage, {
                x: Math.cos(this.aimAngleAtAttack) * kb,
                y: Math.sin(this.aimAngleAtAttack) * kb
            });

            // Bleed DOT
            if (weapon.bleedDamage && enemy.hp > 0) {
                enemy.bleedTimer = weapon.bleedDuration || 180;
                enemy.bleedDamage = weapon.bleedDamage;
                enemy.bleedTickInterval = weapon.bleedTickInterval || 20;
                enemy.bleedTickCounter = 0;
            }

            if (this.particleSpawner && this.particleSpawner.spawnBloodSplatter) {
                this.particleSpawner.spawnBloodSplatter(enemy.x, enemy.y, this.aimAngleAtAttack);
            }
            this._spawnHitSparks(enemy.x, enemy.y, isCritical);

            const shakeIntensity = isCritical ? 8 : Math.min(kb, 12) * 0.5;
            this.camera.x += (Math.random() - 0.5) * shakeIntensity;
            this.camera.y += (Math.random() - 0.5) * shakeIntensity;
        }

        // Check breakable objects
        for (const obj of this.breakableObjects) {
            if (obj.isBroken) continue;
            if (this.hitEnemies.includes(obj)) continue;
            if (!obj.takeDamage) continue;

            const hb = obj.getHurtbox ? obj.getHurtbox() : (obj.getHitbox ? obj.getHitbox() : null);
            if (!hb) continue;

            const cx = hb.x + (hb.width || hb.w || 0) / 2;
            const cy = hb.y + (hb.height || hb.h || 0) / 2;
            const dx = cx - this.player.x;
            const dy = cy - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > currentReach) continue;

            const along = dx * cosA + dy * sinA;
            if (along < 0) continue;
            const perp = Math.abs(-dx * sinA + dy * cosA);
            if (perp > thrustWidth) continue;

            this.hitEnemies.push(obj);
            obj.takeDamage(finalDamage);
            this._spawnHitSparks(cx, cy, isCritical);
        }
    }

    // ── Thrust VFX ──

    _spawnThrustTrail() {
        const weapon = this.handSystem.currentWeapon;
        const range = weapon.meleeRange || 80;
        const reach = range * this.thrustProgress;
        if (reach <= 0) return;

        const cosA = Math.cos(this.aimAngleAtAttack);
        const sinA = Math.sin(this.aimAngleAtAttack);

        this.particles.push({
            type: 'thrust_trail',
            startX: this.player.x + cosA * 12,
            startY: this.player.y + sinA * 12,
            endX: this.player.x + cosA * reach,
            endY: this.player.y + sinA * reach,
            color: weapon.slashTrailColor || 'rgba(236, 240, 241, 0.7)',
            alpha: weapon.slashTrailAlpha || 0.7,
            width: weapon.slashTrailWidth || 3,
            fadeRate: 0.15,
            life: 6,
            maxLife: 6,
            y: this.player.y
        });
    }

    // ── Arc attack hit detection ──

    _performHitDetection() {
        const weapon = this.handSystem.currentWeapon;
        const range = weapon.meleeRange || 52;
        const halfArc = (weapon.meleeArc || 120) * Math.PI / 180 / 2;
        const baseDamage = weapon.damage || 35;
        const kb = weapon.knockback || 6;

        // Critical hit roll (Dagger)
        let finalDamage = baseDamage;
        let isCritical = false;
        if (weapon.criticalHitChance && Math.random() < weapon.criticalHitChance) {
            finalDamage = baseDamage * (weapon.criticalMultiplier || 3);
            isCritical = true;
        }

        const hitsThisFrame = [];

        // Check enemies
        for (const enemy of this.enemies) {
            if (enemy.hp <= 0) continue;
            if (this.hitEnemies.includes(enemy)) continue;

            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > range) continue;

            if (this._isInArc(dx, dy, dist, halfArc)) {
                if (this._isBlockedByWall(enemy.x, enemy.y)) continue;

                this.hitEnemies.push(enemy);
                hitsThisFrame.push(enemy);
                const angle = Math.atan2(dy, dx);
                enemy.takeDamage(finalDamage, {
                    x: Math.cos(angle) * kb,
                    y: Math.sin(angle) * kb
                });

                // Bleed DOT (Battle Axe)
                if (weapon.bleedDamage && enemy.hp > 0) {
                    enemy.bleedTimer = weapon.bleedDuration || 180;
                    enemy.bleedDamage = weapon.bleedDamage;
                    enemy.bleedTickInterval = weapon.bleedTickInterval || 20;
                    enemy.bleedTickCounter = 0;
                }

                // Blood
                if (this.particleSpawner && this.particleSpawner.spawnBloodSplatter) {
                    this.particleSpawner.spawnBloodSplatter(enemy.x, enemy.y, this.swingCurrentAngle);
                }

                // Hit sparks
                this._spawnHitSparks(enemy.x, enemy.y, isCritical);

                // Camera shake (scaled by knockback)
                const shakeIntensity = isCritical ? 8 : Math.min(kb, 12) * 0.5;
                this.camera.x += (Math.random() - 0.5) * shakeIntensity;
                this.camera.y += (Math.random() - 0.5) * shakeIntensity;
            }
        }

        // Cleave bonus (Greatsword) — extra damage when hitting 3+ enemies
        if (weapon.cleaveMultiplier && this.hitEnemies.length >= (weapon.cleaveThreshold || 3)) {
            const bonus = Math.floor(finalDamage * weapon.cleaveMultiplier);
            for (const target of hitsThisFrame) {
                if (target.hp > 0 && target.takeDamage) {
                    target.takeDamage(bonus, { x: 0, y: 0 });
                }
            }
            this._spawnCleaveShockwave();
        }

        // Check breakable objects
        for (const obj of this.breakableObjects) {
            if (obj.isBroken) continue;
            if (this.hitEnemies.includes(obj)) continue;
            if (!obj.takeDamage) continue;

            const hb = obj.getHurtbox ? obj.getHurtbox() : (obj.getHitbox ? obj.getHitbox() : null);
            if (!hb) continue;

            const cx = hb.x + (hb.width || hb.w || 0) / 2;
            const cy = hb.y + (hb.height || hb.h || 0) / 2;
            const dx = cx - this.player.x;
            const dy = cy - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > range) continue;

            if (this._isInArc(dx, dy, dist, halfArc)) {
                this.hitEnemies.push(obj);
                obj.takeDamage(finalDamage);
                this._spawnHitSparks(cx, cy, isCritical);
            }
        }
    }

    _isInArc(dx, dy, dist, halfArc) {
        const targetAngle = Math.atan2(dy, dx);
        let diff = targetAngle - this.swingCurrentAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return Math.abs(diff) <= halfArc;
    }

    _spawnSlashTrail() {
        const weapon = this.handSystem.currentWeapon;
        const radius = (weapon.meleeRange || 52) * 0.85;

        const anticlockwise = this.swingDirection === -1;

        this.particles.push({
            type: 'slash_trail',
            originX: this.player.x,
            originY: this.player.y,
            radius,
            startAngle: this.prevSwingAngle,
            endAngle: this.swingCurrentAngle,
            anticlockwise,
            color: weapon.slashTrailColor || 'rgba(200, 220, 255, 0.7)',
            alpha: weapon.slashTrailAlpha || 0.7,
            width: weapon.slashTrailWidth || 4,
            fadeRate: 0.12,
            life: 8,
            maxLife: 8,
            y: this.player.y
        });
    }

    _spawnHitSparks(x, y, isCritical = false) {
        const weapon = this.handSystem.currentWeapon;
        const sparkColors = weapon.hitSparkColors || ['#ffffff', '#f1c40f'];
        const count = isCritical ? 10 : 5;
        const speedMult = isCritical ? 1.5 : 1;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (1 + Math.random() * 3) * speedMult;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 10 + Math.floor(Math.random() * 10),
                color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
                size: isCritical ? 2 + Math.floor(Math.random() * 4) : 1 + Math.floor(Math.random() * 3),
                friction: 0.9
            });
        }
    }

    _spawnCleaveShockwave() {
        this.particles.push({
            type: 'shockwave',
            x: this.player.x,
            y: this.player.y,
            size: 10,
            maxSize: 60,
            color: '#e67e22',
            alpha: 0.6,
            life: 15
        });
    }

    _isBlockedByWall(targetX, targetY) {
        const start = { x: this.player.x, y: this.player.y };
        const end = { x: targetX, y: targetY };

        for (const wall of this.walls) {
            if (CollisionUtils.lineIntersectsRect(start, end, { x: wall.x, y: wall.y, width: wall.w, height: wall.h })) {
                return true;
            }
        }

        for (const obj of this.breakableObjects) {
            if (!obj || obj.isBroken) continue;
            const type = obj.type;
            const baseType = obj.baseType;
            const isWall = type === 'wall' || type === 'wall_h' || type === 'wall_v';
            const isDoor = type === 'door_h' || type === 'door_v' || baseType === 'door_h' || baseType === 'door_v';
            if (!isWall && !isDoor) continue;
            if (isDoor && obj.isOpen) continue;

            const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
            for (const hb of hitboxes) {
                if (CollisionUtils.lineIntersectsRect(start, end, hb)) {
                    return true;
                }
            }
        }

        return false;
    }

    _lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return a + diff * t;
    }
}
