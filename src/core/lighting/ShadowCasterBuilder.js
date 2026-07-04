import { spriteMaskCache } from '../shared/SpriteMaskCache.js';
import { OccluderSpatialIndex } from './OccluderSpatialIndex.js';

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

function transformPoint(px, py, pivotX, pivotY, originX, originY, cos, sin, flipX) {
    const signX = flipX ? -1 : 1;
    const dx = (px - originX) * signX;
    const dy = py - originY;
    return {
        x: pivotX + dx * cos - dy * sin,
        y: pivotY + dx * sin + dy * cos
    };
}

function computeSpriteAabb(bounds, pivotX, pivotY, originX, originY, rotation, flipX) {
    if (!bounds) return null;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const minX = bounds.minX;
    const minY = bounds.minY;
    const maxX = bounds.maxX + 1;
    const maxY = bounds.maxY + 1;

    const p1 = transformPoint(minX, minY, pivotX, pivotY, originX, originY, cos, sin, flipX);
    const p2 = transformPoint(maxX, minY, pivotX, pivotY, originX, originY, cos, sin, flipX);
    const p3 = transformPoint(maxX, maxY, pivotX, pivotY, originX, originY, cos, sin, flipX);
    const p4 = transformPoint(minX, maxY, pivotX, pivotY, originX, originY, cos, sin, flipX);

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
        this.staticWallEntries = [];
        this.staticObjectEntries = [];
        this.dynamicEntries = [];
        this._dynamicEntryPool = [];
        this._dynamicEntryCount = 0;
        this._lastHash = null;
        this._ownerIds = new WeakMap();
        this._nextOwnerId = 1;
        this._staticSpatialIndex = new OccluderSpatialIndex(64);
        this._wallSpatialIndex = new OccluderSpatialIndex(64);
        this._objectSpatialIndex = new OccluderSpatialIndex(64);
        this._staticQueryScratch = [];
        this._wallQueryScratch = [];
        this._objectQueryScratch = [];
        this._dynamicMaskVersionState = new WeakMap();
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
            if (!this._shouldBlock(obj)) continue;
            hash = mix(hash, obj.x | 0);
            hash = mix(hash, obj.y | 0);
            hash = mix(hash, obj.isBroken ? 1 : 0);
            hash = mix(hash, obj.isOpen ? 1 : 0);
            hash = mix(hash, obj.wallMask | 0);
            hash = mix(hash, obj.frameIndex | 0);
            hash = mix(hash, hashString(obj.type || ''));
        }

        return hash >>> 0;
    }

    _pushRectEntry(target, owner, ownerId, rawRect, reuseEntry = null) {
        const rect = toRect(rawRect);
        if (!rect) return null;

        const entry = reuseEntry || {};
        entry.kind = 'rect';
        entry.x = rect.x;
        entry.y = rect.y;
        entry.w = rect.w;
        entry.h = rect.h;
        entry.owner = owner;
        entry.ownerId = ownerId;
        target.push(entry);
        return entry;
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
    }, reuseEntry = null) {
        if (!mask || !Number.isFinite(maskWidth) || !Number.isFinite(maskHeight)) return null;
        if (!Number.isFinite(pivotX) || !Number.isFinite(pivotY)) return null;

        const bounds = computeSpriteAabb(
            localBounds,
            pivotX,
            pivotY,
            originX,
            originY,
            rotation,
            flipX
        );
        if (!bounds) return null;

        const entry = reuseEntry || {};
        entry.kind = 'sprite';
        entry.x = bounds.x;
        entry.y = bounds.y;
        entry.w = bounds.w;
        entry.h = bounds.h;
        entry.pivotX = pivotX;
        entry.pivotY = pivotY;
        entry.originX = originX;
        entry.originY = originY;
        entry.rotation = rotation;
        entry.flipX = flipX;
        entry.mask = mask;
        entry.maskWidth = maskWidth;
        entry.maskHeight = maskHeight;
        entry.localBounds = localBounds;
        entry.owner = owner;
        entry.ownerId = ownerId;
        target.push(entry);
        return entry;
    }

    _takeDynamicEntry() {
        const index = this._dynamicEntryCount++;
        let entry = this._dynamicEntryPool[index];
        if (!entry) {
            entry = {};
            this._dynamicEntryPool[index] = entry;
        }
        return entry;
    }

    _rollbackDynamicEntry() {
        if (this._dynamicEntryCount > 0) {
            this._dynamicEntryCount--;
        }
    }

    _resolveMaskRefresh(owner, slotIndex, occluder) {
        if (occluder.forceMaskRefresh !== true) return false;

        const maskVersion = Number.isFinite(occluder.maskVersion) ? occluder.maskVersion : null;
        if (maskVersion === null) return true;

        const stateOwner = owner || occluder.sprite;
        const ownerType = typeof stateOwner;
        if (!stateOwner || (ownerType !== 'object' && ownerType !== 'function')) {
            return true;
        }

        let state = this._dynamicMaskVersionState.get(stateOwner);
        if (!state) {
            state = new Map();
            this._dynamicMaskVersionState.set(stateOwner, state);
        }

        const slotKey = slotIndex + ':' + (occluder.kind || 'sprite');
        const lastVersion = state.get(slotKey);
        if (lastVersion === maskVersion) return false;

        state.set(slotKey, maskVersion);
        return true;
    }

    _rebuildStaticEntries(walls = [], breakableObjects = []) {
        this.staticEntries.length = 0;
        this.staticWallEntries.length = 0;
        this.staticObjectEntries.length = 0;

        for (const wall of walls) {
            this._pushRectEntry(this.staticWallEntries, null, 0, {
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
            const staticTarget = isDoor || (obj.type || '').startsWith('wall')
                ? this.staticWallEntries
                : this.staticObjectEntries;
            if (!isDoor) {
                const frameData = spriteMaskCache.getFrameDataForObject(obj);
                const frame = frameData?.frame || null;
                const bounds = frame?.bounds || null;
                if (bounds) {
                    const drawOffsetX = obj.drawOffset?.x || 0;
                    const drawOffsetY = obj.drawOffset?.y || 0;
                    const pivotX = obj.x + drawOffsetX;
                    const pivotY = obj.y + drawOffsetY;
                    this._pushSpriteEntry(staticTarget, obj, ownerId, {
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
                this._pushRectEntry(staticTarget, obj, ownerId, hb);
            }
        }

        this.staticEntries.length = 0;
        for (const entry of this.staticWallEntries) this.staticEntries.push(entry);
        for (const entry of this.staticObjectEntries) this.staticEntries.push(entry);

        this._staticSpatialIndex.build(this.staticEntries);
        this._wallSpatialIndex.build(this.staticWallEntries);
        this._objectSpatialIndex.build(this.staticObjectEntries);
    }

    _rebuildDynamicEntries(dynamicOccluders = []) {
        this.dynamicEntries.length = 0;
        this._dynamicEntryCount = 0;
        if (!Array.isArray(dynamicOccluders) || dynamicOccluders.length === 0) return;

        for (const group of dynamicOccluders) {
            const owner = group?.owner || null;
            const occluders = Array.isArray(group?.occluders) ? group.occluders : [];
            if (occluders.length === 0) continue;

            const ownerId = this._getOwnerId(owner);
            for (let i = 0; i < occluders.length; i++) {
                const occluder = occluders[i];
                if (!occluder) continue;

                if (occluder.kind === 'rect') {
                    const entry = this._takeDynamicEntry();
                    const pushed = this._pushRectEntry(this.dynamicEntries, owner, ownerId, occluder, entry);
                    if (!pushed) this._rollbackDynamicEntry();
                    continue;
                }

                const forceRefresh = this._resolveMaskRefresh(owner, i, occluder);
                const frameData = spriteMaskCache.getFrameDataForCanvas(
                    occluder.sprite,
                    forceRefresh
                );
                const frame = frameData?.frame || null;
                const bounds = frame?.bounds || null;
                if (!frame || !bounds) continue;

                const entry = this._takeDynamicEntry();
                const pushed = this._pushSpriteEntry(this.dynamicEntries, owner, ownerId, {
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
                }, entry);
                if (!pushed) this._rollbackDynamicEntry();
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
        for (const entry of this.staticEntries) this.entries.push(entry);
        for (const entry of this.dynamicEntries) this.entries.push(entry);

        return staticChanged;
    }

    _appendSpatialQuery(index, scratch, x, y, radius, ignoreOwner, out) {
        const candidates = index.queryCircle(x, y, radius, scratch);
        for (const entry of candidates) {
            if (ignoreOwner && entry.owner === ignoreOwner) continue;
            out.push(entry);
        }
        return out;
    }

    _appendDynamicQuery(x, y, radius, ignoreOwner, out) {
        const left = x - radius;
        const right = x + radius;
        const top = y - radius;
        const bottom = y + radius;

        for (const entry of this.dynamicEntries) {
            if (entry.x > right || entry.x + entry.w < left || entry.y > bottom || entry.y + entry.h < top) {
                continue;
            }
            if (ignoreOwner && entry.owner === ignoreOwner) continue;
            out.push(entry);
        }
        return out;
    }

    queryStaticBlockersInRadius(x, y, radius, maxEntries = Infinity, ignoreOwner = null, out = []) {
        out.length = 0;
        if (Number.isFinite(maxEntries) && maxEntries <= 0) return out;

        this._appendSpatialQuery(this._wallSpatialIndex, this._wallQueryScratch, x, y, radius, ignoreOwner, out);
        this._appendSpatialQuery(this._objectSpatialIndex, this._objectQueryScratch, x, y, radius, ignoreOwner, out);

        if (Number.isFinite(maxEntries) && out.length > maxEntries) {
            out.sort((a, b) => dist2ToRect(x, y, a) - dist2ToRect(x, y, b));
            out.length = maxEntries;
        }

        return out;
    }

    queryWallsInRadius(x, y, radius, maxEntries = Infinity, ignoreOwner = null, out = []) {
        out.length = 0;
        if (Number.isFinite(maxEntries) && maxEntries <= 0) return out;

        this._appendSpatialQuery(this._wallSpatialIndex, this._wallQueryScratch, x, y, radius, ignoreOwner, out);

        if (Number.isFinite(maxEntries) && out.length > maxEntries) {
            out.sort((a, b) => dist2ToRect(x, y, a) - dist2ToRect(x, y, b));
            out.length = maxEntries;
        }

        return out;
    }

    queryObjectsInRadius(x, y, radius, maxEntries = Infinity, ignoreOwner = null, out = []) {
        out.length = 0;
        if (Number.isFinite(maxEntries) && maxEntries <= 0) return out;

        this._appendSpatialQuery(this._objectSpatialIndex, this._objectQueryScratch, x, y, radius, ignoreOwner, out);

        if (Number.isFinite(maxEntries) && out.length > maxEntries) {
            out.sort((a, b) => dist2ToRect(x, y, a) - dist2ToRect(x, y, b));
            out.length = maxEntries;
        }

        return out;
    }

    queryDynamicInRadius(x, y, radius, maxEntries = Infinity, ignoreOwner = null, out = []) {
        out.length = 0;
        if (Number.isFinite(maxEntries) && maxEntries <= 0) return out;

        this._appendDynamicQuery(x, y, radius, ignoreOwner, out);

        if (Number.isFinite(maxEntries) && out.length > maxEntries) {
            out.sort((a, b) => dist2ToRect(x, y, a) - dist2ToRect(x, y, b));
            out.length = maxEntries;
        }

        return out;
    }

    query(x, y, radius, maxEntries = Infinity, ignoreOwner = null, out = []) {
        out.length = 0;
        if (Number.isFinite(maxEntries) && maxEntries <= 0) return out;

        this._appendSpatialQuery(this._staticSpatialIndex, this._staticQueryScratch, x, y, radius, ignoreOwner, out);
        this._appendDynamicQuery(x, y, radius, ignoreOwner, out);

        if (Number.isFinite(maxEntries) && out.length > maxEntries) {
            out.sort((a, b) => dist2ToRect(x, y, a) - dist2ToRect(x, y, b));
            out.length = maxEntries;
        }

        return out;
    }
}
