import { PixelOcclusionField } from './PixelOcclusionField.js';

const TWO_PI = Math.PI * 2;

function clampByte(v) {
    return Math.max(0, Math.min(255, Math.round(v)));
}

function toBufferRect(entry) {
    if (!entry) return null;
    const width = entry.w ?? entry.width;
    const height = entry.h ?? entry.height;
    if (!Number.isFinite(entry.x) || !Number.isFinite(entry.y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        return null;
    }
    if (width <= 0 || height <= 0) return null;
    return {
        x: entry.x,
        y: entry.y,
        width,
        height
    };
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
        this.occlusionField = new PixelOcclusionField();
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
        this.occlusionField.ensureSize(w, h);
    }

    _buildOcclusionField(blockers, viewX, viewY, scale) {
        this.occlusionField.clear();
        for (const blocker of blockers) {
            if (!blocker) continue;
            if (blocker.kind === 'sprite') {
                this.occlusionField.rasterizeSpriteMask(blocker, viewX, viewY, scale, blocker.ownerId | 0);
                continue;
            }

            const rect = toBufferRect(blocker);
            if (!rect) continue;
            this.occlusionField.rasterizeWorldRect(rect, viewX, viewY, scale, blocker.ownerId | 0);
        }
    }

    _computeVisibilityPolygon(light, rayCount, viewX, viewY, scale, includeContourPoints = false) {
        const contourPoints = includeContourPoints ? [] : null;
        const contourSeen = includeContourPoints ? new Set() : null;

        const ox = (light.x - viewX) * scale;
        const oy = (light.y - viewY) * scale;
        const maxDist = Math.max(1, light.radius * scale);

        const isCone = light.coneAngle > 0 && Number.isFinite(light.coneDirection);
        let startAngle, totalAngle;
        if (isCone) {
            startAngle = light.coneDirection - light.coneAngle * 0.5;
            totalAngle = light.coneAngle;
        } else {
            totalAngle = TWO_PI;
            const angleStep = totalAngle / rayCount;
            startAngle = ((light.x * 0.0017 + light.y * 0.0023) % 1) * angleStep;
        }

        const angleStep = totalAngle / rayCount;
        const points = [];

        if (isCone) {
            points.push({ x: ox, y: oy });
        }

        for (let i = 0; i <= rayCount; i++) {
            const angle = startAngle + angleStep * Math.min(i, rayCount);
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            const result = this.occlusionField.traceRay(ox, oy, dx, dy, maxDist);
            points.push({ x: result.x, y: result.y });

            if (includeContourPoints && result.hit && result.ownerId > 0) {
                const qx = Math.floor(result.x);
                const qy = Math.floor(result.y);
                const key = `${qx},${qy}`;
                if (!contourSeen.has(key)) {
                    contourSeen.add(key);
                    contourPoints.push({ x: qx, y: qy });
                }
            }
        }

        if (isCone) {
            points.push({ x: ox, y: oy });
        }

        return { points, contourPoints };
    }

    _clipByPolygon(ctx, points) {
        if (!points || points.length < 3) return false;

        ctx.beginPath();
        const first = points[0];
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < points.length; i++) {
            const p = points[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.clip();
        return true;
    }

    _drawLightBands(ctx, x, y, radius, color, intensity, _steps) {
        const rgb = this._parseColor(color);
        const r = Math.max(1, Math.round(radius));
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity.toFixed(4)})`);
        grad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.55).toFixed(4)})`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TWO_PI);
        ctx.fill();
    }

    _drawGlowBands(ctx, x, y, radius, color, intensity, _steps) {
        const rgb = this._parseColor(color);
        const r = Math.max(1, Math.round(radius * 1.1));
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.3).toFixed(4)})`);
        grad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.12).toFixed(4)})`);
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TWO_PI);
        ctx.fill();
    }

    _drawContourGlow(ctx, points, radius, color, intensity) {
        if (!points || points.length === 0) return;

        const rgb = this._parseColor(color);
        const localSize = Math.max(1, Math.round(radius * 0.08));
        const half = Math.floor(localSize / 2);
        const alpha = Math.min(0.65, Math.max(0.05, intensity * 0.28));

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(4)})`;
        for (const p of points) {
            const px = Math.round(p.x) - half;
            const py = Math.round(p.y) - half;
            ctx.fillRect(px, py, localSize, localSize);
        }
        ctx.restore();
    }

    render({ ctx, camera, viewportWidth, viewportHeight, lights, shadowBuilder, screenScale }) {
        const begin = performance.now();

        const PADDING = 128;
        const bufferScale = this.config.bufferScale;
        const ss = screenScale || 1;

        // Snap view origin to buffer-pixel grid for internal consistency.
        // This ensures world-to-buffer transforms only shift by whole buffer pixels,
        // eliminating sub-pixel jitter in shadow rasterization and ray tracing.
        const bufferSnapX = Math.floor(camera.x * bufferScale) / bufferScale;
        const bufferSnapY = Math.floor(camera.y * bufferScale) / bufferScale;
        const viewX = bufferSnapX - PADDING;
        const viewY = bufferSnapY - PADDING;

        // Screen-aligned camera (same formula as main Renderer.js).
        const screenSnapX = Math.floor(camera.x * ss) / ss;
        const screenSnapY = Math.floor(camera.y * ss) / ss;

        const viewW = Math.ceil(viewportWidth) + 1 + PADDING * 2;
        const viewH = Math.ceil(viewportHeight) + 1 + PADDING * 2;

        this._ensureBufferSize(viewW, viewH);

        const rayCount = this.config.shadowRays;
        const gradientSteps = this.config.gradientSteps;
        const glowSteps = this.config.glowSteps;
        const enableContourGlow = this.config.enableContourGlow === true;

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

            const isCone = light.coneAngle > 0;
            const shadowMask = light.shadowMask === 'walls' ? 'walls' : 'all';
            const disableAmbientPointSplit = light.disableAmbientPointSplit === true;
            const blockWalls = light.blockWalls !== false;
            const needsObjectShadows = light.castsShadows === true && shadowMask === 'all';
            const needsShadowQuery = !!shadowBuilder && (blockWalls || needsObjectShadows);

            // Query all blockers once.
            let allBlockers = [];
            if (needsShadowQuery) {
                allBlockers = shadowBuilder.query(
                    light.x,
                    light.y,
                    light.radius,
                    this.config.maxBlockersPerLight,
                    light.ignoreSelfShadow ? light.owner : null
                );
            }

            // Separate wall/door blockers from furniture/object blockers.
            // ownerId === 0 = world geometry walls; breakable walls/doors have ownerId > 0
            // but their owner.type starts with 'wall' or 'door'.
            const wallBlockers = allBlockers.filter(b => {
                if (b.ownerId === 0) return true;
                const t = b.owner?.type || '';
                return t.startsWith('wall') || t.startsWith('door');
            });
            if (!blockWalls) {
                wallBlockers.length = 0;
            }
            if (shadowMask === 'walls' || !needsObjectShadows) {
                // Wall-only occlusion, or lights that do not require object shadowing.
                allBlockers = wallBlockers;
            }
            const hasObjectBlockers =
                !disableAmbientPointSplit &&
                needsObjectShadows &&
                (allBlockers.length > wallBlockers.length);
            const singlePassBlockers = (needsObjectShadows && shadowMask === 'all') ? allBlockers : wallBlockers;

            if (!hasObjectBlockers) {
                // No object blockers nearby — ambient and point polygons are identical.
                // Render once at full intensity (70% + 30% = 100%).
                let polygon = null;
                let contourPoints = null;
                const hasBlockers = singlePassBlockers.length > 0;

                if (hasBlockers || isCone) {
                    if (hasBlockers) {
                        this._buildOcclusionField(singlePassBlockers, viewX, viewY, bufferScale);
                    } else {
                        this.occlusionField.clear();
                    }
                    const result = this._computeVisibilityPolygon(
                        light, rayCount, viewX, viewY, bufferScale, enableContourGlow
                    );
                    polygon = result.points;
                    contourPoints = result.contourPoints;
                }

                lctx.save();
                if (polygon) this._clipByPolygon(lctx, polygon);
                lctx.globalCompositeOperation = 'lighter';
                this._drawLightBands(lctx, lx, ly, rr, light.color, light.intensity, gradientSteps);
                lctx.restore();

                gctx.save();
                if (polygon) this._clipByPolygon(gctx, polygon);
                gctx.globalCompositeOperation = 'lighter';
                this._drawGlowBands(gctx, lx, ly, rr, light.color, light.intensity, glowSteps);
                gctx.restore();

                if (enableContourGlow) {
                    this._drawContourGlow(gctx, contourPoints, rr, light.color, light.intensity);
                }
            } else {
                // Object blockers present — two-pass rendering.

                // --- Ambient pass (70%): only walls block ---
                let ambientPoly = null;
                const hasWalls = wallBlockers.length > 0;

                if (hasWalls || isCone) {
                    if (hasWalls) {
                        this._buildOcclusionField(wallBlockers, viewX, viewY, bufferScale);
                    } else {
                        this.occlusionField.clear();
                    }
                    ambientPoly = this._computeVisibilityPolygon(
                        light, rayCount, viewX, viewY, bufferScale, false
                    ).points;
                }

                lctx.save();
                if (ambientPoly) this._clipByPolygon(lctx, ambientPoly);
                lctx.globalCompositeOperation = 'lighter';
                this._drawLightBands(lctx, lx, ly, rr, light.color, light.intensity * 0.7, gradientSteps);
                lctx.restore();

                // --- Point pass (30%): walls + objects block ---
                let pointPoly = null;
                let contourPoints = null;

                this._buildOcclusionField(allBlockers, viewX, viewY, bufferScale);
                const result = this._computeVisibilityPolygon(
                    light, rayCount, viewX, viewY, bufferScale, enableContourGlow
                );
                pointPoly = result.points;
                contourPoints = result.contourPoints;

                lctx.save();
                if (pointPoly) this._clipByPolygon(lctx, pointPoly);
                lctx.globalCompositeOperation = 'lighter';
                this._drawLightBands(lctx, lx, ly, rr, light.color, light.intensity * 0.3, gradientSteps);
                lctx.restore();

                // Glow follows point light (all blockers).
                gctx.save();
                if (pointPoly) this._clipByPolygon(gctx, pointPoly);
                gctx.globalCompositeOperation = 'lighter';
                this._drawGlowBands(gctx, lx, ly, rr, light.color, light.intensity, glowSteps);
                gctx.restore();

                if (enableContourGlow) {
                    this._drawContourGlow(gctx, contourPoints, rr, light.color, light.intensity);
                }
            }
        }

        // Composite light buffer back to main canvas.
        // Compensate for offset between buffer-pixel-snapped and screen-snapped camera
        // so the light layer aligns perfectly with the scene.
        const padBuf = Math.ceil(PADDING * bufferScale);
        // Convert from screen-snap world space to buffer source pixels.
        // Sign must be (screen - buffer): we sample a later source region when
        // destination starts from a later snapped world origin.
        const snapOffsetX = (screenSnapX - bufferSnapX) * bufferScale;
        const snapOffsetY = (screenSnapY - bufferSnapY) * bufferScale;

        const srcX = padBuf + snapOffsetX;
        const srcY = padBuf + snapOffsetY;
        const srcW = this.bufferWidth - padBuf * 2;
        const srcH = this.bufferHeight - padBuf * 2;
        const dstX = screenSnapX;
        const dstY = screenSnapY;
        const dstW = viewW - PADDING * 2;
        const dstH = viewH - PADDING * 2;

        ctx.save();
        // Use bilinear filtering to smooth sub-buffer-pixel offset from snap compensation.
        // The light buffer content is soft gradients, so interpolation is imperceptible.
        ctx.imageSmoothingEnabled = true;

        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 1;
        ctx.drawImage(this.lightCanvas, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);

        const glowStrength = this.config.glowStrength || 0;
        if (glowStrength > 0) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = glowStrength;
            ctx.drawImage(this.glowCanvas, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
        }

        ctx.restore();

        return performance.now() - begin;
    }
}
