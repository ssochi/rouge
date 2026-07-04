// Warlock 移动动画：12 帧——前倾滑行 + 袍摆加速 + 轻浮沉。
import { WarlockGenerator } from './WarlockGenerator.js';

const generator = new WarlockGenerator();

export const WARLOCK_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;
    const bob = Math.sin(rad * 2);

    WARLOCK_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(bob * 1.2),
        headOffset: { x: 0, y: Math.floor(bob * 0.6) },
        robeWave: phase * 2 % 1, // 袍摆双倍频率
        lean: 1,
        staffRaise: 0.15,
        orbPulse: 0.2
    }));
}
