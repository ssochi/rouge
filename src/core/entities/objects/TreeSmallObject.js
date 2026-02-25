export const TreeSmallObject = {
    configure(obj) {
        // Sprite 40×56, drawOffset y=-24 → occupies world y-24 to y+32
        // Trunk base/roots at sprite rows 46-55 → world y+22 to y+31
        obj.hitbox = { offsetX: 13, offsetY: 26, width: 8, height: 4 };
        obj.hp = 40;
        obj.shadow = { rx: 10, ry: 3, y: 29 };
        obj.drawOffset = { x: -4, y: -24 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + obj.drawOffset.x + 3,
            y: obj.y + obj.drawOffset.y + 1,
            width: 34,
            height: 54
        };
    }
};
