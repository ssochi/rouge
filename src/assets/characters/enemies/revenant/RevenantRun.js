// 复生亡灵行进：12 帧——佝偻蹒跚前扑，绷带飘动、身体起伏。normal/revived 两套。
import { RevenantGenerator } from './RevenantGenerator.js';

const generator = new RevenantGenerator();

function build(eyeRed) {
    const frames = [];
    for (let i = 0; i < 12; i++) {
        const phase = i / 12;
        const stride = Math.sin(phase * Math.PI * 2);
        frames.push(generator.generateFrame({
            bob: Math.round(Math.abs(stride) * -1.2),
            legPhase: phase,
            armSwing: stride * 0.8,
            eyeRed,
            wrapWave: (phase * 1.3) % 1,
            slump: 0.6
        }));
    }
    return frames;
}

export const REVENANT_RUN_FRAMES = build(0);
export const REVENANT_RUN_FRAMES_REVIVED = build(1);
