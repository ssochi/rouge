import { Enemy } from './Enemy.js';
import { SnakeSegment } from './SnakeSegment.js';

/**
 * SnakeBoss — Mechanical Serpent Boss
 * Multi-segment pseudo-3D snake with undulating body.
 * Head entity manages AI, HP pool, and segment positions.
 * Segments are independent entities in enemies[] for proper Y-sort and collision.
 */

const SEGMENT_COUNT = 9;       // 8 body + 1 tail
const SEGMENT_SPACING = 8;     // Frames between each segment in position history
const MAX_HISTORY = (SEGMENT_COUNT + 1) * SEGMENT_SPACING + 10;
const SWAY_AMPLITUDE = 12;     // Lateral sway amplitude (pixels)
const SWAY_PHASE_SHIFT = 0.7;
const SWAY_SPEED = 0.04;
const BURROW_DEPTH = 24;       // heightZ depth for burrowing
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
        this.phaseColors = ['#4a7c8a', '#d4a017', '#c0392b'];
        this.phaseNames = ['I', 'II', 'III'];
        this.phaseMarkers = [0.65, 0.3]; // 65% and 30% transition markers

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

        // Head facing angle (radians)
        this.angle = 0;

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

        this._lightOccluderCanvas = document.createElement('canvas');
        this._lightOccluderCanvas.width = 128;
        this._lightOccluderCanvas.height = 128;
        this._lightOccluderCtx = this._lightOccluderCanvas.getContext('2d');
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
        if (this.phase === 1 && hpRatio <= 0.65) {
            this.phase = 2;
            this.speed = 1.7;
            this.preferredDistance = 140;
            this.isTransitioning = true;
            this.transitionTimer = 0;
            this.currentAttack = null;
            this.attackTimer = 0;
            this.attackCooldown = 40;
            for (const seg of this.segments) {
                seg.phase = 2;
            }
            return true;
        }
        if (this.phase === 2 && hpRatio <= 0.3) {
            this.phase = 3;
            this.speed = 2.2;
            this.preferredDistance = 110;
            this.isTransitioning = true;
            this.transitionTimer = 0;
            this.currentAttack = null;
            this.attackTimer = 0;
            this.attackCooldown = 25;
            for (const seg of this.segments) {
                seg.phase = 3;
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

            // Apply lateral sway perpendicular to facing direction
            if (seg.lateralOffset) {
                const perpAngle = seg.angle + Math.PI / 2;
                seg.x += Math.cos(perpAngle) * seg.lateralOffset;
                seg.y += Math.sin(perpAngle) * seg.lateralOffset;
            }
        }
    }

    updateWave() {
        const waveTime = this.animationTimer * SWAY_SPEED;

        // Head: no Z wave in normal mode, burrow handles its own heightZ
        if (!this.isBurrowingAll && this.currentAttack !== 'burrow_strike') {
            this.heightZ = 0;
            this.isUnderground = false;
        }

        // Body segments: lateral sway (applied in updateSegmentPositions)
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            if (this.isBurrowingAll) {
                seg.heightZ = -BURROW_DEPTH;
                seg.isUnderground = true;
                seg.lateralOffset = 0;
            } else {
                seg.heightZ = 0;
                seg.isUnderground = false;
                seg.lateralOffset = Math.sin(waveTime + (i + 1) * SWAY_PHASE_SHIFT) * SWAY_AMPLITUDE;
            }
        }
    }

    // ========== MOVEMENT AI ==========

    updateMovement(player, walls, wallQuery, moveResolver) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.angle = Math.atan2(dy, dx);

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

        // Update angle from movement direction
        if (Math.abs(moveX) > 0.01 || Math.abs(moveY) > 0.01) {
            this.angle = Math.atan2(moveY, moveX);
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

        // Weighted random selection — attack pool grows with phase
        const pool = [];

        // Phase 1: basic attacks only
        pool.push({ type: 'venom_spit', weight: 3 });
        pool.push({ type: 'charge', weight: 2 });

        // Phase 2+: add constrict and tail_whip
        if (this.phase >= 2) {
            pool.push({ type: 'constrict', weight: 1 });
            pool.push({ type: 'tail_whip', weight: dist < 120 ? 3 : 1 });
        }

        // Phase 3: add burrow_strike and segment_volley
        if (this.phase >= 3) {
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
        this.angle = this.attackTargetAngle;

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
        if (this.phase === 2) this.attackCooldown = Math.floor(this.attackCooldown * 0.85);
        else if (this.phase === 3) this.attackCooldown = Math.floor(this.attackCooldown * 0.65);
        this.currentAttack = null;
        this.attackTimer = 0;
        this.moveMode = 'orbit';
        this.isBurrowingAll = false;
    }

    // ========== ATTACK EXECUTION ==========

    executeVenomSpit(cs, timer) {
        const fireFrame = 20;
        if (timer !== fireFrame) return;

        // 3-tier venom spit: Phase 1 weakest, Phase 3 strongest
        let count, spreadAngle, bulletDmg, bulletColor;
        if (this.phase === 1) {
            count = 4; spreadAngle = 0.5; bulletDmg = 8; bulletColor = '#3498db';
        } else if (this.phase === 2) {
            count = 5; spreadAngle = 0.6; bulletDmg = 10; bulletColor = '#d4a017';
        } else {
            count = 7; spreadAngle = 0.8; bulletDmg = 12; bulletColor = '#e74c3c';
        }
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
                color: bulletColor,
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

        this.angle = Math.atan2(this.chargeVy, this.chargeVx);

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
        this.angle = this.constrictAngle + Math.PI / 2;

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
                this.heightZ = -BURROW_DEPTH;
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
            this.heightZ = -BURROW_DEPTH + BURROW_DEPTH * 2 * surfaceProgress;
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
                color: this.phase === 3 ? '#ff6b6b' : this.phase === 2 ? '#f0c040' : '#5dade2',
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

        this.angle = Math.atan2(dy, dx);

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
        if (!this.isUnderground) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(2, 8, 16, 9, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.isUnderground) {
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

        const drawY = -this.heightZ;

        // Multi-layer programmatic 3D rendering
        const colors = this._getColors();
        const pulsePhase = (this.animationTimer % 64) / 64;
        const pulseT = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2);

        // Calculate jaw open amount
        const jawOpen = this._getJawOpen();

        this._drawHeadLayers(ctx, drawY, colors, pulseT, jawOpen);

        // Status effect overlays
        this._drawStatusOverlays(ctx, drawY);

        ctx.restore();
    }

    getLightOccluderSprites() {
        if (this.hp <= 0 || this.blocksLight === false || this.isUnderground) return [];
        if (!this._lightOccluderCtx) return [];

        const oc = this._lightOccluderCtx;
        const size = this._lightOccluderCanvas.width;
        const center = size / 2;
        oc.clearRect(0, 0, size, size);

        oc.save();
        oc.translate(center, center);

        const drawY = -this.heightZ;
        const colors = this._getColors();
        const pulsePhase = (this.animationTimer % 64) / 64;
        const pulseT = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2);
        const jawOpen = this._getJawOpen();
        this._drawHeadLayers(oc, drawY, colors, pulseT, jawOpen);
        oc.restore();

        return [{
            kind: 'sprite',
            sprite: this._lightOccluderCanvas,
            pivotX: this.x,
            pivotY: this.y,
            originX: center,
            originY: center,
            rotation: 0,
            flipX: false,
            forceMaskRefresh: true
        }];
    }

    // ========== MULTI-LAYER HELPERS ==========

    _drawLayer(ctx, baseDrawY, layerOffset, drawFn) {
        ctx.save();
        ctx.translate(0, baseDrawY + layerOffset);
        ctx.rotate(this.angle + Math.PI / 2);
        drawFn(ctx);
        ctx.restore();
    }

    _getColors() {
        if (this.phase === 1) {
            return {
                armor: '#4a5a6a', armorDark: '#2a3544', armorLight: '#6a8a9a',
                core: '#3498db', coreGlow: '#5dade2',
                belly: '#3a4a5a', bellyDark: '#2a3544',
                rivet: '#556a7a'
            };
        }
        if (this.phase === 2) {
            return {
                armor: '#6a5a2a', armorDark: '#3a3010', armorLight: '#8a7a4a',
                core: '#d4a017', coreGlow: '#f0c040',
                belly: '#5a4a20', bellyDark: '#3a3010',
                rivet: '#7a6a3a'
            };
        }
        return {
            armor: '#6a4a3a', armorDark: '#3a2a1a', armorLight: '#8a6a5a',
            core: '#e74c3c', coreGlow: '#ff6b6b',
            belly: '#5a3a2a', bellyDark: '#3a2a1a',
            rivet: '#7a5a4a'
        };
    }

    _getJawOpen() {
        if (this.currentAttack) {
            const dur = this.attacks[this.currentAttack]?.duration || 60;
            const t = this.attackTimer / dur;
            // Bell curve: 0→1→0
            return Math.sin(t * Math.PI);
        }
        if (this.state === 'run') return 0.1;
        return 0;
    }

    _lerpColor(hex1, hex2, t) {
        const r1 = parseInt(hex1.slice(1, 3), 16);
        const g1 = parseInt(hex1.slice(3, 5), 16);
        const b1 = parseInt(hex1.slice(5, 7), 16);
        const r2 = parseInt(hex2.slice(1, 3), 16);
        const g2 = parseInt(hex2.slice(3, 5), 16);
        const b2 = parseInt(hex2.slice(5, 7), 16);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return `rgb(${r},${g},${b})`;
    }

    // ========== HEAD: 4 LAYERS ==========

    _drawHeadLayers(ctx, drawY, c, pulseT, jawOpen) {
        const jawDrop = jawOpen * 4;

        // L0: Neck base — widest ellipse, drops with jaw
        this._drawLayer(ctx, drawY, 5 + jawDrop, (ctx) => {
            // Neck base ellipse
            ctx.fillStyle = c.bellyDark;
            ctx.beginPath();
            ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // Neck energy ring
            const ringColor = this._lerpColor(c.core, c.coreGlow, pulseT);
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Mouth interior (visible when jaw open)
        if (jawOpen > 0.05) {
            this._drawLayer(ctx, drawY, 3 + jawDrop * 0.5, (ctx) => {
                // Dark mouth cavity
                ctx.fillStyle = '#0a0505';
                ctx.fillRect(-8, -6, 16, 6);
                // Lower jaw teeth (pointing forward = -Y in rotated space)
                ctx.fillStyle = '#ddd';
                for (let i = -6; i <= 6; i += 4) {
                    ctx.fillRect(i, -7, 2, 3);
                }
            });
        }

        // L1: Lower skull — jaw
        this._drawLayer(ctx, drawY, 1 + jawDrop * 0.3, (ctx) => {
            ctx.fillStyle = c.armor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 13, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Jaw line
            ctx.fillStyle = c.armorDark;
            ctx.fillRect(-10, 2, 20, 1);
            // Upper jaw teeth (3 small white rects pointing forward)
            ctx.fillStyle = '#ddd';
            ctx.fillRect(-5, -12, 2, 3);
            ctx.fillRect(-1, -13, 2, 4);
            ctx.fillRect(3, -12, 2, 3);
            // Side armor bands
            ctx.fillStyle = c.armorDark;
            ctx.fillRect(-13, -3, 3, 6);
            ctx.fillRect(10, -3, 3, 6);
        });

        // L2: Upper skull — eyes + armor plates
        this._drawLayer(ctx, drawY, -4, (ctx) => {
            ctx.fillStyle = c.armor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            // Armor plate (lighter center polygon)
            ctx.fillStyle = c.armorLight;
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(7, -3);
            ctx.lineTo(5, 4);
            ctx.lineTo(-5, 4);
            ctx.lineTo(-7, -3);
            ctx.closePath();
            ctx.fill();
            // Eyes (core color, square)
            ctx.fillStyle = c.core;
            ctx.fillRect(-8, -2, 4, 4);
            ctx.fillRect(4, -2, 4, 4);
            // Eye highlights
            ctx.fillStyle = '#fff';
            ctx.fillRect(-7, -1, 2, 2);
            ctx.fillRect(5, -1, 2, 2);
            // Seam lines
            ctx.fillStyle = c.armorDark;
            ctx.fillRect(-10, 0, 20, 1);
        });

        // L3: Crown ridge — smallest, highest
        this._drawLayer(ctx, drawY, -8, (ctx) => {
            ctx.fillStyle = c.armorLight;
            ctx.beginPath();
            ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Energy core (center)
            const coreColor = this._lerpColor(c.core, c.coreGlow, pulseT);
            ctx.fillStyle = coreColor;
            ctx.fillRect(-2, -2, 4, 4);
            // Nose ridge (small triangle pointing forward)
            ctx.fillStyle = c.armor;
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(-3, -3);
            ctx.lineTo(3, -3);
            ctx.closePath();
            ctx.fill();
            // Top highlight
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.12;
            ctx.beginPath();
            ctx.ellipse(0, -1, 4, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Phase 3 crack effects (cracks + sparks only in final phase)
        if (this.phase === 3) {
            this._drawPhase2Effects(ctx, drawY, c);
        }

        // Phase transition overlay
        if (this.isTransitioning) {
            const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
            // Phase 2 transition = amber pulse, Phase 3 transition = red pulse
            const pulseColor = this.phase === 2
                ? `rgba(212, 160, 23, ${alpha})`
                : `rgba(231, 76, 60, ${alpha})`;
            this._drawLayer(ctx, drawY, -2, (ctx) => {
                ctx.fillStyle = pulseColor;
                ctx.beginPath();
                ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    _drawPhase2Effects(ctx, drawY, c) {
        // Crack lines on upper skull layer
        this._drawLayer(ctx, drawY, -4, (ctx) => {
            ctx.strokeStyle = c.armorDark;
            ctx.lineWidth = 1;
            // Diagonal cracks
            ctx.beginPath();
            ctx.moveTo(-6, -6);
            ctx.lineTo(-2, 2);
            ctx.moveTo(5, -5);
            ctx.lineTo(3, 3);
            ctx.moveTo(-3, -7);
            ctx.lineTo(2, -2);
            ctx.stroke();
        });
        // Occasional sparks (based on animation timer)
        if (this.animationTimer % 16 < 4) {
            const sparkT = (this.animationTimer % 16) / 4;
            this._drawLayer(ctx, drawY, -6, (ctx) => {
                ctx.fillStyle = this._lerpColor(c.core, c.coreGlow, sparkT);
                const sx = Math.sin(this.animationTimer * 0.7) * 6;
                const sy = Math.cos(this.animationTimer * 1.1) * 4;
                ctx.fillRect(sx - 1, sy - 1, 2, 2);
            });
        }
    }

    // ========== STATUS OVERLAYS ==========

    _drawStatusOverlays(ctx, drawY) {
        // Hit flash
        if (this.hitFlashTimer > 0) {
            this._drawLayer(ctx, drawY, -2, (ctx) => {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        // Frozen
        if (this.frozenTimer > 0) {
            this._drawLayer(ctx, drawY, -2, (ctx) => {
                ctx.fillStyle = 'rgba(168,216,234,0.45)';
                ctx.beginPath();
                ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.slowTimer > 0) {
            const slowAlpha = 0.1 + (this.slowAmount || 0) * 0.3;
            this._drawLayer(ctx, drawY, -2, (ctx) => {
                ctx.fillStyle = `rgba(168,216,234,${slowAlpha})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        // Bleed
        if (this.bleedTimer > 0) {
            const pulse = 0.15 + Math.sin(Date.now() / 150) * 0.1;
            this._drawLayer(ctx, drawY, -2, (ctx) => {
                ctx.fillStyle = `rgba(192,57,43,${pulse})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // ========== SUPPORT METHODS ==========

    _drawBurrowHole(ctx) {
        ctx.fillStyle = 'rgba(20,15,10,0.6)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(10,5,0,0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 4, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,60,40,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 2);
        ctx.lineTo(-16, 0);
        ctx.moveTo(11, 3);
        ctx.lineTo(15, 1);
        ctx.stroke();
    }
}
