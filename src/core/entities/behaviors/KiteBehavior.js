// KiteBehavior —— 距离带拉扯：太近后撤、太远接近、带内横向漂移。
import { playerVector, moveBy, steerToward, steerAwayFromPlayer } from './BehaviorUtils.js';

export class KiteBehavior {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.near=160] 距离带下限（更近则后撤）
     * @param {number} [opts.far=260] 距离带上限（更远则接近）
     * @param {number} [opts.driftInterval=90] 带内漂移换向帧数
     */
    constructor({ near = 160, far = 260, driftInterval = 90 } = {}) {
        this.near = near;
        this.far = far;
        this.driftInterval = driftInterval;
        this.driftTimer = 0;
        this.driftSign = Math.random() > 0.5 ? 1 : -1;
    }

    /** 纯决策（供测试）：'retreat' | 'approach' | 'drift'。 */
    decide(dist) {
        if (dist < this.near) return 'retreat';
        if (dist > this.far) return 'approach';
        return 'drift';
    }

    /** @returns {'run'|'idle'} 状态提示 */
    update(ctx) {
        const { dist, nx, ny } = playerVector(ctx);
        const decision = this.decide(dist);

        if (decision === 'retreat') {
            steerAwayFromPlayer(ctx, 1);
            return 'run';
        }
        if (decision === 'approach') {
            steerToward(ctx, ctx.player.x, ctx.player.y, 1, true);
            return 'run';
        }

        // 带内：垂直连线缓慢漂移，周期换向
        this.driftTimer++;
        if (this.driftTimer >= this.driftInterval) {
            this.driftTimer = 0;
            this.driftSign = -this.driftSign;
        }
        moveBy(ctx, -ny * this.driftSign, nx * this.driftSign, 0.5);
        return 'run';
    }
}
