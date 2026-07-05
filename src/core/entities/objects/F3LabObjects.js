// F3 深渊实验室层物件定义集（room-f3 独占）。
// 纯配置：碰撞底座 hitbox / 血量 / 阴影。精灵自带落影，故 shadow=null。
// 美术见 src/assets/objects/dungeon/f3_*.js。

// 培养槽：钢座玻璃管，站立占地小底座。
export const F3CultureTankObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 24, width: 14, height: 6 };
        obj.hp = 30;
        obj.shadow = null;
    }
};

// 破裂培养槽：同底座，更脆。
export const F3CultureTankBrokenObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 24, width: 14, height: 6 };
        obj.hp = 20;
        obj.shadow = null;
    }
};

// 手术台：横向宽台，低矮底座。
export const F3SurgeryTableObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 5, offsetY: 21, width: 22, height: 7 };
        obj.hp = 30;
        obj.shadow = null;
    }
};

// 反应堆芯：中央重型立柱，耐久高。
export const F3ReactorCoreObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 23, width: 14, height: 6 };
        obj.hp = 90;
        obj.shadow = null;
    }
};

// 未完成魔像躯干：支架半成品。
export const F3GolemTorsoObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 22, width: 14, height: 7 };
        obj.hp = 45;
        obj.shadow = null;
    }
};

// 冷冻舱：立式舱体。
export const F3CryoPodObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 8, offsetY: 24, width: 16, height: 5 };
        obj.hp = 30;
        obj.shadow = null;
    }
};

// 训练靶：细立柱靶架，占地极小。
export const F3TargetDummyObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 12, offsetY: 25, width: 8, height: 4 };
        obj.hp = 15;
        obj.shadow = null;
    }
};

// 管线阀门段：贴地矮管，不挡光。
export const F3PipeObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 3, offsetY: 20, width: 26, height: 6 };
        obj.hp = 25;
        obj.shadow = null;
        obj.blocksLight = false;
    }
};
