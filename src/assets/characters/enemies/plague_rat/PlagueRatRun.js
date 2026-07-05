// PlagueRat 疾走动画：12 帧——四足高频窜动 + 尾巴甩鞭。
import { PlagueRatGenerator } from './PlagueRatGenerator.js';

const generator = new PlagueRatGenerator();

export const PLAGUE_RAT_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    PLAGUE_RAT_RUN_FRAMES.push(generator.generateFrame({
        legPhase: phase,
        bob: Math.round(Math.abs(Math.sin(phase * Math.PI * 2)) * 1.5),
        tailWave: (phase * 2) % 1,
        twitch: 0
    }));
}
