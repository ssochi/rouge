import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { EnemyHandSystem } from '../systems/EnemyHandSystem.js';

export class Soldier extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 60, 0.9); // Hitbox 20x20, HP 60, Speed 0.9

        this.handSystem = new EnemyHandSystem(this, 'smg');

        // AI Config
        this.visionRange = 350;
        this.shootRange = 200;
        this.minRange = 70;

        // Burst-fire system
        this.burstRemaining = 0;       // Shots left in current burst
        this.burstSize = 3;            // Shots per burst
        this.burstDelay = 0;           // Timer between burst shots
        this.burstDelayMax = 8;        // Frames between shots in a burst
        this.burstCooldown = 0;        // Timer between bursts
        this.burstCooldownMax = 160;   // Frames between bursts
        this.spread = 0.08;            // Bullet spread (radians)

        this.damage = 5;

        // Strafe
        this.strafeDir = 1;           // 1 = right, -1 = left
        this.strafeTimer = 0;

        this.state = 'idle';
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;

        super.update(player, walls, wallQuery);

        if (this.frozenTimer > 0) return;

        // Update Aim
        this.handSystem.update(player.x, player.y);

        // Facing
        if (player.x > this.x) this.facingRight = true;
        else this.facingRight = false;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Burst cooldown
        if (this.burstCooldown > 0) this.burstCooldown--;
        if (this.burstDelay > 0) this.burstDelay--;

        // Continue burst (fire remaining shots)
        if (this.burstRemaining > 0 && this.burstDelay <= 0) {
            this.fireOneBullet(combatSystem);
            this.burstRemaining--;
            if (this.burstRemaining > 0) {
                this.burstDelay = this.burstDelayMax;
            } else {
                this.burstCooldown = this.burstCooldownMax;
            }
        }

        // AI Logic
        if (dist < this.visionRange) {
            if (dist < this.shootRange) {
                this.state = 'combat';

                if (dist < this.minRange) {
                    // Back off
                    this.moveAwayFrom(player, walls, wallQuery, moveResolver);
                } else {
                    // Strafe while shooting
                    this.strafeMove(player, walls, wallQuery, moveResolver);
                }

                // Start new burst
                if (this.burstCooldown <= 0 && this.burstRemaining <= 0) {
                    this.startBurst();
                }
            } else {
                // Chase
                this.state = 'run';
                this.moveTowards(player, walls, wallQuery, getFlowDirection, getNavDirection, moveResolver);
            }
        } else {
            this.state = 'idle';
        }
    }

    startBurst() {
        this.burstRemaining = this.burstSize;
        this.burstDelay = 0; // Fire first shot immediately
    }

    fireOneBullet(combatSystem) {
        if (!combatSystem) return;

        this.handSystem.triggerShoot();

        const muzzle = this.handSystem.getMuzzleWorldPosition();
        const spreadAngle = muzzle.angle + (Math.random() - 0.5) * this.spread * 2;

        combatSystem.spawnEnemyBullet({
            x: muzzle.x,
            y: muzzle.y,
            angle: spreadAngle,
            damage: this.damage,
            speed: 9
        });
    }

    moveTowards(target, walls, wallQuery, getFlowDirection, getNavDirection, moveResolver) {
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
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                vx = dx / dist;
                vy = dy / dist;
            }
        }

        const len = Math.sqrt(vx * vx + vy * vy);
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

    moveAwayFrom(target, walls, wallQuery, moveResolver) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let vx = 0, vy = 0;
        if (dist > 0) {
            vx = dx / dist;
            vy = dy / dist;
        }

        const nextX = this.x + vx * this.getEffectiveSpeed() * 0.7;
        const nextY = this.y + vy * this.getEffectiveSpeed() * 0.7;
        if (moveResolver) {
            moveResolver(this, nextX, nextY, vx, vy);
        } else {
            this.resolveWallCollision(nextX, nextY, walls, wallQuery);
        }
    }

    strafeMove(player, walls, wallQuery, moveResolver) {
        // Change strafe direction periodically
        this.strafeTimer++;
        if (this.strafeTimer > 90) { // Switch every ~1.5 seconds
            this.strafeDir *= -1;
            this.strafeTimer = 0;
        }

        // Perpendicular to player direction
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= 0) return;

        // Perpendicular vector
        let vx = -dy / dist * this.strafeDir;
        let vy = dx / dist * this.strafeDir;

        const nextX = this.x + vx * this.getEffectiveSpeed() * 0.5;
        const nextY = this.y + vy * this.getEffectiveSpeed() * 0.5;
        if (moveResolver) {
            moveResolver(this, nextX, nextY, vx, vy);
        } else {
            this.resolveWallCollision(nextX, nextY, walls, wallQuery);
        }
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
        let frames = Assets.soldier.idle;
        if (this.state === 'run' || this.state === 'combat') {
            frames = Assets.soldier.run;
        }

        if (frames) {
            const speedDiv = 8;
            const frameIndex = Math.floor(this.animationTimer / speedDiv) % frames.length;
            ctx.drawImage(frames[frameIndex], -16, -16);
        }

        // Hit Flash
        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
            if (frames) {
                const speedDiv = 8;
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
        ctx.fillStyle = '#4a7c3f'; // Military green
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
