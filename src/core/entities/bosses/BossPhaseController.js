// BossPhaseController —— Boss 共享调度抽象：相位阈值 + 招式池（权重/条件/优先级）+ 冷却记账。
// 三个 Boss（变异巨兽/机械魔偶/机械巨蛇）的相位状态机与招式选择统一走此控制器；
// 招式的具体执行仍由各 Boss 自己的 execute* 函数负责（迁移不改行为，现值照抄）。
//
// 选择模型（兼容三家原逻辑）：
//   - 加权池（魔偶/巨蛇）：同优先级层内按权重随机；weight 可为函数（动态权重）
//   - 优先级链（巨兽）：candidates 取最高 priority 层，天然表达 if-else 优先级
//   - condition(ctx, controller) 表达距离带/资源门槛等前置条件

export class BossPhaseController {
    /**
     * @param {Object} opts
     * @param {number} [opts.initialPhase=1]
     * @param {Array<{threshold: number, phase: number, onEnter?: Function}>} [opts.phases]
     *        hpRatio ≤ threshold 时晋升到 phase（只前进不回退），触发 onEnter
     * @param {Array<{id: string, weight?: number|Function, minPhase?: number, condition?: Function, priority?: number}>} [opts.attacks]
     */
    constructor({ initialPhase = 1, phases = [], attacks = [] } = {}) {
        this.phase = initialPhase;
        this.phases = phases;
        this.attacks = attacks;
        this.attackCooldowns = new Map(); // 可选的 per-招式冷却（全局冷却仍由 Boss 自持）
    }

    /**
     * 相位推进检查（幂等，可在 takeDamage 中反复调用）。
     * @param {number} hpRatio 当前血量比 0~1
     * @returns {number|null} 若晋升返回新相位，否则 null
     */
    updatePhase(hpRatio) {
        let advanced = null;
        for (const p of this.phases) {
            if (this.phase < p.phase && hpRatio <= p.threshold) {
                this.phase = p.phase;
                advanced = p.phase;
                if (p.onEnter) p.onEnter();
            }
        }
        return advanced;
    }

    /** 每帧递减 per-招式冷却。 */
    tick() {
        for (const [id, cd] of this.attackCooldowns) {
            if (cd > 0) this.attackCooldowns.set(id, cd - 1);
        }
    }

    setAttackCooldown(id, frames) {
        this.attackCooldowns.set(id, frames);
    }

    isReady(id) {
        return (this.attackCooldowns.get(id) || 0) <= 0;
    }

    /**
     * 选招：过滤（相位/条件/冷却/权重>0）→ 取最高 priority 层 → 层内加权随机。
     * @param {Object} ctx 选招上下文（dist/hpRatio/资源标记等，由 Boss 提供）
     * @returns {string|null} 招式 id；无可用招式返回 null
     */
    pickAttack(ctx = {}, rng = Math.random) {
        const candidates = [];
        for (const atk of this.attacks) {
            if ((atk.minPhase || 1) > this.phase) continue;
            if (!this.isReady(atk.id)) continue;
            if (atk.condition && !atk.condition(ctx, this)) continue;
            const weight = typeof atk.weight === 'function' ? atk.weight(ctx, this) : (atk.weight ?? 1);
            if (weight <= 0) continue;
            candidates.push({ id: atk.id, weight, priority: atk.priority || 0 });
        }
        if (candidates.length === 0) return null;

        let topPriority = -Infinity;
        for (const c of candidates) {
            if (c.priority > topPriority) topPriority = c.priority;
        }
        const layer = candidates.filter(c => c.priority === topPriority);

        const total = layer.reduce((s, c) => s + c.weight, 0);
        let roll = rng() * total;
        for (const c of layer) {
            roll -= c.weight;
            if (roll <= 0) return c.id;
        }
        return layer[layer.length - 1].id;
    }
}
