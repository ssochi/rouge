import { CollisionUtils } from '../../utils/CollisionUtils.js';

export class CombatSystem {
    constructor({ bullets, particles, enemies, breakableObjects, walls, camera, handSystem, player, vehicles, blackHoles }) {
        this.bullets = bullets;
        this.particles = particles;
        this.enemies = enemies;
        this.breakableObjects = breakableObjects;
        this.walls = walls;
        this.camera = camera;
        this.handSystem = handSystem;
        this.player = player; // Need player for enemy bullets
        this.vehicles = vehicles || [];
        this.blackHoles = blackHoles || [];
        this.lastShotTime = 0;
    }

    tryShoot() {
        const now = Date.now();
        const weapon = this.handSystem.currentWeapon;
        const FIRE_RATE = weapon.fireRate || 150;

        if (now - this.lastShotTime > FIRE_RATE) {
            this.handSystem.triggerShoot();

            const muzzle = this.handSystem.getMuzzleWorldPosition(now);

            // Laser beam: hitscan, no bullet
            if (weapon.bulletType === 'laser_beam') {
                this._fireLaserBeam(weapon, muzzle);
                const recoil = (weapon.damage || 10) / 5;
                this.camera.x += (Math.random() - 0.5) * recoil;
                this.camera.y += (Math.random() - 0.5) * recoil;
                this.lastShotTime = now;
                return true;
            }

            if (weapon.shellEject !== false) {
                const gunScale = weapon.scale || 1;
                const ejectOffset = weapon.ejectionOffset || { x: 0, y: 0 };
                let bobY = 0;
                if (this.player.state === 'idle') {
                    bobY = Math.sin(now / 300) * 0.5;
                } else if (this.player.state === 'run') {
                    bobY = Math.sin(now / 100) * 1.0;
                }
                const currentDist = (weapon.orbitRadius || 16) - (this.handSystem.recoilOffset || 0);
                const pivotX = this.player.x + Math.cos(muzzle.angle) * currentDist;
                const pivotY = this.player.y + Math.sin(muzzle.angle) * currentDist + bobY;

                let ex = ejectOffset.x * gunScale;
                let ey = ejectOffset.y * gunScale;
                const isFlipped = Math.abs(muzzle.angle) > Math.PI / 2;
                if (isFlipped) ey = -ey;

                const rx = ex * Math.cos(muzzle.angle) - ey * Math.sin(muzzle.angle);
                const ry = ex * Math.sin(muzzle.angle) + ey * Math.cos(muzzle.angle);

                this.spawnShellCasing(pivotX + rx, pivotY + ry, muzzle.angle);
            }

            const pellets = weapon.pelletCount || 1;
            const spreadRad = (weapon.spread || 0) * Math.PI / 180;
            const isFlame = weapon.bulletType === 'flame';

            for (let p = 0; p < pellets; p++) {
                // Flame always applies spread even with pelletCount=1
                const offsetAngle = (pellets > 1 || isFlame) ? (Math.random() - 0.5) * spreadRad : 0;
                const finalAngle = muzzle.angle + offsetAngle;

                const isShotgun = pellets > 1;
                const speedMul = isShotgun ? 0.8 + Math.random() * 0.4 : (isFlame ? 0.7 + Math.random() * 0.6 : 1);
                const posOffset = isShotgun ? (Math.random() - 0.5) * 4 : 0;
                const lifeMul = isShotgun ? 0.8 + Math.random() * 0.4 : 1;
                const sizeVar = (isShotgun || isFlame) ? Math.floor(Math.random() * 4) - 2 : 0;

                const bullet = {
                    x: muzzle.x + Math.cos(finalAngle + Math.PI / 2) * posOffset,
                    y: muzzle.y + Math.sin(finalAngle + Math.PI / 2) * posOffset,
                    vx: Math.cos(finalAngle) * (weapon.bulletSpeed || 12) * speedMul,
                    vy: Math.sin(finalAngle) * (weapon.bulletSpeed || 12) * speedMul,
                    life: Math.round((weapon.bulletLife || 60) * lifeMul),
                    maxLife: weapon.bulletLife || 60,
                    damage: weapon.damage || 10,
                    color: weapon.bulletColor || '#f1c40f',
                    size: Math.max(1, (weapon.bulletSize || 5) + sizeVar),
                    type: weapon.bulletType || 'standard',
                    blastRadius: weapon.blastRadius || 0,
                    knockback: weapon.knockback || 0,
                    piercing: weapon.piercing || 0,
                    gravity: weapon.gravity || 0,
                    z: weapon.initialZ || 0,
                    vz: weapon.vzInitial || 0,
                    gravityZ: weapon.gravityZ || 0,
                    hitList: [],
                    source: 'player'
                };

                // Flame: carry burn params
                if (isFlame) {
                    bullet.burnDamage = weapon.burnDamage || 2;
                    bullet.burnDuration = weapon.burnDuration || 180;
                    bullet.burnTickInterval = weapon.burnTickInterval || 20;
                }

                // Black hole projectile: carry black hole params
                if (weapon.bulletType === 'black_hole_projectile') {
                    bullet.blackHoleDuration = weapon.blackHoleDuration || 180;
                    bullet.blackHoleRadius = weapon.blackHoleRadius || 100;
                    bullet.blackHoleDamageRadius = weapon.blackHoleDamageRadius || 40;
                    bullet.blackHoleDamage = weapon.blackHoleDamage || 5;
                    bullet.blackHoleTickInterval = weapon.blackHoleTickInterval || 15;
                    bullet.blackHolePullForce = weapon.blackHolePullForce || 2;
                }

                this.bullets.push(bullet);
            }

            const recoil = (weapon.damage || 10) / 5;
            this.camera.x += (Math.random() - 0.5) * recoil;
            this.camera.y += (Math.random() - 0.5) * recoil;

            this.lastShotTime = now;
            return true;
        }
        return false;
    }

    _fireLaserBeam(weapon, muzzle) {
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
                    this.spawnDebris(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.type);
                    if (obj.type === 'explosive_barrel') {
                        this.spawnExplosion(obj.x + obj.width / 2, obj.y + obj.height / 2, 80, 100, 10);
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
                    this.spawnBloodExplosion(e.x, e.y);
                } else {
                    this.spawnBloodSplatter(e.x, e.y, muzzle.angle);
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

    spawnEnemyBullet({ x, y, angle, damage, speed }) {
        this.bullets.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 100,
            damage: damage,
            color: '#e74c3c', // Red enemy bullet
            size: 4,
            type: 'standard',
            source: 'enemy'
        });
    }

    updateBullets() {
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
                    hit = true;
                    break;
                }
            }

            if (!hit) {
                // Vehicle Collision
                for (const v of this.vehicles) {
                    if (v.isDead) continue;
                    
                    // Vehicle Hitbox (Simple Rect approximation if containsPoint not available or complex)
                    // If v has complex shape, lineIntersectsRect on its bounding box is a good first pass
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
                                 this.spawnDebris(obj.x + obj.width/2, obj.y + obj.height/2, obj.type);
                                 if (obj.type === 'explosive_barrel') {
                                     this.spawnExplosion(obj.x + obj.width/2, obj.y + obj.height/2, 80, 100, 10);
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
                                const force = b.type === 'flame' ? 0.5 : 4;
                                if (e.takeDamage) {
                                    e.takeDamage(b.damage, {
                                        x: Math.cos(angle) * force,
                                        y: Math.sin(angle) * force
                                    });
                                } else {
                                     e.hp -= b.damage;
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

                                if (e.hp <= 0) {
                                    this.spawnBloodExplosion(e.x, e.y);
                                } else {
                                    this.spawnBloodSplatter(e.x, e.y, angle);
                                }
                            }

                            if (b.piercing > 0) {
                                if (!Array.isArray(b.hitList)) b.hitList = [];
                                b.hitList.push(e);
                                b.piercing--;
                                b.damage *= 0.6;
                            } else {
                                hit = true;
                            }
                            break;
                        }
                    }
                } else if (b.source === 'enemy') {
                    // Check Player
                    const p = this.player;
                    
                    // If Player is Driving, Bullet hits Vehicle instead (Already Checked above)
                    // But if vehicle check missed (e.g. hitbox diff), we must ensure player is immune
                    if (p.state === 'driving') {
                        // Ignore bullet hitting player directly when driving
                        // (Ideally, vehicle hitbox covers player, but this is a safety check)
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
                        this.spawnBloodSplatter(p.x, p.y, angle);
                    }
                }
            }

            }
            const expired = b.life <= 0;
            if (hit || expired) {
                if (hit && b.type === 'rocket') {
                    this.spawnExplosion(b.x, b.y, b.damage, b.blastRadius, b.knockback);
                } else if (b.type === 'grenade') {
                    this.spawnExplosion(b.x, b.y, b.damage, b.blastRadius, b.knockback);
                } else if (b.type === 'black_hole_projectile') {
                    this._spawnBlackHole(b);
                } else if (b.type === 'teleport' && b.source === 'player') {
                    this._teleportPlayer(b);
                }
                this.bullets.splice(i, 1);
            }
        }
    }

    spawnExplosion(x, y, damage, radius, knockback) {
        this.particles.push({
            type: 'shockwave',
            x: x,
            y: y,
            size: 10,
            maxSize: radius * 1.1,
            color: '#ffffff',
            alpha: 1.0,
            life: 20
        });

        this.particles.push({
            type: 'flash',
            x: x,
            y: y,
            size: radius * 0.8,
            color: '#fff700',
            alpha: 1.0,
            life: 10
        });

        const fireCount = 20;
        for (let i = 0; i < fireCount; i++) {
            const angle = (Math.PI * 2 / fireCount) * i + (Math.random() * 0.5);
            const speed = Math.random() * 3 + 2;
            this.particles.push({
                type: 'fire',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 10 + 10,
                color: '#f1c40f',
                life: 30 + Math.random() * 20,
                alpha: 1.0
            });
        }

        const smokeCount = 15;
        for (let i = 0; i < smokeCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 1.5 + 0.5;
            this.particles.push({
                type: 'smoke',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 12 + 8,
                color: '#7f8c8d',
                life: 50 + Math.random() * 30,
                alpha: 0.8
            });
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const dx = e.x - x;
            const dy = e.y - y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < radius) {
                const angle = Math.atan2(dy, dx);
                if (e.takeDamage) {
                    e.takeDamage(damage, {
                        x: Math.cos(angle) * knockback,
                        y: Math.sin(angle) * knockback
                    });
                } else {
                    e.hp -= damage;
                }
                
                if (e.hp <= 0) {
                    this.spawnBloodExplosion(e.x, e.y);
                }
            }
        }

        this.breakableObjects.forEach(obj => {
            if (obj.isBroken) return;
            const center = { x: obj.x + obj.width/2, y: obj.y + obj.height/2 };
            const dx = center.x - x;
            const dy = center.y - y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < radius) {
                obj.takeDamage(damage);
                if (obj.isBroken) {
                    this.spawnDebris(obj.x + obj.width/2, obj.y + obj.height/2, obj.type);
                    if (obj.type === 'explosive_barrel') {
                        this.spawnExplosion(obj.x + obj.width/2, obj.y + obj.height/2, 80, 100, 10);
                    }
                }
            }
        });

        // Damage Player
        const p = this.player;
        const pdx = p.x - x;
        const pdy = p.y - y;
        const pdist = Math.sqrt(pdx*pdx + pdy*pdy);
        
        if (pdist < radius) {
            const angle = Math.atan2(pdy, pdx);
            if (p.takeDamage) {
                p.takeDamage(damage, {
                    x: Math.cos(angle) * knockback,
                    y: Math.sin(angle) * knockback
                });
            } else {
                p.hp -= damage;
            }
        }
    }

    spawnDebris(x, y, type) {
        const count = 5 + Math.random() * 5;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            
            let color = '#8d6e63';
            let size = Math.random() * 4 + 2;
            let width = size;
            
            if (type === 'vase') {
                color = '#d35400';
                if (Math.random() > 0.5) {
                    width = size * 0.5;
                }
            } else if (type === 'box') {
                if (Math.random() > 0.3) {
                    size = Math.random() * 8 + 4;
                    width = 2;
                }
            } else if (type === 'barrel') {
                if (Math.random() > 0.7) {
                    color = '#424242';
                    width = 2;
                    size = 4;
                } else {
                    if (Math.random() > 0.3) {
                        size = Math.random() * 6 + 3;
                        width = 3;
                    }
                }
            } else if (type === 'explosive_barrel') {
                color = '#c0392b'; // Red
                if (Math.random() > 0.5) {
                    color = '#2c3e50'; // Metal
                }
                width = 3;
                size = Math.random() * 5 + 3;
            }
            
            this.particles.push({
                type: 'debris',
                x: x,
                y: y,
                z: 10 + Math.random() * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vz: Math.random() * 3 + 2,
                angle: Math.random() * Math.PI * 2,
                vAngle: (Math.random() - 0.5) * 0.5,
                life: 999999,
                color: color,
                size: size,
                width: width,
                gravity: 0.2,
                bounce: 0.4
            });
        }
    }

    spawnBloodExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 60 + Math.random() * 30,
                color: Math.random() > 0.5 ? '#922b21' : '#641e16',
                size: Math.random() * 4 + 2,
                gravity: 0.1,
                friction: 0.95
            });
        }
    }

    spawnBloodSplatter(x, y, angle) {
        for (let i = 0; i < 5; i++) {
            const spread = (Math.random() - 0.5) * 1.0;
            const speed = Math.random() * 4 + 2;
            this.particles.push({
                type: 'blood',
                x: x,
                y: y,
                vx: Math.cos(angle + spread) * speed,
                vy: Math.sin(angle + spread) * speed,
                life: 30 + Math.random() * 20,
                color: '#922b21',
                size: Math.random() * 3 + 1,
                gravity: 0.1,
                friction: 0.9
            });
        }
    }

    spawnShellCasing(x, y, angle) {
        const isFlipped = Math.abs(angle) > Math.PI / 2;
        
        let ejectOffset;
        if (isFlipped) {
            ejectOffset = -Math.PI / 2;
        } else {
             ejectOffset = Math.PI / 2;
        }
        
        const ejectAngle = angle + ejectOffset + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 1.5 + 0.5;
        
        this.particles.push({
            type: 'shell',
            x: x,
            y: y,
            z: 10,
            vx: Math.cos(ejectAngle) * speed,
            vy: Math.sin(ejectAngle) * speed,
            vz: Math.random() * 2 + 1,
            angle: Math.random() * Math.PI * 2,
            vAngle: (Math.random() - 0.5) * 0.5,
            life: 300,
            color: '#f1c40f',
            size: 3,
            width: 1.5,
            gravity: 0.25,
            bounce: 0.5
        });
    }

    _spawnBlackHole(b) {
        this.blackHoles.push({
            x: b.x,
            y: b.y,
            life: b.blackHoleDuration || 180,
            maxLife: b.blackHoleDuration || 180,
            radius: b.blackHoleRadius || 100,
            damageRadius: b.blackHoleDamageRadius || 40,
            damage: b.blackHoleDamage || 5,
            tickInterval: b.blackHoleTickInterval || 15,
            tickCounter: 0,
            pullForce: b.blackHolePullForce || 2,
            angle: 0
        });
    }

    _teleportPlayer(b) {
        let teleportX = b.x;
        let teleportY = b.y;

        // Step back along trajectory to avoid teleporting into walls
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > 0) {
            const dirX = -b.vx / speed;
            const dirY = -b.vy / speed;

            for (let step = 0; step <= 5; step++) {
                const testX = b.x + dirX * step * 4;
                const testY = b.y + dirY * step * 4;

                if (this.player.getMovementHitboxAt) {
                    const phb = this.player.getMovementHitboxAt(testX, testY);
                    let blocked = false;

                    for (const wall of this.walls) {
                        if (phb.x < wall.x + wall.w &&
                            phb.x + phb.width > wall.x &&
                            phb.y < wall.y + wall.h &&
                            phb.y + phb.height > wall.y) {
                            blocked = true;
                            break;
                        }
                    }

                    if (!blocked) {
                        teleportX = testX;
                        teleportY = testY;
                        break;
                    }
                } else {
                    teleportX = testX;
                    teleportY = testY;
                    break;
                }
            }
        }

        // Departure particles
        for (let j = 0; j < 8; j++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 2 + 1;
            this.particles.push({
                x: this.player.x, y: this.player.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 20,
                color: '#3498db',
                size: Math.random() * 4 + 2,
                friction: 0.9
            });
        }

        // Move player
        this.player.x = teleportX;
        this.player.y = teleportY;

        // Arrival particles
        for (let j = 0; j < 8; j++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 2 + 1;
            this.particles.push({
                x: teleportX, y: teleportY,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 20,
                color: '#5dade2',
                size: Math.random() * 4 + 2,
                friction: 0.9
            });
        }

        // Camera shake
        this.camera.x += (Math.random() - 0.5) * 10;
        this.camera.y += (Math.random() - 0.5) * 10;
    }

    updateBlackHoles() {
        for (let i = this.blackHoles.length - 1; i >= 0; i--) {
            const bh = this.blackHoles[i];
            bh.life--;
            bh.angle += 0.1;
            bh.tickCounter++;

            // Pull and damage enemies
            for (const e of this.enemies) {
                if (e.hp <= 0) continue;
                const dx = bh.x - e.x;
                const dy = bh.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < bh.radius && dist > 5) {
                    const pullStrength = bh.pullForce * (1 - dist / bh.radius);
                    const angle = Math.atan2(dy, dx);
                    e.knockbackX = (e.knockbackX || 0) + Math.cos(angle) * pullStrength;
                    e.knockbackY = (e.knockbackY || 0) + Math.sin(angle) * pullStrength;

                    if (dist < bh.damageRadius && bh.tickCounter >= bh.tickInterval) {
                        if (e.takeDamage) {
                            e.takeDamage(bh.damage, { x: 0, y: 0 });
                        } else {
                            e.hp -= bh.damage;
                        }
                        if (e.hp <= 0) {
                            this.spawnBloodExplosion(e.x, e.y);
                        }
                    }
                }
            }

            // Damage breakable objects in range
            if (bh.tickCounter >= bh.tickInterval) {
                for (const obj of this.breakableObjects) {
                    if (obj.isBroken) continue;
                    const cx = obj.x + obj.width / 2;
                    const cy = obj.y + obj.height / 2;
                    const dx = cx - bh.x;
                    const dy = cy - bh.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < bh.damageRadius) {
                        obj.takeDamage(bh.damage);
                        if (obj.isBroken) {
                            this.spawnDebris(cx, cy, obj.type);
                            if (obj.type === 'explosive_barrel') {
                                this.spawnExplosion(cx, cy, 80, 100, 10);
                            }
                        }
                    }
                }
                bh.tickCounter = 0;
            }

            // Ambient particles
            if (Math.random() > 0.3) {
                const pAngle = Math.random() * Math.PI * 2;
                const pDist = bh.radius * (0.3 + Math.random() * 0.7);
                this.particles.push({
                    type: 'black_hole_orbit',
                    x: bh.x + Math.cos(pAngle) * pDist,
                    y: bh.y + Math.sin(pAngle) * pDist,
                    targetX: bh.x,
                    targetY: bh.y,
                    life: 20 + Math.random() * 10,
                    color: Math.random() > 0.5 ? '#9b59b6' : '#6c3483',
                    size: Math.random() * 3 + 1,
                    alpha: 0.8
                });
            }

            if (bh.life <= 0) {
                // Dispersion particles
                for (let j = 0; j < 10; j++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = Math.random() * 3 + 1;
                    this.particles.push({
                        type: 'fire',
                        x: bh.x, y: bh.y,
                        vx: Math.cos(angle) * spd,
                        vy: Math.sin(angle) * spd,
                        size: Math.random() * 6 + 3,
                        color: '#9b59b6',
                        life: 20,
                        alpha: 0.8
                    });
                }
                this.blackHoles.splice(i, 1);
            }
        }
    }

    updateBurnEffects() {
        for (const e of this.enemies) {
            if (!e.burnTimer || e.burnTimer <= 0) continue;
            e.burnTimer--;
            e.burnTickCounter = (e.burnTickCounter || 0) + 1;

            if (e.burnTickCounter >= (e.burnTickInterval || 20)) {
                e.burnTickCounter = 0;
                e.hp -= e.burnDamage || 2;
                e.hitFlashTimer = 3;
                e.hpBarTimer = 60;

                // Fire particle on burning enemy
                this.particles.push({
                    type: 'fire',
                    x: e.x + (Math.random() - 0.5) * 10,
                    y: e.y + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -Math.random() * 1.5,
                    size: Math.random() * 4 + 2,
                    color: '#f1c40f',
                    life: 15,
                    alpha: 0.8
                });

                if (e.hp <= 0) {
                    this.spawnBloodExplosion(e.x, e.y);
                }
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.type === 'shockwave') {
                p.size += (p.maxSize - p.size) * 0.2;
                p.alpha -= 0.05;
                p.life--;
            } else if (p.type === 'flash') {
                p.alpha -= 0.1;
                p.life--;
            } else if (p.type === 'fire') {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.9;
                p.vy *= 0.9;
                p.size *= 0.95;
                if (p.life < 20) p.color = '#e67e22';
                if (p.life < 10) p.color = '#c0392b';
                p.life--;
            } else if (p.type === 'smoke') {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.95;
                p.vy *= 0.95;
                p.size *= 1.02;
                p.alpha -= 0.01;
                p.life--;
            } else if (p.type === 'explosion_anim') {
                p.frameTimer++;
                if (p.frameTimer >= p.frameDelay) {
                    p.frameTimer = 0;
                    p.frame++;
                    if (p.frame >= p.sprites.length) {
                        p.life = 0;
                    }
                }
            } else if (p.type === 'laser_beam') {
                p.life--;
            } else if (p.type === 'black_hole_orbit') {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    p.x += (dx / dist) * 2;
                    p.y += (dy / dist) * 2;
                    // Spiral motion
                    p.x += (-dy / dist) * 1.5;
                    p.y += (dx / dist) * 1.5;
                }
                p.size *= 0.97;
                p.life--;
            } else if (p.type === 'shell' || p.type === 'debris') {
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;
                p.vz -= p.gravity;
                p.angle += p.vAngle;

                if (p.z <= 0) {
                    p.z = 0;
                    if (Math.abs(p.vz) > 1) {
                        p.vz *= -p.bounce;
                        p.vx *= 0.6; 
                        p.vy *= 0.6;
                        p.vAngle *= 0.7;
                    } else {
                        p.vz = 0;
                        p.vx *= 0.3; 
                        p.vy *= 0.3;
                        p.vAngle = 0;
                    }
                }

                if (p.type !== 'debris') {
                    p.life--;
                }
            } else {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= p.friction || 1;
                p.vy *= p.friction || 1;
                p.life--;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}
