// 复生亡灵待机：16 帧——佝偻缓慢呼吸 + 绷带飘动 + 眼火明灭。normal/revived 两套（眼白/眼红）。
import { RevenantGenerator } from './RevenantGenerator.js';

const generator = new RevenantGenerator();

function build(eyeRed) {
    const frames = [];
    for (let i = 0; i < 16; i++) {
        const phase = i / 16;
        const breath = Math.sin(phase * Math.PI * 2);
        const twitch = (i >= 9 && i <= 11) ? 1 : 0; // 亡者抽搐
        frames.push(generator.generateFrame({
            bob: Math.round(breath * 0.8) + twitch,
            legPhase: -1,
            armSwing: breath * 0.15,
            eyeRed,
            wrapWave: phase,
            slump: 0.4 + twitch * 0.3
        }));
    }
    return frames;
}

export const REVENANT_IDLE_FRAMES = build(0);
export const REVENANT_IDLE_FRAMES_REVIVED = build(1);
