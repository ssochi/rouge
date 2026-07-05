// RelicAltarCore.js
// [tension-batch:power] 遗物三选一祭坛的纯逻辑内核（对标 GambleTable.SlotMachineCore）。
// 只维护「三候选 / 选一灭二」状态机，不依赖 Canvas / DOM，便于单测与复用。
// 候选抽取（排除已持有、互不重复）由 LootTable.pickRelicChoices 完成后注入本内核。

export class RelicAltarCore {
    /**
     * @param {string[]} relicIds 候选遗物 id（通常 3 个，池不足时可少于 3）
     */
    constructor(relicIds = []) {
        this.relicIds = relicIds.slice();
        this.chosenIndex = -1; // -1 表示尚未选择
    }

    /** 是否已完成选择（选一后即锁定）。 */
    get resolved() {
        return this.chosenIndex >= 0;
    }

    /** 候选底座数量。 */
    get count() {
        return this.relicIds.length;
    }

    /**
     * 选定第 i 个底座：锁定选择，其余底座随即熄灭。
     * @param {number} i 底座下标
     * @returns {string|null} 选中的遗物 id；已选 / 越界 / 空底座时返回 null（不改变状态）
     */
    choose(i) {
        if (this.resolved) return null;
        if (!Number.isInteger(i) || i < 0 || i >= this.relicIds.length) return null;
        const id = this.relicIds[i];
        if (!id) return null;
        this.chosenIndex = i;
        return id;
    }

    /** 第 i 个底座是否已熄灭（选定后，非选中的其余底座）。 */
    isExtinguished(i) {
        return this.resolved && i !== this.chosenIndex;
    }

    /** 第 i 个底座是否为被选中的那一个。 */
    isChosen(i) {
        return this.resolved && i === this.chosenIndex;
    }
}
