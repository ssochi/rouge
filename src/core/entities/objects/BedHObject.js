export const BedHObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 2, offsetY: 3, width: 44, height: 26 };
        obj.hp = 50;
        obj.shadow = { type: 'rect', x: 2, y: 3, w: 44, h: 26 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};

