// 复生亡灵挥爪：8 帧——枯爪蓄力后前挥抓击（attackPhase 0~1 + drawAttackArms）。normal/revived 两套。
import { RevenantGenerator } from './RevenantGenerator.js';

const generator = new RevenantGenerator();

function build(eyeRed) {
    const frames = [];
    for (let i = 0; i < 8; i++) {
        const attackPhase = i / 7;
        // 前冲联动：蓄力略后仰，挥击前倾
        const slump = attackPhase < 0.5 ? 0.3 : 0.8;
        frames.push(generator.generateFrame({
            bob: attackPhase < 0.5 ? 0 : -1,
            legPhase: -1,
            attackPhase,
            eyeRed,
            wrapWave: attackPhase,
            slump
        }));
    }
    return frames;
}

export const REVENANT_ATTACK_FRAMES = build(0);
export const REVENANT_ATTACK_FRAMES_REVIVED = build(1);
