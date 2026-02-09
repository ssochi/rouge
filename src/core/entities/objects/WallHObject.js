export const WallHObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 10, width: 32, height: 12 };
        obj.hp = 100;
        obj.shadow = { type: 'rect', x: 0, y: 10, w: 32, h: 12 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.hitbox.offsetX,
            y: obj.y + 4,
            width: obj.hitbox.width,
            height: 24
        };
    }
};

