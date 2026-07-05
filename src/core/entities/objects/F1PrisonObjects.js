// F1 监狱层专属物件逻辑（碰撞箱/血量/阴影）。美术见 src/assets/objects/dungeon/F1Prison*Sprite.js。
// 阴影统一烘焙进精灵（shadow=null）；瞭望塔基座为永久结构（isLocked）。
// 命名前缀 prison_ 由本层 agent 独占，注册见 ObjectRegistry.js。

// 完整铁栏牢门：囚区/禁闭室封锁，整条底座挡路。
export const PrisonCellDoorObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 5, offsetY: 22, width: 22, height: 7 };
        obj.hp = 50;
        obj.shadow = null;
    }
};

// 档案柜：高身铁皮柜，占地窄。
export const PrisonFileCabinetObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 8, offsetY: 22, width: 16, height: 8 };
        obj.hp = 35;
        obj.shadow = null;
    }
};

// 狱卒储物柜：立柜。
export const PrisonLockerObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 22, width: 14, height: 8 };
        obj.hp = 30;
        obj.shadow = null;
    }
};

// 越狱土堆：低矮堆，不挡光（矮），易铲平。
export const PrisonDirtMoundObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 6, offsetY: 24, width: 20, height: 6 };
        obj.hp = 16;
        obj.shadow = null;
        obj.blocksLight = false;
    }
};

// 探视隔离台：长柜台 + 上方隔栏。
export const PrisonVisitBoothObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 4, offsetY: 22, width: 24, height: 8 };
        obj.hp = 32;
        obj.shadow = null;
    }
};

// 瞭望塔基座：永久结构，不可破坏。
export const PrisonWatchtowerObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 7, offsetY: 20, width: 18, height: 9 };
        obj.hp = 999;
        obj.isLocked = true;
        obj.shadow = null;
    }
};

// 囚室铁床：双层床，横向占地宽。
export const PrisonBunkObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 3, offsetY: 22, width: 26, height: 8 };
        obj.hp = 30;
        obj.shadow = null;
    }
};
