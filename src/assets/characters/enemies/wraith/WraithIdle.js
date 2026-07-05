// Wraith 待机动画：16 帧——浮沉 + 拖尾摆动。
import { WraithGenerator } from './WraithGenerator.js';

const generator = new WraithGenerator();

export const WRAITH_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    WRAITH_IDLE_FRAMES.push(generator.generateFrame({
        floatY: Math.round(Math.sin(phase * Math.PI * 2) * 2),
        tailWave: phase,
        flare: 0
    }));
}
