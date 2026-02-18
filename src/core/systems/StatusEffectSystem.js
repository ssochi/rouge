export class StatusEffectSystem {
    constructor({ enemies, breakableObjects, walls, particles, player, camera, blackHoles, acidPuddles, particleSpawner }) {
        this.enemies = enemies;
        this.breakableObjects = breakableObjects;
        this.walls = walls;
        this.particles = particles;
        this.player = player;
        this.camera = camera;
        this.blackHoles = blackHoles || [];
        this.acidPuddles = acidPuddles || [];
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
        if (p.state === 'roll') return;
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
            angle: 0,
            source: b.source || 'player',
            owner: b.owner || null
        });
    }

    _isMovementHitboxBlocked(hitbox) {
        for (const wall of this.walls) {
            if (hitbox.x < wall.x + wall.w &&
                hitbox.x + hitbox.width > wall.x &&
                hitbox.y < wall.y + wall.h &&
                hitbox.y + hitbox.height > wall.y) {
                return true;
            }
        }
        return false;
    }

    teleportEntity(entity, b) {
        if (!entity || !b) return;

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

                if (entity.getMovementHitboxAt) {
                    const hb = entity.getMovementHitboxAt(testX, testY);
                    if (!this._isMovementHitboxBlocked(hb)) {
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
                x: entity.x, y: entity.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life: 20,
                color: '#3498db',
                size: Math.random() * 4 + 2,
                friction: 0.9
            });
        }

        // Move entity
        entity.x = teleportX;
        entity.y = teleportY;

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

    teleportPlayer(b) {
        this.teleportEntity(this.player, b);
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

            // Enemy-origin black holes can affect player as well.
            const p = this.player;
            if (bh.source === 'enemy' && p && p.hp > 0 && p.state !== 'driving' && p.state !== 'roll') {
                const dx = bh.x - p.x;
                const dy = bh.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < bh.radius && dist > 5) {
                    const pullStrength = bh.pullForce * (1 - dist / bh.radius);
                    const angle = Math.atan2(dy, dx);
                    p.knockbackX = (p.knockbackX || 0) + Math.cos(angle) * pullStrength;
                    p.knockbackY = (p.knockbackY || 0) + Math.sin(angle) * pullStrength;

                    if (dist < bh.damageRadius && bh.tickCounter >= bh.tickInterval) {
                        if (p.takeDamage) {
                            p.takeDamage(bh.damage, { x: 0, y: 0 });
                        } else {
                            p.hp -= bh.damage;
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

        const p = this.player;
        if (!p) return;

        if (p.frozenTimer > 0) {
            p.frozenTimer--;
            if (Math.random() > 0.75) {
                this.particles.push({
                    type: 'fire',
                    x: p.x + (Math.random() - 0.5) * 12,
                    y: p.y + (Math.random() - 0.5) * 12,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 0.5,
                    size: Math.random() * 3 + 1,
                    color: '#74b9ff',
                    life: 12,
                    alpha: 0.6
                });
            }
        }

        if (p.slowTimer > 0) {
            p.slowTimer--;
            if (p.slowTimer <= 0) {
                p.freezeStacks = 0;
                p.slowAmount = 0;
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

        const p = this.player;
        if (!p || !p.burnTimer || p.burnTimer <= 0) return;

        p.burnTimer--;
        p.burnTickCounter = (p.burnTickCounter || 0) + 1;
        if (p.burnTickCounter >= (p.burnTickInterval || 20)) {
            p.burnTickCounter = 0;
            let burnDmg = p.burnDamage || 2;
            if (p.frozenTimer > 0) burnDmg = Math.floor(burnDmg * 1.5);

            if (p.takeDamage) {
                p.takeDamage(burnDmg, { x: 0, y: 0 });
            } else {
                p.hp -= burnDmg;
            }

            this.particles.push({
                type: 'fire',
                x: p.x + (Math.random() - 0.5) * 10,
                y: p.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 1,
                vy: -Math.random() * 1.5,
                size: Math.random() * 4 + 2,
                color: '#f1c40f',
                life: 15,
                alpha: 0.8
            });
        }
    }

    updateBleedEffects() {
        for (const e of this.enemies) {
            if (!e.bleedTimer || e.bleedTimer <= 0) continue;
            e.bleedTimer--;
            e.bleedTickCounter = (e.bleedTickCounter || 0) + 1;

            if (e.bleedTickCounter >= (e.bleedTickInterval || 20)) {
                e.bleedTickCounter = 0;
                const bleedDmg = e.bleedDamage || 3;
                e.hp -= bleedDmg;
                e.hitFlashTimer = 3;
                e.hpBarTimer = 60;

                // Blood drip particle
                this._spawnBleedParticle(e.x, e.y);

                if (e.hp <= 0) {
                    this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                }
            }
        }

        // Player bleed DOT
        const p = this.player;
        if (!p || !p.bleedTimer || p.bleedTimer <= 0) return;

        p.bleedTimer--;
        p.bleedTickCounter = (p.bleedTickCounter || 0) + 1;

        if (p.bleedTickCounter >= (p.bleedTickInterval || 20)) {
            p.bleedTickCounter = 0;
            const bleedDmg = p.bleedDamage || 3;

            if (p.takeDamage) {
                p.takeDamage(bleedDmg, { x: 0, y: 0 });
            } else {
                p.hp -= bleedDmg;
            }

            this._spawnBleedParticle(p.x, p.y);
        }
    }

    _spawnBleedParticle(x, y) {
        this.particles.push({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 1.0 + 0.5,
            life: 20 + Math.floor(Math.random() * 10),
            color: Math.random() > 0.5 ? '#922b21' : '#c0392b',
            size: Math.random() * 2 + 1,
            friction: 0.95
        });
    }

    // --- Poison DOT (Acid Gun) ---
    updatePoisonEffects() {
        for (const e of this.enemies) {
            if (!e.poisonTimer || e.poisonTimer <= 0) continue;
            e.poisonTimer--;
            e.poisonTickCounter = (e.poisonTickCounter || 0) + 1;
            if (e.poisonTickCounter >= (e.poisonTickInterval || 20)) {
                e.poisonTickCounter = 0;
                let poisonDmg = e.poisonDamage || 3;
                if (e.frozenTimer > 0) poisonDmg = Math.floor(poisonDmg * 1.5);
                e.hp -= poisonDmg;
                e.hitFlashTimer = 3;
                e.hpBarTimer = 60;
                this.particles.push({
                    type: 'fire',
                    x: e.x + (Math.random() - 0.5) * 10,
                    y: e.y + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: -Math.random() * 1.0,
                    size: Math.random() * 3 + 2,
                    color: '#76ff03',
                    life: 12,
                    alpha: 0.7
                });
                if (e.hp <= 0) {
                    this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                }
            }
        }
        const p = this.player;
        if (!p || !p.poisonTimer || p.poisonTimer <= 0) return;
        p.poisonTimer--;
        p.poisonTickCounter = (p.poisonTickCounter || 0) + 1;
        if (p.poisonTickCounter >= (p.poisonTickInterval || 20)) {
            p.poisonTickCounter = 0;
            const poisonDmg = p.poisonDamage || 3;
            if (p.takeDamage) {
                p.takeDamage(poisonDmg, { x: 0, y: 0 });
            } else {
                p.hp -= poisonDmg;
            }
            this.particles.push({
                type: 'fire',
                x: p.x + (Math.random() - 0.5) * 10,
                y: p.y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 1.0,
                size: Math.random() * 3 + 2,
                color: '#76ff03',
                life: 12,
                alpha: 0.7
            });
        }
    }

    // --- Acid Puddles (ground hazard) ---
    spawnAcidPuddle(x, y, b) {
        this.acidPuddles.push({
            x, y,
            radius: b.puddleRadius || 30,
            life: b.puddleDuration || 180,
            maxLife: b.puddleDuration || 180,
            damage: b.puddleDamage || 2,
            tickInterval: b.puddleTickInterval || 15,
            tickCounter: 0,
            source: b.source || 'player'
        });
        for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            this.particles.push({
                x: x + Math.cos(a) * 5,
                y: y + Math.sin(a) * 5,
                vx: Math.cos(a) * 1.5,
                vy: Math.sin(a) * 1.5,
                life: 15,
                color: '#76ff03',
                size: Math.random() * 3 + 1,
                friction: 0.9
            });
        }
    }

    updateAcidPuddles() {
        for (let i = this.acidPuddles.length - 1; i >= 0; i--) {
            const puddle = this.acidPuddles[i];
            puddle.life--;
            puddle.tickCounter++;

            if (puddle.tickCounter >= puddle.tickInterval) {
                puddle.tickCounter = 0;
                for (const e of this.enemies) {
                    if (e.hp <= 0) continue;
                    const dx = e.x - puddle.x;
                    const dy = e.y - puddle.y;
                    if (dx * dx + dy * dy < puddle.radius * puddle.radius) {
                        if (e.takeDamage) {
                            e.takeDamage(puddle.damage, { x: 0, y: 0 });
                        } else {
                            e.hp -= puddle.damage;
                        }
                        if (e.hp <= 0) {
                            this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                        }
                    }
                }
                if (puddle.source === 'enemy') {
                    const p = this.player;
                    if (p && p.hp > 0 && p.state !== 'roll') {
                        const dx = p.x - puddle.x;
                        const dy = p.y - puddle.y;
                        if (dx * dx + dy * dy < puddle.radius * puddle.radius) {
                            if (p.takeDamage) {
                                p.takeDamage(puddle.damage, { x: 0, y: 0 });
                            } else {
                                p.hp -= puddle.damage;
                            }
                        }
                    }
                }
            }

            // Bubbling particles
            if (Math.random() > 0.7) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * puddle.radius * 0.8;
                this.particles.push({
                    x: puddle.x + Math.cos(a) * r,
                    y: puddle.y + Math.sin(a) * r,
                    vx: 0,
                    vy: -Math.random() * 0.5,
                    life: 10 + Math.random() * 5,
                    color: Math.random() > 0.5 ? '#76ff03' : '#64dd17',
                    size: Math.random() * 2 + 1,
                    friction: 0.95
                });
            }

            if (puddle.life <= 0) {
                this.acidPuddles.splice(i, 1);
            }
        }
    }

    // --- Needle DOT (Embed) ---
    updateNeedleEffects() {
        for (const e of this.enemies) {
            if (!e.needleStacks || e.needleStacks <= 0 || !e.needleTimer || e.needleTimer <= 0) continue;
            e.needleTimer--;
            e.needleTickCounter = (e.needleTickCounter || 0) + 1;

            if (e.needleTickCounter >= (e.needleTickInterval || 15)) {
                e.needleTickCounter = 0;
                let dmg = (e.needleDamage || 4) * e.needleStacks;
                if (e.frozenTimer > 0) dmg = Math.floor(dmg * 1.5);
                e.hp -= dmg;
                e.hitFlashTimer = 3;
                e.hpBarTimer = 60;
                // Metallic spark particles
                this.particles.push({
                    x: e.x + (Math.random() - 0.5) * 8,
                    y: e.y + (Math.random() - 0.5) * 8,
                    vx: (Math.random() - 0.5) * 1,
                    vy: -Math.random() * 0.5,
                    life: 10,
                    color: '#b0bec5',
                    size: 1.5,
                    friction: 0.9
                });
                if (e.hp <= 0) {
                    this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                }
            }

            if (e.needleTimer <= 0) {
                e.needleStacks = 0;
            }
        }
    }

    // --- Force Gun Wall Slam ---
    updateForceEffects() {
        for (const e of this.enemies) {
            if (!e._forceWallSlamCheck || e._forceWallSlamCheck <= 0) continue;
            e._forceWallSlamCheck--;
            const hw = (e.hitboxWidth || e.width || 16) / 2;
            const hh = (e.hitboxHeight || e.height || 16) / 2;
            const hitbox = {
                x: e.x - hw,
                y: e.y - hh,
                width: hw * 2,
                height: hh * 2
            };
            for (const wall of this.walls) {
                if (hitbox.x < wall.x + wall.w &&
                    hitbox.x + hitbox.width > wall.x &&
                    hitbox.y < wall.y + wall.h &&
                    hitbox.y + hitbox.height > wall.y) {
                    const slamDmg = e._forceWallSlamDamage || 15;
                    if (e.takeDamage) {
                        e.takeDamage(slamDmg, { x: 0, y: 0 });
                    } else {
                        e.hp -= slamDmg;
                    }
                    for (let s = 0; s < 5; s++) {
                        const a = Math.random() * Math.PI * 2;
                        this.particles.push({
                            x: e.x, y: e.y,
                            vx: Math.cos(a) * 2,
                            vy: Math.sin(a) * 2,
                            life: 15,
                            color: '#90caf9',
                            size: Math.random() * 3 + 2,
                            friction: 0.85
                        });
                    }
                    e._forceWallSlamCheck = 0;
                    if (e.hp <= 0) {
                        this.particleSpawner.spawnBloodExplosion(e.x, e.y);
                    }
                    break;
                }
            }
        }
    }
}
