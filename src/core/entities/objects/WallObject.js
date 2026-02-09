import { toWorldRects } from './ObjectUtils.js';

const TILE = 32;
const WALL_CENTER = { x: 10, y: 10, w: 12, h: 12 };
const FRONT_FACE_Y = 22;

function buildFrontStrips(mask, y, h) {
    const hasSouth = (mask & 4) !== 0;
    const hasEast = (mask & 2) !== 0;
    const hasWest = (mask & 8) !== 0;

    const strips = [];

    // Center front face only shows when south is not connected.
    if (!hasSouth) {
        strips.push({ offsetX: WALL_CENTER.x, offsetY: y, width: WALL_CENTER.w, height: h });
    }
    if (hasWest) {
        strips.push({ offsetX: 0, offsetY: y, width: WALL_CENTER.x, height: h });
    }
    if (hasEast) {
        strips.push({
            offsetX: WALL_CENTER.x + WALL_CENTER.w,
            offsetY: y,
            width: TILE - (WALL_CENTER.x + WALL_CENTER.w),
            height: h
        });
    }

    // Keep a stable baseline when no strip exists (e.g. pure vertical with south connection).
    if (strips.length === 0) {
        strips.push({ offsetX: WALL_CENTER.x, offsetY: y, width: WALL_CENTER.w, height: h });
    }

    return strips;
}

export const WallObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 32, height: 32 };
        obj.hp = 100;
        obj.shadow = { type: 'multiRect', rects: [{ x: WALL_CENTER.x, y: FRONT_FACE_Y, w: WALL_CENTER.w, h: 3 }] };
        obj.drawOffset = { x: 0, y: -16 };
        obj.isAdaptive = true;
        obj.wallMask = 0;
        obj.occlusionSortY = FRONT_FACE_Y;
    },
    setWallMask(obj, mask) {
        if (!obj.isAdaptive) return;

        obj.wallMask = mask;
        obj.frameIndex = mask;
        obj.hitboxes = [];

        obj.hitboxes.push({ offsetX: 10, offsetY: 10, width: 12, height: 12 });
        if (mask & 1) obj.hitboxes.push({ offsetX: 10, offsetY: 0, width: 12, height: 10 });
        if (mask & 2) obj.hitboxes.push({ offsetX: 22, offsetY: 10, width: 10, height: 12 });
        if (mask & 4) obj.hitboxes.push({ offsetX: 10, offsetY: 22, width: 12, height: 10 });
        if (mask & 8) obj.hitboxes.push({ offsetX: 0, offsetY: 10, width: 10, height: 12 });

        let minX = 10;
        let maxX = 22;
        let minY = 10;
        let maxY = 22;
        if (mask & 1) minY = 0;
        if (mask & 2) maxX = 32;
        if (mask & 4) maxY = 32;
        if (mask & 8) minX = 0;

        obj.hitbox = { offsetX: minX, offsetY: minY, width: maxX - minX, height: maxY - minY };
        const shadowRects = buildFrontStrips(mask, FRONT_FACE_Y, 3).map(r => ({
            x: r.offsetX,
            y: r.offsetY,
            w: r.width,
            h: r.height
        }));
        obj.shadow = { type: 'multiRect', rects: shadowRects };
    },
    getHitboxes(obj) {
        if (obj.hitboxes && obj.hitboxes.length > 0) {
            return toWorldRects(obj, obj.hitboxes);
        }
        return [obj.getHitbox()];
    },
    getHurtbox(obj) {
        const hurtboxes = this.getHurtboxes(obj);
        if (hurtboxes.length === 0) {
            return {
                x: obj.x + obj.hitbox.offsetX,
                y: obj.y + obj.hitbox.offsetY - 16,
                width: obj.hitbox.width,
                height: obj.hitbox.height + 16
            };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const hb of hurtboxes) {
            minX = Math.min(minX, hb.x);
            minY = Math.min(minY, hb.y);
            maxX = Math.max(maxX, hb.x + hb.width);
            maxY = Math.max(maxY, hb.y + hb.height);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    },
    getHurtboxes(obj) {
        const hitboxes = this.getHitboxes(obj);
        return hitboxes.map(hb => ({
            x: hb.x,
            y: hb.y - 16,
            width: hb.width,
            height: hb.height + 16
        }));
    },
    getOcclusionHitboxes(obj) {
        const mask = obj.wallMask || 0;
        const localStrips = buildFrontStrips(mask, FRONT_FACE_Y - 1, 1);
        return toWorldRects(obj, localStrips);
    }
};
