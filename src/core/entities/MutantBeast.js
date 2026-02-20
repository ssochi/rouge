import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';

export class MutantBeast extends Enemy {
    constructor(x, y) {
        super(x, y, 50, 50, 800, 0.5);
        this.hitboxWidth = 28;
        this.hitboxHeight = 16;
        this.hitboxOffsetY = 20;
        this.isBoss = true;

        // Phase system
        this.phase = 1;
        this.isTransitioning = false;
        this.transitionTimer = 0;
        this.transitionDuration = 60;

        // Attack system - multi-attack state machine
        this.currentAttack = null; // 'smash'|'sweep'|'stomp'|'charge'|'leap_slam'|'summon'|'roar'
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.attackDuration = 60;

        // Attack configs
        this.attacks = {
            smash:     { range: 45, damage: 25, knockback: 15, duration: 60, hitFrame: 35, cooldown: 40 },
            sweep:     { range: 50, damage: 20, knockback: 10, duration: 60, hitFrame: 30, cooldown: 45 },
            stomp:     { range: 80, damage: 15, knockback: 10, duration: 60, hitFrame: 28, radius: 80 },
            charge:    { damage: 30, knockback: 20, duration: 90, speed: 4.0, maxDist: 200, windupFrames: 30 },
            leap_slam: { damage: 20, knockback: 12, duration: 70, radius: 100, airStart: 20, airEnd: 50 },
            summon:    { duration: 60, count: 3, cooldown: 600 }
        };

        // Charge state
        this.chargeVx = 0;
        this.chargeVy = 0;
        this.chargeDistTraveled = 0;
        this.isCharging = false;

        // Leap state
        this.leapStartX = 0;
        this.leapStartY = 0;
        this.leapTargetX = 0;
        this.leapTargetY = 0;
        this.isAirborne = false;

        // Summon tracking
        this.summonedMinions = [];
        this.summonCooldown = 0;

        // Aggro
        this.aggroRange = 800;

        // External reference set after spawn
        this.worldSystem = null;

        // Offscreen canvas for sprite-shaped overlays
        this._overlayCanvas = document.createElement('canvas');
        this._overlayCanvas.width = 80;
        this._overlayCanvas.height = 80;
        this._overlayCtx = this._overlayCanvas.getContext('2d');
    }

    // Override: 90% knockback resistance + phase transition check
    takeDamage(amount, knockback) {
        this.hp -= amount;
        this.hitFlashTimer = 5;
        this.hpBarTimer = 120;
        if (knockback) {
            this.knockbackX = knockback.x * 0.1;
            this.knockbackY = knockback.y * 0.1;
        }
        this.checkPhaseTransition();
    }

    checkPhaseTransition() {
        const hpRatio = this.hp / this.maxHp;
        if (this.phase === 1 && hpRatio <= 0.6) {
            this.phase = 2;
            this.speed = 0.7;
            this.isTransitioning = true;
            this.transitionTimer = 0;
            this.currentAttack = null;
            this.isCharging = false;
            this.isAirborne = false;
            return true;
        }
        if (this.phase === 2 && hpRatio <= 0.25) {
            this.phase = 3;
            this.speed = 0.6;
            this.isTransitioning = true;
            this.transitionTimer = 0;
            this.currentAttack = null;
            this.isCharging = false;
            this.isAirborne = false;
            return true;
        }
        return false;
    }

    getPhaseSpeed() {
        if (this.phase === 1) return 0.5;
        if (this.phase === 2) return 0.7;
        return 0.6; // phase 3
    }

    // Return null when airborne so bullets pass through
    getBulletHurtbox() {
        if (this.isAirborne) return null;
        // Sprite drawn at (-40,-40), body spans roughly sprite y=20..73
        // In world coords: this.y-20 (head) to this.y+33 (boots)
        const width = 44;
        const height = 50;
        const bottomY = this.y + 28;
        return {
            x: this.x - width / 2,
            y: bottomY - height,
            width,
            height
        };
    }

    startAttack(type, player) {
        this.currentAttack = type;
        this.attackTimer = 0;
        this.state = 'attack';

        if (type === 'charge') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.chargeVx = (dx / dist) * this.attacks.charge.speed;
                this.chargeVy = (dy / dist) * this.attacks.charge.speed;
            } else {
                this.chargeVx = this.attacks.charge.speed;
                this.chargeVy = 0;
            }
            this.chargeDistTraveled = 0;
            this.isCharging = false; // becomes true after windup
        }

        if (type === 'leap_slam') {
            this.leapStartX = this.x;
            this.leapStartY = this.y;
            this.leapTargetX = player.x;
            this.leapTargetY = player.y;
            this.isAirborne = false;
        }
    }

    // --- Attack execution methods ---

    executeSmash(player, timer) {
        const cfg = this.attacks.smash;
        if (timer !== cfg.hitFrame) return;
        if (player.state === 'driving' || player.state === 'roll') return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < cfg.range) {
            const angle = Math.atan2(dy, dx);
            const knockback = {
                x: Math.cos(angle) * cfg.knockback,
                y: Math.sin(angle) * cfg.knockback
            };
            if (player.takeDamage) {
                player.takeDamage(cfg.damage, knockback);
            } else {
                player.hp -= cfg.damage;
            }
        }
    }

    executeSweep(player, timer) {
        const cfg = this.attacks.sweep;
        if (timer !== cfg.hitFrame) return;
        if (player.state === 'driving' || player.state === 'roll') return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < cfg.range) {
            // Check 60-degree arc facing direction
            const angle = Math.atan2(dy, dx);
            const facingAngle = this.facingRight ? 0 : Math.PI;
            let angleDiff = Math.abs(angle - facingAngle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            if (angleDiff < Math.PI / 3) { // 60 degrees = PI/3
                const kbAngle = Math.atan2(dy, dx);
                const knockback = {
                    x: Math.cos(kbAngle) * cfg.knockback,
                    y: Math.sin(kbAngle) * cfg.knockback
                };
                if (player.takeDamage) {
                    player.takeDamage(cfg.damage, knockback);
                } else {
                    player.hp -= cfg.damage;
                }
            }
        }
    }

    executeStomp(player, timer, combatSystem) {
        const cfg = this.attacks.stomp;
        if (timer !== cfg.hitFrame) return;

        // Create a ground slam shockwave (not explosion — no fire, no self-damage)
        if (combatSystem && combatSystem.spawnGroundSlam) {
            const color = this.phase === 1 ? '#4a7c59' : this.phase === 2 ? '#c0392b' : '#8e44ad';
            combatSystem.spawnGroundSlam(this.x, this.y, cfg.damage, cfg.radius, cfg.knockback, color);
        }
    }

    executeCharge(player, timer, walls, wallQuery, moveResolver) {
        const cfg = this.attacks.charge;

        // Windup phase: telegraph, no movement
        if (timer < cfg.windupFrames) {
            this.isCharging = false;
            return;
        }

        this.isCharging = true;

        // Move at charge speed in locked direction
        const nextX = this.x + this.chargeVx;
        const nextY = this.y + this.chargeVy;
        const prevX = this.x;
        const prevY = this.y;

        if (moveResolver) {
            moveResolver(this, nextX, nextY, this.chargeVx, this.chargeVy);
        } else {
            this.resolveWallCollision(nextX, nextY, walls, wallQuery);
        }

        // Track distance traveled
        const movedDist = Math.sqrt(
            (this.x - prevX) * (this.x - prevX) +
            (this.y - prevY) * (this.y - prevY)
        );
        this.chargeDistTraveled += movedDist;

        // Check if hit a wall (barely moved despite trying)
        const hitWall = movedDist < 0.1 && timer > cfg.windupFrames + 3;

        // Check player collision during charge
        let hitPlayer = false;
        if (player.state !== 'driving' && player.state !== 'roll') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 40) {
                hitPlayer = true;
                const angle = Math.atan2(dy, dx);
                const knockback = {
                    x: Math.cos(angle) * cfg.knockback,
                    y: Math.sin(angle) * cfg.knockback
                };
                if (player.takeDamage) {
                    player.takeDamage(cfg.damage, knockback);
                } else {
                    player.hp -= cfg.damage;
                }
            }
        }

        // Stop charge conditions
        if (hitWall || hitPlayer || this.chargeDistTraveled >= cfg.maxDist) {
            // End charge early by forcing timer to duration
            this.attackTimer = cfg.duration;
            this.isCharging = false;
        }
    }

    executeLeapSlam(player, timer, combatSystem) {
        const cfg = this.attacks.leap_slam;

        if (timer >= cfg.airStart && timer < cfg.airEnd) {
            // Airborne: interpolate position
            this.isAirborne = true;
            const progress = (timer - cfg.airStart) / (cfg.airEnd - cfg.airStart);
            this.x = this.leapStartX + (this.leapTargetX - this.leapStartX) * progress;
            this.y = this.leapStartY + (this.leapTargetY - this.leapStartY) * progress;
        }

        if (timer === cfg.airEnd) {
            // Land: create ground slam AOE (larger, more dramatic)
            this.isAirborne = false;
            this.x = this.leapTargetX;
            this.y = this.leapTargetY;

            if (combatSystem && combatSystem.spawnGroundSlam) {
                const color = this.phase === 1 ? '#4a7c59' : this.phase === 2 ? '#c0392b' : '#8e44ad';
                combatSystem.spawnGroundSlam(this.x, this.y, cfg.damage, cfg.radius, cfg.knockback, color);
            }
        }

        if (timer > cfg.airEnd) {
            this.isAirborne = false;
        }
    }

    executeSummon() {
        const cfg = this.attacks.summon;

        // Spawn minions at frame 40
        if (this.attackTimer === 40 && this.worldSystem) {
            const count = cfg.count + Math.floor(Math.random() * 2); // 3-4 zombies
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count;
                const spawnDist = 50 + Math.random() * 30;
                const sx = this.x + Math.cos(angle) * spawnDist;
                const sy = this.y + Math.sin(angle) * spawnDist;
                const minion = this.worldSystem.spawnEnemy('zombie', { x: sx, y: sy });
                if (minion) {
                    this.summonedMinions.push(minion);
                }
            }
            this.summonCooldown = cfg.cooldown;
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        // Guard checks
        if (this.hp <= 0) return;
        if (this.frozenTimer > 0) return;

        // Base update: knockback, timers
        super.update(player, walls, wallQuery);

        // Phase transition animation
        if (this.isTransitioning) {
            this.transitionTimer++;
            if (this.transitionTimer >= this.transitionDuration) {
                this.isTransitioning = false;
                this.transitionTimer = 0;
            }
            return;
        }

        // Summon cooldown
        if (this.summonCooldown > 0) this.summonCooldown--;

        // Clean dead minions from tracking array
        this.summonedMinions = this.summonedMinions.filter(m => m && m.hp > 0);

        // Attack state machine
        if (this.currentAttack !== null) {
            this.attackTimer++;
            const cfg = this.attacks[this.currentAttack];

            switch (this.currentAttack) {
                case 'smash':
                    this.executeSmash(player, this.attackTimer);
                    break;
                case 'sweep':
                    this.executeSweep(player, this.attackTimer);
                    break;
                case 'stomp':
                    this.executeStomp(player, this.attackTimer, combatSystem);
                    break;
                case 'charge':
                    this.executeCharge(player, this.attackTimer, walls, wallQuery, moveResolver);
                    break;
                case 'leap_slam':
                    this.executeLeapSlam(player, this.attackTimer, combatSystem);
                    break;
                case 'summon':
                    this.executeSummon();
                    break;
            }

            // End attack when timer exceeds duration
            if (this.attackTimer >= (cfg ? cfg.duration : 60)) {
                const cooldown = cfg ? (cfg.cooldown || 30) : 30;
                this.attackCooldown = cooldown;
                this.currentAttack = null;
                this.isCharging = false;
                this.isAirborne = false;
                this.state = 'idle';
            }
            return; // Don't move during attacks (charge handles its own movement)
        }

        // Cooldown
        if (this.attackCooldown > 0) this.attackCooldown--;

        // AI - Attack selection
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.facingRight = dx > 0;

        if (dist < this.aggroRange) {
            // Priority-based attack selection
            if (this.phase >= 3 && this.summonCooldown <= 0 && this.summonedMinions.length < 8) {
                this.startAttack('summon', player);
                return;
            }

            if (dist > 150 && this.phase >= 2 && this.attackCooldown <= 0) {
                this.startAttack('leap_slam', player);
                return;
            }

            if (dist > 80 && dist < 150 && this.phase >= 2 && this.attackCooldown <= 0) {
                this.startAttack('charge', player);
                return;
            }

            if (dist < 80 && dist > 50 && this.attackCooldown <= 0) {
                this.startAttack('stomp', player);
                return;
            }

            if (dist <= 50 && this.attackCooldown <= 0) {
                const type = Math.random() < 0.5 ? 'smash' : 'sweep';
                this.startAttack(type, player);
                return;
            }

            // Movement: use flow field with larger separation
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

                // Direct pursuit if close and no flow
                if (moveX === 0 && moveY === 0 && dist > 0 && dist < 100) {
                    moveX = dx / dist;
                    moveY = dy / dist;
                }

                // Separation from other enemies (larger radius for boss)
                let sepX = 0;
                let sepY = 0;
                if (getNearbyEnemies) {
                    const neighbors = getNearbyEnemies(this);
                    const desiredSep = 40;
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

                const spd = this.getEffectiveSpeed();
                const nextX = this.x + vx * spd;
                const nextY = this.y + vy * spd;

                if (moveResolver) {
                    moveResolver(this, nextX, nextY, vx, vy);
                } else {
                    this.resolveWallCollision(nextX, nextY, walls, wallQuery);
                }
            }
        } else {
            this.state = 'idle';
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Shadow (large, at ground level)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 30, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Select frames based on phase and state
        const phaseKey = 'phase' + this.phase;
        const assets = Assets.mutantBeast ? Assets.mutantBeast[phaseKey] : null;
        if (!assets) {
            // Fallback: draw a placeholder rectangle if assets not yet created
            this._drawPlaceholder(ctx);
            ctx.restore();
            return;
        }

        let frames, frameIndex;
        if (this.isTransitioning && assets.roar) {
            frames = assets.roar;
            frameIndex = Math.min(
                Math.floor((this.transitionTimer / this.transitionDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.currentAttack && assets[this.currentAttack]) {
            frames = assets[this.currentAttack];
            const dur = this.attacks[this.currentAttack]?.duration || 60;
            frameIndex = Math.min(
                Math.floor((this.attackTimer / dur) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run' && assets.run) {
            frames = assets.run;
            frameIndex = Math.floor(this.animationTimer / 7) % frames.length;
        } else {
            frames = assets.idle;
            frameIndex = Math.floor(this.animationTimer / 7) % frames.length;
        }

        if (frames && frames[frameIndex]) {
            // Leap visual: offset Y during airborne
            let drawY = -40;
            if (this.isAirborne) {
                const leapCfg = this.attacks.leap_slam;
                const airProgress = (this.attackTimer - leapCfg.airStart) / (leapCfg.airEnd - leapCfg.airStart);
                const arcHeight = Math.sin(airProgress * Math.PI) * 40;
                drawY -= arcHeight;
            }

            const sprite = frames[frameIndex];
            ctx.drawImage(sprite, -40, drawY);

            // Hit flash
            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(sprite, -40, drawY);
                ctx.restore();
            }

            // Phase transition effect (sprite-shaped)
            if (this.isTransitioning) {
                const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
                const color = this.phase === 2 ? '#ff3200' : '#a028ff';
                this._drawSpriteOverlay(ctx, sprite, drawY, color, alpha);
            }

            // Status effect overlays (sprite-shaped, handled here instead of Renderer)
            if (this.frozenTimer > 0) {
                this._drawSpriteOverlay(ctx, sprite, drawY, '#a8d8ea', 0.45);
            } else if (this.slowTimer > 0) {
                const slowAlpha = 0.1 + (this.slowAmount || 0) * 0.3;
                this._drawSpriteOverlay(ctx, sprite, drawY, '#a8d8ea', slowAlpha);
            }
            if (this.bleedTimer > 0) {
                const pulse = 0.15 + Math.sin(Date.now() / 150) * 0.1;
                this._drawSpriteOverlay(ctx, sprite, drawY, '#c0392b', pulse);
            }
        }

        ctx.restore();
    }

    /**
     * Draw a color overlay that matches the sprite silhouette (not a rectangle).
     */
    _drawSpriteOverlay(ctx, sprite, drawY, color, alpha) {
        const oc = this._overlayCtx;
        oc.clearRect(0, 0, 80, 80);
        oc.globalCompositeOperation = 'source-over';
        oc.globalAlpha = 1;
        oc.drawImage(sprite, 0, 0);
        oc.globalCompositeOperation = 'source-atop';
        oc.fillStyle = color;
        oc.fillRect(0, 0, 80, 80);
        oc.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(this._overlayCanvas, -40, drawY);
        ctx.restore();
    }

    /**
     * Fallback placeholder rendering when sprite assets are not yet registered.
     * Draws a simple colored rectangle so the boss is visible during development.
     */
    _drawPlaceholder(ctx) {
        // Body color based on phase
        const colors = ['#4a2', '#a42', '#62a'];
        ctx.fillStyle = colors[this.phase - 1] || '#4a2';
        ctx.fillRect(-20, -30, 40, 50);

        // Eyes
        ctx.fillStyle = '#f00';
        ctx.fillRect(-12, -22, 6, 6);
        ctx.fillRect(6, -22, 6, 6);

        // Airborne indicator
        if (this.isAirborne) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            ctx.strokeRect(-22, -32, 44, 54);
        }

        // Charge indicator
        if (this.isCharging) {
            ctx.strokeStyle = '#f80';
            ctx.lineWidth = 2;
            ctx.strokeRect(-22, -32, 44, 54);
        }

        // Hit flash
        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(-20, -30, 40, 50);
        }

        // Phase transition overlay
        if (this.isTransitioning) {
            const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
            const color = this.phase === 2
                ? `rgba(255, 50, 0, ${alpha})`
                : `rgba(160, 40, 255, ${alpha})`;
            ctx.fillStyle = color;
            ctx.fillRect(-20, -30, 40, 50);
        }
    }
}
