import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';

export class ZombieBrute extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 24, 120, 0.7); // Hitbox 24x24, HP 120, Speed 0.7 (Slow & Heavy)

        this.attackRange = 35;
        this.attackCooldown = 0;
        this.damage = 18;

        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 50; // Slower, heavier swing
    }

    // Override: reduce incoming knockback by 70%
    takeDamage(amount, knockback) {
        this.hp -= amount;
        this.hitFlashTimer = 5;
        this.hpBarTimer = 120;
        if (knockback) {
            this.knockbackX = knockback.x * 0.3;
            this.knockbackY = knockback.y * 0.3;
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;

        super.update(player, walls, wallQuery);

        if (this.frozenTimer > 0) return;

        // Attack Logic
        if (this.isAttacking) {
            this.attackTimer++;

            if (this.attackTimer === 25) {
                this.checkAttackHit(player);
            }

            if (this.attackTimer >= this.attackDuration) {
                this.isAttacking = false;
                this.attackCooldown = 70;
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        // AI
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dx > 0) this.facingRight = true;
        else this.facingRight = false;

        if (dist < 600) {
            if (dist < this.attackRange && this.attackCooldown <= 0) {
                this.startAttack();
            } else if (dist > this.attackRange - 5) {
                this.state = 'run';
                if (this.knockbackX === 0 && this.knockbackY === 0) {
                    let moveX = 0;
                    let moveY = 0;
                    if (getFlowDirection) {
                        const flow = getFlowDirection(this.x, this.y);
                        if (flow && (flow.x !== 0 || flow.y !== 0)) {
                            moveX = flow.x;
                            moveY = flow.y;
                        }
                    }

                    if (moveX === 0 && moveY === 0 && dist > 0) {
                        moveX = dx / dist;
                        moveY = dy / dist;
                    }

                    let sepX = 0;
                    let sepY = 0;
                    if (getNearbyEnemies) {
                        const neighbors = getNearbyEnemies(this);
                        const desiredSep = 30; // Larger separation for big body
                        for (const other of neighbors) {
                            if (other === this) continue;
                            const ndx = this.x - other.x;
                            const ndy = this.y - other.y;
                            const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
                            if (ndist > 0 && ndist < desiredSep) {
                                const strength = (desiredSep - ndist) / desiredSep;
                                sepX += (ndx / ndist) * strength;
                                sepY += (ndy / ndist) * strength;
                            }
                        }
                    }

                    let vx = moveX + sepX * 1.4;
                    let vy = moveY + sepY * 1.4;
                    const vLen = Math.sqrt(vx * vx + vy * vy);
                    if (vLen > 0) {
                        vx /= vLen;
                        vy /= vLen;
                    }

                    if (getNavDirection) {
                        const nav = getNavDirection(this, vx, vy);
                        if (nav && (nav.x !== 0 || nav.y !== 0)) {
                            vx = nav.x;
                            vy = nav.y;
                        }
                    }

                    const nextX = this.x + vx * this.getEffectiveSpeed();
                    const nextY = this.y + vy * this.getEffectiveSpeed();

                    if (moveResolver) {
                        moveResolver(this, nextX, nextY, vx, vy);
                    } else {
                        this.resolveWallCollision(nextX, nextY, walls, wallQuery);
                    }
                }
            } else {
                this.state = 'idle';
            }
        } else {
            this.state = 'idle';
        }
    }

    startAttack() {
        this.isAttacking = true;
        this.attackTimer = 0;
        this.state = 'attack';
    }

    checkAttackHit(player) {
        if (player.state === 'driving') return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.attackRange + 15) {
            if (player.takeDamage) {
                const angle = Math.atan2(dy, dx);
                const knockback = {
                    x: Math.cos(angle) * 12,
                    y: Math.sin(angle) * 12
                };
                player.takeDamage(this.damage, knockback);
            } else {
                player.hp -= this.damage;
            }
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Shadow (larger for big body)
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 14, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Sprite (40x40, offset -20,-20 to center)
        let frames = Assets.zombieBrute.idle;
        let frameIndex;
        if (this.isAttacking && Assets.zombieBrute.attack) {
            frames = Assets.zombieBrute.attack;
            frameIndex = Math.min(
                Math.floor((this.attackTimer / this.attackDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run') {
            frames = Assets.zombieBrute.run;
            frameIndex = Math.floor(this.animationTimer / 6) % frames.length;
        } else {
            frameIndex = Math.floor(this.animationTimer / 6) % frames.length;
        }

        if (frames) {
            ctx.drawImage(frames[frameIndex], -20, -20);
        }

        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
            if (frames) {
                ctx.drawImage(frames[frameIndex], -20, -20);
            }
            ctx.restore();
        }

        ctx.restore();

        this.drawHpBar(ctx);
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;

        const barWidth = 28;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 28);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);

        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
