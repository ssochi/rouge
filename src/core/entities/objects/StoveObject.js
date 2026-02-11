export const StoveObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 8, offsetY: 16, width: 16, height: 16 };
        obj.hp = 35;
        obj.shadow = { type: 'rect', x: 8, y: 16, w: 16, h: 16 };
        obj.drawOffset = { x: 8, y: 8 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};
