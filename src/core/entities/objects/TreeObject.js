export const TreeObject = {
    configure(obj) {
        // Sprite 56×72, drawOffset y=-40 → occupies world y-40 to y+32
        // Trunk base/roots at sprite rows 60-71 → world y+20 to y+31
        obj.hitbox = { offsetX: 10, offsetY: 24, width: 12, height: 6 };
        obj.hp = 80;
        obj.shadow = { rx: 14, ry: 5, y: 29 };
        obj.drawOffset = { x: -12, y: -40 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.drawOffset.x + 2,
            y: obj.y + obj.drawOffset.y + 1,
            width: 52,
            height: 70
        };
    }
};
