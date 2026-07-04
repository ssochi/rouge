// Warlock 待机动画：16 帧——呼吸 + 袍摆 + 宝珠缓慢脉动。
import { WarlockGenerator } from './WarlockGenerator.js';

const generator = new WarlockGenerator();

export const WARLOCK_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;
    const breath = Math.sin(rad);

    WARLOCK_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(breath * 0.8),
        headOffset: { x: 0, y: Math.floor(breath * 0.5) },
        robeWave: phase,
        staffRaise: 0,
        orbPulse: 0.25 + 0.2 * Math.sin(rad * 2) // 宝珠低频微光
    }));
}
