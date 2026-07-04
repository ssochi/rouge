export const BoxObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 4, offsetY: 20, width: 24, height: 10 };
        obj.hp = 48; // R4 平衡：掩体更耐打（原 30），枪兵压制下玩家有依托
        obj.shadow = { rx: 12, ry: 6, y: 28 };
    }
};

