// PounceChargeBehavior —— 冲刺扑击：距离带内概率触发的预警扑击（敏捷近战的压迫动词）。
// 与 TelegraphedChargeBehavior（Hellhound 的高速直线撞击）的区别：
//   1. 距离带触发（minRange~maxRange）——只在"不远不近"的扑击甜区发动，贴脸/远距离不扑；
//   2. 冷却结束后按概率触发（失败短暂重试）——群体不会同帧齐扑，制造零散的突刺威胁；
//   3. 低速扑击（1.5x）+ 蓄力预警（getPhase/getTelegraphLine 供实体渲染蹲伏/变色）；
//      扑击期间的接触伤害由实体照常结算（本行为只负责位移与状态，命中用 tryConsumeHit 做一次性闸门）。
// 状态机：idle → telegraph(蓄力/蹲伏，定身) → charge(直线扑击) → recover(硬直) → idle
import { moveBy } from './BehaviorUtils.js';

export class PounceChargeBehavior {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.minRange=100]      触发距离带下限（更近不扑，直接普攻/接触）
     * @param {number} [opts.maxRange=200]      触发距离带上限（更远不扑，先逼近）
     * @param {number} [opts.telegraphTime=30]  蓄力帧数（~0.5s@60fps）
     * @param {number} [opts.chargeTime=36]     扑击帧数（~0.6s@60fps）
     * @param {number} [opts.recoverTime=24]    硬直帧数（~0.4s@60fps）
     * @param {number} [opts.speedMult=1.5]     扑击速度倍率
     * @param {number} [opts.cooldown=150]      成功扑击后冷却帧数
     * @param {number} [opts.triggerChance=0.5] 处于距离带且冷却结束时，每次判定的触发概率
     * @param {number} [opts.retryDelay=24]     概率判定失败后的重试间隔帧数（避免每帧掷点）
     * @param {number} [opts.lineLength=180]    预警线长度（px，供实体绘制）
     * @param {Function} [opts.rng=Math.random] 随机源（便于测试注入）
     */
    constructor({
        minRange = 100,
        maxRange = 200,
        telegraphTime = 30,
        chargeTime = 36,
        recoverTime = 24,
        speedMult = 1.5,
        cooldown = 150,
        triggerChance = 0.5,
        retryDelay = 24,
        lineLength = 180,
        rng = Math.random
    } = {}) {
        this.minRange = minRange;
        this.maxRange = maxRange;
        this.telegraphTime = telegraphTime;
        this.chargeTime = chargeTime;
        this.recoverTime = recoverTime;
        this.speedMult = speedMult;
        this.cooldown = cooldown;
        this.triggerChance = triggerChance;
        this.retryDelay = retryDelay;
        this.lineLength = lineLength;
        this.rng = rng;

        this.state = 'idle'; // idle | telegraph | charge | recover
        this.timer = 0;
        this.cooldownTimer = Math.floor(cooldown * 0.4); // 进房不立即扑击
        this.dirX = 0;
        this.dirY = 0;
        this.hitConsumed = false;
    }

    /** 纯决策（供测试）：距离在带内且掷点命中概率 → 触发。 */
    decideTrigger(dist, roll) {
        if (dist < this.minRange || dist > this.maxRange) return false;
        return roll < this.triggerChance;
    }

    /** 是否正处于蓄力预警（实体据此渲染蹲伏/变色）。 */
    get isTelegraphing() { return this.state === 'telegraph'; }
    /** 是否正在扑击（实体据此结算接触伤害 / 锁定朝向 / 切 run 动画）。 */
    get isCharging() { return this.state === 'charge'; }

    /** 预警/扑击进度信息（供实体绘制），idle 时返回 null。 */
    getPhase() {
        if (this.state === 'idle') return null;
        let total = this.telegraphTime;
        if (this.state === 'charge') total = this.chargeTime;
        else if (this.state === 'recover') total = this.recoverTime;
        return {
            state: this.state,
            progress: total > 0 ? 1 - this.timer / total : 1,
            dirX: this.dirX,
            dirY: this.dirY
        };
    }

    /** 预警线数据（仅 telegraph 时非 null）：{x1,y1,x2,y2,progress}。 */
    getTelegraphLine(enemy) {
        if (this.state !== 'telegraph') return null;
        return {
            x1: enemy.x,
            y1: enemy.y,
            x2: enemy.x + this.dirX * this.lineLength,
            y2: enemy.y + this.dirY * this.lineLength,
            progress: 1 - this.timer / this.telegraphTime
        };
    }

    /** 扑击期一次性命中闸门：本次扑击尚未结算过接触伤害则返回 true 并标记。 */
    tryConsumeHit() {
        if (this.state !== 'charge' || this.hitConsumed) return false;
        this.hitConsumed = true;
        return true;
    }

    /** @returns {boolean} 是否接管了本帧移动（telegraph/charge/recover 期间实体不应再自行移动）。 */
    update(ctx) {
        const e = ctx.enemy;
        switch (this.state) {
            case 'idle': {
                if (this.cooldownTimer > 0) { this.cooldownTimer--; return false; }
                const dx = ctx.player.x - e.x;
                const dy = ctx.player.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (!this.decideTrigger(dist, this.rng())) {
                    this.cooldownTimer = this.retryDelay; // 判定失败：短暂重试，避免每帧掷点
                    return false;
                }
                const inv = 1 / (dist || 1);
                this.dirX = dx * inv;
                this.dirY = dy * inv;
                this.state = 'telegraph';
                this.timer = this.telegraphTime;
                this.hitConsumed = false;
                return true;
            }
            case 'telegraph': {
                this.timer--;
                if (this.timer <= 0) { this.state = 'charge'; this.timer = this.chargeTime; }
                return true; // 定身蓄力
            }
            case 'charge': {
                moveBy(ctx, this.dirX, this.dirY, this.speedMult);
                this.timer--;
                if (this.timer <= 0) { this.state = 'recover'; this.timer = this.recoverTime; }
                return true;
            }
            case 'recover': {
                this.timer--;
                if (this.timer <= 0) { this.state = 'idle'; this.cooldownTimer = this.cooldown; }
                return true;
            }
            default:
                this.state = 'idle';
                return false;
        }
    }
}
