import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';

export class ZombieFemale extends Enemy {
    constructor(x, y) {
        super(x, y, 18, 18, 35, 1.1); // Hitbox 18x18, HP 35, Speed 1.1 (Slightly faster)

        this.attackRange = 28;
        this.attackCooldown = 0;
        this.damage = 8;

        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 35; // Slightly faster attack than male

        // Sprint ability (cooldown-based)
        this.isSprinting = false;
        this.sprintTimer = 0;
        this.sprintDuration = 180; // 3 seconds at 60fps
        this.sprintCooldown = 0;
        this.sprintCooldownMax = 3600; // 1 minute at 60fps
        this.sprintTriggerDistance = 200;

        // Sprint VFX
        this.afterimages = []; // [{x, y, facingRight, alpha, frameIndex}]
        this.sprintParticles = []; // dust + speed lines
    }

    getEffectiveSpeed() {
        const base = super.getEffectiveSpeed();
        if (this.isSprinting) return base * 2;
        return base;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;

        super.update(player, walls, wallQuery);

        if (this.frozenTimer > 0) return;

        // Sprint ability update
        if (this.sprintCooldown > 0) this.sprintCooldown--;
        if (this.isSprinting) {
            this.sprintTimer++;
            if (this.sprintTimer >= this.sprintDuration) {
                this.isSprinting = false;
                this.sprintCooldown = this.sprintCooldownMax;
            }
        }

        // Update VFX particles
        this.updateSprintVFX();

        // Attack Logic
        if (this.isAttacking) {
            this.attackTimer++;

            if (this.attackTimer === 18) {
                this.checkAttackHit(player);
            }

            if (this.attackTimer >= this.attackDuration) {
                this.isAttacking = false;
                this.attackCooldown = 55;
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        // AI (same as male zombie)
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dx > 0) this.facingRight = true;
        else this.facingRight = false;

        // Trigger sprint when close enough (cooldown-based)
        if (this.sprintCooldown <= 0 && !this.isSprinting && dist < this.sprintTriggerDistance && dist > this.attackRange) {
            this.isSprinting = true;
            this.sprintTimer = 0;
        }

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

                    if (moveX === 0 && moveY === 0 && dist > 0 && dist < this.attackRange * 1.5) {
                        moveX = dx / dist;
                        moveY = dy / dist;
                    }

                    let sepX = 0;
                    let sepY = 0;
                    if (getNearbyEnemies) {
                        const neighbors = getNearbyEnemies(this);
                        const desiredSep = 22;
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
             if (player.takeDamage) {
                 const angle = Math.atan2(dy, dx);
                 const knockback = {
                     x: Math.cos(angle) * 6,
                     y: Math.sin(angle) * 6
                 };
                 player.takeDamage(this.damage, knockback);
             } else {
                 player.hp -= this.damage;
             }
        }
    }

    updateSprintVFX() {
        // Update afterimages
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            this.afterimages[i].alpha -= 0.08;
            if (this.afterimages[i].alpha <= 0) {
                this.afterimages.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.sprintParticles.length - 1; i >= 0; i--) {
            const p = this.sprintParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                this.sprintParticles.splice(i, 1);
            }
        }

        // Spawn new VFX while sprinting
        if (this.isSprinting && this.state === 'run') {
            // Afterimage every 4 frames
            if (this.sprintTimer % 4 === 0) {
                const frames = Assets.zombieFemale.run;
                const animSpeed = 3;
                const frameIndex = Math.floor(this.animationTimer / animSpeed) % frames.length;
                this.afterimages.push({
                    x: this.x,
                    y: this.y,
                    facingRight: this.facingRight,
                    alpha: 0.5,
                    frameIndex
                });
            }

            // Dust particles at feet every 3 frames
            if (this.sprintTimer % 3 === 0) {
                const dir = this.facingRight ? -1 : 1;
                this.sprintParticles.push({
                    x: this.x + dir * (3 + Math.random() * 4),
                    y: this.y + 10 + Math.random() * 4,
                    vx: dir * (0.3 + Math.random() * 0.5),
                    vy: -(0.2 + Math.random() * 0.4),
                    size: 1 + Math.random() * 2,
                    life: 12 + Math.floor(Math.random() * 8),
                    type: 'dust'
                });
            }

            // Speed lines every 5 frames
            if (this.sprintTimer % 5 === 0) {
                const dir = this.facingRight ? -1 : 1;
                this.sprintParticles.push({
                    x: this.x + dir * (6 + Math.random() * 8),
                    y: this.y - 6 + Math.random() * 16,
                    vx: dir * (1.0 + Math.random() * 0.8),
                    vy: 0,
                    length: 4 + Math.random() * 6,
                    life: 8 + Math.floor(Math.random() * 4),
                    type: 'line'
                });
            }
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        // Draw afterimages (behind the main sprite)
        this.drawAfterimages(ctx);

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw Sprite
        let frames = Assets.zombieFemale.idle;
        let frameIndex;
        if (this.isAttacking && Assets.zombieFemale.attack) {
            frames = Assets.zombieFemale.attack;
            frameIndex = Math.min(
                Math.floor((this.attackTimer / this.attackDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run') {
            frames = Assets.zombieFemale.run;
            const animSpeed = this.isSprinting ? 3 : 5;
            frameIndex = Math.floor(this.animationTimer / animSpeed) % frames.length;
        } else {
            frameIndex = Math.floor(this.animationTimer / 5) % frames.length;
        }

        if (frames) {
            ctx.drawImage(frames[frameIndex], -16, -16);
        }

        // Sprint tint overlay
        if (this.isSprinting && frames) {
            ctx.save();
            ctx.globalAlpha = 0.15 + Math.sin(this.sprintTimer * 0.3) * 0.1;
            ctx.filter = 'brightness(150%) sepia(80%) saturate(300%) hue-rotate(-10deg)';
            ctx.drawImage(frames[frameIndex], -16, -16);
            ctx.restore();
        }

        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
            if (frames) {
                ctx.drawImage(frames[frameIndex], -16, -16);
            }
            ctx.restore();
        }

        ctx.restore();

        // Draw particles (in front)
        this.drawSprintParticles(ctx);

        this.drawHpBar(ctx);
    }

    getLightOccluderSprites() {
        if (this.hp <= 0 || this.blocksLight === false) return [];

        let frames = Assets.zombieFemale.idle;
        let frameIndex = 0;
        if (this.isAttacking && Assets.zombieFemale.attack) {
            frames = Assets.zombieFemale.attack;
            frameIndex = Math.min(
                Math.floor((this.attackTimer / this.attackDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run') {
            frames = Assets.zombieFemale.run;
            const animSpeed = this.isSprinting ? 3 : 5;
            frameIndex = Math.floor(this.animationTimer / animSpeed) % frames.length;
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

    drawAfterimages(ctx) {
        const frames = Assets.zombieFemale.run;
        if (!frames) return;

        for (const img of this.afterimages) {
            ctx.save();
            ctx.translate(Math.floor(img.x), Math.floor(img.y));
            if (img.facingRight) ctx.scale(-1, 1);
            ctx.globalAlpha = img.alpha;
            ctx.filter = 'brightness(60%) sepia(100%) saturate(500%) hue-rotate(-30deg)';
            const fi = Math.min(img.frameIndex, frames.length - 1);
            ctx.drawImage(frames[fi], -16, -16);
            ctx.restore();
        }
    }

    drawSprintParticles(ctx) {
        for (const p of this.sprintParticles) {
            const alpha = Math.min(1, p.life / 8);
            if (p.type === 'dust') {
                ctx.save();
                ctx.globalAlpha = alpha * 0.6;
                ctx.fillStyle = '#b8a88a';
                ctx.beginPath();
                ctx.arc(Math.floor(p.x), Math.floor(p.y), p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (p.type === 'line') {
                ctx.save();
                ctx.globalAlpha = alpha * 0.5;
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(Math.floor(p.x), Math.floor(p.y));
                ctx.lineTo(Math.floor(p.x - p.length * Math.sign(p.vx)), Math.floor(p.y));
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;

        const barWidth = 22;
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 22);

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
