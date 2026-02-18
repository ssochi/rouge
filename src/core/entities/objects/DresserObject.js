export const DresserObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 2, offsetY: 20, width: 28, height: 12 };
        obj.hp = 50;
        obj.shadow = { type: 'rect', x: 2, y: 20, w: 28, h: 12 };
        obj.drawOffset = { x: 0, y: -8 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.hitbox.offsetX,
            y: obj.y + obj.drawOffset.y,
            width: obj.hitbox.width,
            height: 40
        };
    }
};
