// StrafeBehavior —— 垂直于玩家连线的横移走位，周期换向（带随机抖动防群体同步）。
import { playerVector, moveBy } from './BehaviorUtils.js';

export class StrafeBehavior {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.interval=70] 基础换向帧数
     * @param {number} [opts.jitter=30] 换向随机抖动帧数
     * @param {number} [opts.speedMult=0.7] 横移速度倍率
     */
    constructor({ interval = 70, jitter = 30, speedMult = 0.7 } = {}) {
        this.interval = interval;
        this.jitter = jitter;
        this.speedMult = speedMult;
        this.timer = 0;
        this.sign = Math.random() > 0.5 ? 1 : -1;
        this.nextFlip = interval + Math.floor(Math.random() * jitter);
    }

    update(ctx) {
        const { nx, ny } = playerVector(ctx);
        this.timer++;
        if (this.timer >= this.nextFlip) {
            this.timer = 0;
            this.sign = -this.sign;
            this.nextFlip = this.interval + Math.floor(Math.random() * this.jitter);
        }
        moveBy(ctx, -ny * this.sign, nx * this.sign, this.speedMult);
        return 'run';
    }
}
