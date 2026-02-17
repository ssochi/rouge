export const CoatRackObject = {
    configure(obj) {
        // Sprite is 16×40, centered in 32px tile with drawOffset.x=8
        // Sprite occupies tile x:[8,24], y:[-8,32]
        obj.hitbox = { offsetX: 12, offsetY: 24, width: 8, height: 8 };
        obj.hp = 20;
        obj.shadow = { rx: 6, ry: 3, y: 30 };
        obj.drawOffset = { x: 8, y: -8 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + 8,
            y: obj.y + obj.drawOffset.y,
            width: 16,
            height: 40
        };
    }
};
