import { ParticleSpawner } from './ParticleSpawner.js';
import { StatusEffectSystem } from './StatusEffectSystem.js';
import { BulletSystem } from './BulletSystem.js';

export class CombatSystem {
    constructor(deps) {
        this.bullets = deps.bullets;
        this.particles = deps.particles;
        this.camera = deps.camera;
        this.handSystem = deps.handSystem;
        this.player = deps.player;

        // Create sub-systems
        this.particleSpawner = new ParticleSpawner(deps);
        this.statusEffects = new StatusEffectSystem({ ...deps, particleSpawner: this.particleSpawner });
        this.bulletSystem = new BulletSystem({ ...deps, particleSpawner: this.particleSpawner, statusEffects: this.statusEffects });

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
                this.bulletSystem.fireLaserBeam(weapon, muzzle);
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

                this.particleSpawner.spawnShellCasing(pivotX + rx, pivotY + ry, muzzle.angle);
            }

            const pellets = weapon.pelletCount || 1;
            const spreadRad = (weapon.spread || 0) * Math.PI / 180;
            const isFlame = weapon.bulletType === 'flame';
            const isIceShard = weapon.bulletType === 'ice_shard';

            for (let p = 0; p < pellets; p++) {
                // Flame/Ice always applies spread even with pelletCount=1
                const offsetAngle = (pellets > 1 || isFlame || isIceShard) ? (Math.random() - 0.5) * spreadRad : 0;
                const finalAngle = muzzle.angle + offsetAngle;

                const isShotgun = pellets > 1;
                const speedMul = isShotgun ? 0.8 + Math.random() * 0.4 : ((isFlame || isIceShard) ? 0.7 + Math.random() * 0.6 : 1);
                const posOffset = isShotgun ? (Math.random() - 0.5) * 4 : 0;
                const lifeMul = isShotgun ? 0.8 + Math.random() * 0.4 : 1;
                const sizeVar = (isShotgun || isFlame || isIceShard) ? Math.floor(Math.random() * 4) - 2 : 0;

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

                // Lightning: carry chain params
                if (weapon.bulletType === 'lightning') {
                    bullet.chainCount = weapon.chainCount || 3;
                    bullet.chainRange = weapon.chainRange || 120;
                    bullet.chainDamageMultiplier = weapon.chainDamageMultiplier || 0.6;
                }

                // Ice shard: carry slow/freeze params
                if (isIceShard) {
                    bullet.slowAmount = weapon.slowAmount || 0.5;
                    bullet.slowDuration = weapon.slowDuration || 90;
                    bullet.freezeThreshold = weapon.freezeThreshold || 5;
                    bullet.freezeDuration = weapon.freezeDuration || 120;
                    bullet.frozenDamageMultiplier = weapon.frozenDamageMultiplier || 1.5;
                }

                // Ricochet: carry bounce params
                if (weapon.bulletType === 'ricochet') {
                    bullet.bounceCount = weapon.maxBounces || 3;
                    bullet.maxBounces = weapon.maxBounces || 3;
                }

                // Boomerang: carry return params
                if (weapon.bulletType === 'boomerang') {
                    bullet.phase = 'outgoing';
                    bullet.distanceTraveled = 0;
                    bullet.startX = muzzle.x;
                    bullet.startY = muzzle.y;
                    bullet.maxDistance = weapon.maxDistance || 200;
                    bullet.returnAccel = weapon.returnAccel || 0.3;
                    bullet.catchRadius = weapon.catchRadius || 16;
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

    spawnEnemyBullet({ x, y, angle, damage, speed }) {
        this.bullets.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 100,
            damage: damage,
            color: '#e74c3c',
            size: 4,
            type: 'standard',
            source: 'enemy'
        });
    }

    // Delegated methods — external API unchanged
    updateBullets() { this.bulletSystem.update(); }
    updateBlackHoles() { this.statusEffects.updateBlackHoles(); }
    updateBurnEffects() { this.statusEffects.updateBurnEffects(); }
    updateFreezeEffects() { this.statusEffects.updateFreezeEffects(); }
    updateParticles() { this.particleSpawner.updateParticles(); }
    spawnExplosion(x, y, damage, radius, knockback) { this.statusEffects.spawnExplosion(x, y, damage, radius, knockback); }
    spawnDebris(x, y, type) { this.particleSpawner.spawnDebris(x, y, type); }
    spawnBloodExplosion(x, y) { this.particleSpawner.spawnBloodExplosion(x, y); }
    spawnBloodSplatter(x, y, angle) { this.particleSpawner.spawnBloodSplatter(x, y, angle); }
}
