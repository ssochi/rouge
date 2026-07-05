// PlagueRat 待机动画：16 帧——嗅探拱背 + 尾尖蛇摆 + 耳须神经质抽动（性格=神经质）。
import { PlagueRatGenerator } from './PlagueRatGenerator.js';

const generator = new PlagueRatGenerator();

export const PLAGUE_RAT_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // 拱背随嗅探轻微起伏
    const bob = Math.round(Math.sin(rad) * 0.5);
    // 抽搐：神经质的“随机帧”急促抖动（第 3/4/9/12 帧）
    let twitch = 0;
    if (i === 3 || i === 4 || i === 9 || i === 12) twitch = 1;

    PLAGUE_RAT_IDLE_FRAMES.push(generator.generateFrame({
        legPhase: 0,
        bob,
        tailWave: phase,   // 尾尖缓慢蛇摆
        twitch,
        rear: 0,
        crouch: 0,
        snarl: 0
    }));
}
