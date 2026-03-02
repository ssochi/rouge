export const DungeonIronCageObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 8, offsetY: 14, width: 16, height: 13 };
        obj.hp = 40;
        obj.shadow = { rx: 8, ry: 3, y: 28 };
    },
    getHurtbox(obj) {
        return {
            x: obj.x + 8,
            y: obj.y + 11,
            width: 16,
            height: 16
        };
    }
};
