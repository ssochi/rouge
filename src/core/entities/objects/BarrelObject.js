export const BarrelObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 6, offsetY: 20, width: 20, height: 10 };
        obj.hp = 60; // R4 平衡：掩体更耐打（原 40）
        obj.shadow = { rx: 10, ry: 5, y: 28 };
    }
};

