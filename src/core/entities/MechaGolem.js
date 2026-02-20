import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';

export class MechaGolem extends Enemy {
    constructor(x, y) {
        super(x, y, 40, 40, 600, 0.4);
        this.hitboxWidth = 20;
        this.hitboxHeight = 12;
        this.hitboxOffsetY = 18;
        this.isBoss = true;
        this.name = '机械魔偶';

        // Phase system (2 phases)
        this.phase = 1;
        this.isTransitioning = false;
        this.transitionTimer = 0;
        this.transitionDuration = 60;

        // Attack state machine
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.attackTargetAngle = 0;

        // Spiral storm state
        this.spiralArmAngles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];

        // Movement AI
        this.preferredDistance = 175;
        this.orbitAngle = 0;
        this.orbitSpeed = 0.02;
        this.dashTimer = 0;
        this.dashVx = 0;
        this.dashVy = 0;

        // Aggro range
        this.aggroRange = 600;

        // External references
        this.worldSystem = null;
        this.combatSystem = null;

        // Offscreen canvas for sprite-shaped overlays (64×64)
        this._overlayCanvas = document.createElement('canvas');
        this._overlayCanvas.width = 64;
        this._overlayCanvas.height = 64;
        this._overlayCtx = this._overlayCanvas.getContext('2d');
    }

    // 80% knockback resistance
    takeDamage(amount, knockback) {
        this.hp -= amount;
        this.hitFlashTimer = 5;
        this.hpBarTimer = 120;
        if (knockback) {
            this.knockbackX = knockback.x * 0.2;
            this.knockbackY = knockback.y * 0.2;
        }
        this.checkPhaseTransition();
    }

    checkPhaseTransition() {
        const hpRatio = this.hp / this.maxHp;
        if (this.phase === 1 && hpRatio <= 0.4) {
            this.phase = 2;
            this.speed = 0.6;
            this.preferredDistance = 125;
            this.isTransitioning = true;
            this.transitionTimer = 0;
            this.currentAttack = null;
            this.attackTimer = 0;
            return true;
        }
        return false;
    }

    getBulletHurtbox() {
        const width = 40;
        const height = 48;
        const bottomY = this.y + 22;
        return {
            x: this.x - width / 2,
            y: bottomY - height,
            width,
            height
        };
    }

    // --- Attack duration configs ---
    getAttackDuration(type) {
        const durations = {
            gatling_sweep: 70,
            ring_burst: 50,
            aimed_triple: 30,
            rocket_salvo: 60,
            spiral_storm: 200,
            cross_fire: 90,
            desperation: 40
        };
        return durations[type] || 60;
    }

    getAttackCooldown(type) {
        const cooldowns = {
            gatling_sweep: 50,
            ring_burst: 90,
            aimed_triple: 40,
            rocket_salvo: 150,
            spiral_storm: 120,
            cross_fire: 80,
            desperation: 60
        };
        return cooldowns[type] || 40;
    }

    // --- Attack selection ---
    getAttackPool() {
        if (this.phase === 1) {
            return [
                { type: 'gatling_sweep', weight: 3 },
                { type: 'ring_burst', weight: 2 },
                { type: 'aimed_triple', weight: 4 },
                { type: 'rocket_salvo', weight: 2 }
            ];
        }
        return [
            { type: 'gatling_sweep', weight: 2 },
            { type: 'ring_burst', weight: 2 },
            { type: 'aimed_triple', weight: 3 },
            { type: 'rocket_salvo', weight: 2 },
            { type: 'spiral_storm', weight: 3 },
            { type: 'cross_fire', weight: 2 },
            { type: 'desperation', weight: this.hp < this.maxHp * 0.15 ? 4 : 0 }
        ];
    }

    selectNextAttack(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let pool = this.getAttackPool().filter(atk => {
            if (atk.weight <= 0) return false;
            if (atk.type === 'rocket_salvo' && dist < 100) return false;
            if (atk.type === 'aimed_triple' && dist > 300) return false;
            return true;
        });

        if (pool.length === 0) pool = this.getAttackPool().filter(a => a.weight > 0);
        if (pool.length === 0) return 'aimed_triple';

        const totalWeight = pool.reduce((sum, a) => sum + a.weight, 0);
        let rand = Math.random() * totalWeight;
        for (const atk of pool) {
            rand -= atk.weight;
            if (rand <= 0) return atk.type;
        }
        return pool[0].type;
    }

    startAttack(type, player) {
        this.currentAttack = type;
        this.attackTimer = 0;
        this.state = 'attack';

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.attackTargetAngle = Math.atan2(dy, dx);

        if (type === 'spiral_storm') {
            this.spiralArmAngles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
        }
    }

    endAttack() {
        this.attackCooldown = this.getAttackCooldown(this.currentAttack);
        this.currentAttack = null;
        this.state = 'idle';
    }

    // ========== BULLET PATTERN EXECUTION ==========

    // Pattern 1: Gatling Sweep - rapid arc sweep
    executeGatlingSweep(cs, timer) {
        const windupFrames = 10;
        const sweepStart = 12;
        const sweepEnd = 66;
        const bulletSpeed = this.phase === 2 ? 5.5 : 5;
        const bulletDmg = this.phase === 2 ? 10 : 8;

        if (timer < windupFrames) return;
        if (timer < sweepStart || timer > sweepEnd) return;

        if ((timer - sweepStart) % 3 !== 0) return;

        const sweepProgress = (timer - sweepStart) / (sweepEnd - sweepStart);
        const sweepAngleStart = this.attackTargetAngle - Math.PI / 4;
        const sweepAngleEnd = this.attackTargetAngle + Math.PI / 4;
        const angle = sweepAngleStart + sweepProgress * (sweepAngleEnd - sweepAngleStart);

        const muzzleOffset = 14;
        cs.spawnEnemyBullet({
            x: this.x + Math.cos(angle) * muzzleOffset,
            y: this.y + Math.sin(angle) * muzzleOffset,
            angle: angle,
            damage: bulletDmg,
            speed: bulletSpeed,
            color: '#f39c12',
            size: 3,
            life: 120
        });
    }

    // Pattern 2: Ring Burst - 2 rings with gaps
    executeRingBurst(cs, timer) {
        const ring1Frame = 20;
        const ring2Frame = 35;
        const bulletCount = this.phase === 2 ? 16 : 14;
        const bulletSpeed = this.phase === 2 ? 4.5 : 4;
        const bulletDmg = this.phase === 2 ? 12 : 10;

        const spawnRing = (offsetAngle) => {
            const angleStep = (Math.PI * 2) / bulletCount;
            // Leave 2 gaps (skip 2 consecutive bullets near each gap position)
            const gapSpacing = Math.floor(bulletCount / 2);
            for (let i = 0; i < bulletCount; i++) {
                const posInGap = i % gapSpacing;
                if (posInGap === 0 || posInGap === 1) continue;
                const angle = i * angleStep + offsetAngle;
                cs.spawnEnemyBullet({
                    x: this.x,
                    y: this.y,
                    angle: angle,
                    damage: bulletDmg,
                    speed: bulletSpeed,
                    color: '#3498db',
                    size: 4,
                    life: 150
                });
            }
        };

        if (timer === ring1Frame) spawnRing(0);
        if (timer === ring2Frame) spawnRing(Math.PI / bulletCount);
    }

    // Pattern 3: Aimed Triple - 3 fast aimed shots
    executeAimedTriple(cs, timer) {
        const fireFrame = 15;
        const bulletSpeed = this.phase === 2 ? 8 : 7;
        const bulletDmg = this.phase === 2 ? 14 : 12;
        const spreadAngle = 0.15;
        const count = this.phase === 2 ? 5 : 3;

        if (timer !== fireFrame) return;

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spreadAngle;
            const angle = this.attackTargetAngle + offset;
            cs.spawnEnemyBullet({
                x: this.x,
                y: this.y,
                angle: angle,
                damage: bulletDmg,
                speed: bulletSpeed,
                color: '#e74c3c',
                size: 5,
                life: 100
            });
        }
    }

    // Pattern 4: Rocket Salvo - 2-3 slow rockets with explosions
    executeRocketSalvo(cs, timer) {
        const rocketFrames = this.phase === 2 ? [18, 30, 42, 54] : [20, 35, 50];

        if (!rocketFrames.includes(timer)) return;

        // Lead aim at player
        const angle = this.attackTargetAngle + (Math.random() - 0.5) * 0.2;

        cs.spawnEnemyBullet({
            x: this.x + Math.cos(angle) * 14,
            y: this.y + Math.sin(angle) * 14,
            angle: angle,
            damage: 15,
            speed: 3,
            color: '#95a5a6',
            size: 6,
            life: 180,
            type: 'rocket',
            blastRadius: 40,
            knockback: 8
        });
    }

    // Pattern 5: Spiral Storm (Phase 2) - 3 rotating arms
    executeSpiralStorm(cs, timer) {
        const startFrame = 10;
        const endFrame = 190;
        const rotSpeed = this.hp < this.maxHp * 0.15 ? 0.10 : 0.08;
        const bulletSpeed = 3.5;
        const bulletDmg = 9;

        if (timer < startFrame || timer > endFrame) return;
        if ((timer - startFrame) % 4 !== 0) return;

        for (let i = 0; i < this.spiralArmAngles.length; i++) {
            this.spiralArmAngles[i] += rotSpeed;
        }

        for (const armAngle of this.spiralArmAngles) {
            cs.spawnEnemyBullet({
                x: this.x,
                y: this.y,
                angle: armAngle,
                damage: bulletDmg,
                speed: bulletSpeed,
                color: '#e91e63',
                size: 4,
                life: 150
            });
        }
    }

    // Pattern 6: Cross Fire (Phase 2) - alternating + and × bursts
    executeCrossFire(cs, timer) {
        const waveFrames = [15, 35, 55, 75];
        const bulletSpeed = 5;
        const bulletDmg = 10;

        if (!waveFrames.includes(timer)) return;

        const waveIndex = waveFrames.indexOf(timer);
        const isPlus = waveIndex % 2 === 0;

        const baseAngles = isPlus
            ? [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2]
            : [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4];

        for (const baseAngle of baseAngles) {
            for (let i = -1; i <= 1; i++) {
                const angle = baseAngle + i * 0.1;
                cs.spawnEnemyBullet({
                    x: this.x,
                    y: this.y,
                    angle: angle,
                    damage: bulletDmg,
                    speed: bulletSpeed,
                    color: '#9b59b6',
                    size: 4,
                    life: 130
                });
            }
        }
    }

    // Pattern 7: Desperation (Phase 2, <15% HP) - ring + aimed combo
    executeDesperation(cs, timer) {
        if (timer === 20) {
            // Ring burst
            const count = 16;
            const angleStep = (Math.PI * 2) / count;
            for (let i = 0; i < count; i++) {
                cs.spawnEnemyBullet({
                    x: this.x,
                    y: this.y,
                    angle: i * angleStep,
                    damage: 12,
                    speed: 4,
                    color: '#c0392b',
                    size: 5,
                    life: 140
                });
            }
        }

        if (timer === 25) {
            // Aimed burst
            for (let i = -1; i <= 1; i++) {
                cs.spawnEnemyBullet({
                    x: this.x,
                    y: this.y,
                    angle: this.attackTargetAngle + i * 0.12,
                    damage: 12,
                    speed: 7,
                    color: '#e74c3c',
                    size: 5,
                    life: 120
                });
            }
        }
    }

    // ========== MOVEMENT AI ==========

    updateMovement(player, walls, wallQuery, getFlowDirection, moveResolver) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.facingRight = dx > 0;

        const targetDist = this.preferredDistance;
        let moveX = 0;
        let moveY = 0;

        if (dist > targetDist + 30) {
            // Too far — move closer
            moveX = dx / dist;
            moveY = dy / dist;
        } else if (dist < targetDist - 30) {
            // Too close — back away
            moveX = -dx / dist;
            moveY = -dy / dist;
        } else {
            // Good range — orbit strafe
            this.orbitAngle += this.orbitSpeed;
            const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
            moveX = Math.cos(perpAngle);
            moveY = Math.sin(perpAngle);
        }

        // Phase 2: occasional short dash
        if (this.phase === 2 && this.dashTimer <= 0 && Math.random() < 0.005) {
            this.dashTimer = 20;
            this.dashVx = moveX * 3;
            this.dashVy = moveY * 3;
        }

        if (this.dashTimer > 0) {
            this.dashTimer--;
            moveX = this.dashVx;
            moveY = this.dashVy;
        }

        const spd = this.getEffectiveSpeed();
        const nextX = this.x + moveX * spd;
        const nextY = this.y + moveY * spd;

        if (moveResolver) {
            moveResolver(this, nextX, nextY, moveX, moveY);
        } else {
            this.resolveWallCollision(nextX, nextY, walls, wallQuery);
        }
    }

    // ========== MAIN UPDATE ==========

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        if (this.frozenTimer > 0) return;

        this.combatSystem = combatSystem;

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

        // Attack execution
        if (this.currentAttack !== null) {
            this.attackTimer++;

            switch (this.currentAttack) {
                case 'gatling_sweep':
                    this.executeGatlingSweep(combatSystem, this.attackTimer);
                    break;
                case 'ring_burst':
                    this.executeRingBurst(combatSystem, this.attackTimer);
                    break;
                case 'aimed_triple':
                    this.executeAimedTriple(combatSystem, this.attackTimer);
                    break;
                case 'rocket_salvo':
                    this.executeRocketSalvo(combatSystem, this.attackTimer);
                    break;
                case 'spiral_storm':
                    this.executeSpiralStorm(combatSystem, this.attackTimer);
                    break;
                case 'cross_fire':
                    this.executeCrossFire(combatSystem, this.attackTimer);
                    break;
                case 'desperation':
                    this.executeDesperation(combatSystem, this.attackTimer);
                    break;
            }

            if (this.attackTimer >= this.getAttackDuration(this.currentAttack)) {
                this.endAttack();
            }
            return; // Don't move during attacks
        }

        // Cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        // Attack selection
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.facingRight = dx > 0;

        if (dist < this.aggroRange && this.attackCooldown <= 0) {
            const nextAttack = this.selectNextAttack(player);
            this.startAttack(nextAttack, player);
            return;
        }

        // Movement when not attacking
        if (dist < this.aggroRange) {
            this.state = 'run';
            if (this.knockbackX === 0 && this.knockbackY === 0) {
                this.updateMovement(player, walls, wallQuery, getFlowDirection, moveResolver);
            }
        } else {
            this.state = 'idle';
        }
    }

    // ========== DRAW ==========

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 26, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Select frames
        const phaseKey = 'phase' + this.phase;
        const assets = Assets.mechaGolem ? Assets.mechaGolem[phaseKey] : null;

        if (!assets) {
            this._drawPlaceholder(ctx);
            ctx.restore();
            return;
        }

        let frames, frameIndex;

        if (this.isTransitioning && assets.transition) {
            frames = assets.transition;
            frameIndex = Math.min(
                Math.floor((this.transitionTimer / this.transitionDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.currentAttack && assets[this.currentAttack]) {
            frames = assets[this.currentAttack];
            const dur = this.getAttackDuration(this.currentAttack);
            frameIndex = Math.min(
                Math.floor((this.attackTimer / dur) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run' && assets.run) {
            frames = assets.run;
            frameIndex = Math.floor(this.animationTimer / 6) % frames.length;
        } else {
            frames = assets.idle;
            frameIndex = Math.floor(this.animationTimer / 8) % frames.length;
        }

        if (frames && frames[frameIndex]) {
            const sprite = frames[frameIndex];
            const drawY = -32;
            ctx.drawImage(sprite, -32, drawY);

            // Hit flash
            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(sprite, -32, drawY);
                ctx.restore();
            }

            // Phase transition overlay
            if (this.isTransitioning) {
                const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
                this._drawSpriteOverlay(ctx, sprite, drawY, '#e74c3c', alpha);
            }

            // Frozen overlay
            if (this.frozenTimer > 0) {
                this._drawSpriteOverlay(ctx, sprite, drawY, '#a8d8ea', 0.45);
            } else if (this.slowTimer > 0) {
                const slowAlpha = 0.1 + (this.slowAmount || 0) * 0.3;
                this._drawSpriteOverlay(ctx, sprite, drawY, '#a8d8ea', slowAlpha);
            }
            // Bleed overlay
            if (this.bleedTimer > 0) {
                const pulse = 0.15 + Math.sin(Date.now() / 150) * 0.1;
                this._drawSpriteOverlay(ctx, sprite, drawY, '#c0392b', pulse);
            }
        }

        ctx.restore();
    }

    _drawSpriteOverlay(ctx, sprite, drawY, color, alpha) {
        const oc = this._overlayCtx;
        oc.clearRect(0, 0, 64, 64);
        oc.globalCompositeOperation = 'source-over';
        oc.globalAlpha = 1;
        oc.drawImage(sprite, 0, 0);
        oc.globalCompositeOperation = 'source-atop';
        oc.fillStyle = color;
        oc.fillRect(0, 0, 64, 64);
        oc.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(this._overlayCanvas, -32, drawY);
        ctx.restore();
    }

    _drawPlaceholder(ctx) {
        const color = this.phase === 1 ? '#4a5a6a' : '#e74c3c';
        ctx.fillStyle = color;
        ctx.fillRect(-16, -28, 32, 46);

        // Core
        ctx.fillStyle = this.phase === 1 ? '#3498db' : '#ff6b6b';
        ctx.fillRect(-3, -8, 6, 6);

        // Gatling arm (left)
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(-22, -12, 8, 4);

        // Launcher arm (right)
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(14, -12, 8, 4);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(-16, -28, 32, 46);
        }

        if (this.isTransitioning) {
            const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
            ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
            ctx.fillRect(-16, -28, 32, 46);
        }
    }
}
