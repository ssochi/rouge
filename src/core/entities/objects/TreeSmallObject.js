export const TreeSmallObject = {
    configure(obj) {
        // Sprite 32×36, drawOffset y=-4 → occupies world y-4 to y+32
        // Trunk base at sprite row 35 → world y+31
        obj.hitbox = { offsetX: 13, offsetY: 28, width: 6, height: 4 };
        obj.hp = 40;
        obj.shadow = { rx: 6, ry: 3, y: 30 };
        obj.drawOffset = { x: 0, y: -4 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + 6,
            y: obj.y + obj.drawOffset.y + 1,
            width: 21,
            height: 35
        };
    }
};
