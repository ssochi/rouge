// PlagueRat 撕咬动画：8 帧——神经质地后腿骤然立起、龇露门牙，前扑啃咬后落地。
import { PlagueRatGenerator } from './PlagueRatGenerator.js';

const generator = new PlagueRatGenerator();

export const PLAGUE_RAT_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7;

    // 立起：前段猛地拔高（rear↑），第 5 帧起前扑下压
    const rear = t < 0.6 ? Math.min(1, t / 0.4) : Math.max(0, 1 - (t - 0.6) * 3);
    // 龇牙：立起即咧嘴，扑咬时最盛
    const snarl = Math.min(1, t * 1.5);
    // 前扑瞬间身体前压
    const bob = t > 0.6 ? -Math.round((t - 0.6) * 4) : 0;

    PLAGUE_RAT_ATTACK_FRAMES.push(generator.generateFrame({
        legPhase: 0,
        bob,
        tailWave: t,            // 尾随身形起伏摆动配平
        twitch: 1,              // 攻击时耳须全程紧绷抽动
        rear,
        crouch: 0,
        snarl
    }));
}
