/**
 * DungeonRunState —— 单局地牢运行状态。
 *
 * 追踪一次地牢探索期间的易失状态：金币、钥匙、圣物、当前楼层与本局随机种子。
 * 进入地牢时 start()，回到 hub / 通关时 end()。地牢生成器以 `seed + floor`
 * 派生每层的 mulberry32 种子，从而实现单局内可复现。
 *
 * 注意：所有字段均为“单局易失”，玩家死亡为整页 reload，不需要额外清算路径。
 */
export class DungeonRunState {
    constructor() {
        /** @type {boolean} 是否处于地牢局内 */
        this.active = false;
        /** @type {number} 本局金币 */
        this.coins = 0;
        /** @type {number} 本局钥匙 */
        this.keys = 0;
        /** @type {string[]} 本局已获得圣物 id（P2 使用，本期占位） */
        this.relicIds = [];
        /** @type {number} 当前楼层（1 起） */
        this.floor = 1;
        /** @type {number} 本局随机种子（进入地牢时记录） */
        this.seed = 0;
    }

    /**
     * 进入地牢时调用：清零全部状态、激活并记录种子。
     * @param {number} seed 本局随机种子（通常为 Date.now()）
     */
    start(seed) {
        this.active = true;
        this.coins = 0;
        this.keys = 0;
        this.relicIds = [];
        this.floor = 1;
        this.seed = seed;
        console.log('[Dungeon] seed:', seed);
    }

    /**
     * 回到 hub / 通关时调用：清零全部状态并停用。
     */
    end() {
        this.active = false;
        this.coins = 0;
        this.keys = 0;
        this.relicIds = [];
        this.floor = 1;
        this.seed = 0;
    }

    /**
     * 增加金币。
     * @param {number} n 数量（非正数或非法值忽略）
     */
    addCoins(n) {
        if (!Number.isFinite(n) || n <= 0) return;
        this.coins += n;
    }

    /**
     * 消费金币；不足时返回 false 且不扣款。
     * @param {number} n 数量
     * @returns {boolean} 是否成功扣款
     */
    spendCoins(n) {
        if (!Number.isFinite(n) || n < 0) return false;
        if (this.coins < n) return false;
        this.coins -= n;
        return true;
    }

    /**
     * 增加钥匙。
     * @param {number} n 数量（非正数或非法值忽略）
     */
    addKeys(n) {
        if (!Number.isFinite(n) || n <= 0) return;
        this.keys += n;
    }

    /**
     * 使用一把钥匙；无钥匙时返回 false。
     * @returns {boolean} 是否成功使用
     */
    useKey() {
        if (this.keys <= 0) return false;
        this.keys -= 1;
        return true;
    }

    /**
     * 记录圣物 id（去重）。P2 使用，本期先占位。
     * @param {string} id 圣物 id
     */
    addRelic(id) {
        if (id == null) return;
        if (!this.relicIds.includes(id)) this.relicIds.push(id);
    }

    /**
     * 是否已拥有指定圣物。
     * @param {string} id 圣物 id
     * @returns {boolean}
     */
    hasRelic(id) {
        return this.relicIds.includes(id);
    }
}
