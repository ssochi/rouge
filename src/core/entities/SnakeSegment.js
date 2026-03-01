import { Enemy } from './Enemy.js';

/**
 * SnakeSegment — body or tail segment of the SnakeBoss.
 * Each segment is an independent entity in enemies[] for automatic Y-sort and bullet collision.
 * Damage is routed to the parent SnakeBoss head.
 * Uses multi-layer programmatic 3D rendering (belly→armor→cap) for depth.
 */
export class SnakeSegment extends Enemy {
    constructor(x, y, segmentIndex, parentBoss, segmentType = 'body') {
        // body: 20×20 logical, tail: 16×16 logical
        const size = segmentType === 'tail' ? 16 : 20;
        super(x, y, size, size, 9999, 0); // HP is cosmetic; damage routes to head

        this.segmentIndex = segmentIndex;
        this.parentBoss = parentBoss;
        this.segmentType = segmentType; // 'body' | 'tail'
        this.isSegment = true;
        this.isBoss = false;

        // Pseudo-3D height offset
        this.heightZ = 0;
        this.isUnderground = false;

        // Facing angle (radians) for rotated rendering
        this.angle = 0;

        // Smaller movement hitbox (segments don't collide with walls directly)
        this.hitboxWidth = 0;
        this.hitboxHeight = 0;

        // Phase (mirrors head)
        this.phase = 1;

        // Lateral sway offset (set by SnakeBoss.updateWave)
        this.lateralOffset = 0;

        this._lightOccluderCanvas = document.createElement('canvas');
        this._lightOccluderCanvas.width = 96;
        this._lightOccluderCanvas.height = 96;
        this._lightOccluderCtx = this._lightOccluderCanvas.getContext('2d');
    }

    // Route damage to head with reduction
    takeDamage(amount, knockback) {
        if (!this.parentBoss || this.parentBoss.hp <= 0) return;
        const ratio = this.segmentType === 'tail' ? 0.4 : 0.6;
        // Minimal knockback to head
        const reducedKB = knockback
            ? { x: knockback.x * 0.05, y: knockback.y * 0.05 }
            : null;
        this.parentBoss.takeDamage(Math.floor(amount * ratio), reducedKB);
        // Local hit flash
        this.hitFlashTimer = 5;
    }

    getBulletHurtbox() {
        if (this.isUnderground || this.hp <= 0) return null;
        const size = this.segmentType === 'tail' ? 14 : 18;
        return {
            x: this.x - size / 2,
            y: this.y - this.heightZ - size / 2,
            width: size,
            height: size
        };
    }

    // Segments skip normal AI update — position is set by SnakeBoss
    update() {
        if (this.hitFlashTimer > 0) this.hitFlashTimer--;
        this.animationTimer++;
        // Sync phase with parent
        if (this.parentBoss) this.phase = this.parentBoss.phase;
        // Sync death
        if (this.parentBoss && this.parentBoss.hp <= 0) {
            this.hp = 0;
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        // --- Ground shadow ---
        const isTail = this.segmentType === 'tail';
        if (!this.isUnderground) {
            const sRx = isTail ? 9 : 13;
            const sRy = isTail ? 5 : 7;
            // Offset shadow slightly down-right for directional light
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(2, 5, sRx, sRy, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.isUnderground) {
            this._drawBurrowHole(ctx);
            ctx.restore();
            return;
        }

        // Transition zone (partially underground)
        const undergroundThreshold = 8;
        if (this.heightZ < undergroundThreshold && this.heightZ > -undergroundThreshold) {
            const alpha = (this.heightZ + undergroundThreshold) / (2 * undergroundThreshold);
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

        if (this.segmentType === 'tail') {
            this._drawTailLayers(ctx, drawY, colors, pulseT);
        } else {
            this._drawBodyLayers(ctx, drawY, colors, pulseT);
        }

        // Status effect overlays (drawn at armor layer position)
        this._drawStatusOverlays(ctx, drawY, colors);

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
        if (this.segmentType === 'tail') {
            this._drawTailLayers(oc, drawY, colors, pulseT);
        } else {
            this._drawBodyLayers(oc, drawY, colors, pulseT);
        }
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

    // ========== BODY SEGMENT: 3 LAYERS ==========

    _drawBodyLayers(ctx, drawY, c, pulseT) {
        // Layer 0 (bottom): Belly — larger ellipse, visible beneath armor
        this._drawLayer(ctx, drawY, 3, (ctx) => {
            // Belly fill
            ctx.fillStyle = c.bellyDark;
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            // Energy ring
            const ringColor = this._lerpColor(c.core, c.coreGlow, pulseT);
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Layer 1 (middle): Armor plate
        this._drawLayer(ctx, drawY, 0, (ctx) => {
            // Main armor
            ctx.fillStyle = c.armor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Dark side bands
            ctx.fillStyle = c.armorDark;
            ctx.fillRect(-11, -2, 3, 4);
            ctx.fillRect(8, -2, 3, 4);
            // Armor seam line (horizontal across center)
            ctx.fillStyle = c.armorDark;
            ctx.fillRect(-8, -1, 16, 1);
            // Rivets (4 along seam)
            ctx.fillStyle = c.rivet;
            ctx.fillRect(-6, -2, 2, 2);
            ctx.fillRect(-1, -2, 2, 2);
            ctx.fillRect(4, -2, 2, 2);
        });

        // Layer 2 (top): Armor cap — smaller, lighter
        this._drawLayer(ctx, drawY, -3, (ctx) => {
            ctx.fillStyle = c.armorLight;
            ctx.beginPath();
            ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Center spine ridge
            ctx.fillStyle = c.armor;
            ctx.fillRect(-7, -1, 14, 2);
            // Highlight
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            ctx.ellipse(0, -1, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
    }

    // ========== TAIL SEGMENT: 3 LAYERS ==========

    _drawTailLayers(ctx, drawY, c, pulseT) {
        // Layer 0 (bottom): Belly
        this._drawLayer(ctx, drawY, 2, (ctx) => {
            ctx.fillStyle = c.bellyDark;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Layer 1 (middle): Armor
        this._drawLayer(ctx, drawY, 0, (ctx) => {
            ctx.fillStyle = c.armor;
            ctx.beginPath();
            ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Energy ring
            const ringColor = this._lerpColor(c.core, c.coreGlow, pulseT);
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Layer 2 (top): Cap with drill tip
        this._drawLayer(ctx, drawY, -2, (ctx) => {
            ctx.fillStyle = c.armorLight;
            ctx.beginPath();
            ctx.ellipse(0, 0, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Drill tip (small triangle pointing forward = negative Y in rotated space)
            ctx.fillStyle = c.armor;
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(-3, -2);
            ctx.lineTo(3, -2);
            ctx.closePath();
            ctx.fill();
        });
    }

    // ========== STATUS OVERLAYS ==========

    _drawStatusOverlays(ctx, drawY, c) {
        const isTail = this.segmentType === 'tail';
        const rx = isTail ? 8 : 12;
        const ry = isTail ? 6 : 9;

        // Hit flash
        if (this.hitFlashTimer > 0) {
            this._drawLayer(ctx, drawY, 0, (ctx) => {
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath();
                ctx.ellipse(0, 0, rx + 2, ry + 2, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        // Frozen overlay
        if (this.frozenTimer > 0) {
            this._drawLayer(ctx, drawY, 0, (ctx) => {
                ctx.fillStyle = 'rgba(168,216,234,0.45)';
                ctx.beginPath();
                ctx.ellipse(0, 0, rx + 1, ry + 1, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.slowTimer > 0) {
            const slowAlpha = 0.1 + (this.slowAmount || 0) * 0.3;
            this._drawLayer(ctx, drawY, 0, (ctx) => {
                ctx.fillStyle = `rgba(168,216,234,${slowAlpha})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, rx + 1, ry + 1, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        // Bleed overlay
        if (this.bleedTimer > 0) {
            const pulse = 0.15 + Math.sin(Date.now() / 150) * 0.1;
            this._drawLayer(ctx, drawY, 0, (ctx) => {
                ctx.fillStyle = `rgba(192,57,43,${pulse})`;
                ctx.beginPath();
                ctx.ellipse(0, 0, rx + 1, ry + 1, 0, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // ========== UTILITY ==========

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

    _drawBurrowHole(ctx) {
        const size = this.segmentType === 'tail' ? 6 : 9;
        ctx.fillStyle = 'rgba(20,15,10,0.6)';
        ctx.beginPath();
        ctx.ellipse(0, 2, size + 2, size * 0.5 + 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(10,5,0,0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 2, size, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(80,60,40,0.3)';
        ctx.fillRect(-size - 1, 0, 2, 2);
        ctx.fillRect(size - 1, 1, 2, 2);
    }

}
