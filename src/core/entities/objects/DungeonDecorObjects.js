// 地牢装饰物定义集（P5 装饰库扩容）。
// 阻挡型给足 hitbox；氛围型走零尺寸 hitbox（不阻挡）。
// 石柱/雕像为永久结构（isLocked 不可破坏），其余可破坏。

export const DungeonPillarObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 22, width: 14, height: 8 };
        obj.hp = 999;
        obj.isLocked = true; // 永久结构
        obj.shadow = null;   // 精灵自带落影
    }
};

export const DungeonPillarBrokenObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 22, width: 14, height: 8 };
        obj.hp = 35;
        obj.shadow = null;
    }
};

export const DungeonStatueObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 22, width: 12, height: 8 };
        obj.hp = 999;
        obj.isLocked = true;
        obj.shadow = null;
    }
};

export const DungeonAltarObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 7, offsetY: 22, width: 18, height: 8 };
        obj.hp = 30;
        obj.shadow = null;
    }
};

export const DungeonBannerObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 13, offsetY: 25, width: 6, height: 5 };
        obj.hp = 15;
        obj.shadow = null;
    }
};

export const DungeonBarsObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 4, offsetY: 22, width: 24, height: 7 };
        obj.hp = 45;
        obj.shadow = null;
    }
};

export const DungeonRackObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 7, offsetY: 23, width: 18, height: 6 };
        obj.hp = 30;
        obj.shadow = null;
    }
};

export const DungeonMushroomsObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 }; // 不阻挡
        obj.hp = 8;
        obj.shadow = null;
        obj.blocksLight = false;
    }
};
