import { ParticleSpawner } from './ParticleSpawner.js';
import { StatusEffectSystem } from './StatusEffectSystem.js';
import { BulletSystem } from './BulletSystem.js';
import { CollisionUtils } from '../../utils/CollisionUtils.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';

export class CombatSystem {
    constructor(deps) {
        this.bullets = deps.bullets;
        this.particles = deps.particles;
        this.walls = deps.walls || [];
        this.breakableObjects = deps.breakableObjects || [];
        this.camera = deps.camera;
        this.handSystem = deps.handSystem;
        this.player = deps.player;

        // Create sub-systems
        this.particleSpawner = new ParticleSpawner(deps);
        this.statusEffects = new StatusEffectSystem({ ...deps, particleSpawner: this.particleSpawner });
        this.bulletSystem = new BulletSystem({ ...deps, particleSpawner: this.particleSpawner, statusEffects: this.statusEffects });

        this.lastShotTime = 0;
        this.burstState = null;
        this.echoQueue = []; // M15: echo bullet replay queue
        this.chargeState = null; // M1: charge shot state
        this.beamState = null; // M8: continuous beam state
    }

    _isShootBlockerObject(obj) {
        if (!obj || obj.isBroken) return false;

        const type = obj.type;
        const baseType = obj.baseType;
        const isWall = type === 'wall' || type === 'wall_h' || type === 'wall_v';
        const isDoor = type === 'door_h' || type === 'door_v' || baseType === 'door_h' || baseType === 'door_v';

        if (isWall) return true;
        if (isDoor) {
            return !obj.isOpen;
        }
        return false;
    }

    _isSegmentBlocked(start, end) {
        const walls = this.walls || [];
        const breakableObjects = this.breakableObjects || [];

        for (const wall of walls) {
            if (CollisionUtils.lineIntersectsRect(start, end, { x: wall.x, y: wall.y, width: wall.w, height: wall.h })) {
                return true;
            }
        }

        for (const obj of breakableObjects) {
            if (!this._isShootBlockerObject(obj)) continue;
            const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
            for (const hb of hitboxes) {
                if (CollisionUtils.lineIntersectsRect(start, end, hb)) {
                    return true;
                }
            }
        }

        return false;
    }

    _resolveTargetPoint(target) {
        if (!target) return null;
        if (typeof target.x === 'number' && typeof target.y === 'number' && !target.getBulletHurtbox) {
            return { x: target.x, y: target.y };
        }

        const hb = target.getBulletHurtbox
            ? target.getBulletHurtbox()
            : null;
        if (hb) {
            return {
                x: hb.x + (hb.width ?? hb.w) / 2,
                y: hb.y + (hb.height ?? hb.h) / 2
            };
        }

        if (typeof target.x === 'number' && typeof target.y === 'number') {
            return { x: target.x, y: target.y };
        }

        return null;
    }

    canShootFrom(shooter, muzzle, target = null) {
        if (!shooter || !muzzle) return false;

        const body = { x: shooter.x, y: shooter.y };
        const barrel = { x: muzzle.x, y: muzzle.y };

        // Prevent muzzle clipping through blockers (body on one side, muzzle on the other side).
        if (this._isSegmentBlocked(body, barrel)) {
            return false;
        }

        const targetPoint = this._resolveTargetPoint(target);
        if (targetPoint && this._isSegmentBlocked(barrel, targetPoint)) {
            return false;
        }

        return true;
    }

    _pushWeaponProjectiles({ weapon, muzzle, source = 'player', owner = null, team = null, aimAngleOverride = null }) {
        if (!weapon || !muzzle) return 0;

        const pellets = weapon.pelletCount || 1;
        const spreadRad = (weapon.spread || 0) * Math.PI / 180;
        const isFlame = weapon.bulletType === 'flame';
        const isIceShard = weapon.bulletType === 'ice_shard';
        const baseAngle = Number.isFinite(aimAngleOverride) ? aimAngleOverride : muzzle.angle;
        let created = 0;

        for (let p = 0; p < pellets; p++) {
            // Flame/Ice always applies spread even with pelletCount=1
            const offsetAngle = (pellets > 1 || isFlame || isIceShard) ? (Math.random() - 0.5) * spreadRad : 0;
            const finalAngle = baseAngle + offsetAngle;

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
                source,
                owner,
                team
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

            // Homing: carry tracking params
            if (weapon.bulletType === 'homing') {
                bullet.homingTurnRate = weapon.homingTurnRate || 0.06;
                bullet.homingAcquireRange = weapon.homingAcquireRange || 300;
            }

            // Acid: carry poison and puddle params
            if (weapon.bulletType === 'acid') {
                bullet.poisonDamage = weapon.poisonDamage || 3;
                bullet.poisonDuration = weapon.poisonDuration || 120;
                bullet.poisonTickInterval = weapon.poisonTickInterval || 20;
                bullet.puddleRadius = weapon.puddleRadius || 30;
                bullet.puddleDuration = weapon.puddleDuration || 180;
                bullet.puddleDamage = weapon.puddleDamage || 2;
                bullet.puddleTickInterval = weapon.puddleTickInterval || 15;
            }

            // Cluster: carry fragment params
            if (weapon.bulletType === 'cluster') {
                bullet.fragmentCount = weapon.fragmentCount || 8;
                bullet.fragmentDamage = weapon.fragmentDamage || 6;
                bullet.fragmentSpeed = weapon.fragmentSpeed || 8;
                bullet.fragmentLife = weapon.fragmentLife || 20;
                bullet.fragmentSize = weapon.fragmentSize || 3;
            }

            // Force: carry knockback and wall slam params
            if (weapon.bulletType === 'force') {
                bullet.wallSlamDamage = weapon.wallSlamDamage || 15;
            }

            // Vampyre: carry lifesteal params
            if (weapon.bulletType === 'vampyre') {
                bullet.lifestealPercent = weapon.lifestealPercent || 0.25;
                bullet.lifestealCap = weapon.lifestealCap || 10;
            }

            // Needle: carry embed DOT params
            if (weapon.bulletType === 'needle') {
                bullet.needleDamage = weapon.needleDamage || 4;
                bullet.needleDuration = weapon.needleDuration || 150;
                bullet.needleTickInterval = weapon.needleTickInterval || 15;
                bullet.needleMaxStacks = weapon.needleMaxStacks || 6;
            }

            // Railgun: carry acceleration params
            if (weapon.bulletType === 'railgun') {
                bullet.railAccel = weapon.railAccel || 0.35;
                bullet.railMaxSpeed = weapon.railMaxSpeed || 25;
                bullet.railDamageMultiplier = weapon.railDamageMultiplier || 0.15;
                bullet.railPierceSpeedThreshold = weapon.railPierceSpeedThreshold || 15;
                bullet.currentDamage = bullet.damage;
            }

            // Truck projectile: carry truck behavior params
            if (weapon.bulletType === 'truck_projectile') {
                bullet.truckStraightTime = weapon.truckStraightTime || 60;
                bullet.truckErraticTurnRate = weapon.truckErraticTurnRate || 0.08;
                bullet.truckMaxSpeed = weapon.truckMaxSpeed || 7;
                bullet.truckAcceleration = weapon.truckAcceleration || 0.1;
                bullet.truckTimer = 0;
            }

            // M2: Mine — carry mine params
            if (weapon.bulletType === 'mine') {
                bullet.mineArmTime = weapon.mineArmTime || 120;
                bullet.mineDetectRadius = weapon.mineDetectRadius || 64;
                bullet.mineBlastRadius = weapon.mineBlastRadius || 96;
                bullet.mineBlastDamage = weapon.mineBlastDamage || weapon.damage || 30;
                bullet.mineState = 'flying'; // flying → armed
                bullet.mineArmTimer = 0;
            }

            // M3: Sticky — carry sticky params
            if (weapon.bulletType === 'sticky') {
                bullet.stickyTimer = weapon.stickyTimer || 120;
                bullet.stickyBlastRadius = weapon.stickyBlastRadius || 80;
                bullet.stickyBlastDamage = weapon.stickyBlastDamage || weapon.damage || 40;
                bullet.stickyState = 'flying'; // flying → attached
                bullet.attachedTo = null;
                bullet.stuckAt = null;
            }

            // M4: Split — carry split params
            if (weapon.bulletType === 'split') {
                bullet.splitAfter = weapon.splitAfter || 30;
                bullet.splitCount = weapon.splitCount || 3;
                bullet.splitSpread = weapon.splitSpread || 60;
                bullet.splitGeneration = weapon.splitGeneration || 1;
                bullet.splitTimer = 0;
                bullet.splitBulletSpeed = weapon.splitBulletSpeed || weapon.bulletSpeed || 10;
                bullet.splitBulletLife = weapon.splitBulletLife || 40;
                bullet.splitBulletDamage = weapon.splitBulletDamage || weapon.damage || 8;
            }

            // M5: Wave — sine oscillation modifier (applies to any type)
            if (weapon.waveModifier) {
                bullet.waveAmplitude = weapon.waveAmplitude || 16;
                bullet.waveFrequency = weapon.waveFrequency || 0.15;
                bullet.waveTimer = 0;
                // Store base velocity direction for perpendicular calc
                bullet.waveBaseAngle = finalAngle;
            }

            // M6: Phase — ghost bullet modifier
            if (weapon.phaseThrough) {
                bullet.phaseThrough = true;
                // Track entities pierced for damage scaling
                bullet.phasePierceCount = 0;
                bullet.phaseDamageGain = weapon.phaseDamageGain || 0; // 0 = no gain, 0.5 = +50% per pierce
                bullet.phaseSlowAmount = weapon.phaseSlowAmount || 0; // slow applied to pierced enemies
            }

            // M7: Orbit — orbital bullet params
            if (weapon.bulletType === 'orbit') {
                bullet.orbitRadius = weapon.orbitBulletRadius || 48;
                bullet.orbitSpeed = weapon.orbitSpeed || 0.08;
                bullet.orbitAngle = finalAngle; // start angle
                bullet.orbitCenter = null; // set to player ref in BulletSystem
            }

            // M9: Bounce Grow — ricochet variant with growing damage/size
            if (weapon.bulletType === 'bounce_grow') {
                bullet.type = 'ricochet'; // reuse ricochet physics
                bullet.bounceCount = weapon.maxBounces || 6;
                bullet.maxBounces = weapon.maxBounces || 6;
                bullet.bounceGrowDamage = weapon.bounceGrowDamage || 1.8;
                bullet.bounceGrowSize = weapon.bounceGrowSize || 1.3;
                bullet.bounceGrowSpeed = weapon.bounceGrowSpeed || 1.0; // optional speed multiplier
            }

            // M10: Chain Explosion modifier
            if (weapon.chainExplosion) {
                bullet.chainExplosion = true;
                bullet.chainBlastRadius = weapon.chainBlastRadius || 64;
                bullet.chainMaxDepth = weapon.chainMaxDepth || 3;
                bullet.chainDepth = 0;
            }

            // M11: Meteor — carry meteor params
            if (weapon.bulletType === 'meteor') {
                bullet.meteorDelay = weapon.meteorDelay || 90;
                bullet.meteorBlastRadius = weapon.meteorBlastRadius || 128;
                bullet.meteorBlastDamage = weapon.meteorBlastDamage || weapon.damage || 60;
                bullet.meteorCount = weapon.meteorCount || 1;
                bullet.meteorSpread = weapon.meteorSpread || 0;
                bullet.meteorState = 'marking'; // marking → waiting → falling
            }

            // M12: Grapple — carry grapple params
            if (weapon.bulletType === 'grapple') {
                bullet.grappleSpeed = weapon.grappleSpeed || 8;
                bullet.grapplePull = weapon.grapplePull || 'player'; // 'player' or 'enemy'
            }

            this.bullets.push(bullet);
            created++;
        }

        return created;
    }

    spawnEnemyWeaponShot({ shooter, weapon, muzzle, aimAngleOverride = null }) {
        if (!shooter || !muzzle || !weapon) return false;

        const resolvedWeapon = typeof weapon === 'string'
            ? WEAPONS[weapon]
            : weapon;
        if (!resolvedWeapon) return false;

        if (resolvedWeapon.bulletType === 'laser_beam') {
            const pellets = resolvedWeapon.pelletCount || 1;
            const spreadRad = (resolvedWeapon.spread || 0) * Math.PI / 180;
            for (let p = 0; p < pellets; p++) {
                const offsetAngle = pellets > 1
                    ? (Math.random() - 0.5) * spreadRad
                    : 0;
                const spreadMuzzle = {
                    x: muzzle.x,
                    y: muzzle.y,
                    angle: muzzle.angle + offsetAngle
                };
                this.bulletSystem.fireLaserBeam(resolvedWeapon, spreadMuzzle, {
                    source: 'enemy',
                    shooter,
                    friendlyFire: true
                });
            }
            return true;
        }

        const created = this._pushWeaponProjectiles({
            weapon: resolvedWeapon,
            muzzle,
            source: 'enemy',
            owner: shooter,
            team: 'enemy',
            aimAngleOverride
        });

        return created > 0;
    }

    tryShoot() {
        const now = Date.now();
        const weapon = this.handSystem.currentWeapon;
        const FIRE_RATE = weapon.fireRate || 150;

        if (now - this.lastShotTime > FIRE_RATE) {
            // M14: Blood cost — check HP instead of ammo
            if (weapon.bloodCost) {
                if (this.player.hp <= weapon.bloodCost) return false;
            }

            const preMuzzle = this.handSystem.getMuzzleWorldPosition(now);
            if (!this.canShootFrom(this.player, preMuzzle)) {
                return false;
            }

            this.handSystem.triggerShoot();
            const muzzle = this.handSystem.getMuzzleWorldPosition(now);

            // Laser beam: hitscan, no bullet (supports spread for shotgun lasers)
            if (weapon.bulletType === 'laser_beam') {
                const pellets = weapon.pelletCount || 1;
                const spreadRad = (weapon.spread || 0) * Math.PI / 180;
                for (let p = 0; p < pellets; p++) {
                    const offsetAngle = pellets > 1
                        ? (Math.random() - 0.5) * spreadRad
                        : 0;
                    const spreadMuzzle = {
                        x: muzzle.x,
                        y: muzzle.y,
                        angle: muzzle.angle + offsetAngle
                    };
                    this.bulletSystem.fireLaserBeam(weapon, spreadMuzzle);
                }
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

            // Use shared _pushWeaponProjectiles to avoid code duplication
            this._pushWeaponProjectiles({ weapon, muzzle, source: 'player' });

            // M13: Mirror — fire a reverse bullet
            if (weapon.mirror) {
                this._pushWeaponProjectiles({
                    weapon, muzzle, source: 'player',
                    aimAngleOverride: muzzle.angle + Math.PI
                });
            }

            // M14: Blood cost — deduct HP + blood particles
            if (weapon.bloodCost) {
                this.player.hp -= weapon.bloodCost;
                for (let k = 0; k < 3; k++) {
                    this.particles.push({
                        x: this.player.x + (Math.random() - 0.5) * 8,
                        y: this.player.y + (Math.random() - 0.5) * 8,
                        vx: (Math.random() - 0.5) * 2,
                        vy: -Math.random() * 2,
                        life: 20,
                        color: '#8b0000',
                        size: Math.random() * 3 + 1,
                        friction: 0.9
                    });
                }
            }

            // M15: Echo — record shot for delayed replay
            if (weapon.echo) {
                this.echoQueue.push({
                    origin: { x: muzzle.x, y: muzzle.y },
                    angle: muzzle.angle,
                    weapon: weapon,
                    delay: weapon.echoDelay || 24, // frames until echo
                    echoesLeft: weapon.echoCount || 1,
                    damageMultiplier: 1.0
                });
            }

            const recoil = (weapon.damage || 10) / 5;
            this.camera.x += (Math.random() - 0.5) * recoil;
            this.camera.y += (Math.random() - 0.5) * recoil;

            // Initiate burst fire if weapon has burstCount
            if (weapon.burstCount > 1) {
                this.burstState = {
                    remaining: weapon.burstCount - 1,
                    interval: weapon.burstInterval || 60,
                    lastBurstShotTime: now,
                    weapon: weapon
                };
            }

            this.lastShotTime = now;
            return true;
        }
        return false;
    }

    updateBurst() {
        if (!this.burstState) return;
        const now = Date.now();
        if (now - this.burstState.lastBurstShotTime >= this.burstState.interval) {
            if (this.burstState.remaining > 0) {
                const weapon = this.burstState.weapon;
                const muzzle = this.handSystem.getMuzzleWorldPosition(now);
                if (muzzle && this.handSystem.canShoot()) {
                    this.handSystem.triggerShoot();
                    this._pushWeaponProjectiles({
                        weapon, muzzle, source: 'player'
                    });
                    this.handSystem.consumeAmmo();
                    const recoil = (weapon.damage || 10) / 8;
                    this.camera.x += (Math.random() - 0.5) * recoil;
                    this.camera.y += (Math.random() - 0.5) * recoil;
                }
                this.burstState.remaining--;
                this.burstState.lastBurstShotTime = now;
            }
            if (this.burstState.remaining <= 0) {
                this.burstState = null;
            }
        }
    }

    // M15: Echo bullet replay — call each frame
    updateEcho() {
        for (let i = this.echoQueue.length - 1; i >= 0; i--) {
            const echo = this.echoQueue[i];
            echo.delay--;
            if (echo.delay <= 0) {
                // Fire echo bullet from original position
                const echoWeapon = {
                    ...echo.weapon,
                    damage: Math.floor((echo.weapon.damage || 10) * echo.damageMultiplier),
                    echo: false, // prevent infinite echo loops
                    mirror: false, // don't mirror echoes
                    bloodCost: 0 // don't cost HP for echoes
                };
                const echoMuzzle = { x: echo.origin.x, y: echo.origin.y, angle: echo.angle };
                this._pushWeaponProjectiles({ weapon: echoWeapon, muzzle: echoMuzzle, source: 'player' });

                // Echo flash particle
                this.particles.push({
                    type: 'flash',
                    x: echo.origin.x, y: echo.origin.y,
                    size: 8, color: '#a29bfe', alpha: 0.6, life: 6
                });

                echo.echoesLeft--;
                if (echo.echoesLeft > 0) {
                    echo.delay = echo.weapon.echoDelay || 24;
                    echo.damageMultiplier *= 0.8; // Each echo 20% weaker
                } else {
                    this.echoQueue.splice(i, 1);
                }
            }
        }
    }

    // M1: Charge shot system — call when fire button held
    updateCharge(isFireHeld) {
        const weapon = this.handSystem.currentWeapon;
        if (!weapon || !weapon.chargeTime) {
            if (this.chargeState) this.chargeState = null;
            return;
        }

        const now = Date.now();
        if (isFireHeld) {
            if (!this.chargeState) {
                this.chargeState = { startTime: now, level: 0, weapon };
            }
            const elapsed = now - this.chargeState.startTime;
            const chargeTime = weapon.chargeTime || 1500; // ms for full charge
            this.chargeState.level = Math.min(3, Math.floor((elapsed / chargeTime) * 3) + 1);

            // Charge particles at muzzle
            const muzzle = this.handSystem.getMuzzleWorldPosition(now);
            if (muzzle && Math.random() > (0.8 - this.chargeState.level * 0.15)) {
                this.particles.push({
                    x: muzzle.x + (Math.random() - 0.5) * 8,
                    y: muzzle.y + (Math.random() - 0.5) * 8,
                    vx: (muzzle.x - this.player.x) * 0.05,
                    vy: (muzzle.y - this.player.y) * 0.05,
                    life: 10, color: weapon.bulletColor || '#f39c12',
                    size: this.chargeState.level + 1, friction: 0.9
                });
            }
        } else if (this.chargeState && this.chargeState.level > 0) {
            // Release — fire charged shot
            const level = this.chargeState.level;
            const chargedWeapon = {
                ...weapon,
                damage: Math.floor((weapon.damage || 10) * (1 + level * 0.8)),
                bulletSize: Math.floor((weapon.bulletSize || 5) * (1 + level * 0.4)),
                piercing: (weapon.piercing || 0) + level,
                pelletCount: weapon.chargePelletScale
                    ? Math.floor((weapon.pelletCount || 1) * (1 + (level - 1) * (weapon.chargePelletScale - 1)))
                    : (weapon.pelletCount || 1),
                chargeTime: undefined // prevent recursion
            };

            const muzzle = this.handSystem.getMuzzleWorldPosition(now);
            if (muzzle) {
                this.handSystem.triggerShoot();
                this._pushWeaponProjectiles({ weapon: chargedWeapon, muzzle, source: 'player' });
                if (weapon.mirror) {
                    this._pushWeaponProjectiles({
                        weapon: chargedWeapon, muzzle, source: 'player',
                        aimAngleOverride: muzzle.angle + Math.PI
                    });
                }
                const recoil = (chargedWeapon.damage || 10) / 4;
                this.camera.x += (Math.random() - 0.5) * recoil;
                this.camera.y += (Math.random() - 0.5) * recoil;
                this.lastShotTime = now;
            }
            this.chargeState = null;
            return true; // Signal that a shot was fired (for ammo consumption)
        } else {
            this.chargeState = null;
        }
        return false;
    }

    // M8: Continuous beam — call each frame when fire is held
    updateBeam(isFireHeld) {
        const weapon = this.handSystem.currentWeapon;
        if (!weapon || !weapon.continuous) {
            if (this.beamState) this.beamState = null;
            return;
        }

        const now = Date.now();
        if (isFireHeld) {
            if (!this.beamState) {
                this.beamState = { startTime: now, ammoTickCounter: 0 };
            }
            const muzzle = this.handSystem.getMuzzleWorldPosition(now);
            if (!muzzle) return;

            // Duration-based DPS scaling
            const elapsed = (now - this.beamState.startTime) / 1000;
            const baseDPS = weapon.beamDPS || 2;
            const maxDPS = weapon.beamMaxDPS || baseDPS * 4;
            const rampTime = weapon.beamRampTime || 3; // seconds to reach max
            const currentDPS = Math.min(maxDPS, baseDPS + (maxDPS - baseDPS) * (elapsed / rampTime));

            // Fire laser beam with current DPS
            const beamWeapon = { ...weapon, damage: Math.ceil(currentDPS), beamDuration: 2 };
            this.bulletSystem.fireLaserBeam(beamWeapon, muzzle);

            // Lifesteal for siphon-type beams
            if (weapon.beamLifesteal) {
                // Lifesteal handled in fireLaserBeam damage — just visual
                // (actual healing integrated into beam hits is complex, use vampyre-style)
            }

            // Consume ammo periodically
            this.beamState.ammoTickCounter++;
            const ammoRate = weapon.beamAmmoRate || 10; // frames per ammo consumed
            if (this.beamState.ammoTickCounter >= ammoRate) {
                this.beamState.ammoTickCounter = 0;
                this.handSystem.consumeAmmo();
                if (!this.handSystem.canShoot()) {
                    this.beamState = null; // Out of ammo
                }
            }
        } else {
            this.beamState = null; // Released fire button
        }
    }

    spawnEnemyBullet({ x, y, angle, damage, speed, color = '#e74c3c', size = 4, life = 100, type = 'standard', blastRadius, knockback }) {
        const bullet = {
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: life,
            maxLife: life,
            damage: damage,
            color: color,
            size: size,
            type: type,
            source: 'enemy'
        };
        if (blastRadius) bullet.blastRadius = blastRadius;
        if (knockback) bullet.knockback = knockback;
        this.bullets.push(bullet);
    }

    setObstacleIndex(index) { this.bulletSystem.setObstacleIndex(index); }

    // Delegated methods — external API unchanged
    updateBullets() { this.bulletSystem.update(); }
    updateBlackHoles() { this.statusEffects.updateBlackHoles(); }
    updateBurnEffects() { this.statusEffects.updateBurnEffects(); }
    updateBleedEffects() { this.statusEffects.updateBleedEffects(); }
    updateFreezeEffects() { this.statusEffects.updateFreezeEffects(); }
    updatePoisonEffects() { this.statusEffects.updatePoisonEffects(); }
    updateAcidPuddles() { this.statusEffects.updateAcidPuddles(); }
    updateForceEffects() { this.statusEffects.updateForceEffects(); }
    updateNeedleEffects() { this.statusEffects.updateNeedleEffects(); }
    updateParticles() { this.particleSpawner.updateParticles(); }
    spawnExplosion(x, y, damage, radius, knockback) { this.statusEffects.spawnExplosion(x, y, damage, radius, knockback); }
    spawnGroundSlam(x, y, damage, radius, knockback, color) { this.statusEffects.spawnGroundSlam(x, y, damage, radius, knockback, color); }
    spawnDebris(x, y, type) { this.particleSpawner.spawnDebris(x, y, type); }
    spawnBloodExplosion(x, y) { this.particleSpawner.spawnBloodExplosion(x, y); }
    spawnBloodSplatter(x, y, angle) { this.particleSpawner.spawnBloodSplatter(x, y, angle); }
}
