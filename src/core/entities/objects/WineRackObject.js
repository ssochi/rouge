export const WineRackObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 2, offsetY: 16, width: 28, height: 14 };
        obj.hp = 35;
        obj.shadow = { type: 'rect', x: 2, y: 16, w: 28, h: 14 };
        obj.drawOffset = { x: 0, y: -16 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.hitbox.offsetX,
            y: obj.y + obj.drawOffset.y,
            width: obj.hitbox.width,
            height: 48
        };
    }
};
