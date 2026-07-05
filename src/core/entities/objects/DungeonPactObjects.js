// 契约房机关：中央契约拉杆（走 BreakableObject 管线，参考 DungeonTrapObjects 的 cage_lever）。
// 美术在 src/assets/objects/dungeon/DungeonPactLeverSprite.js（两态：未立约/已立约）。
// 拉下 → 委托 DungeonManager.startPactFight 封门开战（敌人 ×1.5 全精英，奖励翻倍 + 保底遗物）；
// 不拉可自由通行（契约房进房不封门、无敌人）。worldSystem 引用由 WorldSystem 建对象时注入。

const PACT_INTERACT_RANGE = 56;

/** 取拉杆所在房间（供判定 category / 委托开战）。 */
export function pactRoomOf(obj) {
    const dm = obj.worldSystem && obj.worldSystem.dungeonManager;
    if (!dm || !dm.getRoomAt) return null;
    return dm.getRoomAt(obj.x + 16, obj.y + 16);
}

export const PactLeverObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 10, offsetY: 20, width: 12, height: 9 }; // 底座小挡
        obj.hp = 999;
        obj.isLocked = true;      // 不可破坏
        obj.blocksLight = false;
        obj.shadow = null;
        obj.noAnimation = true;   // 帧由拉杆状态控制
        obj.frameIndex = 0;
        obj.pulled = false;
        obj.hintOffsetY = -18;
    },
    update(obj, player) {
        obj.frameIndex = obj.pulled ? 1 : 0;
        if (obj.pulled || !player) return;
        const dx = player.x - (obj.x + 16);
        const dy = player.y - (obj.y + 16);
        if (dx * dx + dy * dy > PACT_INTERACT_RANGE * PACT_INTERACT_RANGE) return;
        // BreakableObject.update 每帧已置 showHint=false，此处重亮（风险自选提示）
        obj.showHint = true;
        obj.hintText = '[E] 立约·敌人加倍全精英';
        obj.hintColor = '#c084f0';
    },
    interact(obj) {
        if (obj.pulled) return false;
        const dm = obj.worldSystem && obj.worldSystem.dungeonManager;
        const room = pactRoomOf(obj);
        if (!dm || !room || room.category !== 'pact' || !dm.startPactFight) return false;
        if (!dm.startPactFight(room)) return false; // 已开战 / 非法：E 落回消耗品
        obj.pulled = true;
        obj.frameIndex = 1;
        return true;
    }
};
