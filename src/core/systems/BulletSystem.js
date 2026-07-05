import { CollisionUtils } from '../../utils/CollisionUtils.js';
import { Turret } from '../entities/Turret.js';

export class BulletSystem {
    constructor({ bullets, particles, enemies, breakableObjects, walls, vehicles, player, camera, handSystem, particleSpawner, statusEffects }) {
        this.bullets = bullets;
        this.particles = particles;
        this.enemies = enemies;
        this.breakableObjects = breakableObjects;
        this.walls = walls;
        this.vehicles = vehicles || [];
        this.player = player;
        this.camera = camera;
        this.handSystem = handSystem;
        this.particleSpawner = particleSpawner;
        this.statusEffects = statusEffects;
        this.obstacleIndex = null;
        // 遗物系统引用（Game 接线后注入）：暴击回血等命中钩子。地牢外为 null。
        this.relicSystem = null;
    }

    setObstacleIndex(index) {
        this.obstacleIndex = index;
    }

    _getPlayerHurtbox() {
        return this.player.getBulletHurtbox
            ? this.player.getBulletHurtbox()
            : {
                x: this.player.x - (this.player.width || 24) / 2,
                y: this.player.y - (this.player.height || 24) / 2,
                width: this.player.width || 24,
                height: this.player.height || 24
            };
    }

    _applyIceShardToPlayer(bullet) {
        const p = this.player;
        p.freezeStacks = (p.freezeStacks || 0) + 1;
        const threshold = bullet.freezeThreshold || 5;
        p.slowTimer = bullet.slowDuration || 90;
        p.slowAmount = Math.min(1.0, p.freezeStacks / threshold);

        if (p.freezeStacks >= threshold) {
            p.frozenTimer = bullet.freezeDuration || 120;
            p.freezeStacks = 0;
            p.slowTimer = 0;
            p.slowAmount = 0;
            for (let k = 0; k < 8; k++) {
                const a = Math.random() * Math.PI * 2;
                this.particles.push({
                    x: p.x + Math.cos(a) * 10,
                    y: p.y + Math.sin(a) * 10,
                    vx: Math.cos(a) * 2.5,
                    vy: Math.sin(a) * 2.5,
                    life: 25,
                    color: '#dfe6e9',
                    size: Math.random() * 4 + 2,
                    friction: 0.88
                });
            }
        }
    }

    _applyEnemyBulletStatusToPlayer(bullet) {
        const p = this.player;
        if (bullet.type === 'flame' && bullet.burnDamage) {
            if (!p.burnTimer || p.burnTimer <= 0) {
                p.burnTimer = bullet.burnDuration;
                p.burnDamage = bullet.burnDamage;
                p.burnTickInterval = bullet.burnTickInterval;
                p.burnTickCounter = 0;
            } else {
                p.burnTimer = Math.max(p.burnTimer, bullet.burnDuration || 0);
            }
        }

        if (bullet.type === 'ice_shard') {
            this._applyIceShardToPlayer(bullet);
        }

        if (bullet.type === 'lightning' && bullet.chainCount > 0) {
            this.statusEffects.chainLightning(this.player, bullet);
        }
    }

    _handleEnemyBulletHitPlayer(bullet, angle) {
        const p = this.player;
        if (p.state === 'roll') return;
        let damage = bullet.damage;
        if (p.frozenTimer > 0 && bullet.type !== 'ice_shard') {
            damage = Math.floor(damage * 1.5);
        }

        const force = 4;
        if (p.takeDamage) {
            p.takeDamage(damage, {
                x: Math.cos(angle) * force,
                y: Math.sin(angle) * force
            });
        } else {
            p.hp -= damage;
        }

        this._applyEnemyBulletStatusToPlayer(bullet);
        this.particleSpawner.spawnBloodSplatter(p.x, p.y, angle);
    }

    fireLaserBeam(weapon, muzzle, options = {}) {
        const source = options.source || 'player';
        const shooter = options.shooter || null;
        const friendlyFire = options.friendlyFire === true;
        const dir = { x: Math.cos(muzzle.angle), y: Math.sin(muzzle.angle) };
        const maxRange = weapon.laserMaxRange || 600;
        let beamDist = maxRange;

        // Find wall hit distance
        for (const wall of this.walls) {
            const d = CollisionUtils.rayRectIntersect(
                muzzle, dir,
                { x: wall.x, y: wall.y, width: wall.w, height: wall.h },
                beamDist
            );
            if (d !== null && d < beamDist) beamDist = d;
        }

        // Vehicles (skip shooter's own vehicle)
        for (const v of this.vehicles) {
            if (v.isDead || v === shooter) continue;
            const vRect = { x: v.x - v.width / 2, y: v.y - v.height / 2, width: v.width, height: v.height };
            const d = CollisionUtils.rayRectIntersect(muzzle, dir, vRect, beamDist);
            if (d !== null && d < beamDist) beamDist = d;
        }

        // Breakable objects
        for (const obj of this.breakableObjects) {
            if (obj.isBroken || obj.noBulletCollision) continue;
            const boxes = obj.getHurtboxes
                ? obj.getHurtboxes()
                : [obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox()];
            const d = CollisionUtils.rayIntersectsRects(muzzle, dir, boxes, beamDist);
            if (d !== null && d < beamDist) {
                beamDist = d;
                obj.takeDamage(weapon.damage);
                if (obj.isBroken) {
                    this.particleSpawner.spawnDebris(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.type);
                    if (obj.type === 'explosive_barrel') {
                        this.statusEffects.spawnExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, 80, 100, 10);
                    }
                }
            }
        }

        // Damage entities along the beam
        const beamEnd = { x: muzzle.x + dir.x * beamDist, y: muzzle.y + dir.y * beamDist };
        const beamP1 = { x: muzzle.x, y: muzzle.y };

        if (source === 'player') {
            for (const e of this.enemies) {
                const eRect = e.getBulletHurtbox
                    ? e.getBulletHurtbox()
                    : { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
                if (eRect && CollisionUtils.lineIntersectsRect(beamP1, beamEnd, eRect)) {
                    const force = 2;
                    if (e.takeDamage) {
                        e.takeDamage(weapon.damage, {
                            x: Math.cos(muzzle.angle) * force,
                            y: Math.sin(muzzle.angle) * force
                        });
                    } else {
                        e.hp -= weapon.damage;
                    }
                    if (e.hp <= 0) {
                        this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                    } else {
                        this.particleSpawner.spawnBloodSplatter(e.x, e.y, muzzle.angle);
                    }
                }
            }
        } else if (source === 'enemy') {
            if (this.player && this.player.state !== 'driving' && this.player.state !== 'roll') {
                const pRect = this._getPlayerHurtbox();
                if (CollisionUtils.lineIntersectsRect(beamP1, beamEnd, pRect)) {
                    this._handleEnemyBulletHitPlayer({
                        ...weapon,
                        type: weapon.bulletType || 'standard',
                        damage: weapon.damage || 10
                    }, muzzle.angle);
                }
            }

            if (friendlyFire) {
                for (const e of this.enemies) {
                    if (!e || e.hp <= 0 || e === shooter) continue;
                    const eRect = e.getBulletHurtbox
                        ? e.getBulletHurtbox()
                        : { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
                    if (!eRect || !CollisionUtils.lineIntersectsRect(beamP1, beamEnd, eRect)) continue;

                    const force = 2;
                    if (e.takeDamage) {
                        e.takeDamage(weapon.damage || 10, {
                            x: Math.cos(muzzle.angle) * force,
                            y: Math.sin(muzzle.angle) * force
                        });
                    } else {
                        e.hp -= weapon.damage || 10;
                    }

                    if (e.hp <= 0) {
                        this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                    } else {
                        this.particleSpawner.spawnBloodSplatter(e.x, e.y, muzzle.angle);
                    }
                }
            }
        }

        // Create beam visual particle
        this.particles.push({
            type: 'laser_beam',
            x1: muzzle.x,
            y1: muzzle.y,
            x2: beamEnd.x,
            y2: beamEnd.y,
            life: weapon.beamDuration || 10,
            maxLife: weapon.beamDuration || 10,
            color: weapon.bulletColor || '#00e5ff'
        });
    }

    update() {
        // Bullet cap: remove oldest enemy bullets when over limit
        const MAX_BULLETS = 500;
        if (this.bullets.length > MAX_BULLETS) {
            let excess = this.bullets.length - MAX_BULLETS;
            for (let i = 0; i < this.bullets.length && excess > 0; i++) {
                if (this.bullets[i].source === 'enemy') {
                    this.bullets[i] = this.bullets[this.bullets.length - 1];
                    this.bullets.pop();
                    excess--;
                    i--; // Re-check swapped element
                }
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];

            // Save previous position for raycasting (Continuous Collision Detection)
            const prevX = b.x;
            const prevY = b.y;

            if (b.gravityZ) {
                // Fake 3D Parabola Physics
                b.vz = (b.vz || 0) - b.gravityZ;
                b.z = (b.z || 0) + b.vz;
            } else if (b.gravity) {
                b.vy += b.gravity;
            }

            b.x += b.vx;
            b.y += b.vy;
            b.life--;

            // === 敌方弹幕运动扩展（仅携带对应字段的子弹生效，对普通弹零开销）===
            // 波浪弹：沿垂直于基向量方向做正弦横移（挺进地牢式蛇形弹）。
            // waveAge 为敌方波浪弹独占字段，避免与玩家武器 M5 波形弹（waveTimer）语义混淆。
            if (b.waveAge !== undefined) {
                b.waveAge++;
                const perpX = -b.waveBaseVY;   // 基向量（单位向量）顺时针 90°
                const perpY = b.waveBaseVX;
                const amp = b.waveAmplitude;
                const freq = b.waveFrequency;
                const delta = (Math.sin(b.waveAge * freq) - Math.sin((b.waveAge - 1) * freq)) * amp;
                b.x += perpX * delta;
                b.y += perpY * delta;
            }

            // 分裂弹：飞行 splitAfter 帧后消失，环形迸发 splitCount 颗普通敌弹（继承 owner）。
            // 排除玩家武器 M4 分裂弹（type==='split'），二者字段语义不同。
            if (b.splitAfter !== undefined && b.type !== 'split') {
                b.splitAge = (b.splitAge || 0) + 1;
                if (b.splitAge >= b.splitAfter) {
                    const n = b.splitCount || 8;
                    const spd = b.splitSpeed || 2.5;
                    const childLife = b.splitChildLife || 90;
                    const childSize = Math.max(2, (b.size || 6) * 0.5);
                    for (let s = 0; s < n; s++) {
                        const a = (s / n) * Math.PI * 2;
                        this.bullets.push({
                            x: b.x, y: b.y,
                            vx: Math.cos(a) * spd,
                            vy: Math.sin(a) * spd,
                            life: childLife,
                            maxLife: childLife,
                            damage: b.splitDamage || b.damage,
                            color: b.color,
                            size: childSize,
                            type: 'standard',
                            source: b.source,
                            owner: b.owner,
                            hitList: []
                        });
                    }
                    // 迸发闪光
                    this.particles.push({ type: 'flash', x: b.x, y: b.y, size: 14, color: b.color, alpha: 0.7, life: 6 });
                    // 移除母弹（swap-pop），跳过本帧后续碰撞
                    this.bullets[i] = this.bullets[this.bullets.length - 1];
                    this.bullets.pop();
                    continue;
                }
            }

            if (b.type === 'rocket') {
                if (Math.random() > 0.5) {
                    this.particles.push({
                        x: b.x,
                        y: b.y,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 20,
                        color: '#95a5a6',
                        size: Math.random() * 4 + 2,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'grenade') {
                if (Math.random() > 0.75) {
                    this.particles.push({
                        x: b.x,
                        y: b.y,
                        vx: (Math.random() - 0.5) * 0.4,
                        vy: (Math.random() - 0.5) * 0.4,
                        life: 12,
                        color: '#7f8c8d',
                        size: Math.random() * 3 + 1.5,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'flame') {
                // Flames decelerate and grow
                b.vx *= 0.97;
                b.vy *= 0.97;
                b.size *= 1.02;
            } else if (b.type === 'black_hole_projectile') {
                // Trail particles
                if (Math.random() > 0.5) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 6,
                        y: b.y + (Math.random() - 0.5) * 6,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 15,
                        color: '#6c3483',
                        size: Math.random() * 3 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'teleport') {
                // Blue trail particles
                if (Math.random() > 0.3) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 4,
                        y: b.y + (Math.random() - 0.5) * 4,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 15,
                        color: '#3498db',
                        size: Math.random() * 3 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'lightning') {
                // Electric spark trail
                if (Math.random() > 0.4) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 6,
                        y: b.y + (Math.random() - 0.5) * 6,
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: (Math.random() - 0.5) * 1.5,
                        life: 10,
                        color: Math.random() > 0.5 ? '#f1c40f' : '#ffffff',
                        size: Math.random() * 2 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'ice_shard') {
                // Ice crystals decelerate
                b.vx *= 0.98;
                b.vy *= 0.98;
                // Ice crystal trail
                if (Math.random() > 0.5) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 4,
                        y: b.y + (Math.random() - 0.5) * 4,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 15,
                        color: Math.random() > 0.5 ? '#a8d8ea' : '#dfe6e9',
                        size: Math.random() * 2 + 1,
                        friction: 0.95
                    });
                }
            } else if (b.type === 'laser_bolt') {
                // Cyan energy trail
                if (Math.random() > 0.4) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 2,
                        y: b.y + (Math.random() - 0.5) * 2,
                        vx: -b.vx * 0.05 + (Math.random() - 0.5) * 0.3,
                        vy: -b.vy * 0.05 + (Math.random() - 0.5) * 0.3,
                        life: 8,
                        color: Math.random() > 0.5 ? '#00e5ff' : '#80f0ff',
                        size: Math.random() * 2 + 1,
                        friction: 0.85
                    });
                }
            } else if (b.type === 'ricochet') {
                // Green trail
                if (Math.random() > 0.6) {
                    this.particles.push({
                        x: b.x, y: b.y,
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3,
                        life: 10,
                        color: '#2ecc71',
                        size: Math.random() * 2 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'boomerang') {
                if (b.phase === 'outgoing') {
                    const dx = b.x - b.startX;
                    const dy = b.y - b.startY;
                    b.distanceTraveled = Math.sqrt(dx * dx + dy * dy);
                    if (b.distanceTraveled >= b.maxDistance) {
                        b.phase = 'returning';
                        b.hitList = []; // Reset to allow hitting on return
                    }
                } else if (b.phase === 'returning') {
                    const returnTarget = (b.source === 'enemy' && b.owner && b.owner.hp > 0)
                        ? b.owner
                        : this.player;
                    if (!returnTarget) {
                        b.life = 0;
                        continue;
                    }

                    const dx = returnTarget.x - b.x;
                    const dy = returnTarget.y - b.y;
                    const angle = Math.atan2(dy, dx);
                    b.vx += Math.cos(angle) * b.returnAccel;
                    b.vy += Math.sin(angle) * b.returnAccel;
                    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    if (speed > 12) {
                        b.vx = (b.vx / speed) * 12;
                        b.vy = (b.vy / speed) * 12;
                    }
                    // Check catch by player
                    const distToPlayer = Math.sqrt(
                        (returnTarget.x - b.x) ** 2 + (returnTarget.y - b.y) ** 2
                    );
                    if (distToPlayer < (b.catchRadius || 16)) {
                        b.life = 0; // Will be removed as expired
                    }
                }
                // Rotation trail
                if (Math.random() > 0.5) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 4,
                        y: b.y + (Math.random() - 0.5) * 4,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 12,
                        color: '#bcaaa4',
                        size: Math.random() * 2 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'plasma') {
                if (Math.random() > 0.3) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 4,
                        y: b.y + (Math.random() - 0.5) * 4,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 12,
                        color: Math.random() > 0.5 ? '#00e676' : '#00e5ff',
                        size: Math.random() * 2 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'homing') {
                // Homing: track nearest enemy
                let nearestEnemy = null;
                let nearestDist = b.homingAcquireRange || 300;
                const targets = b.source === 'player' ? this.enemies : [this.player];
                for (const e of targets) {
                    if (!e || e.hp <= 0) continue;
                    const dx = e.x - b.x;
                    const dy = e.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = e;
                    }
                }
                if (nearestEnemy) {
                    const desiredAngle = Math.atan2(nearestEnemy.y - b.y, nearestEnemy.x - b.x);
                    const currentAngle = Math.atan2(b.vy, b.vx);
                    let angleDiff = desiredAngle - currentAngle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    const turnRate = b.homingTurnRate || 0.06;
                    const turn = Math.max(-turnRate, Math.min(turnRate, angleDiff));
                    const newAngle = currentAngle + turn;
                    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                    b.vx = Math.cos(newAngle) * speed;
                    b.vy = Math.sin(newAngle) * speed;
                }
                // Smoke trail
                if (Math.random() > 0.4) {
                    this.particles.push({
                        x: b.x, y: b.y,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 20,
                        color: '#95a5a6',
                        size: Math.random() * 4 + 2,
                        friction: 0.9
                    });
                }
                if (Math.random() > 0.6) {
                    this.particles.push({
                        x: b.x - b.vx * 0.5,
                        y: b.y - b.vy * 0.5,
                        vx: 0, vy: 0,
                        life: 8,
                        color: '#e74c3c',
                        size: Math.random() * 2 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'acid') {
                b.vx *= 0.99;
                b.vy *= 0.99;
                if (Math.random() > 0.4) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 4,
                        y: b.y + (Math.random() - 0.5) * 4,
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: Math.random() * 0.5 + 0.2,
                        life: 15,
                        color: Math.random() > 0.5 ? '#76ff03' : '#64dd17',
                        size: Math.random() * 2 + 1,
                        friction: 0.95
                    });
                }
            } else if (b.type === 'cluster') {
                if (Math.random() > 0.4) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 4,
                        y: b.y + (Math.random() - 0.5) * 4,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 15,
                        color: Math.random() > 0.5 ? '#ff9800' : '#ffb74d',
                        size: Math.random() * 3 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'force') {
                b.vx *= 0.95;
                b.vy *= 0.95;
                b.size *= 1.03;
                if (Math.random() > 0.3) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 6,
                        y: b.y + (Math.random() - 0.5) * 6,
                        vx: (Math.random() - 0.5) * 1,
                        vy: (Math.random() - 0.5) * 1,
                        life: 8,
                        color: Math.random() > 0.5 ? '#42a5f5' : '#90caf9',
                        size: Math.random() * 3 + 2,
                        friction: 0.85
                    });
                }
            } else if (b.type === 'vampyre') {
                // Blood trail
                if (Math.random() > 0.4) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 4,
                        y: b.y + (Math.random() - 0.5) * 4,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 15,
                        color: Math.random() > 0.5 ? '#e74c3c' : '#8b0000',
                        size: Math.random() * 2 + 1,
                        friction: 0.9
                    });
                }
            } else if (b.type === 'needle') {
                // Metallic trail
                if (Math.random() > 0.6) {
                    this.particles.push({
                        x: b.x, y: b.y,
                        vx: (Math.random() - 0.5) * 0.2,
                        vy: (Math.random() - 0.5) * 0.2,
                        life: 8,
                        color: '#b0bec5',
                        size: 1,
                        friction: 0.9
                    });
                }
            // === NEW MECHANICS: Movement modifiers ===

            // M5: Wave modifier — sine oscillation
            if (b.waveAmplitude) {
                b.waveTimer = (b.waveTimer || 0) + 1;
                const perpAngle = b.waveBaseAngle + Math.PI / 2;
                const offset = Math.sin(b.waveTimer * b.waveFrequency) * b.waveAmplitude;
                const prevOffset = Math.sin((b.waveTimer - 1) * b.waveFrequency) * b.waveAmplitude;
                const delta = offset - prevOffset;
                b.x += Math.cos(perpAngle) * delta;
                b.y += Math.sin(perpAngle) * delta;
            }

            // M2: Mine — state machine
            if (b.type === 'mine') {
                if (b.mineState === 'flying') {
                    // Grenade-like trail
                    if (Math.random() > 0.7) {
                        this.particles.push({
                            x: b.x, y: b.y,
                            vx: (Math.random() - 0.5) * 0.3,
                            vy: (Math.random() - 0.5) * 0.3,
                            life: 10, color: '#7f8c8d',
                            size: Math.random() * 2 + 1, friction: 0.9
                        });
                    }
                } else if (b.mineState === 'armed') {
                    b.vx = 0; b.vy = 0;
                    b.life = Math.max(b.life, 2); // Keep alive while armed
                    // Pulsing red indicator
                    if (Math.random() > 0.7) {
                        this.particles.push({
                            x: b.x + (Math.random() - 0.5) * 4,
                            y: b.y + (Math.random() - 0.5) * 4,
                            vx: 0, vy: -0.3,
                            life: 15, color: '#e74c3c',
                            size: Math.random() * 2 + 1, friction: 0.95
                        });
                    }
                    // Check proximity to enemies
                    const detectR = b.mineDetectRadius || 64;
                    const targets = b.source === 'player' ? this.enemies : [this.player];
                    for (const e of targets) {
                        if (!e || e.hp <= 0) continue;
                        const dx = e.x - b.x;
                        const dy = e.y - b.y;
                        if (dx * dx + dy * dy < detectR * detectR) {
                            b.life = 0; // Trigger despawn → explosion
                            break;
                        }
                    }
                }
            }

            // M3: Sticky — attachment tracking
            if (b.type === 'sticky') {
                if (b.stickyState === 'attached') {
                    b.life = Math.max(b.life, 2); // Keep alive while attached
                    if (b.attachedTo) {
                        if (b.attachedTo.hp <= 0) {
                            b.life = 0; // Host died, explode
                        } else {
                            b.x = b.attachedTo.x;
                            b.y = b.attachedTo.y;
                        }
                    } else if (b.stuckAt) {
                        b.x = b.stuckAt.x;
                        b.y = b.stuckAt.y;
                    }
                    b.vx = 0; b.vy = 0;
                    b.stickyTimer--;
                    // Flashing particles (faster as timer decreases)
                    const flashRate = b.stickyTimer > 60 ? 0.8 : (b.stickyTimer > 30 ? 0.5 : 0.2);
                    if (Math.random() > flashRate) {
                        this.particles.push({
                            x: b.x + (Math.random() - 0.5) * 6,
                            y: b.y + (Math.random() - 0.5) * 6,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: (Math.random() - 0.5) * 0.5,
                            life: 8, color: '#e74c3c',
                            size: Math.random() * 2 + 2, friction: 0.9
                        });
                    }
                    if (b.stickyTimer <= 0) {
                        b.life = 0; // Trigger despawn → explosion
                    }
                } else {
                    // Flying state trail
                    if (Math.random() > 0.6) {
                        this.particles.push({
                            x: b.x, y: b.y,
                            vx: (Math.random() - 0.5) * 0.3,
                            vy: (Math.random() - 0.5) * 0.3,
                            life: 10, color: '#e67e22',
                            size: Math.random() * 2 + 1, friction: 0.9
                        });
                    }
                }
            }

            // M4: Split — timer check
            if (b.type === 'split') {
                b.splitTimer = (b.splitTimer || 0) + 1;
                if (b.splitTimer >= b.splitAfter && b.splitGeneration > 0) {
                    // Spawn sub-bullets
                    const count = b.splitCount || 3;
                    const spreadDeg = b.splitSpread || 60;
                    const spreadRad = spreadDeg * Math.PI / 180;
                    const baseAngle = Math.atan2(b.vy, b.vx);
                    for (let s = 0; s < count; s++) {
                        const angle = baseAngle + (s / (count - 1) - 0.5) * spreadRad;
                        this.bullets.push({
                            x: b.x, y: b.y,
                            vx: Math.cos(angle) * (b.splitBulletSpeed || 10),
                            vy: Math.sin(angle) * (b.splitBulletSpeed || 10),
                            life: b.splitBulletLife || 40,
                            maxLife: b.splitBulletLife || 40,
                            damage: b.splitBulletDamage || b.damage,
                            color: b.color,
                            size: Math.max(2, b.size * 0.7),
                            type: b.splitGeneration > 1 ? 'split' : 'standard',
                            source: b.source, owner: b.owner, team: b.team,
                            hitList: [],
                            // Pass split params for recursive splitting
                            splitAfter: b.splitAfter,
                            splitCount: b.splitCount,
                            splitSpread: b.splitSpread,
                            splitGeneration: b.splitGeneration - 1,
                            splitTimer: 0,
                            splitBulletSpeed: b.splitBulletSpeed,
                            splitBulletLife: b.splitBulletLife,
                            splitBulletDamage: b.splitBulletDamage,
                            // Inherit wave modifier if present
                            waveAmplitude: b.waveAmplitude,
                            waveFrequency: b.waveFrequency,
                            waveTimer: 0,
                            waveBaseAngle: angle
                        });
                    }
                    // Flash at split point
                    this.particles.push({
                        type: 'flash', x: b.x, y: b.y,
                        size: 12, color: b.color, alpha: 0.7, life: 6
                    });
                    b.life = 0; // Remove original bullet
                    continue; // Skip collision for this frame
                }
                // Trail
                if (Math.random() > 0.5) {
                    this.particles.push({
                        x: b.x, y: b.y,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 12, color: b.color,
                        size: Math.random() * 2 + 1, friction: 0.9
                    });
                }
            }

            // M6: Phase bullet trail (ghost effect)
            if (b.phaseThrough) {
                if (Math.random() > 0.5) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 6,
                        y: b.y + (Math.random() - 0.5) * 6,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        life: 15,
                        color: Math.random() > 0.5 ? '#6c5ce7' : '#a29bfe',
                        size: Math.random() * 3 + 1,
                        friction: 0.92
                    });
                }
            }

            // M7: Orbit — circular movement around player
            if (b.type === 'orbit') {
                b.orbitAngle += b.orbitSpeed || 0.08;
                const cx = this.player.x;
                const cy = this.player.y;
                b.x = cx + Math.cos(b.orbitAngle) * b.orbitRadius;
                b.y = cy + Math.sin(b.orbitAngle) * b.orbitRadius;
                b.vx = 0; b.vy = 0; // Override velocity
                // Orbit trail
                if (Math.random() > 0.6) {
                    this.particles.push({
                        x: b.x, y: b.y,
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3,
                        life: 10, color: b.color,
                        size: Math.random() * 2 + 1, friction: 0.9
                    });
                }
            }

            // M11: Meteor — state machine
            if (b.type === 'meteor') {
                if (b.meteorState === 'marking') {
                    // Marker travels to target
                    if (Math.random() > 0.4) {
                        this.particles.push({
                            x: b.x + (Math.random() - 0.5) * 4,
                            y: b.y + (Math.random() - 0.5) * 4,
                            vx: 0, vy: -0.5,
                            life: 15, color: '#e74c3c',
                            size: Math.random() * 2 + 1, friction: 0.9
                        });
                    }
                } else if (b.meteorState === 'waiting') {
                    b.vx = 0; b.vy = 0;
                    b.life = Math.max(b.life, 2);
                    b.meteorDelay--;
                    // Warning circle pulsing
                    if (Math.random() > 0.3) {
                        const a = Math.random() * Math.PI * 2;
                        const r = (b.meteorBlastRadius || 64) * 0.5;
                        this.particles.push({
                            x: b.x + Math.cos(a) * r,
                            y: b.y + Math.sin(a) * r,
                            vx: 0, vy: 0,
                            life: 10, color: '#e74c3c',
                            size: 2, friction: 0.9
                        });
                    }
                    if (b.meteorDelay <= 0) {
                        // Spawn falling meteor(s)
                        const count = b.meteorCount || 1;
                        for (let m = 0; m < count; m++) {
                            const spreadOff = b.meteorSpread ? (Math.random() - 0.5) * b.meteorSpread * 2 : 0;
                            this.bullets.push({
                                x: b.x + spreadOff,
                                y: b.y - 200 + (Math.random() - 0.5) * 20,
                                vx: 0, vy: 15,
                                life: 30, maxLife: 30,
                                damage: b.meteorBlastDamage || 60,
                                color: '#e74c3c',
                                size: 8,
                                type: 'rocket',
                                blastRadius: b.meteorBlastRadius || 128,
                                knockback: 12,
                                source: b.source,
                                owner: b.owner,
                                team: b.team,
                                hitList: []
                            });
                        }
                        b.life = 0;
                    }
                }
            }

            } else if (b.type === 'railgun') {
                // Accelerate
                const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                const maxSpeed = b.railMaxSpeed || 25;
                if (currentSpeed < maxSpeed) {
                    const accel = b.railAccel || 0.35;
                    const angle = Math.atan2(b.vy, b.vx);
                    b.vx += Math.cos(angle) * accel;
                    b.vy += Math.sin(angle) * accel;
                }
                // Dynamic damage based on speed
                const newSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                b.currentDamage = b.damage + Math.floor(newSpeed * (b.railDamageMultiplier || 0.15) * b.damage);
                // Enable piercing at high speed
                if (newSpeed >= (b.railPierceSpeedThreshold || 15) && !b._piercingEnabled) {
                    b.piercing = 3;
                    b._piercingEnabled = true;
                }
                // Electromagnetic trail (intensity scales with speed)
                const trailIntensity = Math.min(1.0, newSpeed / maxSpeed);
                if (Math.random() > (0.7 - trailIntensity * 0.5)) {
                    this.particles.push({
                        x: b.x + (Math.random() - 0.5) * 3,
                        y: b.y + (Math.random() - 0.5) * 3,
                        vx: (Math.random() - 0.5) * trailIntensity,
                        vy: (Math.random() - 0.5) * trailIntensity,
                        life: 10 + Math.floor(trailIntensity * 10),
                        color: Math.random() > 0.5 ? '#00bcd4' : '#4dd0e1',
                        size: Math.random() * 2 + 1 + trailIntensity,
                        friction: 0.9
                    });
                }
            }

            let hit = false;

            if (b.gravityZ) {
                if (b.z <= 0) {
                    hit = true;
                    b.z = 0;
                }
            }

            // Define line segment for this frame
            const p1 = {x: prevX, y: prevY};
            const p2 = {x: b.x, y: b.y};

            // Wall Collision — M6: phase bullets skip wall collision
            if (!b.gravityZ && !b.phaseThrough && b.type !== 'orbit') {
            // Compute bullet path AABB for spatial queries
            const _pMinX = prevX < b.x ? prevX : b.x;
            const _pMinY = prevY < b.y ? prevY : b.y;
            const _pMaxX = prevX > b.x ? prevX : b.x;
            const _pMaxY = prevY > b.y ? prevY : b.y;

            if (this.obstacleIndex) {
                // Broad-phase: spatial index query for nearby walls
                const wallAABB = { x: _pMinX - 1, y: _pMinY - 1, width: _pMaxX - _pMinX + 2, height: _pMaxY - _pMinY + 2 };
                const wallCandidates = this.obstacleIndex.queryRect(wallAABB, { wallsOnly: true });
                for (const entry of wallCandidates) {
                    if (CollisionUtils.lineIntersectsRect(p1, p2, entry.rect)) {
                        if ((b.type === 'ricochet' || b.relicBounce) && b.bounceCount > 0) {
                            const wallLeft = entry.rect.x;
                            const wallRight = entry.rect.x + entry.rect.width;
                            const wallTop = entry.rect.y;
                            const wallBottom = entry.rect.y + entry.rect.height;
                            const wasOutsideX = (prevX <= wallLeft || prevX >= wallRight);
                            const wasOutsideY = (prevY <= wallTop || prevY >= wallBottom);
                            if (wasOutsideX && wasOutsideY) {
                                b.vx = -b.vx;
                                b.vy = -b.vy;
                            } else if (wasOutsideX) {
                                b.vx = -b.vx;
                            } else {
                                b.vy = -b.vy;
                            }
                            b.x = prevX;
                            b.y = prevY;
                            b.bounceCount--;
                            // M9: Bounce Grow — increase damage/size on bounce
                            if (b.bounceGrowDamage) { b.damage *= b.bounceGrowDamage; b.size *= (b.bounceGrowSize || 1); }
                            for (let s = 0; s < 3; s++) {
                                this.particles.push({
                                    x: b.x, y: b.y,
                                    vx: (Math.random() - 0.5) * 3,
                                    vy: (Math.random() - 0.5) * 3,
                                    life: 15,
                                    color: '#2ecc71',
                                    size: Math.random() * 3 + 2,
                                    friction: 0.85
                                });
                            }
                            break;
                        } else {
                            hit = true;
                            break;
                        }
                    }
                }
            } else {
                // Fallback: brute-force wall iteration
                for (const wall of this.walls) {
                    if (CollisionUtils.lineIntersectsRect(p1, p2, {x: wall.x, y: wall.y, width: wall.w, height: wall.h})) {
                        if ((b.type === 'ricochet' || b.relicBounce) && b.bounceCount > 0) {
                            const wallLeft = wall.x;
                            const wallRight = wall.x + wall.w;
                            const wallTop = wall.y;
                            const wallBottom = wall.y + wall.h;
                            const wasOutsideX = (prevX <= wallLeft || prevX >= wallRight);
                            const wasOutsideY = (prevY <= wallTop || prevY >= wallBottom);
                            if (wasOutsideX && wasOutsideY) {
                                b.vx = -b.vx;
                                b.vy = -b.vy;
                            } else if (wasOutsideX) {
                                b.vx = -b.vx;
                            } else {
                                b.vy = -b.vy;
                            }
                            b.x = prevX;
                            b.y = prevY;
                            b.bounceCount--;
                            // M9: Bounce Grow — increase damage/size on bounce
                            if (b.bounceGrowDamage) { b.damage *= b.bounceGrowDamage; b.size *= (b.bounceGrowSize || 1); }
                            for (let s = 0; s < 3; s++) {
                                this.particles.push({
                                    x: b.x, y: b.y,
                                    vx: (Math.random() - 0.5) * 3,
                                    vy: (Math.random() - 0.5) * 3,
                                    life: 15,
                                    color: '#2ecc71',
                                    size: Math.random() * 3 + 2,
                                    friction: 0.85
                                });
                            }
                            break;
                        } else {
                            hit = true;
                            break;
                        }
                    }
                }
            }

            if (!hit) {
                // Vehicle Collision
                for (const v of this.vehicles) {
                    if (v.isDead) continue;
                    // Skip vehicle the player is driving
                    if (b.source === 'player' && v.driver) continue;

                    const vRect = {
                        x: v.x - v.width/2,
                        y: v.y - v.height/2,
                        width: v.width,
                        height: v.height
                    };

                    if (CollisionUtils.lineIntersectsRect(p1, p2, vRect)) {
                        hit = true;

                        if (b.type !== 'rocket' && b.type !== 'grenade' && b.type !== 'homing') {
                            this.particles.push({
                                x: b.x,
                                y: b.y,
                                vx: (Math.random() - 0.5) * 2,
                                vy: (Math.random() - 0.5) * 2,
                                life: 20,
                                color: '#bdc3c7',
                                size: Math.random() * 3 + 1,
                                type: 'particle'
                            });

                            if (v.takeDamage) {
                                v.takeDamage(b.damage);
                            }
                        }
                        break;
                    }
                }
            }

            if (!hit) {
                // Breakable Object Collision
                let candidateObjects = [];
                if (this.obstacleIndex) {
                    // Broad-phase: spatial index query with padding for hurtbox extent
                    const objAABB = { x: _pMinX - 16, y: _pMinY - 16, width: _pMaxX - _pMinX + 32, height: _pMaxY - _pMinY + 32 };
                    const objCandidates = this.obstacleIndex.queryRect(objAABB, { objectsOnly: true });
                    const seenObjects = new Set();

                    for (const entry of objCandidates) {
                        const obj = entry.object;
                        if (!obj || obj.isBroken || seenObjects.has(obj)) continue;
                        seenObjects.add(obj);
                        candidateObjects.push(obj);
                    }

                    // Objects with zero movement hitboxes are not indexed.
                    // Include them via hurtbox AABB test to keep bullet collision complete.
                    for (const obj of this.breakableObjects) {
                        if (!obj || obj.isBroken || obj.noBulletCollision || seenObjects.has(obj)) continue;
                        const hurtboxes = obj.getHurtboxes
                            ? obj.getHurtboxes()
                            : [obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox()];

                        for (const box of hurtboxes) {
                            const bw = box.width ?? box.w ?? 0;
                            const bh = box.height ?? box.h ?? 0;
                            if (bw <= 0 || bh <= 0) continue;
                            if (box.x > objAABB.x + objAABB.width || box.x + bw < objAABB.x ||
                                box.y > objAABB.y + objAABB.height || box.y + bh < objAABB.y) {
                                continue;
                            }
                            candidateObjects.push(obj);
                            seenObjects.add(obj);
                            break;
                        }
                    }
                } else {
                    candidateObjects = this.breakableObjects;
                }

                for (const obj of candidateObjects) {
                    if (!obj || obj.isBroken || obj.noBulletCollision) continue;
                    const hurtboxes = obj.getHurtboxes
                        ? obj.getHurtboxes()
                        : [obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox()];

                    let intersectedBox = null;
                    for (const box of hurtboxes) {
                        const bw = box.width ?? box.w ?? 0;
                        const bh = box.height ?? box.h ?? 0;
                        if (bw <= 0 || bh <= 0) continue;
                        const normBox = {
                            x: box.x,
                            y: box.y,
                            width: bw,
                            height: bh
                        };
                        if (CollisionUtils.lineIntersectsRect(p1, p2, normBox)) {
                            intersectedBox = normBox;
                            break;
                        }
                    }

                    if (intersectedBox) {
                        if ((b.type === 'ricochet' || b.relicBounce) && b.bounceCount > 0) {
                            const boxLeft = intersectedBox.x;
                            const boxRight = intersectedBox.x + intersectedBox.width;
                            const boxTop = intersectedBox.y;
                            const boxBottom = intersectedBox.y + intersectedBox.height;
                            const wasOutsideX = (prevX <= boxLeft || prevX >= boxRight);
                            const wasOutsideY = (prevY <= boxTop || prevY >= boxBottom);
                            if (wasOutsideX && wasOutsideY) {
                                b.vx = -b.vx;
                                b.vy = -b.vy;
                            } else if (wasOutsideX) {
                                b.vx = -b.vx;
                            } else {
                                b.vy = -b.vy;
                            }
                            b.x = prevX;
                            b.y = prevY;
                            b.bounceCount--;
                            // M9: Bounce Grow — increase damage/size on bounce
                            if (b.bounceGrowDamage) { b.damage *= b.bounceGrowDamage; b.size *= (b.bounceGrowSize || 1); }
                            obj.takeDamage(b.damage);
                            if (obj.isBroken) {
                                this.particleSpawner.spawnDebris(obj.x + obj.width/2, obj.y + obj.height/2, obj.type);
                                if (obj.type === 'explosive_barrel') {
                                    this.statusEffects.spawnExplosion(obj.x + obj.width/2, obj.y + obj.height/2, 80, 100, 10);
                                }
                            }
                            for (let s = 0; s < 3; s++) {
                                this.particles.push({
                                    x: b.x, y: b.y,
                                    vx: (Math.random() - 0.5) * 3,
                                    vy: (Math.random() - 0.5) * 3,
                                    life: 15,
                                    color: '#2ecc71',
                                    size: Math.random() * 3 + 2,
                                    friction: 0.85
                                });
                            }
                            break;
                        } else {
                            hit = true;
                            if (b.type !== 'rocket' && b.type !== 'grenade') {
                                obj.takeDamage(b.damage);
                                if (obj.isBroken) {
                                    this.particleSpawner.spawnDebris(obj.x + obj.width/2, obj.y + obj.height/2, obj.type);
                                    if (obj.type === 'explosive_barrel') {
                                        this.statusEffects.spawnExplosion(obj.x + obj.width/2, obj.y + obj.height/2, 80, 100, 10);
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
            }

            // Entity Collision
            if (!hit) {
                if (b.source === 'player') {
                    // Check Enemies
                    for (let j = this.enemies.length - 1; j >= 0; j--) {
                        const e = this.enemies[j];
                        if (Array.isArray(b.hitList) && b.hitList.includes(e)) continue;
                        const eRect = e.getBulletHurtbox
                            ? e.getBulletHurtbox()
                            : {
                                x: e.x - e.width / 2,
                                y: e.y - e.height,
                                width: e.width,
                                height: e.height
                            };

                        if (eRect && CollisionUtils.lineIntersectsRect(p1, p2, eRect)) {
                            // M3: Sticky — attach to enemy instead of dealing damage
                            if (b.type === 'sticky' && b.stickyState === 'flying') {
                                b.stickyState = 'attached';
                                b.attachedTo = e;
                                hit = false;
                                break;
                            }

                            // M12: Grapple (enemy pull mode) — pull enemy toward player
                            if (b.type === 'grapple' && b.grapplePull === 'enemy') {
                                const pullAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                                const pullForce = b.grappleSpeed || 8;
                                e.knockbackX = (e.knockbackX || 0) + Math.cos(pullAngle) * pullForce * 3;
                                e.knockbackY = (e.knockbackY || 0) + Math.sin(pullAngle) * pullForce * 3;
                                if (e.takeDamage) e.takeDamage(b.damage, { x: 0, y: 0 });
                                hit = true;
                                break;
                            }

                            if (b.type !== 'rocket' && b.type !== 'grenade' && b.type !== 'homing' && b.type !== 'mine' && b.type !== 'meteor') {
                                const angle = Math.atan2(b.vy, b.vx);
                                // 巨人腰带：叠加遗物专用击退（不影响武器自带击退手感）
                                const force = (b.type === 'flame' || b.type === 'ice_shard' ? 0.5 : 4) + (b.relicKnockback || 0);
                                // Use dynamic damage for railgun
                                let finalDamage = b.type === 'railgun' ? (b.currentDamage || b.damage) : b.damage;
                                // Frozen damage multiplier
                                if (e.frozenTimer > 0 && b.type !== 'ice_shard') {
                                    finalDamage = Math.floor(finalDamage * 1.5);
                                }
                                // 深渊之眼：对满血敌人伤害倍率（命中扣血前判定）
                                if (b.firstStrikeMult && e.maxHp && e.hp === e.maxHp) {
                                    finalDamage = Math.round(finalDamage * b.firstStrikeMult);
                                }
                                if (e.takeDamage) {
                                    e.takeDamage(finalDamage, {
                                        x: Math.cos(angle) * force,
                                        y: Math.sin(angle) * force
                                    });
                                } else {
                                     e.hp -= finalDamage;
                                }

                                // 血牙冠冕：暴击命中回血（经遗物钩子）
                                if (b.isCrit && this.relicSystem) {
                                    this.relicSystem.onCritHit();
                                }

                                if (b.source === 'player') this.soundSystem?.play(b.isCrit ? 'hit_crit' : 'hit_flesh', { x: e.x, y: e.y }); // [audio-p1] 命中/暴击音

                                // Burn DOT（flame 武器或遗物余烬弹头）
                                if (b.burnDamage) {
                                    if (!e.burnTimer || e.burnTimer <= 0) {
                                        e.burnTimer = b.burnDuration;
                                        e.burnDamage = b.burnDamage;
                                        e.burnTickInterval = b.burnTickInterval;
                                        e.burnTickCounter = 0;
                                    } else {
                                        e.burnTimer = Math.max(e.burnTimer, b.burnDuration);
                                    }
                                }

                                // Lightning: chain to nearby enemies
                                if (b.type === 'lightning' && b.chainCount > 0) {
                                    this.statusEffects.chainLightning(e, b);
                                }

                                // Acid: apply poison DOT
                                if (b.type === 'acid' && b.poisonDamage) {
                                    if (!e.poisonTimer || e.poisonTimer <= 0) {
                                        e.poisonTimer = b.poisonDuration;
                                        e.poisonDamage = b.poisonDamage;
                                        e.poisonTickInterval = b.poisonTickInterval;
                                        e.poisonTickCounter = 0;
                                    } else {
                                        e.poisonTimer = Math.max(e.poisonTimer, b.poisonDuration);
                                    }
                                }

                                // Force: apply massive knockback + wall slam check
                                if (b.type === 'force') {
                                    const forceAngle = Math.atan2(b.vy, b.vx);
                                    const kbForce = b.knockback || 18;
                                    e.knockbackX = (e.knockbackX || 0) + Math.cos(forceAngle) * kbForce;
                                    e.knockbackY = (e.knockbackY || 0) + Math.sin(forceAngle) * kbForce;
                                    e._forceWallSlamCheck = 10;
                                    e._forceWallSlamDamage = b.wallSlamDamage || 15;
                                }

                                // Ice shard / 遗物霜寒弹头: stackable slow + freeze
                                if (b.type === 'ice_shard' || b.applyFreezeStack) {
                                    e.freezeStacks = (e.freezeStacks || 0) + 1;
                                    const threshold = b.freezeThreshold || 5;
                                    e.slowTimer = b.slowDuration || 90;
                                    e.slowAmount = Math.min(1.0, e.freezeStacks / threshold);
                                    if (e.freezeStacks >= threshold) {
                                        e.frozenTimer = b.freezeDuration || 120;
                                        e.freezeStacks = 0;
                                        e.slowTimer = 0;
                                        e.slowAmount = 0;
                                        // Freeze burst particles
                                        for (let k = 0; k < 8; k++) {
                                            const a = Math.random() * Math.PI * 2;
                                            this.particles.push({
                                                x: e.x + Math.cos(a) * 10,
                                                y: e.y + Math.sin(a) * 10,
                                                vx: Math.cos(a) * 2.5,
                                                vy: Math.sin(a) * 2.5,
                                                life: 25,
                                                color: '#dfe6e9',
                                                size: Math.random() * 4 + 2,
                                                friction: 0.88
                                            });
                                        }
                                    }
                                }

                                // Vampyre: lifesteal
                                if (b.type === 'vampyre' && b.source === 'player') {
                                    const healAmt = Math.min(
                                        Math.floor(finalDamage * (b.lifestealPercent || 0.25)),
                                        b.lifestealCap || 10
                                    );
                                    const pl = this.player;
                                    if (pl.hp < (pl.maxHp || 100)) {
                                        pl.hp = Math.min(pl.maxHp || 100, pl.hp + healAmt);
                                        for (let h = 0; h < 3; h++) {
                                            const ha = Math.random() * Math.PI * 2;
                                            this.particles.push({
                                                x: e.x + Math.cos(ha) * 5,
                                                y: e.y + Math.sin(ha) * 5,
                                                vx: (pl.x - e.x) * 0.05 + (Math.random() - 0.5),
                                                vy: (pl.y - e.y) * 0.05 + (Math.random() - 0.5),
                                                life: 20,
                                                color: '#2ecc71',
                                                size: 2,
                                                friction: 0.92
                                            });
                                        }
                                    }
                                }

                                // Needle: embed in enemy
                                if (b.type === 'needle' && b.source === 'player') {
                                    const maxStacks = b.needleMaxStacks || 6;
                                    e.needleStacks = (e.needleStacks || 0);
                                    if (e.needleStacks < maxStacks) {
                                        e.needleStacks++;
                                        e.needleDamage = b.needleDamage || 4;
                                        e.needleTickInterval = b.needleTickInterval || 15;
                                        e.needleTimer = Math.max(e.needleTimer || 0, b.needleDuration || 150);
                                        e.needleTickCounter = e.needleTickCounter || 0;
                                    }
                                }

                                if (e.hp <= 0) {
                                    this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                                    // M10: Chain Explosion — enemy death triggers chain explosion
                                    if (b.chainExplosion && (b.chainDepth || 0) < (b.chainMaxDepth || 3)) {
                                        const chainDmg = Math.floor((b.chainBlastRadius ? b.damage : 30) * Math.pow(0.5, b.chainDepth || 0));
                                        this.statusEffects.spawnExplosion(e.x, e.y, chainDmg, b.chainBlastRadius || 64, 6);
                                        // Mark nearby enemies for chain tracking
                                        for (const other of this.enemies) {
                                            if (other === e || other.hp <= 0) continue;
                                            const cdx = other.x - e.x;
                                            const cdy = other.y - e.y;
                                            if (cdx * cdx + cdy * cdy < (b.chainBlastRadius || 64) * (b.chainBlastRadius || 64)) {
                                                other._chainExplosionPending = {
                                                    depth: (b.chainDepth || 0) + 1,
                                                    maxDepth: b.chainMaxDepth || 3,
                                                    blastRadius: b.chainBlastRadius || 64,
                                                    baseDamage: b.damage
                                                };
                                            }
                                        }
                                    }
                                } else {
                                    this.particleSpawner.spawnBloodSplatter(e.x, e.y, angle);
                                }
                            }

                            // M6: Phase bullets pass through everything
                            if (b.phaseThrough) {
                                if (!Array.isArray(b.hitList)) b.hitList = [];
                                b.hitList.push(e);
                                b.phasePierceCount = (b.phasePierceCount || 0) + 1;
                                // Damage gain per pierce
                                if (b.phaseDamageGain > 0) {
                                    b.damage = Math.floor(b.damage * (1 + b.phaseDamageGain));
                                }
                                // Apply slow to pierced enemy
                                if (b.phaseSlowAmount > 0) {
                                    e.slowTimer = Math.max(e.slowTimer || 0, 60);
                                    e.slowAmount = Math.max(e.slowAmount || 0, b.phaseSlowAmount);
                                }
                            } else if (b.piercing > 0) {
                                if (!Array.isArray(b.hitList)) b.hitList = [];
                                b.hitList.push(e);
                                b.piercing--;
                                b.damage *= 0.6;
                            } else if (b.type === 'boomerang') {
                                // Boomerang penetrates through enemies
                                if (!Array.isArray(b.hitList)) b.hitList = [];
                                b.hitList.push(e);
                            } else if ((b.type === 'ricochet' || b.relicBounce) && b.bounceCount > 0) {
                                // Ricochet bounces off enemies
                                if (!Array.isArray(b.hitList)) b.hitList = [];
                                b.hitList.push(e);
                                // Reflect off enemy surface
                                const nx = b.x - e.x;
                                const ny = b.y - e.y;
                                const nd = Math.sqrt(nx * nx + ny * ny) || 1;
                                const nnx = nx / nd;
                                const nny = ny / nd;
                                const dot = b.vx * nnx + b.vy * nny;
                                b.vx = b.vx - 2 * dot * nnx;
                                b.vy = b.vy - 2 * dot * nny;
                                b.bounceCount--;
                            // M9: Bounce Grow — increase damage/size on bounce
                            if (b.bounceGrowDamage) { b.damage *= b.bounceGrowDamage; b.size *= (b.bounceGrowSize || 1); }
                                // Bounce spark
                                for (let s = 0; s < 3; s++) {
                                    this.particles.push({
                                        x: b.x, y: b.y,
                                        vx: (Math.random() - 0.5) * 3,
                                        vy: (Math.random() - 0.5) * 3,
                                        life: 15,
                                        color: '#2ecc71',
                                        size: Math.random() * 3 + 2,
                                        friction: 0.85
                                    });
                                }
                            } else {
                                hit = true;
                            }
                            break;
                        }
                    }
                } else if (b.source === 'enemy') {
                    // Check Player
                    const p = this.player;

                    // If Player is Driving or Rolling, skip bullet hit
                    if (p.state === 'driving' || p.state === 'roll') {
                        continue;
                    }

                    const pRect = p.getBulletHurtbox
                        ? p.getBulletHurtbox()
                        : {
                            x: p.x - (p.width || 24) / 2,
                            y: p.y - (p.height || 24) / 2,
                            width: p.width || 24,
                            height: p.height || 24
                        };

                    const alreadyHitPlayer = Array.isArray(b.hitList) && b.hitList.includes(p);
                    if (!alreadyHitPlayer && CollisionUtils.lineIntersectsRect(p1, p2, pRect)) {
                        const angle = Math.atan2(b.vy, b.vx);
                        if (b.type !== 'rocket' && b.type !== 'grenade' && b.type !== 'homing') {
                            this._handleEnemyBulletHitPlayer(b, angle);
                        }

                        if (b.piercing > 0) {
                            if (!Array.isArray(b.hitList)) b.hitList = [];
                            b.hitList.push(p);
                            b.piercing--;
                            b.damage *= 0.6;
                        } else if (b.type === 'boomerang') {
                            if (!Array.isArray(b.hitList)) b.hitList = [];
                            b.hitList.push(p);
                        } else if ((b.type === 'ricochet' || b.relicBounce) && b.bounceCount > 0) {
                            if (!Array.isArray(b.hitList)) b.hitList = [];
                            b.hitList.push(p);
                            const nx = b.x - p.x;
                            const ny = b.y - p.y;
                            const nd = Math.sqrt(nx * nx + ny * ny) || 1;
                            const nnx = nx / nd;
                            const nny = ny / nd;
                            const dot = b.vx * nnx + b.vy * nny;
                            b.vx = b.vx - 2 * dot * nnx;
                            b.vy = b.vy - 2 * dot * nny;
                            b.bounceCount--;
                            // M9: Bounce Grow — increase damage/size on bounce
                            if (b.bounceGrowDamage) { b.damage *= b.bounceGrowDamage; b.size *= (b.bounceGrowSize || 1); }
                            for (let s = 0; s < 3; s++) {
                                this.particles.push({
                                    x: b.x, y: b.y,
                                    vx: (Math.random() - 0.5) * 3,
                                    vy: (Math.random() - 0.5) * 3,
                                    life: 15,
                                    color: '#e74c3c',
                                    size: Math.random() * 3 + 2,
                                    friction: 0.85
                                });
                            }
                        } else {
                            hit = true;
                        }
                    }
                }
            }

            }
            // M2: Mine — transition from flying to armed on landing
            if (b.type === 'mine' && b.mineState === 'flying' && b.gravityZ && b.z <= 0) {
                b.mineState = 'armed';
                b.z = 0;
                b.vx = 0; b.vy = 0; b.vz = 0;
                hit = false; // Don't remove, enter armed state
            }

            // M3: Sticky — attach on hit (handled here before removal)
            if (b.type === 'sticky' && b.stickyState === 'flying' && hit) {
                b.stickyState = 'attached';
                if (!b.stuckAt) b.stuckAt = { x: b.x, y: b.y };
                hit = false; // Don't remove, enter attached state
            }

            // M11: Meteor — transition from marking to waiting on hit
            if (b.type === 'meteor' && b.meteorState === 'marking' && (hit || expired)) {
                b.meteorState = 'waiting';
                b.meteorDelay = b.meteorDelay || 90;
                hit = false; // Don't remove
            }

            // M12: Grapple — on wall hit, pull player
            if (b.type === 'grapple' && hit) {
                if (b.grapplePull === 'player' || !b.grapplePull) {
                    // Set grapple target on player
                    this.player._grappleTarget = { x: b.x, y: b.y };
                    this.player._grappleSpeed = b.grappleSpeed || 8;
                }
            }

            const expired = b.life <= 0;
                if (hit || expired) {
                    // M2: Mine explodes
                    if (b.type === 'mine' && b.mineState === 'armed') {
                        this.statusEffects.spawnExplosion(b.x, b.y, b.mineBlastDamage, b.mineBlastRadius, 8);
                    }
                    // M3: Sticky explodes
                    if (b.type === 'sticky' && b.stickyState === 'attached') {
                        this.statusEffects.spawnExplosion(b.x, b.y, b.stickyBlastDamage, b.stickyBlastRadius, 6);
                    }

                    if (hit && b.type === 'rocket') {
                        this.statusEffects.spawnExplosion(b.x, b.y, b.damage, b.blastRadius, b.knockback);
                    } else if (b.type === 'grenade') {
                        this.statusEffects.spawnExplosion(b.x, b.y, b.damage, b.blastRadius, b.knockback);
                    } else if (b.type === 'black_hole_projectile') {
                        this.statusEffects.spawnBlackHole(b);
                    } else if (b.type === 'teleport') {
                        if (b.source === 'player') {
                            this.statusEffects.teleportPlayer(b);
                        } else if (b.source === 'enemy' && b.owner && b.owner.hp > 0) {
                            this.statusEffects.teleportEntity(b.owner, b);
                        }
                    } else if (b.type === 'homing') {
                        this.statusEffects.spawnExplosion(b.x, b.y, b.damage, b.blastRadius || 48, b.knockback || 6);
                    } else if (b.type === 'acid') {
                        this.statusEffects.spawnAcidPuddle(b.x, b.y, b);
                    } else if (b.type === 'cluster') {
                        // Spawn fragments in radial pattern
                        const count = b.fragmentCount || 8;
                        for (let f = 0; f < count; f++) {
                            const angle = (Math.PI * 2 / count) * f + (Math.random() - 0.5) * 0.3;
                            this.bullets.push({
                                x: b.x, y: b.y,
                                vx: Math.cos(angle) * (b.fragmentSpeed || 8),
                                vy: Math.sin(angle) * (b.fragmentSpeed || 8),
                                life: b.fragmentLife || 20,
                                maxLife: b.fragmentLife || 20,
                                damage: b.fragmentDamage || 6,
                                color: '#ffb74d',
                                size: b.fragmentSize || 3,
                                type: 'standard',
                                source: b.source,
                                owner: b.owner,
                                team: b.team,
                                hitList: []
                            });
                        }
                        // Burst flash
                        this.particles.push({
                            type: 'flash',
                            x: b.x, y: b.y,
                            size: 20,
                            color: '#ff9800',
                            alpha: 0.8,
                            life: 8
                        });
                        for (let s = 0; s < 6; s++) {
                            const a = Math.random() * Math.PI * 2;
                            this.particles.push({
                                x: b.x, y: b.y,
                                vx: Math.cos(a) * (Math.random() * 3 + 1),
                                vy: Math.sin(a) * (Math.random() * 3 + 1),
                                life: 12,
                                color: '#ffb74d',
                                size: Math.random() * 2 + 1,
                                friction: 0.9
                            });
                        }
                    } else if (b.type === 'turret_deploy') {
                        // Spawn defense turret at impact location
                        const turret = new Turret(
                            b.x - 12, b.y - 12,  // Center turret on impact point
                            this.enemies, this.bullets, this.particles
                        );
                        // Enforce turret limit
                        Turret.enforceTurretLimit(this.breakableObjects);
                        this.breakableObjects.push(turret);
                        // Deploy flash effect
                        this.particles.push({
                            type: 'flash',
                            x: b.x, y: b.y,
                            size: 16,
                            color: '#00b894',
                            alpha: 0.8,
                            life: 10
                        });
                        for (let s = 0; s < 8; s++) {
                            const a = Math.random() * Math.PI * 2;
                            this.particles.push({
                                x: b.x, y: b.y,
                                vx: Math.cos(a) * (Math.random() * 2 + 1),
                                vy: Math.sin(a) * (Math.random() * 2 + 1),
                                life: 20,
                                color: Math.random() > 0.5 ? '#00b894' : '#55efc4',
                                size: Math.random() * 3 + 1,
                                friction: 0.9
                            });
                        }
                    }
                    this.bullets[i] = this.bullets[this.bullets.length - 1];
                    this.bullets.pop();
                }
        }
    }
}
