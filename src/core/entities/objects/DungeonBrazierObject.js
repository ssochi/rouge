// 地牢落地火盆：发光的可破坏装饰（掩体级），特殊房/Boss 房氛围光源。
export const DungeonBrazierObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 8, offsetY: 20, width: 16, height: 10 };
        obj.hp = 40;
        obj.shadow = null; // 精灵自带落影
    }
};
