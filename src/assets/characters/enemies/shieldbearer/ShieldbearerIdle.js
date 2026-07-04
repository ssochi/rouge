// Shieldbearer 待机动画：16 帧——沉重呼吸 + 盾微沉。
import { ShieldbearerGenerator } from './ShieldbearerGenerator.js';

const generator = new ShieldbearerGenerator();

export const SHIELDBEARER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);

    SHIELDBEARER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(breath * 0.7),
        step: 0,
        shieldForward: 0,
        headBob: Math.floor(breath * 0.5)
    }));
}
