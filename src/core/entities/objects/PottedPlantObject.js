export const PottedPlantObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 18, width: 12, height: 12 };
        obj.hp = 15;
        obj.shadow = { type: 'rect', x: 11, y: 22, w: 10, h: 6 };
        obj.drawOffset = { x: 8, y: 8 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};
