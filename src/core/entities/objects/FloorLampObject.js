export const FloorLampObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 28, width: 12, height: 12 };
        obj.hp = 15;
        obj.shadow = { type: 'rect', x: 10, y: 30, w: 12, h: 8 };
        obj.drawOffset = { x: 8, y: -8 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + 10,
            y: obj.y + obj.drawOffset.y,
            width: 12,
            height: 40
        };
    }
};
