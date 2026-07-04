// SummonBehavior —— 周期召唤（上限控制 + 施法前摇）。
// 召唤动作本身通过 onSummon 回调交给实体执行（实体负责 worldSystem.spawnEnemy
// 与 DungeonManager 房间跟踪注册），组件只管节奏与上限。

export class SummonBehavior {
    /**
     * @param {Object} opts
     * @param {number} [opts.interval=300] 召唤周期帧数
     * @param {number} [opts.batch=2] 每次召唤数量
     * @param {number} [opts.cap=4] 同时存活召唤物上限
     * @param {number} [opts.castTime=45] 施法前摇帧数
     * @param {number} [opts.range=420] 发动距离
     * @param {(index: number) => Object|null} opts.onSummon 召唤回调，返回召唤出的实体（或 null）
     */
    constructor({ interval = 300, batch = 2, cap = 4, castTime = 45, range = 420, onSummon }) {
        this.interval = interval;
        this.batch = batch;
        this.cap = cap;
        this.castTime = castTime;
        this.range = range;
        this.onSummon = onSummon;
        this.timer = Math.floor(interval * 0.4); // 首次提前一些
        this.castTimer = 0;
        this.minions = [];
    }

    /** 是否处于施法前摇（供实体切施法动画）。 */
    get isCasting() {
        return this.castTimer > 0;
    }

    /** 施法进度 0~1。 */
    get castProgress() {
        return this.castTimer > 0 ? 1 - this.castTimer / this.castTime : 0;
    }

    aliveMinionCount() {
        this.minions = this.minions.filter(m => m && m.hp > 0);
        return this.minions.length;
    }

    update(ctx) {
        const e = ctx.enemy;

        if (this.castTimer > 0) {
            this.castTimer--;
            if (this.castTimer === 0) {
                for (let i = 0; i < this.batch; i++) {
                    if (this.aliveMinionCount() >= this.cap) break;
                    const minion = this.onSummon ? this.onSummon(i) : null;
                    if (minion) this.minions.push(minion);
                }
                this.timer = this.interval;
            }
            return true; // 施法中
        }

        if (this.timer > 0) {
            this.timer--;
            return false;
        }

        // 上限已满则待机重试
        if (this.aliveMinionCount() + this.batch > this.cap) {
            this.timer = Math.floor(this.interval * 0.3);
            return false;
        }

        const dx = ctx.player.x - e.x;
        const dy = ctx.player.y - e.y;
        if (dx * dx + dy * dy > this.range * this.range) return false;

        this.castTimer = this.castTime;
        return true;
    }
}
