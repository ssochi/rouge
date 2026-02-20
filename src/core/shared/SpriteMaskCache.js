import { Assets } from '../../graphics/Assets.js';

const ALPHA_THRESHOLD = 8;
const MAX_CONTOUR_POINTS = 720;

function hasCanvasShape(value) {
    return !!value && Number.isFinite(value.width) && Number.isFinite(value.height);
}

function normalizeFrames(source) {
    if (!source) return [];
    if (Array.isArray(source)) {
        return source.filter(hasCanvasShape);
    }
    return hasCanvasShape(source) ? [source] : [];
}

function analyzeFrame(canvas) {
    if (!hasCanvasShape(canvas)) return null;

    const width = canvas.width | 0;
    const height = canvas.height | 0;
    if (width <= 0 || height <= 0) return null;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const image = ctx.getImageData(0, 0, width, height).data;
    const mask = new Uint8Array(width * height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
            const idx = (rowOffset + x) * 4 + 3;
            if (image[idx] < ALPHA_THRESHOLD) continue;

            mask[rowOffset + x] = 1;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    if (maxX < minX || maxY < minY) {
        return {
            width,
            height,
            mask,
            bounds: null,
            contour: []
        };
    }

    const bounds = {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    };

    const contour = buildContour(mask, width, height, bounds);

    return {
        width,
        height,
        mask,
        bounds,
        contour
    };
}

function buildContour(mask, width, height, bounds) {
    if (!bounds) return [];

    const points = [];
    for (let y = bounds.minY; y <= bounds.maxY; y++) {
        const rowOffset = y * width;
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
            const idx = rowOffset + x;
            if (!mask[idx]) continue;

            const left = x > 0 ? mask[idx - 1] : 0;
            const right = x < width - 1 ? mask[idx + 1] : 0;
            const up = y > 0 ? mask[idx - width] : 0;
            const down = y < height - 1 ? mask[idx + width] : 0;
            if (left && right && up && down) continue;

            points.push({ x, y });
        }
    }

    if (points.length <= MAX_CONTOUR_POINTS) return points;

    const sampled = [];
    const stride = Math.ceil(points.length / MAX_CONTOUR_POINTS);
    for (let i = 0; i < points.length; i += stride) {
        sampled.push(points[i]);
    }
    return sampled;
}

function buildUnionFrame(frames) {
    if (!Array.isArray(frames) || frames.length === 0) {
        return {
            width: 0,
            height: 0,
            mask: new Uint8Array(0),
            bounds: null,
            contour: []
        };
    }

    let unionWidth = 0;
    let unionHeight = 0;
    for (const frame of frames) {
        unionWidth = Math.max(unionWidth, frame.width | 0);
        unionHeight = Math.max(unionHeight, frame.height | 0);
    }

    if (unionWidth <= 0 || unionHeight <= 0) {
        return {
            width: 0,
            height: 0,
            mask: new Uint8Array(0),
            bounds: null,
            contour: []
        };
    }

    const unionMask = new Uint8Array(unionWidth * unionHeight);
    let minX = unionWidth;
    let minY = unionHeight;
    let maxX = -1;
    let maxY = -1;

    for (const frame of frames) {
        const fMask = frame.mask;
        const fw = frame.width;
        const fh = frame.height;
        for (let y = 0; y < fh; y++) {
            const srcRow = y * fw;
            const dstRow = y * unionWidth;
            for (let x = 0; x < fw; x++) {
                if (!fMask[srcRow + x]) continue;
                const idx = dstRow + x;
                if (unionMask[idx]) continue;
                unionMask[idx] = 1;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (maxX < minX || maxY < minY) {
        return {
            width: unionWidth,
            height: unionHeight,
            mask: unionMask,
            bounds: null,
            contour: []
        };
    }

    const bounds = {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    };

    return {
        width: unionWidth,
        height: unionHeight,
        mask: unionMask,
        bounds,
        contour: buildContour(unionMask, unionWidth, unionHeight, bounds)
    };
}

export class SpriteMaskCache {
    constructor() {
        this._cache = new Map();
    }

    clear() {
        this._cache.clear();
    }

    _buildTypeData(type) {
        const source = Assets.objects[type];
        const frames = normalizeFrames(source).map(frame => analyzeFrame(frame)).filter(Boolean);
        const union = buildUnionFrame(frames);
        return {
            type,
            source,
            frames,
            union
        };
    }

    getTypeData(type) {
        const source = Assets.objects[type];
        const cached = this._cache.get(type);
        if (cached && cached.source === source) {
            return cached.data;
        }

        const data = this._buildTypeData(type);
        this._cache.set(type, {
            source,
            data
        });
        return data;
    }

    getFrameDataForObject(obj) {
        if (!obj) return null;
        const data = this.getTypeData(obj.type);
        const frames = data.frames;
        if (!frames || frames.length === 0) return null;

        const rawIndex = Number.isFinite(obj.frameIndex) ? Math.floor(obj.frameIndex) : 0;
        const frameCount = frames.length;
        const frameIndex = ((rawIndex % frameCount) + frameCount) % frameCount;
        return {
            frameIndex,
            frame: frames[frameIndex],
            union: data.union,
            frameCount
        };
    }

    getFrameWorldBounds(obj) {
        if (!obj) return null;
        const frameData = this.getFrameDataForObject(obj);
        const frameBounds = frameData?.frame?.bounds;
        if (!frameBounds) return null;

        const dx = obj.drawOffset?.x || 0;
        const dy = obj.drawOffset?.y || 0;

        return {
            x: obj.x + dx + frameBounds.minX,
            y: obj.y + dy + frameBounds.minY,
            width: frameBounds.width,
            height: frameBounds.height,
            w: frameBounds.width,
            h: frameBounds.height
        };
    }

    getUnionWorldBounds(obj) {
        if (!obj) return null;
        const data = this.getTypeData(obj.type);
        const unionBounds = data.union?.bounds;
        if (!unionBounds) return null;

        const dx = obj.drawOffset?.x || 0;
        const dy = obj.drawOffset?.y || 0;

        return {
            x: obj.x + dx + unionBounds.minX,
            y: obj.y + dy + unionBounds.minY,
            width: unionBounds.width,
            height: unionBounds.height,
            w: unionBounds.width,
            h: unionBounds.height
        };
    }
}

export const spriteMaskCache = new SpriteMaskCache();
