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

export class ShadowCasterBuilder {
    constructor() {
        this.entries = [];
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
            hash = mix(hash, obj.wallMask | 0);
            hash = mix(hash, obj.frameIndex | 0);
            hash = mix(hash, hashString(obj.type || ''));
        }

        return hash >>> 0;
    }

    rebuildIfNeeded(walls = [], breakableObjects = []) {
        const nextHash = this._computeHash(walls, breakableObjects);
        if (nextHash === this._lastHash) return false;

        this._lastHash = nextHash;
        this.entries.length = 0;

        for (const wall of walls) {
            const rect = toRect({ x: wall.x, y: wall.y, width: wall.w, height: wall.h });
            if (!rect) continue;
            this.entries.push({
                kind: 'rect',
                ...rect,
                owner: null,
                ownerId: 0
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
                    const spriteX = obj.x + drawOffsetX;
                    const spriteY = obj.y + drawOffsetY;
                    this.entries.push({
                        kind: 'sprite',
                        x: Math.floor(spriteX + bounds.minX),
                        y: Math.floor(spriteY + bounds.minY),
                        w: Math.ceil(bounds.width),
                        h: Math.ceil(bounds.height),
                        spriteX,
                        spriteY,
                        mask: frame.mask,
                        maskWidth: frame.width,
                        maskHeight: frame.height,
                        localBounds: bounds,
                        owner: obj,
                        ownerId
                    });
                    continue;
                }
            }

            // Fallback for doors / non-sprite entries: use bullet hurtboxes.
            const hurtboxes = obj.getHurtboxes
                ? obj.getHurtboxes()
                : [obj.getHurtbox?.(), obj.getHitbox?.()].filter(Boolean);
            for (const hb of hurtboxes) {
                const rect = toRect(hb);
                if (!rect) continue;
                this.entries.push({
                    kind: 'rect',
                    ...rect,
                    owner: obj,
                    ownerId
                });
            }
        }

        return true;
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
