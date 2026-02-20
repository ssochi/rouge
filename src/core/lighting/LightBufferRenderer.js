const TWO_PI = Math.PI * 2;
const EPS = 1e-6;

function clampByte(v) {
    return Math.max(0, Math.min(255, Math.round(v)));
}

function rayRectDistance(ox, oy, dx, dy, rect, maxDist) {
    let tNear = -Infinity;
    let tFar = Infinity;

    // X slab
    if (Math.abs(dx) < EPS) {
        if (ox < rect.x || ox > rect.x + rect.w) return null;
    } else {
        const tx1 = (rect.x - ox) / dx;
        const tx2 = (rect.x + rect.w - ox) / dx;
        const txMin = Math.min(tx1, tx2);
        const txMax = Math.max(tx1, tx2);
        tNear = Math.max(tNear, txMin);
        tFar = Math.min(tFar, txMax);
    }

    // Y slab
    if (Math.abs(dy) < EPS) {
        if (oy < rect.y || oy > rect.y + rect.h) return null;
    } else {
        const ty1 = (rect.y - oy) / dy;
        const ty2 = (rect.y + rect.h - oy) / dy;
        const tyMin = Math.min(ty1, ty2);
        const tyMax = Math.max(ty1, ty2);
        tNear = Math.max(tNear, tyMin);
        tFar = Math.min(tFar, tyMax);
    }

    if (tNear > tFar) return null;

    // If inside rect, use exit distance.
    const dist = tNear > EPS ? tNear : tFar;
    if (!Number.isFinite(dist) || dist <= EPS || dist > maxDist) return null;

    return dist;
}

export class LightBufferRenderer {
    constructor(config) {
        this.config = config;
        this._colorCache = new Map();

        this.lightCanvas = document.createElement('canvas');
        this.lightCtx = this.lightCanvas.getContext('2d');
        this.lightCtx.imageSmoothingEnabled = false;

        this.glowCanvas = document.createElement('canvas');
        this.glowCtx = this.glowCanvas.getContext('2d');
        this.glowCtx.imageSmoothingEnabled = false;

        this.bufferWidth = 0;
        this.bufferHeight = 0;
    }

    updateConfig(config) {
        this.config = config;
    }

    _parseColor(color) {
        if (!color) return { r: 255, g: 255, b: 255 };
        if (this._colorCache.has(color)) {
            return this._colorCache.get(color);
        }

        let rgb = { r: 255, g: 255, b: 255 };

        if (color[0] === '#') {
            if (color.length === 4) {
                rgb = {
                    r: parseInt(color[1] + color[1], 16),
                    g: parseInt(color[2] + color[2], 16),
                    b: parseInt(color[3] + color[3], 16)
                };
            } else if (color.length === 7) {
                rgb = {
                    r: parseInt(color.slice(1, 3), 16),
                    g: parseInt(color.slice(3, 5), 16),
                    b: parseInt(color.slice(5, 7), 16)
                };
            }
        } else {
            const m = color.match(/rgba?\(([^)]+)\)/i);
            if (m) {
                const parts = m[1].split(',').map(v => Number.parseFloat(v.trim()));
                rgb = {
                    r: clampByte(parts[0] || 0),
                    g: clampByte(parts[1] || 0),
                    b: clampByte(parts[2] || 0)
                };
            }
        }

        this._colorCache.set(color, rgb);
        return rgb;
    }

    _ensureBufferSize(viewportWidth, viewportHeight) {
        const scale = this.config.bufferScale;
        const w = Math.max(1, Math.ceil(viewportWidth * scale));
        const h = Math.max(1, Math.ceil(viewportHeight * scale));

        if (w === this.bufferWidth && h === this.bufferHeight) return;

        this.bufferWidth = w;
        this.bufferHeight = h;

        this.lightCanvas.width = w;
        this.lightCanvas.height = h;
        this.glowCanvas.width = w;
        this.glowCanvas.height = h;

        this.lightCtx.imageSmoothingEnabled = false;
        this.glowCtx.imageSmoothingEnabled = false;
    }

    _computeVisibilityPolygon(light, blockers, rayCount) {
        if (!blockers || blockers.length === 0) return null;

        const points = new Array(rayCount);
        const angleStep = TWO_PI / rayCount;
        const startAngle = ((light.x * 0.0017 + light.y * 0.0023) % 1) * angleStep;

        for (let i = 0; i < rayCount; i++) {
            const angle = startAngle + angleStep * i;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            let nearest = light.radius;
            for (const blocker of blockers) {
                const dist = rayRectDistance(light.x, light.y, dx, dy, blocker, nearest);
                if (dist !== null && dist < nearest) {
                    nearest = dist;
                }
            }

            points[i] = {
                x: light.x + dx * nearest,
                y: light.y + dy * nearest
            };
        }

        return points;
    }

    _clipByPolygon(ctx, points, viewX, viewY, scale) {
        if (!points || points.length < 3) return false;

        ctx.beginPath();
        const first = points[0];
        ctx.moveTo(
            Math.round((first.x - viewX) * scale),
            Math.round((first.y - viewY) * scale)
        );

        for (let i = 1; i < points.length; i++) {
            const p = points[i];
            ctx.lineTo(
                Math.round((p.x - viewX) * scale),
                Math.round((p.y - viewY) * scale)
            );
        }

        ctx.closePath();
        ctx.clip();
        return true;
    }

    _drawLightBands(ctx, x, y, radius, color, intensity, steps) {
        const rgb = this._parseColor(color);
        const localSteps = Math.max(1, steps | 0);
        for (let i = localSteps; i >= 1; i--) {
            const t = i / localSteps;
            const edge = 1 - t;
            const r = Math.max(1, Math.round(radius * t));
            const alpha = (intensity / localSteps) * (0.42 + edge * 0.95);

            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(4)})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, TWO_PI);
            ctx.fill();
        }
    }

    _drawGlowBands(ctx, x, y, radius, color, intensity, steps) {
        const rgb = this._parseColor(color);
        const localSteps = Math.max(1, steps | 0);
        for (let i = localSteps; i >= 1; i--) {
            const t = i / localSteps;
            const edge = 1 - t;
            const r = Math.max(1, Math.round(radius * (0.65 + t * 0.45)));
            const alpha = (intensity / localSteps) * (0.18 + edge * 0.4);

            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(4)})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, TWO_PI);
            ctx.fill();
        }
    }

    render({ ctx, camera, viewportWidth, viewportHeight, lights, shadowBuilder }) {
        const begin = performance.now();

        const viewX = Math.floor(camera.x);
        const viewY = Math.floor(camera.y);
        const viewW = Math.ceil(viewportWidth) + 1;
        const viewH = Math.ceil(viewportHeight) + 1;

        this._ensureBufferSize(viewW, viewH);

        const bufferScale = this.config.bufferScale;
        const rayCount = this.config.shadowRays;
        const gradientSteps = this.config.gradientSteps;
        const glowSteps = this.config.glowSteps;

        const ambient = clampByte(this.config.ambientBrightness);

        const lctx = this.lightCtx;
        lctx.globalCompositeOperation = 'source-over';
        lctx.globalAlpha = 1;
        lctx.fillStyle = `rgb(${ambient}, ${ambient}, ${ambient})`;
        lctx.fillRect(0, 0, this.bufferWidth, this.bufferHeight);

        const gctx = this.glowCtx;
        gctx.globalCompositeOperation = 'source-over';
        gctx.globalAlpha = 1;
        gctx.clearRect(0, 0, this.bufferWidth, this.bufferHeight);

        for (const light of lights) {
            const lx = (light.x - viewX) * bufferScale;
            const ly = (light.y - viewY) * bufferScale;
            const rr = Math.max(1, light.radius * bufferScale);

            if (lx + rr < 0 || lx - rr > this.bufferWidth || ly + rr < 0 || ly - rr > this.bufferHeight) {
                continue;
            }

            let blockers = null;
            let polygon = null;
            if (light.castsShadows && shadowBuilder) {
                blockers = shadowBuilder.query(
                    light.x,
                    light.y,
                    light.radius,
                    this.config.maxBlockersPerLight,
                    light.ignoreSelfShadow ? light.owner : null
                );
                if (blockers.length > 0) {
                    polygon = this._computeVisibilityPolygon(light, blockers, rayCount);
                }
            }

            lctx.save();
            if (polygon) {
                this._clipByPolygon(lctx, polygon, viewX, viewY, bufferScale);
            }
            lctx.globalCompositeOperation = 'lighter';
            this._drawLightBands(lctx, Math.round(lx), Math.round(ly), rr, light.color, light.intensity, gradientSteps);
            lctx.restore();

            gctx.save();
            if (polygon) {
                this._clipByPolygon(gctx, polygon, viewX, viewY, bufferScale);
            }
            gctx.globalCompositeOperation = 'lighter';
            this._drawGlowBands(gctx, Math.round(lx), Math.round(ly), rr, light.color, light.intensity, glowSteps);
            gctx.restore();
        }

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 1;
        ctx.drawImage(this.lightCanvas, 0, 0, this.bufferWidth, this.bufferHeight, viewX, viewY, viewW, viewH);

        const glowStrength = this.config.glowStrength || 0;
        if (glowStrength > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = glowStrength;
            ctx.drawImage(this.glowCanvas, 0, 0, this.bufferWidth, this.bufferHeight, viewX, viewY, viewW, viewH);
        }

        ctx.restore();

        return performance.now() - begin;
    }
}
