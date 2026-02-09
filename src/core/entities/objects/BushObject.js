export const BushObject = {
    configure(obj) {
        // Sprite 24×20, drawOffset {x:4, y:12} → occupies world x+4..x+28, y+12..y+32
        obj.hitbox = { offsetX: 6, offsetY: 27, width: 20, height: 5 };
        obj.hp = 15;
        obj.shadow = { rx: 9, ry: 3, y: 30 };
        obj.drawOffset = { x: 4, y: 12 };
    },
    getHurtbox(obj) {
        // Full visual shape: x+4, y+12, w24, h20
        // Slightly tighten it to avoid cheap hits
        return {
            x: obj.x + 5,
            y: obj.y + 13,
            width: 22,
            height: 18
        };
    }
};
