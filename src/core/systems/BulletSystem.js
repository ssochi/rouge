import { CollisionUtils } from '../../utils/CollisionUtils.js';

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
    }

    fireLaserBeam(weapon, muzzle) {
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

        // Vehicles
        for (const v of this.vehicles) {
            if (v.isDead) continue;
            const vRect = { x: v.x - v.width / 2, y: v.y - v.height / 2, width: v.width, height: v.height };
            const d = CollisionUtils.rayRectIntersect(muzzle, dir, vRect, beamDist);
            if (d !== null && d < beamDist) beamDist = d;
        }

        // Breakable objects
        for (const obj of this.breakableObjects) {
            if (obj.isBroken) continue;
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

        // Damage all enemies along the beam
        const beamEnd = { x: muzzle.x + dir.x * beamDist, y: muzzle.y + dir.y * beamDist };
        const beamP1 = { x: muzzle.x, y: muzzle.y };
        for (const e of this.enemies) {
            const eRect = e.getBulletHurtbox
                ? e.getBulletHurtbox()
                : { x: e.x - e.width / 2, y: e.y - e.height, width: e.width, height: e.height };
            if (CollisionUtils.lineIntersectsRect(beamP1, beamEnd, eRect)) {
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
                    const dx = this.player.x - b.x;
                    const dy = this.player.y - b.y;
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
                        (this.player.x - b.x) ** 2 + (this.player.y - b.y) ** 2
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

            // Wall Collision
            if (!b.gravityZ) {
            for (const wall of this.walls) {
                // Check if line segment intersects wall rect
                if (CollisionUtils.lineIntersectsRect(p1, p2, {x: wall.x, y: wall.y, width: wall.w, height: wall.h})) {
                    if (b.type === 'ricochet' && b.bounceCount > 0) {
                        // Reflect off wall
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
                        break;
                    } else {
                        hit = true;
                        break;
                    }
                }
            }

            if (!hit) {
                // Vehicle Collision
                for (const v of this.vehicles) {
                    if (v.isDead) continue;

                    const vRect = {
                        x: v.x - v.width/2,
                        y: v.y - v.height/2,
                        width: v.width,
                        height: v.height
                    };

                    if (CollisionUtils.lineIntersectsRect(p1, p2, vRect)) {
                        hit = true;

                        if (b.type !== 'rocket' && b.type !== 'grenade') {
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
                for (const obj of this.breakableObjects) {
                    if (obj.isBroken) continue;
                    const hurtboxes = obj.getHurtboxes
                        ? obj.getHurtboxes()
                        : [obj.getHurtbox ? obj.getHurtbox() : obj.getHitbox()];

                    if (CollisionUtils.lineIntersectsRects(p1, p2, hurtboxes)) {
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

                        if (CollisionUtils.lineIntersectsRect(p1, p2, eRect)) {
                            if (b.type !== 'rocket' && b.type !== 'grenade') {
                                const angle = Math.atan2(b.vy, b.vx);
                                const force = b.type === 'flame' || b.type === 'ice_shard' ? 0.5 : 4;
                                // Frozen damage multiplier
                                let finalDamage = b.damage;
                                if (e.frozenTimer > 0 && b.type !== 'ice_shard') {
                                    finalDamage = Math.floor(finalDamage * 1.5);
                                }
                                if (e.takeDamage) {
                                    e.takeDamage(finalDamage, {
                                        x: Math.cos(angle) * force,
                                        y: Math.sin(angle) * force
                                    });
                                } else {
                                     e.hp -= finalDamage;
                                }

                                // Flame: apply burn DOT
                                if (b.type === 'flame' && b.burnDamage) {
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

                                // Ice shard: stackable slow + freeze
                                if (b.type === 'ice_shard') {
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

                                if (e.hp <= 0) {
                                    this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                                } else {
                                    this.particleSpawner.spawnBloodSplatter(e.x, e.y, angle);
                                }
                            }

                            if (b.piercing > 0) {
                                if (!Array.isArray(b.hitList)) b.hitList = [];
                                b.hitList.push(e);
                                b.piercing--;
                                b.damage *= 0.6;
                            } else if (b.type === 'boomerang') {
                                // Boomerang penetrates through enemies
                                if (!Array.isArray(b.hitList)) b.hitList = [];
                                b.hitList.push(e);
                            } else if (b.type === 'ricochet' && b.bounceCount > 0) {
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

                    // If Player is Driving, Bullet hits Vehicle instead
                    if (p.state === 'driving') {
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

                    if (CollisionUtils.lineIntersectsRect(p1, p2, pRect)) {

                        hit = true;
                        const angle = Math.atan2(b.vy, b.vx);
                        const force = 4;
                        if (p.takeDamage) {
                            p.takeDamage(b.damage, {
                                x: Math.cos(angle) * force,
                                y: Math.sin(angle) * force
                            });
                        }
                        this.particleSpawner.spawnBloodSplatter(p.x, p.y, angle);
                    }
                }
            }

            }
            const expired = b.life <= 0;
            if (hit || expired) {
                if (hit && b.type === 'rocket') {
                    this.statusEffects.spawnExplosion(b.x, b.y, b.damage, b.blastRadius, b.knockback);
                } else if (b.type === 'grenade') {
                    this.statusEffects.spawnExplosion(b.x, b.y, b.damage, b.blastRadius, b.knockback);
                } else if (b.type === 'black_hole_projectile') {
                    this.statusEffects.spawnBlackHole(b);
                } else if (b.type === 'teleport' && b.source === 'player') {
                    this.statusEffects.teleportPlayer(b);
                }
                this.bullets.splice(i, 1);
            }
        }
    }
}
