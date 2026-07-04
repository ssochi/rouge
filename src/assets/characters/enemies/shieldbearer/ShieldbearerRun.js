// Shieldbearer 推进动画：12 帧——沉重踏步 + 身体重心起伏。
import { ShieldbearerGenerator } from './ShieldbearerGenerator.js';

const generator = new ShieldbearerGenerator();

export const SHIELDBEARER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const stomp = Math.abs(Math.sin(phase * Math.PI * 2));

    SHIELDBEARER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(stomp * 1.5),
        step: Math.floor(phase * 4),
        shieldForward: 0,
        headBob: Math.floor(stomp)
    }));
}
