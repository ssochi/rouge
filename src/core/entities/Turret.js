import { Assets } from '../../graphics/Assets.js';
import { PixelDraw } from '../../utils/PixelDraw.js';

const MAX_TURRETS = 5;

export class Turret {
    constructor(x, y, enemies, bullets, particles) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;

        // Combat stats
        this.hp = 80;
        this.maxHp = 80;
        this.attackRange = 100;
        this.fireRate = 400;       // ms between shots
        this.damage = 8;
        this.bulletSpeed = 10;
        this.bulletColor = '#66bb6a';
        this.bulletSize = 3;

        // State
        this.angle = 0;
        this.targetAngle = 0;
        this.target = null;
        this.lastFireTime = 0;
        this.isBroken = false;
        this.isTurret = true;      // Identifier flag
        this.hitFlashTimer = 0;
        this.hpBarTimer = 0;
        this.deployTimer = 30;     // Deploy animation frames

        // Hitbox (bottom-aligned for movement collision)
        this.hitbox = { offsetX: 4, offsetY: 16, width: 16, height: 8 };

        // Shadow
        this.shadow = { rx: 10, ry: 4, y: 22 };

        // External references
        this._enemies = enemies;
        this._bullets = bullets;
        this._particles = particles;

        // Sprites
        this._sprites = Assets.turret;

        // Flash sprite cache
        this._flashBase = null;
        this._flashGun = null;
    }

    getHitbox() {
        return {
            x: this.x + this.hitbox.offsetX,
            y: this.y + this.hitbox.offsetY,
            w: this.hitbox.width,
            h: this.hitbox.height,
            width: this.hitbox.width,
            height: this.hitbox.height
        };
    }

    getHurtbox() {
        return {
            x: this.x + 2,
            y: this.y + 2,
            width: 20,
            height: 20
        };
    }

    getHurtboxes() {
        return [this.getHurtbox()];
    }

    getHitboxes() {
        return [this.getHitbox()];
    }

    getOcclusionHitboxes() {
        return this.getHitboxes();
    }

    takeDamage(amount) {
        if (this.isBroken) return;
        this.hp -= amount;
        this.hitFlashTimer = 5;
        this.hpBarTimer = 120;
        if (this.hp <= 0) {
            this.break();
        }
    }

    break() {
        this.isBroken = true;
        // Spawn explosion particles
        for (let i = 0; i < 12; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this._particles.push({
                x: this.x + 12,
                y: this.y + 12,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                life: 20 + Math.random() * 15,
                color: Math.random() > 0.5 ? '#636e72' : '#ff7675',
                size: Math.random() * 4 + 2,
                friction: 0.92
            });
        }
        // Smoke puff
        for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            this._particles.push({
                x: this.x + 12 + Math.cos(a) * 4,
                y: this.y + 10 + Math.sin(a) * 4,
                vx: Math.cos(a) * 0.5,
                vy: Math.sin(a) * 0.5 - 0.5,
                life: 30,
                color: '#636e72',
                size: Math.random() * 6 + 4,
                friction: 0.95
            });
        }
    }

    update() {
        if (this.isBroken) return;

        if (this.hitFlashTimer > 0) this.hitFlashTimer--;
        if (this.hpBarTimer > 0) this.hpBarTimer--;
        if (this.deployTimer > 0) {
            this.deployTimer--;
            return; // Still deploying, don't shoot
        }

        // Find target
        this._findTarget();

        if (this.target) {
            // Calculate angle to target
            const dx = this.target.x - (this.x + 12);
            const dy = this.target.y - (this.y + 12);
            this.targetAngle = Math.atan2(dy, dx);

            // Smooth rotation toward target
            let angleDiff = this.targetAngle - this.angle;
            // Normalize to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += angleDiff * 0.15;

            // Shoot if aimed close enough
            const aimThreshold = 0.2; // radians
            if (Math.abs(angleDiff) < aimThreshold) {
                this._shoot();
            }
        }
    }

    _findTarget() {
        this.target = null;
        let nearestDist = this.attackRange;

        for (const e of this._enemies) {
            if (!e || e.hp <= 0) continue;
            const dx = e.x - (this.x + 12);
            const dy = e.y - (this.y + 12);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                this.target = e;
            }
        }
    }

    _shoot() {
        const now = Date.now();
        if (now - this.lastFireTime < this.fireRate) return;
        this.lastFireTime = now;

        const cx = this.x + 12;
        const cy = this.y + 8; // Slightly above center (gun layer offset)
        const muzzleDist = 16;
        const mx = cx + Math.cos(this.angle) * muzzleDist;
        const my = cy + Math.sin(this.angle) * muzzleDist;

        this._bullets.push({
            x: mx,
            y: my,
            vx: Math.cos(this.angle) * this.bulletSpeed,
            vy: Math.sin(this.angle) * this.bulletSpeed,
            life: 40,
            maxLife: 40,
            damage: this.damage,
            color: this.bulletColor,
            size: this.bulletSize,
            type: 'standard',
            source: 'player',
            owner: this,
            hitList: []
        });

        // Muzzle flash particle
        this._particles.push({
            type: 'flash',
            x: mx,
            y: my,
            size: 8,
            color: '#fdcb6e',
            alpha: 0.8,
            life: 4
        });

        // Small recoil particles
        for (let i = 0; i < 2; i++) {
            const spread = (Math.random() - 0.5) * 0.5;
            this._particles.push({
                x: mx,
                y: my,
                vx: Math.cos(this.angle + spread) * 2,
                vy: Math.sin(this.angle + spread) * 2,
                life: 6,
                color: '#ffeaa7',
                size: 2,
                friction: 0.85
            });
        }
    }

    draw(ctx) {
        if (this.isBroken) return;

        const cx = Math.floor(this.x);
        const cy = Math.floor(this.y);

        // Deploy animation (scale up)
        let scale = 1;
        if (this.deployTimer > 0) {
            scale = 1 - (this.deployTimer / 30) * 0.5;
        }

        ctx.save();
        ctx.translate(cx, cy);

        if (scale < 1) {
            ctx.translate(12, 12);
            ctx.scale(scale, scale);
            ctx.translate(-12, -12);
        }

        // Layer 1: Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(12, this.shadow.y, this.shadow.rx, this.shadow.ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Base (static, no rotation)
        const baseSprite = this._sprites.base;
        if (this.hitFlashTimer > 0) {
            if (!this._flashBase) {
                this._flashBase = PixelDraw.createSilhouette(baseSprite);
            }
            ctx.drawImage(this._flashBase, 0, 0);
        } else {
            ctx.drawImage(baseSprite, 0, 0);
        }

        // Layer 3: Gun (rotates, yOffset = -4)
        const gunSprite = this._sprites.gun;
        ctx.save();
        ctx.translate(12, 8); // Pivot point (center of base, raised)
        ctx.rotate(this.angle);
        if (this.hitFlashTimer > 0) {
            if (!this._flashGun) {
                this._flashGun = PixelDraw.createSilhouette(gunSprite);
            }
            ctx.drawImage(this._flashGun, -14, -6); // Gun anchor at center (14,6)
        } else {
            ctx.drawImage(gunSprite, -14, -6);
        }
        ctx.restore();

        ctx.restore();

        // HP Bar
        if (this.hpBarTimer > 0 && this.hp < this.maxHp) {
            this._drawHpBar(ctx, cx, cy);
        }
    }

    _drawHpBar(ctx, cx, cy) {
        const barW = 20;
        const barH = 3;
        const barX = cx + 12 - barW / 2;
        const barY = cy - 6;
        const ratio = Math.max(0, this.hp / this.maxHp);

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        // HP fill
        ctx.fillStyle = ratio > 0.5 ? '#00b894' : ratio > 0.25 ? '#fdcb6e' : '#e17055';
        ctx.fillRect(barX, barY, barW * ratio, barH);
    }

    /**
     * Static helper: enforce turret count limit
     */
    static enforceTurretLimit(breakableObjects) {
        const turrets = breakableObjects.filter(o => o.isTurret && !o.isBroken);
        while (turrets.length > MAX_TURRETS) {
            turrets[0].break();
            turrets.shift();
        }
    }
}
