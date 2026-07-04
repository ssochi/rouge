// ChaseBehavior —— 流场追击（Hunter.moveTowards 通用化）。
import { steerToward } from './BehaviorUtils.js';

export class ChaseBehavior {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.speedMult=1] 追击速度倍率
     */
    constructor({ speedMult = 1 } = {}) {
        this.speedMult = speedMult;
    }

    /** @returns {'run'} 状态提示（供实体切动画） */
    update(ctx) {
        steerToward(ctx, ctx.player.x, ctx.player.y, this.speedMult, true);
        return 'run';
    }
}
