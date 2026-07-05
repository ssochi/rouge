// Hellhound 奔跑动画：12 帧——四足两相位交替疾奔 + 焰鬃拉扬。
import { HellhoundGenerator } from './HellhoundGenerator.js';

const generator = new HellhoundGenerator();

export const HELLHOUND_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    HELLHOUND_RUN_FRAMES.push(generator.generateFrame({
        legPhase: phase,
        bob: Math.round(Math.abs(Math.sin(phase * Math.PI * 2)) * 2),
        lunge: 0,
        ember: 0.6 + Math.sin(phase * Math.PI * 4) * 0.3
    }));
}
