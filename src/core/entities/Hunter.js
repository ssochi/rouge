import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { EnemyHandSystem } from '../systems/EnemyHandSystem.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { createWeaponInstanceData, weaponItemIdFromConfigId } from '../systems/WeaponInstanceUtils.js';
import { EnemyWeaponController } from '../systems/EnemyWeaponController.js';
import { MeleeSystem } from '../systems/MeleeSystem.js';

export class Hunter extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 40, 1.2); // Hitbox 20x20, HP 40, Speed 1.2 (Faster than zombie)

        this.handSystem = new EnemyHandSystem(this, 'default_pistol');

        // AI Config
        this.visionRange = 400;
        this.shootRange = 250;
        this.currentWeapon = WEAPONS.default_pistol;

        this.isNonZombieEnemy = true;
        this.canOpenDoors = true;
        this.dropWeaponChance = 0.3;
        this.weaponConfigId = 'default_pistol';
        this.weaponItemId = weaponItemIdFromConfigId(this.weaponConfigId);
        this.weaponInstanceData = createWeaponInstanceData({ weaponConfigId: this.weaponConfigId });
        this.weaponController = new EnemyWeaponController({
            owner: this,
            handSystem: this.handSystem,
            weaponConfigId: this.weaponConfigId,
            weaponInstanceData: this.weaponInstanceData
        });
        this.fireIntervalMultiplier = 2;

        this.meleeSystem = null;

        this.setCombatWeapon(this.weaponConfigId);

        this.state = 'idle'; // idle, run, combat
    }

    initMeleeSystem({ player, breakableObjects, walls, particles, particleSpawner, statusEffects }) {
        this.meleeSystem = new MeleeSystem({
            owner: this,
            targets: [player],
            breakableObjects,
            walls,
            particles,
            handSystem: this.handSystem,
            particleSpawner,
            statusEffects,
            onHit: null
        });
        this.handSystem.setMeleeSystem(this.meleeSystem);
    }

    setCombatWeapon(weaponConfigId) {
        if (!weaponConfigId || !WEAPONS[weaponConfigId]) return;
        const weapon = WEAPONS[weaponConfigId];

        this.weaponConfigId = weaponConfigId;
        this.weaponItemId = weaponItemIdFromConfigId(weaponConfigId);
        this.weaponInstanceData = createWeaponInstanceData({ weaponConfigId });
        this.currentWeapon = weapon;
        this.handSystem.setWeapon(weaponConfigId);
        this.weaponController.setWeapon(weaponConfigId, this.weaponInstanceData);

        if (weapon.isMelee) {
            this.shootRange = weapon.meleeRange || 52;
        } else if (weapon.bulletType === 'laser_beam') {
            this.shootRange = weapon.laserMaxRange || 600;
        } else {
            const bulletLife = weapon.bulletLife || 50;
            const bulletSpeed = weapon.bulletSpeed || 10;
            this.shootRange = Math.max(140, Math.min(700, bulletLife * bulletSpeed));
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;

        super.update(player, walls, wallQuery);

        if (this.weaponController) {
            this.weaponController.update();
        }
        if (this.meleeSystem) {
            this.meleeSystem.update();
        }

        if (this.frozenTimer > 0) return;

        // Update Aim
        this.handSystem.update(player.x, player.y);

        // Facing
        if (player.x > this.x) this.facingRight = true;
        else this.facingRight = false;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // AI Logic
        if (dist < this.visionRange) {
            if (this.currentWeapon && this.currentWeapon.isMelee) {
                // Melee AI
                if (dist < this.shootRange) {
                    this.state = 'combat';
                    if (this.meleeSystem && !this.meleeSystem.isAttacking) {
                        this.meleeSystem.tryAttack();
                    }
                } else {
                    this.state = 'run';
                    this.moveTowards(player, walls, wallQuery, getFlowDirection, getNavDirection, moveResolver);
                }
            } else {
                // Ranged AI
                if (dist < this.shootRange) {
                    this.state = 'combat';
                    const muzzle = this.handSystem.getMuzzleWorldPosition();
                    const canShoot = !combatSystem || !combatSystem.canShootFrom
                        ? true
                        : combatSystem.canShootFrom(this, muzzle, player);

                    if (!canShoot) {
                        this.state = 'run';
                        this.moveTowards(player, walls, wallQuery, getFlowDirection, getNavDirection, moveResolver);
                    } else {
                        this.shoot(combatSystem, player);
                    }
                } else {
                    this.state = 'run';
                    this.moveTowards(player, walls, wallQuery, getFlowDirection, getNavDirection, moveResolver);
                }
            }
        } else {
            this.state = 'idle';
        }
    }

    moveTowards(target, walls, wallQuery, getFlowDirection, getNavDirection, moveResolver) {
        // Reuse Zombie movement logic or simplify
        // Here we use simple nav
        let vx = 0, vy = 0;
        
        if (getFlowDirection) {
            const flow = getFlowDirection(this.x, this.y);
            if (flow && (flow.x !== 0 || flow.y !== 0)) {
                vx = flow.x;
                vy = flow.y;
            }
        }
        
        if (vx === 0 && vy === 0) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                vx = dx/dist;
                vy = dy/dist;
            }
        }
        
        // Normalize
        const len = Math.sqrt(vx*vx + vy*vy);
        if (len > 0) {
            vx /= len;
            vy /= len;
        }
        
        const nextX = this.x + vx * this.getEffectiveSpeed();
        const nextY = this.y + vy * this.getEffectiveSpeed();
        if (moveResolver) {
            moveResolver(this, nextX, nextY, vx, vy);
        } else {
            this.resolveWallCollision(nextX, nextY, walls, wallQuery);
        }
    }

    shoot(combatSystem, target = null) {
        if (!this.weaponController) return { fired: false, reason: 'invalid' };
        return this.weaponController.tryFire({
            combatSystem,
            shooter: this,
            target,
            fireIntervalMultiplier: this.fireIntervalMultiplier
        });
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        
        if (this.facingRight) {
            ctx.scale(-1, 1);
        }
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sprite
        let frames = Assets.hunter.idle;
        if (this.state === 'run') {
             frames = Assets.hunter.run;
        }
        
        if (frames) {
            const speedDiv = 10;
            const frameIndex = Math.floor(this.animationTimer / speedDiv) % frames.length;
            ctx.drawImage(frames[frameIndex], -16, -16);
        }

        // Hit Flash
        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)'; 
            if (frames) {
                 const speedDiv = 10;
                 const frameIndex = Math.floor(this.animationTimer / speedDiv) % frames.length;
                 ctx.drawImage(frames[frameIndex], -16, -16);
            }
            ctx.restore();
        }

        ctx.restore();
        
        // Draw Hand System (in World Space)
        this.handSystem.draw(ctx);

        this.drawReloadBar(ctx);
        this.drawHpBar(ctx);
    }

    getLightOccluderSprites() {
        if (this.hp <= 0 || this.blocksLight === false) return [];

        let frames = Assets.hunter.idle;
        if (this.state === 'run') {
            frames = Assets.hunter.run;
        }
        if (!frames || frames.length === 0) return [];

        const speedDiv = 10;
        const frameIndex = Math.floor(this.animationTimer / speedDiv) % frames.length;
        const sprite = frames?.[frameIndex];
        if (!sprite) return [];

        return [{
            kind: 'sprite',
            sprite,
            pivotX: this.x,
            pivotY: this.y,
            originX: 16,
            originY: 16,
            rotation: 0,
            flipX: this.facingRight === true
        }];
    }

    drawReloadBar(ctx) {
        if (!this.weaponController || !this.weaponController.isReloading) return;

        const progress = this.weaponController.getReloadProgress(Date.now());
        const y = this.hpBarTimer > 0 ? this.y - 30 : this.y - 24;

        ctx.save();
        ctx.translate(this.x, y);

        const scale = 0.55;
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(6, -4);
        ctx.quadraticCurveTo(12, 0, 6, 4);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-12, -4);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.clip();

        const totalWidth = 24;
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(-12, -4, totalWidth * progress, 8);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-12, -2, totalWidth, 2);

        ctx.restore();
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;

        const barWidth = 24;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 24);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);

        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#e67e22'; // Orange for Hunter
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
        
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
