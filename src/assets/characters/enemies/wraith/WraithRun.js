// Wraith 追击动画：12 帧——前倾疾漂 + 拖尾高频摆。
import { WraithGenerator } from './WraithGenerator.js';

const generator = new WraithGenerator();

export const WRAITH_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    WRAITH_RUN_FRAMES.push(generator.generateFrame({
        floatY: Math.round(Math.sin(phase * Math.PI * 4) * 1.5),
        tailWave: (phase * 2) % 1,
        lean: 2,
        flare: 0.3
    }));
}
