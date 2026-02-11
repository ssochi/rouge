export const CabinetObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 2, offsetY: 12, width: 44, height: 20 };
        obj.hp = 50;
        obj.shadow = { type: 'rect', x: 2, y: 12, w: 44, h: 20 };
        obj.drawOffset = { x: 0, y: 8 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};
