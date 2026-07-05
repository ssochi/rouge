// PlagueRat 待机动画：16 帧——嗅探抽搐 + 尾尖轻摆。
import { PlagueRatGenerator } from './PlagueRatGenerator.js';

const generator = new PlagueRatGenerator();

export const PLAGUE_RAT_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    PLAGUE_RAT_IDLE_FRAMES.push(generator.generateFrame({
        legPhase: 0,
        bob: Math.round(Math.sin(phase * Math.PI * 2) * 0.5),
        tailWave: phase,
        twitch: Math.sin(phase * Math.PI * 6) > 0.7 ? 1 : 0
    }));
}
