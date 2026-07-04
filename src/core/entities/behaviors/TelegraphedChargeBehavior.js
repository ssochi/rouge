// TelegraphedChargeBehavior —— 预警冲锋：锁定方向亮预警线 → 直线冲锋 → 硬直恢复。
// 预警线视觉由实体 draw 消费 getTelegraphLine()。
import { moveBy } from './BehaviorUtils.js';

export class TelegraphedChargeBehavior {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.telegraphTime=40] 预警帧数
     * @param {number} [opts.chargeTime=26] 冲锋帧数
     * @param {number} [opts.recoverTime=45] 恢复硬直帧数
     * @param {number} [opts.speedMult=4] 冲锋速度倍率
     * @param {number} [opts.cooldown=180] 冷却帧数
     * @param {number} [opts.triggerRange=220] 发动距离
     * @param {number} [opts.lineLength=200] 预警线长度（px）
     */
    constructor({
        telegraphTime = 40,
        chargeTime = 26,
        recoverTime = 45,
        speedMult = 4,
        cooldown = 180,
        triggerRange = 220,
        lineLength = 200
    } = {}) {
        this.telegraphTime = telegraphTime;
        this.chargeTime = chargeTime;
        this.recoverTime = recoverTime;
        this.speedMult = speedMult;
        this.cooldown = cooldown;
        this.triggerRange = triggerRange;
        this.lineLength = lineLength;

        this.state = 'idle'; // idle | telegraph | charge | recover
        this.timer = 0;
        this.cooldownTimer = Math.floor(cooldown * 0.5);
        this.dirX = 0;
        this.dirY = 0;
    }

    /** 预警线数据（telegraph 状态时非 null）：{x1,y1,x2,y2,progress}。 */
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

    /** @returns {boolean} 是否接管了本帧移动（telegraph/charge/recover 期间实体不应再自行移动） */
    update(ctx) {
        const e = ctx.enemy;

        switch (this.state) {
            case 'idle': {
                if (this.cooldownTimer > 0) {
                    this.cooldownTimer--;
                    return false;
                }
                const dx = ctx.player.x - e.x;
                const dy = ctx.player.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > this.triggerRange || dist < 1) return false;
                this.dirX = dx / dist;
                this.dirY = dy / dist;
                this.state = 'telegraph';
                this.timer = this.telegraphTime;
                return true;
            }
            case 'telegraph': {
                this.timer--;
                if (this.timer <= 0) {
                    this.state = 'charge';
                    this.timer = this.chargeTime;
                }
                return true; // 定身瞄准
            }
            case 'charge': {
                moveBy(ctx, this.dirX, this.dirY, this.speedMult);
                this.timer--;
                if (this.timer <= 0) {
                    this.state = 'recover';
                    this.timer = this.recoverTime;
                }
                return true;
            }
            case 'recover': {
                this.timer--;
                if (this.timer <= 0) {
                    this.state = 'idle';
                    this.cooldownTimer = this.cooldown;
                }
                return true;
            }
            default:
                this.state = 'idle';
                return false;
        }
    }
}
