export const ChairObject = {
    configure(obj) {
        // Sprite is 16×20, centered in 32px tile with drawOffset.x=8
        // Sprite occupies tile x:[8,24], y:[12,32]
        obj.hitbox = { offsetX: 10, offsetY: 22, width: 12, height: 8 };
        obj.hp = 15;
        obj.shadow = { rx: 7, ry: 3, y: 28 };
        obj.drawOffset = { x: 8, y: 12 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};
