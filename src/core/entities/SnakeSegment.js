import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';

/**
 * SnakeSegment — body or tail segment of the SnakeBoss.
 * Each segment is an independent entity in enemies[] for automatic Y-sort and bullet collision.
 * Damage is routed to the parent SnakeBoss head.
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

        // Overlay canvas for effects
        this._overlayCanvas = document.createElement('canvas');
        this._overlayCanvas.width = 36;
        this._overlayCanvas.height = 36;
        this._overlayCtx = this._overlayCanvas.getContext('2d');
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

        // --- Ground shadow (always at ground level) ---
        const shadowScale = this.isUnderground ? 0.6 : Math.max(0.4, 1 - this.heightZ / 60);
        const shadowAlpha = this.isUnderground ? 0.35 : Math.max(0.1, 0.25 * shadowScale);
        const shadowRx = (this.segmentType === 'tail' ? 6 : 8) * shadowScale;
        const shadowRy = (this.segmentType === 'tail' ? 3 : 4) * shadowScale;
        ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(0, 4, shadowRx, shadowRy, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.isUnderground) {
            // Draw burrow hole
            this._drawBurrowHole(ctx);
            ctx.restore();
            return;
        }

        // Transition zone (partially underground)
        const undergroundThreshold = 8;
        if (this.heightZ < undergroundThreshold && this.heightZ > -undergroundThreshold) {
            const alpha = (this.heightZ + undergroundThreshold) / (2 * undergroundThreshold);
            ctx.globalAlpha = Math.max(0.15, alpha);
            // Draw partial burrow
            if (this.heightZ < 0) {
                this._drawBurrowHole(ctx);
            }
        }

        // Draw segment sprite at height-offset Y
        const drawY = -this.heightZ;

        // Dynamic 3D: draw belly/column extension when elevated
        if (this.heightZ > 4) {
            this._drawBellyExtension(ctx, drawY);
        }

        const phaseKey = 'phase' + this.phase;
        const assets = Assets.snakeBoss ? Assets.snakeBoss[phaseKey] : null;
        const frameKey = this.segmentType === 'tail' ? 'tail' : 'body';
        const frames = assets ? assets[frameKey] : null;

        if (frames && frames.length > 0) {
            const frameIndex = Math.floor(this.animationTimer / 8) % frames.length;
            const sprite = frames[frameIndex];
            const sw = sprite.width;
            const sh = sprite.height;

            ctx.save();
            ctx.translate(0, drawY);
            // No rotation — 2.5D cylindrical sprites are orientation-independent
            ctx.drawImage(sprite, -sw / 2, -sh / 2);

            // Hit flash
            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(sprite, -sw / 2, -sh / 2);
                ctx.restore();
            }

            // Frozen overlay
            if (this.frozenTimer > 0) {
                this._drawSpriteOverlay(ctx, sprite, '#a8d8ea', 0.45);
            } else if (this.slowTimer > 0) {
                const slowAlpha = 0.1 + (this.slowAmount || 0) * 0.3;
                this._drawSpriteOverlay(ctx, sprite, '#a8d8ea', slowAlpha);
            }
            // Bleed overlay
            if (this.bleedTimer > 0) {
                const pulse = 0.15 + Math.sin(Date.now() / 150) * 0.1;
                this._drawSpriteOverlay(ctx, sprite, '#c0392b', pulse);
            }

            ctx.restore();
        } else {
            // Placeholder rendering
            this._drawPlaceholder(ctx, drawY);
        }

        ctx.restore();
    }

    _drawBurrowHole(ctx) {
        const size = this.segmentType === 'tail' ? 6 : 9;
        // Outer hole
        ctx.fillStyle = 'rgba(20,15,10,0.6)';
        ctx.beginPath();
        ctx.ellipse(0, 2, size + 2, size * 0.5 + 1, 0, 0, Math.PI * 2);
        ctx.fill();
        // Inner darker
        ctx.fillStyle = 'rgba(10,5,0,0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 2, size, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Dust/crack edges
        ctx.fillStyle = 'rgba(80,60,40,0.3)';
        ctx.fillRect(-size - 1, 0, 2, 2);
        ctx.fillRect(size - 1, 1, 2, 2);
    }

    _drawSpriteOverlay(ctx, sprite, color, alpha) {
        const oc = this._overlayCtx;
        oc.clearRect(0, 0, 36, 36);
        oc.globalCompositeOperation = 'source-over';
        oc.globalAlpha = 1;
        oc.drawImage(sprite, (36 - sprite.width) / 2, (36 - sprite.height) / 2);
        oc.globalCompositeOperation = 'source-atop';
        oc.fillStyle = color;
        oc.fillRect(0, 0, 36, 36);
        oc.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(this._overlayCanvas, -18, -18);
        ctx.restore();
    }

    _drawPlaceholder(ctx, drawY) {
        const isTail = this.segmentType === 'tail';
        const rx = isTail ? 6 : 9;
        const wallH = isTail ? 6 : 8;
        const ry = isTail ? 3 : 4;
        const color = this.phase === 1 ? '#4a5a6a' : '#6a4a3a';
        const dark = this.phase === 1 ? '#2a3544' : '#3a2a1a';
        const light = this.phase === 1 ? '#6a8a9a' : '#8a6a5a';
        const coreColor = this.phase === 1 ? '#3498db' : '#e74c3c';

        ctx.save();
        ctx.translate(0, drawY);

        // Bottom ellipse (belly)
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(0, wallH, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Side walls
        ctx.fillStyle = color;
        ctx.fillRect(-rx, 0, rx * 2, wallH);
        // Dark edges
        ctx.fillStyle = dark;
        ctx.fillRect(-rx, 0, 2, wallH);
        ctx.fillRect(rx - 2, 0, 2, wallH);
        // Center highlight
        ctx.fillStyle = light;
        ctx.fillRect(-2, 1, 4, wallH - 1);

        // Top ellipse (armor cap)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        // Top highlight
        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.ellipse(0, -1, rx - 3, ry - 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Energy ring
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -ry + 1, rx + 1, 2, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(-rx, 0, rx * 2, wallH);
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    _drawBellyExtension(ctx, drawY) {
        const isTail = this.segmentType === 'tail';
        const baseW = isTail ? 7 : 10;

        // Sprite bottom offset (where the built-in cylinder ends, relative to drawY)
        const spriteBottomOffset = isTail ? 10 : 12;
        const extTop = drawY + spriteBottomOffset;
        const groundY = 4; // shadow Y level

        if (extTop >= groundY) return;

        const extH = groundY - extTop;

        // Colors
        const dark = this.phase === 1 ? '#2a3544' : '#3a2a1a';
        const mid = this.phase === 1 ? '#3a4a5a' : '#4a3a2a';
        const light = this.phase === 1 ? '#5a6a7a' : '#7a5a4a';
        const edge = this.phase === 1 ? '#1a2534' : '#1a0a00';

        // Main belly column
        ctx.fillStyle = mid;
        ctx.fillRect(-baseW + 2, extTop, (baseW - 2) * 2, extH);

        // Dark side edges
        ctx.fillStyle = edge;
        ctx.fillRect(-baseW, extTop, 2, extH);
        ctx.fillRect(baseW - 2, extTop, 2, extH);

        // Slightly lighter next-to-edge
        ctx.fillStyle = dark;
        ctx.fillRect(-baseW + 2, extTop, 2, extH);
        ctx.fillRect(baseW - 4, extTop, 2, extH);

        // Center highlight strip
        ctx.fillStyle = light;
        ctx.fillRect(-2, extTop, 4, extH);

        // Bottom ellipse at ground level
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.ellipse(0, groundY, baseW, baseW * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Armor band lines across extension
        ctx.fillStyle = edge;
        for (let y = extTop + 3; y < groundY - 1; y += 4) {
            ctx.fillRect(-(baseW - 1), y, (baseW - 1) * 2, 1);
        }
    }
}
