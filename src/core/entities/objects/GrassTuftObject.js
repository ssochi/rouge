export const GrassTuftObject = {
    configure(obj) {
        // Sprite 16×14, drawOffset {x:8, y:18} → occupies world x+8..x+24, y+18..y+32
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 };
        obj.hp = 8;
        obj.drawOffset = { x: 8, y: 18 };
    }
};
