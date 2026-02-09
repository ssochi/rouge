export const TreeObject = {
    configure(obj) {
        // Sprite 32×48, drawOffset y=-16 → occupies world y-16 to y+32
        // Trunk base at sprite row 47 → world y+31
        obj.hitbox = { offsetX: 12, offsetY: 28, width: 8, height: 4 };
        obj.hp = 80;
        obj.shadow = { rx: 8, ry: 4, y: 30 };
        obj.drawOffset = { x: 0, y: -16 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + 3,
            y: obj.y + obj.drawOffset.y + 1,
            width: 27,
            height: 47
        };
    }
};
