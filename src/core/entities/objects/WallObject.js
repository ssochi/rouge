import { toWorldRects } from './ObjectUtils.js';

export const WallObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 32, height: 32 };
        obj.hp = 100;
        obj.shadow = { type: 'rect', x: 0, y: 0, w: 32, h: 32 };
        obj.drawOffset = { x: 0, y: -16 };
        obj.isAdaptive = true;
    },
    setWallMask(obj, mask) {
        if (!obj.isAdaptive) return;

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
        obj.shadow = { type: 'rect', x: minX, y: minY, w: obj.hitbox.width, h: obj.hitbox.height };
    },
    getHitboxes(obj) {
        if (obj.hitboxes && obj.hitboxes.length > 0) {
            return toWorldRects(obj, obj.hitboxes);
        }
        return [obj.getHitbox()];
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.hitbox.offsetX,
            y: obj.y + obj.hitbox.offsetY - 16,
            width: obj.hitbox.width,
            height: obj.hitbox.height + 16
        };
    }
};

