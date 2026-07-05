// F2 教团圣殿层叙事物件定义集（长椅/讲坛/坩埚/药剂架/烛台/管风琴/展柜/血祭石）。
// 阻挡型给足底座 hitbox；精灵自带落影故 shadow=null。可破坏（教团据点被玩家清剿）。

export const TemplePewObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 4, offsetY: 22, width: 24, height: 6 };
        obj.hp = 25;
        obj.shadow = null;
    }
};

export const TemplePulpitObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 22, width: 14, height: 7 };
        obj.hp = 40;
        obj.shadow = null;
    }
};

export const AlchemyCauldronObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 8, offsetY: 22, width: 16, height: 6 };
        obj.hp = 30;
        obj.shadow = null;
    }
};

export const PotionShelfObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 5, offsetY: 23, width: 22, height: 5 };
        obj.hp = 20;
        obj.shadow = null;
    }
};

export const TempleCandelabraObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 24, width: 12, height: 5 };
        obj.hp = 15;
        obj.shadow = null;
    }
};

export const BrokenOrganObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 3, offsetY: 22, width: 26, height: 6 };
        obj.hp = 45;
        obj.shadow = null;
    }
};

export const ReliquaryCaseObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 7, offsetY: 23, width: 18, height: 6 };
        obj.hp = 28;
        obj.shadow = null;
    }
};

export const SacrificeSlabObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 4, offsetY: 19, width: 24, height: 9 };
        obj.hp = 55;
        obj.shadow = null;
    }
};
