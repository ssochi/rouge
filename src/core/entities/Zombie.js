import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';

export class Zombie extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 50, 1.0); // Hitbox 20x20, HP 50, Speed 1.0 (Slow)
        
        this.attackRange = 30;
        this.attackCooldown = 0;
        this.damage = 10;
        
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 40; // Frames for attack
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;

        super.update(player, walls, wallQuery);

        if (this.frozenTimer > 0) return;

        // Attack Logic
        if (this.isAttacking) {
            this.attackTimer++;

            // Hit Frame (e.g. frame 20)
            if (this.attackTimer === 20) {
                this.checkAttackHit(player);
            }

            if (this.attackTimer >= this.attackDuration) {
                this.isAttacking = false;
                this.attackCooldown = 60; // 1 second cooldown
            }
            return; // Don't move while attacking
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        // AI
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Direction
        if (dx > 0) this.facingRight = true;
        else this.facingRight = false;

        if (dist < 600) { // Aggro Range
            if (dist < this.attackRange && this.attackCooldown <= 0) {
                this.startAttack();
            } else if (dist > this.attackRange - 5) {
                this.state = 'run';
                // Move towards player
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
                    
                    if (moveX === 0 && moveY === 0 && dist > 0 && dist < this.attackRange * 1.5) {
                        moveX = dx / dist;
                        moveY = dy / dist;
                    }

                    let sepX = 0;
                    let sepY = 0;
                    if (getNearbyEnemies) {
                        const neighbors = getNearbyEnemies(this);
                        const desiredSep = 24;
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
        if (player.state === 'driving' || player.state === 'roll') return;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.attackRange + 15) {
             // Apply Damage
             // Check if player has takeDamage method, otherwise modify directly
             if (player.takeDamage) {
                 const angle = Math.atan2(dy, dx);
                 const knockback = {
                     x: Math.cos(angle) * 8,
                     y: Math.sin(angle) * 8
                 };
                 player.takeDamage(this.damage, knockback);
             } else {
                 // Fallback if method doesn't exist yet
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
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Sprite
        let frames = Assets.zombie.idle;
        let frameIndex;
        if (this.isAttacking && Assets.zombie.attack) {
            frames = Assets.zombie.attack;
            // Map attackTimer (0~attackDuration) to attack frames (0~7)
            frameIndex = Math.min(
                Math.floor((this.attackTimer / this.attackDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run') {
            frames = Assets.zombie.run;
            frameIndex = Math.floor(this.animationTimer / 5) % frames.length;
        } else {
            frameIndex = Math.floor(this.animationTimer / 5) % frames.length;
        }

        if (frames) {
            ctx.drawImage(frames[frameIndex], -16, -16);
        }

        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
            if (frames) {
                ctx.drawImage(frames[frameIndex], -16, -16);
            }
            ctx.restore();
        }

        ctx.restore(); // Restore main context state (rotation/translation/scale)
        
        // HP Bar (Draw in world space above the zombie)
        // We need to undo the scaling if we want a consistent size, but it's fine to scale with the world.
        // Since we already restored the context, we are back to World Coordinates but untranslated? 
        // No, we restored to BEFORE the zombie translation.
        // So we need to translate again to draw HP bar, OR draw it relative to this.x/this.y
        
        this.drawHpBar(ctx);
    }

    getLightOccluderSprites() {
        if (this.hp <= 0 || this.blocksLight === false) return [];

        let frames = Assets.zombie.idle;
        let frameIndex = 0;
        if (this.isAttacking && Assets.zombie.attack) {
            frames = Assets.zombie.attack;
            frameIndex = Math.min(
                Math.floor((this.attackTimer / this.attackDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run') {
            frames = Assets.zombie.run;
            frameIndex = Math.floor(this.animationTimer / 5) % frames.length;
        } else {
            frameIndex = Math.floor(this.animationTimer / 5) % frames.length;
        }
        if (!frames || frames.length === 0) return [];

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

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;

        const barWidth = 24;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 24);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Fill
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#e74c3c'; // Red
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
