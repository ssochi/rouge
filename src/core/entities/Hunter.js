import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { EnemyHandSystem } from '../systems/EnemyHandSystem.js';

export class Hunter extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 40, 1.2); // Hitbox 20x20, HP 40, Speed 1.2 (Faster than zombie)
        
        this.handSystem = new EnemyHandSystem(this);
        
        // AI Config
        this.visionRange = 400;
        this.shootRange = 250;
        this.minRange = 100; // Too close, back off
        
        this.attackCooldown = 0;
        this.fireRate = 120; // 2 seconds
        
        this.state = 'idle'; // idle, chase, combat, flee
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem) {
        if (this.hp <= 0) return;

        super.update(player, walls, wallQuery);
        
        // Update Aim
        this.handSystem.update(player.x, player.y);
        
        // Facing
        if (player.x > this.x) this.facingRight = true;
        else this.facingRight = false;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Cooldown
        if (this.attackCooldown > 0) this.attackCooldown--;

        // AI Logic
        if (dist < this.visionRange) {
            // Can see player
            if (dist < this.shootRange) {
                // Combat State
                this.state = 'combat';
                
                // Behavior: 
                // 1. If too close, back off
                // 2. If in range, stop and shoot
                // 3. Strafe? (Advanced)
                
                if (dist < this.minRange) {
                    // Back off
                    this.moveAwayFrom(player, walls, wallQuery, getNavDirection);
                } else {
                    // Stand ground and shoot
                    // Maybe small random movement to not be a sitting duck
                    // But for now, stop to shoot accuracy
                }
                
                // Shoot Logic
                if (this.attackCooldown <= 0) {
                    this.shoot(combatSystem);
                }
                
            } else {
                // Chase State
                this.state = 'run';
                this.moveTowards(player, walls, wallQuery, getFlowDirection, getNavDirection);
            }
        } else {
            // Idle State
            this.state = 'idle';
        }
    }

    moveTowards(target, walls, wallQuery, getFlowDirection, getNavDirection) {
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
        
        const nextX = this.x + vx * this.speed;
        const nextY = this.y + vy * this.speed;
        this.resolveWallCollision(nextX, nextY, walls, wallQuery);
    }

    moveAwayFrom(target, walls, wallQuery, getNavDirection) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        let vx = 0, vy = 0;
        if (dist > 0) {
            vx = (dx / dist);
            vy = (dy / dist);
        }
        
        const nextX = this.x + vx * this.speed * 0.8; // Back off slightly slower
        const nextY = this.y + vy * this.speed * 0.8;
        this.resolveWallCollision(nextX, nextY, walls, wallQuery);
    }

    shoot(combatSystem) {
        if (!combatSystem) return;
        
        this.attackCooldown = this.fireRate;
        this.handSystem.triggerShoot();
        
        const muzzle = this.handSystem.getMuzzleWorldPosition();
        
        // Call combat system to spawn enemy bullet
        combatSystem.spawnEnemyBullet({
            x: muzzle.x,
            y: muzzle.y,
            angle: muzzle.angle,
            damage: 10,
            speed: 8
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
        if (this.state === 'run' || (this.state === 'combat' && this.speed > 0.1)) { // Check actual movement?
             // If backing off, run animation
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
        
        this.drawHpBar(ctx);
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
