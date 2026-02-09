export const BedObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 3, offsetY: -10, width: 26, height: 40 };
        obj.hp = 50;
        obj.shadow = { type: 'rect', x: 4, y: -8, w: 24, h: 38 };
        obj.drawOffset = { x: 0, y: -16 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};

