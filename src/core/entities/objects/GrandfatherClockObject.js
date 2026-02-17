export const GrandfatherClockObject = {
    configure(obj) {
        // Sprite is 16×48, centered in 32px tile with drawOffset.x=8
        // Sprite occupies tile x:[8,24], y:[-16,32]
        obj.hitbox = { offsetX: 10, offsetY: 18, width: 12, height: 14 };
        obj.hp = 45;
        obj.shadow = { rx: 6, ry: 4, y: 30 };
        obj.drawOffset = { x: 8, y: -16 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + 8,
            y: obj.y + obj.drawOffset.y,
            width: 16,
            height: 48
        };
    }
};
