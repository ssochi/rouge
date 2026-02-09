export const WardrobeObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 8, width: 32, height: 24 };
        obj.hp = 80;
        obj.shadow = { type: 'rect', x: 0, y: 8, w: 32, h: 24 };
        obj.drawOffset = { x: 0, y: -24 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.hitbox.offsetX,
            y: obj.y + obj.drawOffset.y,
            width: obj.hitbox.width,
            height: 56
        };
    }
};

