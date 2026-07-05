// PlagueRat 疾走动画：12 帧——贴地窜行压低 + 四足高频窜动 + 尾巴狂甩（性格=神经质）。
import { PlagueRatGenerator } from './PlagueRatGenerator.js';

const generator = new PlagueRatGenerator();

export const PLAGUE_RAT_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;

    PLAGUE_RAT_RUN_FRAMES.push(generator.generateFrame({
        legPhase: phase,                                  // 四足高频交替
        bob: Math.round(Math.abs(Math.sin(rad)) * 1.5),
        tailWave: (phase * 2) % 1,                         // 尾双循环狂甩
        twitch: 0,
        rear: 0,
        crouch: 0.7,                                       // 贴地窜行压低身形
        snarl: 0
    }));
}
