export const TableObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 1, offsetY: 12, width: 30, height: 20 };
        obj.hp = 40;
        obj.shadow = { type: 'rect', x: 2, y: 14, w: 28, h: 18 };
        obj.drawOffset = { x: 0, y: 8 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};

