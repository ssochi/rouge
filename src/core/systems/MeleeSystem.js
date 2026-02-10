/**
 * MeleeSystem — 近战攻击系统
 * 管理攻击状态机、扇形命中检测、刀光VFX
 */
export class MeleeSystem {
    constructor({ player, enemies, breakableObjects, camera, particles, handSystem, particleSpawner }) {
        this.player = player;
        this.enemies = enemies;
        this.breakableObjects = breakableObjects;
        this.camera = camera;
        this.particles = particles;
        this.handSystem = handSystem;
        this.particleSpawner = particleSpawner;

        // Attack state: 'idle' | 'windup' | 'swing' | 'recovery'
        this.attackState = 'idle';
        this.attackTimer = 0;

        // Swing data
        this.aimAngleAtAttack = 0;
        this.swingStartAngle = 0;
        this.swingEndAngle = 0;
        this.swingCurrentAngle = 0;
        this.swingDirection = 1; // Alternates: 1 = CW, -1 = CCW
        this.hitEnemies = [];
        this.prevSwingAngle = 0;

        this.lastAttackTime = 0;
    }

    get isAttacking() {
        return this.attackState !== 'idle';
    }

    getSwingAngle() {
        return this.swingCurrentAngle;
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

        // Alternate swing direction
        this.swingDirection *= -1;

        const halfArc = (weapon.swingArcDegrees || 150) * Math.PI / 180 / 2;
        // Windup pulls back opposite to swing direction
        this.swingStartAngle = this.aimAngleAtAttack - halfArc * this.swingDirection;
        this.swingEndAngle = this.aimAngleAtAttack + halfArc * this.swingDirection;

        // Start from windup position (pulled back)
        const windupPull = 30 * Math.PI / 180;
        this.swingCurrentAngle = this.aimAngleAtAttack - (halfArc + windupPull) * this.swingDirection;
        this.prevSwingAngle = this.swingCurrentAngle;

        this._enterPhase('windup');
        return true;
    }

    cancelAttack() {
        this.attackState = 'idle';
        this.attackTimer = 0;
    }

    update() {
        if (this.attackState === 'idle') return;
        if (this.player.hp <= 0 || this.player.state === 'roll') {
            this.cancelAttack();
            return;
        }

        this.attackTimer++;

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

    _enterPhase(phase) {
        this.attackState = phase;
        this.attackTimer = 0;
    }

    _updateWindup() {
        const weapon = this.handSystem.currentWeapon;
        const frames = weapon.windupFrames || 4;

        // Interpolate from pulled-back position toward swing start
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

        // Ease-out cubic for fast start, slow finish
        const rawT = Math.min(1, this.attackTimer / frames);
        const t = 1 - Math.pow(1 - rawT, 3);

        this.prevSwingAngle = this.swingCurrentAngle;
        this.swingCurrentAngle = this._lerpAngle(this.swingStartAngle, this.swingEndAngle, t);

        // Hit detection
        this._performHitDetection();

        // Slash trail VFX
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
        // Smooth return to current aim angle
        this.swingCurrentAngle = this._lerpAngle(this.swingEndAngle, this.handSystem.angle, t);

        if (this.attackTimer >= frames) {
            this.attackState = 'idle';
            this.attackTimer = 0;
        }
    }

    _performHitDetection() {
        const weapon = this.handSystem.currentWeapon;
        const range = weapon.meleeRange || 52;
        const halfArc = (weapon.meleeArc || 120) * Math.PI / 180 / 2;
        const damage = weapon.damage || 35;
        const kb = weapon.knockback || 6;

        // Check enemies
        for (const enemy of this.enemies) {
            if (enemy.hp <= 0) continue;
            if (this.hitEnemies.includes(enemy)) continue;

            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > range) continue;

            if (this._isInArc(dx, dy, dist, halfArc)) {
                this.hitEnemies.push(enemy);
                const angle = Math.atan2(dy, dx);
                enemy.takeDamage(damage, {
                    x: Math.cos(angle) * kb,
                    y: Math.sin(angle) * kb
                });

                // Blood
                if (this.particleSpawner && this.particleSpawner.spawnBloodSplatter) {
                    this.particleSpawner.spawnBloodSplatter(enemy.x, enemy.y, this.swingCurrentAngle);
                }

                // Hit sparks
                this._spawnHitSparks(enemy.x, enemy.y);

                // Camera shake
                this.camera.x += (Math.random() - 0.5) * 4;
                this.camera.y += (Math.random() - 0.5) * 4;
            }
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
                obj.takeDamage(damage);
                this._spawnHitSparks(cx, cy);
            }
        }
    }

    _isInArc(dx, dy, dist, halfArc) {
        const targetAngle = Math.atan2(dy, dx);
        let diff = targetAngle - this.swingCurrentAngle;
        // Normalize to [-PI, PI]
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return Math.abs(diff) <= halfArc;
    }

    _spawnSlashTrail() {
        const weapon = this.handSystem.currentWeapon;
        const radius = (weapon.meleeRange || 52) * 0.85;

        // Determine draw direction: if swingDirection is -1, arc goes counter-clockwise
        const anticlockwise = this.swingDirection === -1;

        this.particles.push({
            type: 'slash_trail',
            originX: this.player.x,
            originY: this.player.y,
            radius,
            startAngle: this.prevSwingAngle,
            endAngle: this.swingCurrentAngle,
            anticlockwise,
            color: 'rgba(200, 220, 255, 0.7)',
            alpha: 0.7,
            width: 4,
            fadeRate: 0.12,
            life: 8,
            maxLife: 8,
            y: this.player.y // For Y-sort
        });
    }

    _spawnHitSparks(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 10 + Math.floor(Math.random() * 10),
                color: Math.random() > 0.5 ? '#ffffff' : '#f1c40f',
                size: 1 + Math.floor(Math.random() * 3),
                friction: 0.9
            });
        }
    }

    _lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return a + diff * t;
    }
}
