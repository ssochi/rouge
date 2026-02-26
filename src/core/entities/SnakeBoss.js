import { Enemy } from './Enemy.js';
import { SnakeSegment } from './SnakeSegment.js';
import { Assets } from '../../graphics/Assets.js';

/**
 * SnakeBoss — Mechanical Serpent Boss
 * Multi-segment pseudo-3D snake with undulating body.
 * Head entity manages AI, HP pool, and segment positions.
 * Segments are independent entities in enemies[] for proper Y-sort and collision.
 */

const SEGMENT_COUNT = 9;       // 8 body + 1 tail
const SEGMENT_SPACING = 8;     // Frames between each segment in position history
const MAX_HISTORY = (SEGMENT_COUNT + 1) * SEGMENT_SPACING + 10;
const WAVE_AMPLITUDE = 24;
const WAVE_PHASE_SHIFT = 0.7;
const WAVE_SPEED = 0.04;
const UNDERGROUND_THRESHOLD = 8;

export class SnakeBoss extends Enemy {
    constructor(x, y) {
        super(x, y, 30, 30, 1000, 1.5);
        this.hitboxWidth = 20;
        this.hitboxHeight = 12;
        this.hitboxOffsetY = 14;
        this.isBoss = true;
        this.isSegment = false;
        this.name = '机械巨蛇';

        // Boss HP bar config (used by Renderer.drawBossHpBar)
        this.phaseColors = ['#4a7c8a', '#c0392b'];
        this.phaseNames = ['I', 'II'];
        this.phaseMarkers = [0.4]; // 40% transition marker

        // Phase system
        this.phase = 1;
        this.isTransitioning = false;
        this.transitionTimer = 0;
        this.transitionDuration = 60;

        // Attack state machine
        this.currentAttack = null;
        this.attackTimer = 0;
        this.attackCooldown = 60; // Initial cooldown
        this.attackTargetAngle = 0;

        // Attack configs
        this.attacks = {
            venom_spit:     { duration: 50, cooldown: 90 },
            charge:         { duration: 100, cooldown: 120, speed: 4.0, windupFrames: 25 },
            tail_whip:      { duration: 50, cooldown: 80, damage: 20, knockback: 12, radius: 70 },
            constrict:      { duration: 180, cooldown: 150 },
            burrow_strike:  { duration: 150, cooldown: 180 },
            segment_volley: { duration: 60, cooldown: 100 }
        };

        // Movement AI
        this.moveMode = 'orbit'; // 'orbit' | 'charge' | 'burrow'
        this.orbitAngle = 0;
        this.orbitSpeed = 0.015;
        this.preferredDistance = 160;
        this.aggroRange = 800;

        // Charge state
        this.chargeVx = 0;
        this.chargeVy = 0;
        this.chargeDistTraveled = 0;

        // Burrow state
        this.burrowTimer = 0;
        this.burrowTargetX = 0;
        this.burrowTargetY = 0;
        this.isBurrowingAll = false;

        // Constrict state
        this.constrictAngle = 0;
        this.constrictRadius = 0;

        // Segments
        this.segments = [];
        this.segmentsInitialized = false;
        this.positionHistory = [];

        // Pseudo-3D
        this.heightZ = 0;
        this.isUnderground = false;

        // External references
        this.worldSystem = null;
        this.combatSystem = null;

        // Overlay canvas (48×48)
        this._overlayCanvas = document.createElement('canvas');
        this._overlayCanvas.width = 48;
        this._overlayCanvas.height = 48;
        this._overlayCtx = this._overlayCanvas.getContext('2d');
    }

    // ========== DAMAGE & PHASES ==========

    // 90% knockback resistance
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
        if (this.phase === 1 && hpRatio <= 0.4) {
            this.phase = 2;
            this.speed = 2.0;
            this.preferredDistance = 120;
            this.isTransitioning = true;
            this.transitionTimer = 0;
            this.currentAttack = null;
            this.attackTimer = 0;
            this.attackCooldown = 30;
            // Sync segments
            for (const seg of this.segments) {
                seg.phase = 2;
            }
            return true;
        }
        return false;
    }

    getBulletHurtbox() {
        if (this.isUnderground || this.hp <= 0) return null;
        const width = 28;
        const height = 32;
        return {
            x: this.x - width / 2,
            y: this.y - this.heightZ - height + 8,
            width,
            height
        };
    }

    // ========== SEGMENT MANAGEMENT ==========

    initSegments(worldSystem) {
        if (this.segmentsInitialized) return;
        this.worldSystem = worldSystem;

        // Seed position history
        for (let i = 0; i < MAX_HISTORY; i++) {
            this.positionHistory.push({ x: this.x, y: this.y });
        }

        // Create segments
        for (let i = 0; i < SEGMENT_COUNT; i++) {
            const type = (i === SEGMENT_COUNT - 1) ? 'tail' : 'body';
            const seg = new SnakeSegment(this.x, this.y, i + 1, this, type);
            this.segments.push(seg);
            worldSystem.enemies.push(seg);
        }
        this.segmentsInitialized = true;
    }

    updatePositionHistory() {
        this.positionHistory.unshift({ x: this.x, y: this.y });
        if (this.positionHistory.length > MAX_HISTORY) {
            this.positionHistory.pop();
        }
    }

    updateSegmentPositions() {
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const histIdx = Math.min((i + 1) * SEGMENT_SPACING, this.positionHistory.length - 1);
            const pos = this.positionHistory[histIdx];
            const prevIdx = Math.max(0, histIdx - SEGMENT_SPACING);
            const prevPos = this.positionHistory[prevIdx];

            seg.x = pos.x;
            seg.y = pos.y;

            // Calculate facing angle from movement direction
            const dx = prevPos.x - pos.x;
            const dy = prevPos.y - pos.y;
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                seg.angle = Math.atan2(dy, dx);
            }
        }
    }

    updateWave() {
        const waveTime = this.animationTimer * WAVE_SPEED;

        // Head has smaller wave
        if (!this.isBurrowingAll) {
            this.heightZ = Math.sin(waveTime - WAVE_PHASE_SHIFT) * (WAVE_AMPLITUDE * 0.5);
            this.isUnderground = this.heightZ < -UNDERGROUND_THRESHOLD;
        }

        // Body segments
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            if (this.isBurrowingAll) {
                // During full burrow, force all underground
                seg.heightZ = -WAVE_AMPLITUDE;
                seg.isUnderground = true;
            } else {
                seg.heightZ = Math.sin(waveTime + (i + 1) * WAVE_PHASE_SHIFT) * WAVE_AMPLITUDE;
                seg.isUnderground = seg.heightZ < -UNDERGROUND_THRESHOLD;
            }
        }
    }

    // ========== MOVEMENT AI ==========

    updateMovement(player, walls, wallQuery, moveResolver) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.facingRight = dx > 0;

        if (this.moveMode === 'charge') {
            return; // Charge handles its own movement
        }

        if (this.moveMode === 'burrow') {
            return; // Burrow handles its own movement
        }

        // Default orbit movement
        let moveX = 0;
        let moveY = 0;

        if (dist > this.preferredDistance + 40) {
            moveX = dx / dist;
            moveY = dy / dist;
        } else if (dist < this.preferredDistance - 40) {
            moveX = -dx / dist;
            moveY = -dy / dist;
        } else {
            // Orbit
            this.orbitAngle += this.orbitSpeed;
            const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
            moveX = Math.cos(perpAngle);
            moveY = Math.sin(perpAngle);
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

    // ========== ATTACK SYSTEM ==========

    selectNextAttack(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Weighted random selection
        const pool = [];

        // Always available
        pool.push({ type: 'venom_spit', weight: 3 });
        pool.push({ type: 'charge', weight: 2 });
        pool.push({ type: 'constrict', weight: 1 });

        if (dist < 120) {
            pool.push({ type: 'tail_whip', weight: 3 });
        } else {
            pool.push({ type: 'tail_whip', weight: 1 });
        }

        // Phase 2 attacks
        if (this.phase >= 2) {
            pool.push({ type: 'burrow_strike', weight: 3 });
            pool.push({ type: 'segment_volley', weight: 2 });
        }

        const totalWeight = pool.reduce((sum, a) => sum + a.weight, 0);
        let rand = Math.random() * totalWeight;
        for (const entry of pool) {
            rand -= entry.weight;
            if (rand <= 0) return entry.type;
        }
        return 'venom_spit';
    }

    startAttack(type, player) {
        this.currentAttack = type;
        this.attackTimer = 0;
        this.attackTargetAngle = Math.atan2(player.y - this.y, player.x - this.x);

        if (type === 'charge') {
            this.moveMode = 'charge';
            this.chargeVx = Math.cos(this.attackTargetAngle) * this.attacks.charge.speed;
            this.chargeVy = Math.sin(this.attackTargetAngle) * this.attacks.charge.speed;
            this.chargeDistTraveled = 0;
        } else if (type === 'constrict') {
            this.moveMode = 'orbit';
            this.constrictAngle = Math.atan2(this.y - player.y, this.x - player.x);
            this.constrictRadius = 140;
        } else if (type === 'burrow_strike') {
            this.moveMode = 'burrow';
            this.burrowTimer = 0;
            this.burrowTargetX = player.x;
            this.burrowTargetY = player.y;
            this.isBurrowingAll = false;
        }
    }

    endAttack() {
        const cfg = this.attacks[this.currentAttack];
        this.attackCooldown = (cfg && cfg.cooldown) || 60;
        if (this.phase === 2) this.attackCooldown = Math.floor(this.attackCooldown * 0.7);
        this.currentAttack = null;
        this.attackTimer = 0;
        this.moveMode = 'orbit';
        this.isBurrowingAll = false;
    }

    // ========== ATTACK EXECUTION ==========

    executeVenomSpit(cs, timer) {
        const fireFrame = 20;
        if (timer !== fireFrame) return;

        const count = this.phase === 2 ? 7 : 5;
        const spreadAngle = this.phase === 2 ? 0.8 : 0.6;
        const bulletDmg = this.phase === 2 ? 12 : 10;
        const bulletSpeed = 5;

        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * (spreadAngle / (count - 1));
            const angle = this.attackTargetAngle + offset;
            cs.spawnEnemyBullet({
                x: this.x + Math.cos(angle) * 16,
                y: this.y + Math.sin(angle) * 16,
                angle: angle,
                damage: bulletDmg,
                speed: bulletSpeed,
                color: this.phase === 1 ? '#3498db' : '#e74c3c',
                size: 4,
                life: 120
            });
        }
    }

    executeCharge(player, timer, walls, wallQuery, moveResolver) {
        const cfg = this.attacks.charge;

        if (timer < cfg.windupFrames) {
            // Windup — slow down, update target angle
            this.attackTargetAngle = Math.atan2(player.y - this.y, player.x - this.x);
            this.chargeVx = Math.cos(this.attackTargetAngle) * cfg.speed;
            this.chargeVy = Math.sin(this.attackTargetAngle) * cfg.speed;
            return;
        }

        // Charge forward
        const nextX = this.x + this.chargeVx;
        const nextY = this.y + this.chargeVy;
        this.chargeDistTraveled += cfg.speed;

        if (moveResolver) {
            moveResolver(this, nextX, nextY, this.chargeVx / cfg.speed, this.chargeVy / cfg.speed);
        } else {
            this.resolveWallCollision(nextX, nextY, walls, wallQuery);
        }

        this.facingRight = this.chargeVx > 0;

        // Contact damage
        const chargeDist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
        if (chargeDist < 30 && player.takeDamage) {
            player.takeDamage(cfg.speed > 3 ? 25 : 15);
        }
    }

    executeTailWhip(cs, timer, player) {
        const cfg = this.attacks.tail_whip;
        const hitFrame = 25;
        if (timer !== hitFrame) return;

        const tail = this.segments[this.segments.length - 1];
        if (!tail || tail.isUnderground) return;

        // AOE at tail position
        const dx = player.x - tail.x;
        const dy = player.y - tail.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < cfg.radius && player.takeDamage) {
            const angle = Math.atan2(dy, dx);
            player.takeDamage(cfg.damage);
            if (player.knockbackX !== undefined) {
                player.knockbackX = Math.cos(angle) * cfg.knockback;
                player.knockbackY = Math.sin(angle) * cfg.knockback;
            }
        }
    }

    executeConstrict(player, timer) {
        // Snake orbits player rapidly with shrinking radius
        const progress = timer / this.attacks.constrict.duration;
        this.constrictRadius = 140 * (1 - progress * 0.6);
        this.constrictAngle += 0.06 + progress * 0.04;

        this.x = player.x + Math.cos(this.constrictAngle) * this.constrictRadius;
        this.y = player.y + Math.sin(this.constrictAngle) * this.constrictRadius;
        this.facingRight = Math.cos(this.constrictAngle + Math.PI / 2) > 0;

        // Contact damage when close
        if (this.constrictRadius < 60) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 35 && timer % 20 === 0 && player.takeDamage) {
                player.takeDamage(8);
            }
        }
    }

    executeBurrowStrike(player, timer) {
        const cfg = this.attacks.burrow_strike;

        // Phase 1: Dive underground (0-40)
        if (timer < 40) {
            this.isBurrowingAll = timer > 15;
            if (timer === 15) {
                this.heightZ = -WAVE_AMPLITUDE;
                this.isUnderground = true;
            }
            return;
        }

        // Phase 2: Move underground toward target (40-100)
        if (timer < 100) {
            if (timer === 40) {
                this.burrowTargetX = player.x;
                this.burrowTargetY = player.y;
            }
            const progress = (timer - 40) / 60;
            const startX = this.positionHistory[Math.min(40, this.positionHistory.length - 1)]?.x || this.x;
            const startY = this.positionHistory[Math.min(40, this.positionHistory.length - 1)]?.y || this.y;
            this.x = startX + (this.burrowTargetX - startX) * progress;
            this.y = startY + (this.burrowTargetY - startY) * progress;
            return;
        }

        // Phase 3: Surface (100-150)
        if (timer >= 100) {
            this.isBurrowingAll = false;
            const surfaceProgress = (timer - 100) / 50;
            this.heightZ = -WAVE_AMPLITUDE + WAVE_AMPLITUDE * 2 * surfaceProgress;
            this.isUnderground = this.heightZ < -UNDERGROUND_THRESHOLD;

            // Surface damage at frame 110
            if (timer === 110 && player.takeDamage) {
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 60) {
                    player.takeDamage(20);
                    if (player.knockbackX !== undefined) {
                        const angle = Math.atan2(dy, dx);
                        player.knockbackX = -Math.cos(angle) * 10;
                        player.knockbackY = -Math.sin(angle) * 10;
                    }
                }
            }
        }
    }

    executeSegmentVolley(cs, timer) {
        // Each segment fires outward at staggered frames
        const fireInterval = 8;
        const segIdx = Math.floor(timer / fireInterval);
        if (timer % fireInterval !== 0) return;
        if (segIdx >= this.segments.length) return;

        const seg = this.segments[segIdx];
        if (!seg || seg.isUnderground) return;

        const count = 4;
        const angleStep = (Math.PI * 2) / count;
        for (let i = 0; i < count; i++) {
            cs.spawnEnemyBullet({
                x: seg.x,
                y: seg.y - seg.heightZ,
                angle: seg.angle + i * angleStep,
                damage: 8,
                speed: 3.5,
                color: this.phase === 1 ? '#5dade2' : '#ff6b6b',
                size: 3,
                life: 90
            });
        }
    }

    // ========== MAIN UPDATE ==========

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) {
            // Kill all segments
            for (const seg of this.segments) {
                seg.hp = 0;
            }
            return;
        }
        if (this.frozenTimer > 0) return;

        this.combatSystem = combatSystem;

        // Initialize segments on first update
        if (!this.segmentsInitialized && this.worldSystem) {
            this.initSegments(this.worldSystem);
        }

        // Base update: knockback, timers
        super.update(player, walls, wallQuery);

        // Update position history and segments
        this.updatePositionHistory();
        this.updateSegmentPositions();
        this.updateWave();

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
                case 'venom_spit':
                    this.executeVenomSpit(combatSystem, this.attackTimer);
                    break;
                case 'charge':
                    this.executeCharge(player, this.attackTimer, walls, wallQuery, moveResolver);
                    break;
                case 'tail_whip':
                    this.executeTailWhip(combatSystem, this.attackTimer, player);
                    break;
                case 'constrict':
                    this.executeConstrict(player, this.attackTimer);
                    break;
                case 'burrow_strike':
                    this.executeBurrowStrike(player, this.attackTimer);
                    break;
                case 'segment_volley':
                    this.executeSegmentVolley(combatSystem, this.attackTimer);
                    break;
            }

            const cfg = this.attacks[this.currentAttack];
            if (cfg && this.attackTimer >= cfg.duration) {
                this.endAttack();
            }
            // Charge and constrict handle their own movement
            if (this.currentAttack === 'charge' || this.currentAttack === 'constrict' || this.currentAttack === 'burrow_strike') {
                return;
            }
            return;
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
                this.updateMovement(player, walls, wallQuery, moveResolver);
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

        // Ground shadow
        const shadowScale = this.isUnderground ? 0.6 : Math.max(0.4, 1 - this.heightZ / 60);
        const shadowAlpha = this.isUnderground ? 0.35 : Math.max(0.1, 0.25 * shadowScale);
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 10, 14 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.isUnderground) {
            // Draw burrow hole at ground level
            this._drawBurrowHole(ctx);
            ctx.restore();
            return;
        }

        // Transition zone
        if (this.heightZ < UNDERGROUND_THRESHOLD && this.heightZ > -UNDERGROUND_THRESHOLD) {
            const alpha = (this.heightZ + UNDERGROUND_THRESHOLD) / (2 * UNDERGROUND_THRESHOLD);
            ctx.globalAlpha = Math.max(0.15, alpha);
            if (this.heightZ < 0) {
                this._drawBurrowHole(ctx);
            }
        }

        // Dynamic 3D: draw neck/belly extension when elevated
        const drawY = -this.heightZ;
        if (this.heightZ > 4) {
            this._drawNeckExtension(ctx, drawY);
        }

        if (this.facingRight) {
            ctx.scale(-1, 1);
        }
        const phaseKey = 'phase' + this.phase;
        const assets = Assets.snakeBoss ? Assets.snakeBoss[phaseKey] : null;
        const headAssets = assets ? assets.head : null;

        if (headAssets) {
            let frames, frameIndex;

            if (this.isTransitioning && headAssets.transition) {
                frames = headAssets.transition;
                frameIndex = Math.min(
                    Math.floor((this.transitionTimer / this.transitionDuration) * frames.length),
                    frames.length - 1
                );
            } else if (this.currentAttack && headAssets.attack) {
                frames = headAssets.attack;
                const dur = this.attacks[this.currentAttack]?.duration || 60;
                frameIndex = Math.min(
                    Math.floor((this.attackTimer / dur) * frames.length),
                    frames.length - 1
                );
            } else if (this.state === 'run' && headAssets.run) {
                frames = headAssets.run;
                frameIndex = Math.floor(this.animationTimer / 6) % frames.length;
            } else {
                frames = headAssets.idle;
                frameIndex = Math.floor(this.animationTimer / 8) % frames.length;
            }

            if (frames && frames[frameIndex]) {
                const sprite = frames[frameIndex];
                const spriteDrawY = drawY - 24;
                ctx.drawImage(sprite, -24, spriteDrawY);

                // Hit flash
                if (this.hitFlashTimer > 0) {
                    ctx.save();
                    ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                    ctx.drawImage(sprite, -24, spriteDrawY);
                    ctx.restore();
                }

                // Phase transition overlay
                if (this.isTransitioning) {
                    const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
                    this._drawSpriteOverlay(ctx, sprite, spriteDrawY, '#e74c3c', alpha);
                }

                // Status effect overlays
                if (this.frozenTimer > 0) {
                    this._drawSpriteOverlay(ctx, sprite, spriteDrawY, '#a8d8ea', 0.45);
                } else if (this.slowTimer > 0) {
                    const slowAlpha = 0.1 + (this.slowAmount || 0) * 0.3;
                    this._drawSpriteOverlay(ctx, sprite, spriteDrawY, '#a8d8ea', slowAlpha);
                }
                if (this.bleedTimer > 0) {
                    const pulse = 0.15 + Math.sin(Date.now() / 150) * 0.1;
                    this._drawSpriteOverlay(ctx, sprite, spriteDrawY, '#c0392b', pulse);
                }
            }
        } else {
            // Placeholder
            this._drawPlaceholder(ctx, drawY);
        }

        ctx.restore();
    }

    _drawNeckExtension(ctx, drawY) {
        const baseW = 12;
        // Head sprite's neck bottom is roughly at drawY + 2 (from sprite coordinates)
        const extTop = drawY + 2;
        const groundY = 10; // head shadow Y level

        if (extTop >= groundY) return;
        const extH = groundY - extTop;

        const dark = this.phase === 1 ? '#2a3544' : '#3a2a1a';
        const mid = this.phase === 1 ? '#3a4a5a' : '#4a3a2a';
        const light = this.phase === 1 ? '#5a6a7a' : '#7a5a4a';
        const edge = this.phase === 1 ? '#1a2534' : '#1a0a00';

        // Main neck column
        ctx.fillStyle = mid;
        ctx.fillRect(-baseW + 2, extTop, (baseW - 2) * 2, extH);
        // Dark side edges
        ctx.fillStyle = edge;
        ctx.fillRect(-baseW, extTop, 2, extH);
        ctx.fillRect(baseW - 2, extTop, 2, extH);
        // Lighter inner edges
        ctx.fillStyle = dark;
        ctx.fillRect(-baseW + 2, extTop, 2, extH);
        ctx.fillRect(baseW - 4, extTop, 2, extH);
        // Center highlight
        ctx.fillStyle = light;
        ctx.fillRect(-3, extTop, 6, extH);
        // Bottom ellipse
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(0, groundY, baseW, baseW * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        // Armor seam lines
        ctx.fillStyle = edge;
        for (let y = extTop + 3; y < groundY - 1; y += 4) {
            ctx.fillRect(-(baseW - 1), y, (baseW - 1) * 2, 1);
        }
    }

    _drawBurrowHole(ctx) {
        ctx.fillStyle = 'rgba(20,15,10,0.6)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(10,5,0,0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cracks
        ctx.strokeStyle = 'rgba(80,60,40,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 2);
        ctx.lineTo(-16, 0);
        ctx.moveTo(11, 3);
        ctx.lineTo(15, 1);
        ctx.stroke();
    }

    _drawSpriteOverlay(ctx, sprite, drawY, color, alpha) {
        const oc = this._overlayCtx;
        oc.clearRect(0, 0, 48, 48);
        oc.globalCompositeOperation = 'source-over';
        oc.globalAlpha = 1;
        oc.drawImage(sprite, 0, 0);
        oc.globalCompositeOperation = 'source-atop';
        oc.fillStyle = color;
        oc.fillRect(0, 0, 48, 48);
        oc.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(this._overlayCanvas, -24, drawY);
        ctx.restore();
    }

    _drawPlaceholder(ctx, drawY) {
        const color = this.phase === 1 ? '#4a5a6a' : '#6a4a3a';
        const dark = this.phase === 1 ? '#2a3544' : '#3a2a1a';
        const light = this.phase === 1 ? '#6a8a9a' : '#8a6a5a';
        const eyeColor = this.phase === 1 ? '#3498db' : '#e74c3c';

        ctx.save();
        ctx.translate(0, drawY);

        // Side walls (3D depth visible below top plate)
        ctx.fillStyle = dark;
        ctx.fillRect(-14, -4, 2, 12);
        ctx.fillRect(12, -4, 2, 12);
        // Front face (belly)
        ctx.fillStyle = this.phase === 1 ? '#3a4a5a' : '#4a3a2a';
        ctx.fillRect(-6, -4, 12, 10);
        // Side armor panels
        ctx.fillStyle = color;
        ctx.fillRect(-12, -4, 6, 10);
        ctx.fillRect(6, -4, 6, 10);

        // Top armor plate (angular, from 35° view)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(14, -6);
        ctx.lineTo(12, 4);
        ctx.lineTo(0, 0);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-14, -6);
        ctx.closePath();
        ctx.fill();

        // Top plate highlight
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, -4);
        ctx.lineTo(4, 0);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, -4);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = eyeColor;
        ctx.fillRect(-8, -4, 3, 3);
        ctx.fillRect(5, -4, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-7, -3, 1, 1);
        ctx.fillRect(6, -3, 1, 1);

        // Jaw seam
        ctx.fillStyle = dark;
        ctx.fillRect(-10, 0, 20, 1);

        // Energy core
        ctx.fillStyle = eyeColor;
        ctx.fillRect(-2, -8, 4, 3);

        // Bottom ellipse (neck)
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(0, 8, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Neck energy ring
        ctx.strokeStyle = eyeColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 8, 11, 3, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(14, -6);
            ctx.lineTo(14, 6);
            ctx.lineTo(-14, 6);
            ctx.lineTo(-14, -6);
            ctx.closePath();
            ctx.fill();
        }

        if (this.isTransitioning) {
            const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
            ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(14, -6);
            ctx.lineTo(14, 6);
            ctx.lineTo(-14, 6);
            ctx.lineTo(-14, -6);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
