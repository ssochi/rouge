const NON_BLOCKING_TYPES = new Set([
    'grass_tuft',
    'grass_tall',
    'grass_flower'
]);

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

export class ShadowCasterBuilder {
    constructor() {
        this.entries = [];
        this._lastHash = null;
    }

    _isDoor(obj) {
        const type = obj?.type;
        const baseType = obj?.baseType;
        return type === 'door_h' || type === 'door_v' || baseType === 'door_h' || baseType === 'door_v';
    }

    _shouldBlock(obj) {
        if (!obj || obj.isBroken) return false;
        if (NON_BLOCKING_TYPES.has(obj.type)) return false;
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
            this.entries.push({ ...rect, owner: null });
        }

        for (const obj of breakableObjects) {
            if (!this._shouldBlock(obj)) continue;

            // Lighting occlusion follows bullet blocking volumes, not movement collision volumes.
            const hurtboxes = obj.getHurtboxes
                ? obj.getHurtboxes()
                : [obj.getHurtbox?.(), obj.getHitbox?.()].filter(Boolean);

            for (const hb of hurtboxes) {
                const rect = toRect(hb);
                if (!rect) continue;
                // Ignore tiny decorative blockers to keep shadow cost low.
                if (rect.w * rect.h < 48) continue;
                this.entries.push({ ...rect, owner: obj });
            }
        }

        return true;
    }

    query(x, y, radius, maxEntries = Infinity, ignoreOwner = null) {
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
            if (result.length >= maxEntries) break;
        }

        return result;
    }
}
