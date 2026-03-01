import { spriteMaskCache } from '../shared/SpriteMaskCache.js';

function toRect(raw) {
    if (!raw) return null;
    const width = raw.width ?? raw.w;
    const height = raw.height ?? raw.h;
    if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y) || !Number.isFinite(width) || !Number.isFinite(height)) {
        return null;
    }

    if (width <= 0 || height <= 0) return null;

    return {
        x: Math.floor(raw.x),
        y: Math.floor(raw.y),
        w: Math.ceil(width),
        h: Math.ceil(height)
    };
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash;
}

function mix(hash, value) {
    let v = value | 0;
    hash ^= v + 0x9e3779b9 + ((hash << 6) | 0) + (hash >>> 2);
    return hash | 0;
}

function dist2ToRect(x, y, entry) {
    const w = entry.w ?? entry.width ?? 0;
    const h = entry.h ?? entry.height ?? 0;
    const cx = entry.x + w * 0.5;
    const cy = entry.y + h * 0.5;
    const dx = cx - x;
    const dy = cy - y;
    return dx * dx + dy * dy;
}

function transformPoint(px, py, pivotX, pivotY, originX, originY, rotation, flipX) {
    const signX = flipX ? -1 : 1;
    const dx = (px - originX) * signX;
    const dy = py - originY;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return {
        x: pivotX + dx * cos - dy * sin,
        y: pivotY + dx * sin + dy * cos
    };
}

function computeSpriteAabb(bounds, pivotX, pivotY, originX, originY, rotation, flipX) {
    if (!bounds) return null;
    const minX = bounds.minX;
    const minY = bounds.minY;
    const maxX = bounds.maxX + 1;
    const maxY = bounds.maxY + 1;

    const p1 = transformPoint(minX, minY, pivotX, pivotY, originX, originY, rotation, flipX);
    const p2 = transformPoint(maxX, minY, pivotX, pivotY, originX, originY, rotation, flipX);
    const p3 = transformPoint(maxX, maxY, pivotX, pivotY, originX, originY, rotation, flipX);
    const p4 = transformPoint(minX, maxY, pivotX, pivotY, originX, originY, rotation, flipX);

    const worldMinX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const worldMaxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const worldMinY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const worldMaxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    const x = Math.floor(worldMinX);
    const y = Math.floor(worldMinY);
    const w = Math.max(1, Math.ceil(worldMaxX) - x);
    const h = Math.max(1, Math.ceil(worldMaxY) - y);
    return { x, y, w, h };
}

export class ShadowCasterBuilder {
    constructor() {
        this.entries = [];
        this.staticEntries = [];
        this.dynamicEntries = [];
        this._lastHash = null;
        this._ownerIds = new WeakMap();
        this._nextOwnerId = 1;
    }

    _isDoor(obj) {
        const type = obj?.type;
        const baseType = obj?.baseType;
        return type === 'door_h' || type === 'door_v' || baseType === 'door_h' || baseType === 'door_v';
    }

    _getOwnerId(owner) {
        if (!owner) return 0;
        let id = this._ownerIds.get(owner);
        if (!id) {
            id = this._nextOwnerId++;
            this._ownerIds.set(owner, id);
        }
        return id;
    }

    _shouldBlock(obj) {
        if (!obj || obj.isBroken) return false;
        if (obj.blocksLight === false) return false;
        if (this._isDoor(obj) && obj.isOpen) return false;
        return true;
    }

    _computeHash(walls = [], breakableObjects = []) {
        let hash = 0x811c9dc5;
        hash = mix(hash, walls.length);
        hash = mix(hash, breakableObjects.length);

        for (const wall of walls) {
            if (!wall) continue;
            hash = mix(hash, wall.x | 0);
            hash = mix(hash, wall.y | 0);
            hash = mix(hash, wall.w | 0);
            hash = mix(hash, wall.h | 0);
        }

        for (const obj of breakableObjects) {
            if (!obj) continue;
            hash = mix(hash, obj.x | 0);
            hash = mix(hash, obj.y | 0);
            hash = mix(hash, obj.isBroken ? 1 : 0);
            hash = mix(hash, obj.isOpen ? 1 : 0);
            hash = mix(hash, obj.blocksLight === false ? 0 : 1);
            hash = mix(hash, obj.wallMask | 0);
            hash = mix(hash, obj.frameIndex | 0);
            hash = mix(hash, hashString(obj.type || ''));
        }

        return hash >>> 0;
    }

    _pushRectEntry(target, owner, ownerId, rawRect) {
        const rect = toRect(rawRect);
        if (!rect) return;
        target.push({
            kind: 'rect',
            ...rect,
            owner,
            ownerId
        });
    }

    _pushSpriteEntry(target, owner, ownerId, {
        mask,
        maskWidth,
        maskHeight,
        localBounds,
        pivotX,
        pivotY,
        originX = 0,
        originY = 0,
        rotation = 0,
        flipX = false
    }) {
        if (!mask || !Number.isFinite(maskWidth) || !Number.isFinite(maskHeight)) return;
        if (!Number.isFinite(pivotX) || !Number.isFinite(pivotY)) return;

        const bounds = computeSpriteAabb(
            localBounds,
            pivotX,
            pivotY,
            originX,
            originY,
            rotation,
            flipX
        );
        if (!bounds) return;

        target.push({
            kind: 'sprite',
            ...bounds,
            pivotX,
            pivotY,
            originX,
            originY,
            rotation,
            flipX,
            mask,
            maskWidth,
            maskHeight,
            localBounds,
            owner,
            ownerId
        });
    }

    _rebuildStaticEntries(walls = [], breakableObjects = []) {
        this.staticEntries.length = 0;

        for (const wall of walls) {
            this._pushRectEntry(this.staticEntries, null, 0, {
                x: wall.x,
                y: wall.y,
                width: wall.w,
                height: wall.h
            });
        }

        for (const obj of breakableObjects) {
            if (!this._shouldBlock(obj)) continue;

            const ownerId = this._getOwnerId(obj);
            const isDoor = this._isDoor(obj);
            if (!isDoor) {
                const frameData = spriteMaskCache.getFrameDataForObject(obj);
                const frame = frameData?.frame || null;
                const bounds = frame?.bounds || null;
                if (bounds) {
                    const drawOffsetX = obj.drawOffset?.x || 0;
                    const drawOffsetY = obj.drawOffset?.y || 0;
                    const pivotX = obj.x + drawOffsetX;
                    const pivotY = obj.y + drawOffsetY;
                    this._pushSpriteEntry(this.staticEntries, obj, ownerId, {
                        mask: frame.mask,
                        maskWidth: frame.width,
                        maskHeight: frame.height,
                        localBounds: bounds,
                        pivotX,
                        pivotY,
                        originX: 0,
                        originY: 0,
                        rotation: 0,
                        flipX: false
                    });
                    continue;
                }
            }

            const hurtboxes = obj.getHurtboxes
                ? obj.getHurtboxes()
                : [obj.getHurtbox?.(), obj.getHitbox?.()].filter(Boolean);
            for (const hb of hurtboxes) {
                this._pushRectEntry(this.staticEntries, obj, ownerId, hb);
            }
        }
    }

    _rebuildDynamicEntries(dynamicOccluders = []) {
        this.dynamicEntries.length = 0;
        if (!Array.isArray(dynamicOccluders) || dynamicOccluders.length === 0) return;

        for (const group of dynamicOccluders) {
            const owner = group?.owner || null;
            const occluders = Array.isArray(group?.occluders) ? group.occluders : [];
            if (occluders.length === 0) continue;

            const ownerId = this._getOwnerId(owner);
            for (const occluder of occluders) {
                if (!occluder) continue;

                if (occluder.kind === 'rect') {
                    this._pushRectEntry(this.dynamicEntries, owner, ownerId, occluder);
                    continue;
                }

                const frameData = spriteMaskCache.getFrameDataForCanvas(
                    occluder.sprite,
                    occluder.forceMaskRefresh === true
                );
                const frame = frameData?.frame || null;
                const bounds = frame?.bounds || null;
                if (!frame || !bounds) continue;

                this._pushSpriteEntry(this.dynamicEntries, owner, ownerId, {
                    mask: frame.mask,
                    maskWidth: frame.width,
                    maskHeight: frame.height,
                    localBounds: bounds,
                    pivotX: occluder.pivotX,
                    pivotY: occluder.pivotY,
                    originX: occluder.originX || 0,
                    originY: occluder.originY || 0,
                    rotation: occluder.rotation || 0,
                    flipX: occluder.flipX === true
                });
            }
        }
    }

    rebuildIfNeeded(walls = [], breakableObjects = [], dynamicOccluders = []) {
        const nextHash = this._computeHash(walls, breakableObjects);
        const staticChanged = nextHash !== this._lastHash;
        if (staticChanged) {
            this._lastHash = nextHash;
            this._rebuildStaticEntries(walls, breakableObjects);
        }

        this._rebuildDynamicEntries(dynamicOccluders);

        this.entries.length = 0;
        this.entries.push(...this.staticEntries);
        this.entries.push(...this.dynamicEntries);

        return staticChanged;
    }

    query(x, y, radius, maxEntries = Infinity, ignoreOwner = null) {
        if (Number.isFinite(maxEntries) && maxEntries <= 0) return [];

        const left = x - radius;
        const right = x + radius;
        const top = y - radius;
        const bottom = y + radius;

        const result = [];
        for (const entry of this.entries) {
            if (entry.x > right || entry.x + entry.w < left || entry.y > bottom || entry.y + entry.h < top) {
                continue;
            }
            if (ignoreOwner && entry.owner === ignoreOwner) continue;
            result.push(entry);
        }

        if (Number.isFinite(maxEntries) && result.length > maxEntries) {
            result.sort((a, b) => dist2ToRect(x, y, a) - dist2ToRect(x, y, b));
            result.length = maxEntries;
        }

        return result;
    }
}
