export class StatusEffectSystem {
    constructor({ enemies, breakableObjects, walls, particles, player, camera, blackHoles, particleSpawner }) {
        this.enemies = enemies;
        this.breakableObjects = breakableObjects;
        this.walls = walls;
        this.particles = particles;
        this.player = player;
        this.camera = camera;
        this.blackHoles = blackHoles || [];
        this.particleSpawner = particleSpawner;
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
                let eDamage = damage;
                if (e.frozenTimer > 0) eDamage = Math.floor(eDamage * 1.5);
                if (e.takeDamage) {
                    e.takeDamage(eDamage, {
                        x: Math.cos(angle) * knockback,
                        y: Math.sin(angle) * knockback
                    });
                } else {
                    e.hp -= eDamage;
                }

                if (e.hp <= 0) {
                    this.particleSpawner.spawnBloodExplosion(e.x, e.y);
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
                    this.particleSpawner.spawnDebris(obj.x + obj.width/2, obj.y + obj.height/2, obj.type);
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

    spawnBlackHole(b) {
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

    teleportPlayer(b) {
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
                            this.particleSpawner.spawnBloodExplosion(e.x, e.y);
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
                            this.particleSpawner.spawnDebris(cx, cy, obj.type);
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

    chainLightning(hitEnemy, bullet) {
        const chainTargets = [hitEnemy];
        let currentTarget = hitEnemy;
        let currentDamage = bullet.damage;
        const chainRange = bullet.chainRange || 120;
        const multiplier = bullet.chainDamageMultiplier || 0.6;

        for (let i = 0; i < bullet.chainCount; i++) {
            currentDamage *= multiplier;

            let nearest = null;
            let nearestDist = chainRange;

            for (const e of this.enemies) {
                if (e.hp <= 0) continue;
                if (chainTargets.includes(e)) continue;

                const dx = e.x - currentTarget.x;
                const dy = e.y - currentTarget.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = e;
                }
            }

            if (!nearest) break;

            const angle = Math.atan2(nearest.y - currentTarget.y, nearest.x - currentTarget.x);
            let chainDmg = Math.floor(currentDamage);
            if (nearest.frozenTimer > 0) chainDmg = Math.floor(chainDmg * 1.5);
            if (nearest.takeDamage) {
                nearest.takeDamage(chainDmg, {
                    x: Math.cos(angle) * 2,
                    y: Math.sin(angle) * 2
                });
            } else {
                nearest.hp -= chainDmg;
            }

            if (nearest.hp <= 0) {
                this.particleSpawner.spawnBloodExplosion(nearest.x, nearest.y);
            } else {
                this.particleSpawner.spawnBloodSplatter(nearest.x, nearest.y, angle);
            }

            // Lightning arc particle
            this.particles.push({
                type: 'lightning_arc',
                x1: currentTarget.x,
                y1: currentTarget.y,
                x2: nearest.x,
                y2: nearest.y,
                life: 15,
                maxLife: 15,
                color: '#f1c40f'
            });

            chainTargets.push(nearest);
            currentTarget = nearest;
        }
    }

    updateFreezeEffects() {
        for (const e of this.enemies) {
            if (e.frozenTimer > 0) {
                e.frozenTimer--;
                // Frost particle on frozen enemy
                if (Math.random() > 0.7) {
                    this.particles.push({
                        type: 'fire',
                        x: e.x + (Math.random() - 0.5) * 12,
                        y: e.y + (Math.random() - 0.5) * 12,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: -Math.random() * 0.5,
                        size: Math.random() * 3 + 1,
                        color: '#74b9ff',
                        life: 12,
                        alpha: 0.6
                    });
                }
                if (e.frozenTimer <= 0) {
                    // Shatter particles when freeze ends
                    for (let i = 0; i < 4; i++) {
                        const a = Math.random() * Math.PI * 2;
                        this.particles.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(a) * 1.5,
                            vy: Math.sin(a) * 1.5,
                            life: 15,
                            color: '#dfe6e9',
                            size: Math.random() * 2 + 1,
                            friction: 0.9
                        });
                    }
                }
            }
            if (e.slowTimer > 0) {
                e.slowTimer--;
                if (e.slowTimer <= 0) {
                    e.freezeStacks = 0;
                }
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
                let burnDmg = e.burnDamage || 2;
                if (e.frozenTimer > 0) burnDmg = Math.floor(burnDmg * 1.5);
                e.hp -= burnDmg;
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
                    this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                }
            }
        }
    }
}
