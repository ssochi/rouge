export const WallVObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 0, width: 12, height: 32 };
        obj.hp = 100;
        obj.shadow = { type: 'rect', x: 10, y: 0, w: 12, h: 32 };
        obj.drawOffset = { x: 0, y: -16 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.hitbox.offsetX,
            y: obj.y - 16,
            width: obj.hitbox.width,
            height: 48
        };
    }
};

