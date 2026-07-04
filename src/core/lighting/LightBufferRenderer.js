import { PixelOcclusionField } from './PixelOcclusionField.js';
import { FrameScratchPool } from './FrameScratchPool.js';

const TWO_PI = Math.PI * 2;
const CHEAP_CONE_SEGMENTS = 14;

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
        this.wallOcclusionField = new PixelOcclusionField();
        this.workOcclusionField = new PixelOcclusionField();
        this._scratchPool = new FrameScratchPool();
        this._fullCircleRayLut = {
            rayCount: 0,
            cos: new Float32Array(0),
            sin: new Float32Array(0)
        };
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
            const match = color.match(/rgba?\(([^)]+)\)/i);
            if (match) {
                const parts = match[1].split(',').map(v => Number.parseFloat(v.trim()));
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
        const width = Math.max(1, Math.ceil(viewportWidth * scale));
        const height = Math.max(1, Math.ceil(viewportHeight * scale));

        if (width === this.bufferWidth && height === this.bufferHeight) return;

        this.bufferWidth = width;
        this.bufferHeight = height;

        this.lightCanvas.width = width;
        this.lightCanvas.height = height;
        this.glowCanvas.width = width;
        this.glowCanvas.height = height;

        this.lightCtx.imageSmoothingEnabled = false;
        this.glowCtx.imageSmoothingEnabled = false;
        this.wallOcclusionField.ensureSize(width, height);
        this.workOcclusionField.ensureSize(width, height);
    }

    _rasterizeBlockers(field, blockers, viewX, viewY, scale) {
        for (const blocker of blockers) {
            if (!blocker) continue;
            if (blocker.kind === 'sprite') {
                field.rasterizeSpriteMask(blocker, viewX, viewY, scale, blocker.ownerId | 0);
                continue;
            }

            const rect = toBufferRect(blocker);
            if (!rect) continue;
            field.rasterizeWorldRect(rect, viewX, viewY, scale, blocker.ownerId | 0);
        }
    }

    _buildOcclusionField(field, blockers, viewX, viewY, scale) {
        field.clear();
        this._rasterizeBlockers(field, blockers, viewX, viewY, scale);
    }

    _ensureFullCircleRayLut(rayCount) {
        if (this._fullCircleRayLut.rayCount === rayCount && this._fullCircleRayLut.cos.length === rayCount + 1) {
            return this._fullCircleRayLut;
        }

        const size = rayCount + 1;
        const cos = new Float32Array(size);
        const sin = new Float32Array(size);
        const step = TWO_PI / rayCount;
        for (let i = 0; i <= rayCount; i++) {
            const angle = step * i;
            cos[i] = Math.cos(angle);
            sin[i] = Math.sin(angle);
        }

        this._fullCircleRayLut = { rayCount, cos, sin };
        return this._fullCircleRayLut;
    }

    _computeVisibilityPolygon(field, light, rayCount, viewX, viewY, scale, includeContourPoints = false, fullCircleRayLut = null) {
        const contourPoints = includeContourPoints ? [] : null;
        const contourSeen = includeContourPoints ? new Set() : null;

        const ox = (light.x - viewX) * scale;
        const oy = (light.y - viewY) * scale;
        const maxDist = Math.max(1, light.radius * scale);

        const isCone = light.coneAngle > 0 && Number.isFinite(light.coneDirection);
        let startAngle;
        let totalAngle;

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

        if (!isCone && fullCircleRayLut && fullCircleRayLut.rayCount === rayCount) {
            const startCos = Math.cos(startAngle);
            const startSin = Math.sin(startAngle);

            for (let i = 0; i <= rayCount; i++) {
                const baseCos = fullCircleRayLut.cos[i];
                const baseSin = fullCircleRayLut.sin[i];
                const dx = baseCos * startCos - baseSin * startSin;
                const dy = baseSin * startCos + baseCos * startSin;

                const result = field.traceRay(ox, oy, dx, dy, maxDist);
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
        } else {
            for (let i = 0; i <= rayCount; i++) {
                const angle = startAngle + angleStep * Math.min(i, rayCount);
                const dx = Math.cos(angle);
                const dy = Math.sin(angle);

                const result = field.traceRay(ox, oy, dx, dy, maxDist);
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
        }

        if (isCone) {
            points.push({ x: ox, y: oy });
        }

        return { points, contourPoints };
    }

    _computeCheapConePolygon(light, viewX, viewY, scale, segmentCount = CHEAP_CONE_SEGMENTS) {
        if (!(light.coneAngle > 0) || !Number.isFinite(light.coneDirection)) return null;

        const ox = (light.x - viewX) * scale;
        const oy = (light.y - viewY) * scale;
        const radius = Math.max(1, light.radius * scale);
        const startAngle = light.coneDirection - light.coneAngle * 0.5;
        const step = light.coneAngle / Math.max(1, segmentCount);
        const points = [{ x: ox, y: oy }];

        for (let i = 0; i <= segmentCount; i++) {
            const angle = startAngle + step * i;
            points.push({
                x: ox + Math.cos(angle) * radius,
                y: oy + Math.sin(angle) * radius
            });
        }

        points.push({ x: ox, y: oy });
        return points;
    }

    _getUnshadowedPolygon(light, viewX, viewY, scale) {
        return light.coneAngle > 0 ? this._computeCheapConePolygon(light, viewX, viewY, scale) : null;
    }

    _clipByPolygon(ctx, points) {
        if (!points || points.length < 3) return false;

        ctx.beginPath();
        const first = points[0];
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.clip();
        return true;
    }

    _drawLightBands(ctx, x, y, radius, color, intensity, _steps) {
        const rgb = this._parseColor(color);
        const r = Math.max(1, Math.round(radius));
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity.toFixed(4)})`);
        gradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.55).toFixed(4)})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TWO_PI);
        ctx.fill();
    }

    _drawGlowBands(ctx, x, y, radius, color, intensity, _steps) {
        const rgb = this._parseColor(color);
        const r = Math.max(1, Math.round(radius * 1.1));
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.3).toFixed(4)})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(intensity * 0.12).toFixed(4)})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        ctx.fillStyle = gradient;
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
        for (const point of points) {
            const px = Math.round(point.x) - half;
            const py = Math.round(point.y) - half;
            ctx.fillRect(px, py, localSize, localSize);
        }
        ctx.restore();
    }

    _drawSinglePass({ lctx, gctx, polygon, contourPoints, lx, ly, radius, light, intensity, gradientSteps, glowSteps, enableContourGlow }) {
        lctx.save();
        if (polygon) this._clipByPolygon(lctx, polygon);
        lctx.globalCompositeOperation = 'lighter';
        this._drawLightBands(lctx, lx, ly, radius, light.color, intensity, gradientSteps);
        lctx.restore();

        gctx.save();
        if (polygon) this._clipByPolygon(gctx, polygon);
        gctx.globalCompositeOperation = 'lighter';
        this._drawGlowBands(gctx, lx, ly, radius, light.color, intensity, glowSteps);
        gctx.restore();

        if (enableContourGlow) {
            this._drawContourGlow(gctx, contourPoints, radius, light.color, intensity);
        }
    }

    _prepareWallField(shadowBuilder, centerX, centerY, radius, viewX, viewY, scale) {
        const wallBlockers = this._scratchPool.takeArray();
        shadowBuilder.queryWallsInRadius(centerX, centerY, radius, Infinity, null, wallBlockers);
        this._buildOcclusionField(this.wallOcclusionField, wallBlockers, viewX, viewY, scale);
        return wallBlockers.length > 0;
    }

    _buildCombinedField(shadowBuilder, light, viewX, viewY, scale, out = []) {
        out.length = 0;
        const ignoreOwner = light.ignoreSelfShadow ? light.owner : null;
        const maxBlockers = this.config.maxBlockersPerLight;

        shadowBuilder.queryObjectsInRadius(light.x, light.y, light.radius, maxBlockers, ignoreOwner, out);

        const remaining = Number.isFinite(maxBlockers)
            ? Math.max(0, maxBlockers - out.length)
            : Infinity;
        if (remaining > 0) {
            const dynamicBlockers = this._scratchPool.takeArray();
            shadowBuilder.queryDynamicInRadius(light.x, light.y, light.radius, remaining, ignoreOwner, dynamicBlockers);
            for (const blocker of dynamicBlockers) out.push(blocker);
        }

        this.workOcclusionField.copyFrom(this.wallOcclusionField);
        this._rasterizeBlockers(this.workOcclusionField, out, viewX, viewY, scale);
        return out.length > 0;
    }

    render({ ctx, camera, viewportWidth, viewportHeight, lights, shadowBuilder, screenScale }) {
        const begin = performance.now();

        const padding = 128;
        const bufferScale = this.config.bufferScale;
        const ss = screenScale || 1;

        const bufferSnapX = Math.floor(camera.x * bufferScale) / bufferScale;
        const bufferSnapY = Math.floor(camera.y * bufferScale) / bufferScale;
        const viewX = bufferSnapX - padding;
        const viewY = bufferSnapY - padding;

        const screenSnapX = Math.floor(camera.x * ss) / ss;
        const screenSnapY = Math.floor(camera.y * ss) / ss;

        const viewW = Math.ceil(viewportWidth) + 1 + padding * 2;
        const viewH = Math.ceil(viewportHeight) + 1 + padding * 2;

        this._ensureBufferSize(viewW, viewH);
        this._scratchPool.reset();

        const rayCount = this.config.shadowRays;
        const fullCircleRayLut = this._ensureFullCircleRayLut(rayCount);
        const gradientSteps = this.config.gradientSteps;
        const glowSteps = this.config.glowSteps;
        const enableContourGlow = this.config.enableContourGlow === true;

        const ambient = clampByte(this.config.ambientBrightness);
        const ambientOverride = this.ambientOverride || null;

        const lctx = this.lightCtx;
        lctx.globalCompositeOperation = 'source-over';
        lctx.globalAlpha = 1;
        // 环境光：默认全局灰度；地牢等场景可用 ambientOverride 压暗并染色
        lctx.fillStyle = ambientOverride
            ? `rgb(${clampByte(ambientOverride.r)}, ${clampByte(ambientOverride.g)}, ${clampByte(ambientOverride.b)})`
            : `rgb(${ambient}, ${ambient}, ${ambient})`;
        lctx.fillRect(0, 0, this.bufferWidth, this.bufferHeight);

        const gctx = this.glowCtx;
        gctx.globalCompositeOperation = 'source-over';
        gctx.globalAlpha = 1;
        gctx.clearRect(0, 0, this.bufferWidth, this.bufferHeight);

        const hasShadowedLights = !!shadowBuilder && lights.some(light => light.shadowMode && light.shadowMode !== 'none');
        const shadowQueryRadius = Math.hypot(viewW, viewH) * 0.5 + 64;
        const shadowCenterX = viewX + viewW * 0.5;
        const shadowCenterY = viewY + viewH * 0.5;
        const wallFieldHasBlockers = hasShadowedLights
            ? this._prepareWallField(shadowBuilder, shadowCenterX, shadowCenterY, shadowQueryRadius, viewX, viewY, bufferScale)
            : false;

        for (const light of lights) {
            const lx = (light.x - viewX) * bufferScale;
            const ly = (light.y - viewY) * bufferScale;
            const radius = Math.max(1, light.radius * bufferScale);

            if (lx + radius < 0 || lx - radius > this.bufferWidth || ly + radius < 0 || ly - radius > this.bufferHeight) {
                continue;
            }

            const shadowMode = light.shadowMode || 'none';
            const wantsCone = light.coneAngle > 0 && Number.isFinite(light.coneDirection);

            if (!shadowBuilder || shadowMode === 'none') {
                const polygon = this._getUnshadowedPolygon(light, viewX, viewY, bufferScale);
                this._drawSinglePass({
                    lctx,
                    gctx,
                    polygon,
                    contourPoints: null,
                    lx,
                    ly,
                    radius,
                    light,
                    intensity: light.intensity,
                    gradientSteps,
                    glowSteps,
                    enableContourGlow: false
                });
                continue;
            }

            if (shadowMode === 'walls') {
                let polygon = null;
                let contourPoints = null;

                if (wallFieldHasBlockers) {
                    const result = this._computeVisibilityPolygon(
                        this.wallOcclusionField,
                        light,
                        rayCount,
                        viewX,
                        viewY,
                        bufferScale,
                        enableContourGlow,
                        fullCircleRayLut
                    );
                    polygon = result.points;
                    contourPoints = result.contourPoints;
                } else if (wantsCone) {
                    polygon = this._getUnshadowedPolygon(light, viewX, viewY, bufferScale);
                }

                this._drawSinglePass({
                    lctx,
                    gctx,
                    polygon,
                    contourPoints,
                    lx,
                    ly,
                    radius,
                    light,
                    intensity: light.intensity,
                    gradientSteps,
                    glowSteps,
                    enableContourGlow
                });
                continue;
            }

            const extraBlockers = this._scratchPool.takeArray();
            const hasExtraBlockers = this._buildCombinedField(shadowBuilder, light, viewX, viewY, bufferScale, extraBlockers);

            if (!hasExtraBlockers) {
                let polygon = null;
                let contourPoints = null;

                if (wallFieldHasBlockers) {
                    const result = this._computeVisibilityPolygon(
                        this.wallOcclusionField,
                        light,
                        rayCount,
                        viewX,
                        viewY,
                        bufferScale,
                        enableContourGlow,
                        fullCircleRayLut
                    );
                    polygon = result.points;
                    contourPoints = result.contourPoints;
                } else if (wantsCone) {
                    polygon = this._getUnshadowedPolygon(light, viewX, viewY, bufferScale);
                }

                this._drawSinglePass({
                    lctx,
                    gctx,
                    polygon,
                    contourPoints,
                    lx,
                    ly,
                    radius,
                    light,
                    intensity: light.intensity,
                    gradientSteps,
                    glowSteps,
                    enableContourGlow
                });
                continue;
            }

            if (light.disableAmbientPointSplit === true) {
                const result = this._computeVisibilityPolygon(
                    this.workOcclusionField,
                    light,
                    rayCount,
                    viewX,
                    viewY,
                    bufferScale,
                    enableContourGlow,
                    fullCircleRayLut
                );

                this._drawSinglePass({
                    lctx,
                    gctx,
                    polygon: result.points,
                    contourPoints: result.contourPoints,
                    lx,
                    ly,
                    radius,
                    light,
                    intensity: light.intensity,
                    gradientSteps,
                    glowSteps,
                    enableContourGlow
                });
                continue;
            }

            let ambientPolygon = null;
            if (wallFieldHasBlockers) {
                ambientPolygon = this._computeVisibilityPolygon(
                    this.wallOcclusionField,
                    light,
                    rayCount,
                    viewX,
                    viewY,
                    bufferScale,
                    false,
                    fullCircleRayLut
                ).points;
            } else if (wantsCone) {
                ambientPolygon = this._getUnshadowedPolygon(light, viewX, viewY, bufferScale);
            }

            const pointResult = this._computeVisibilityPolygon(
                this.workOcclusionField,
                light,
                rayCount,
                viewX,
                viewY,
                bufferScale,
                enableContourGlow,
                fullCircleRayLut
            );

            lctx.save();
            if (ambientPolygon) this._clipByPolygon(lctx, ambientPolygon);
            lctx.globalCompositeOperation = 'lighter';
            this._drawLightBands(lctx, lx, ly, radius, light.color, light.intensity * 0.7, gradientSteps);
            lctx.restore();

            lctx.save();
            if (pointResult.points) this._clipByPolygon(lctx, pointResult.points);
            lctx.globalCompositeOperation = 'lighter';
            this._drawLightBands(lctx, lx, ly, radius, light.color, light.intensity * 0.3, gradientSteps);
            lctx.restore();

            gctx.save();
            if (pointResult.points) this._clipByPolygon(gctx, pointResult.points);
            gctx.globalCompositeOperation = 'lighter';
            this._drawGlowBands(gctx, lx, ly, radius, light.color, light.intensity, glowSteps);
            gctx.restore();

            if (enableContourGlow) {
                this._drawContourGlow(gctx, pointResult.contourPoints, radius, light.color, light.intensity);
            }
        }

        const padBuf = Math.ceil(padding * bufferScale);
        const snapOffsetX = (screenSnapX - bufferSnapX) * bufferScale;
        const snapOffsetY = (screenSnapY - bufferSnapY) * bufferScale;

        const srcX = padBuf + snapOffsetX;
        const srcY = padBuf + snapOffsetY;
        const srcW = this.bufferWidth - padBuf * 2;
        const srcH = this.bufferHeight - padBuf * 2;
        const dstX = screenSnapX;
        const dstY = screenSnapY;
        const dstW = viewW - padding * 2;
        const dstH = viewH - padding * 2;

        ctx.save();
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
