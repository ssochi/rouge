export const TVStandObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 16, width: 40, height: 16 };
        obj.hp = 40;
        obj.shadow = { type: 'rect', x: 0, y: 16, w: 40, h: 16 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};

