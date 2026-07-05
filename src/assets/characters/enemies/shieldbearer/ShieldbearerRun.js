// Shieldbearer 推进动画：12 帧——沉重踏步 + 重心起伏 + 落步扬尘 + 盾随踏步微沉。
import { ShieldbearerGenerator } from './ShieldbearerGenerator.js';

const generator = new ShieldbearerGenerator();

export const SHIELDBEARER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const stomp = Math.abs(Math.sin(phase * Math.PI * 2)); // 踏步落地强度
    const stepPhase = Math.floor(phase * 4);

    SHIELDBEARER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(stomp * 1.5),
        step: stepPhase,
        shieldForward: stomp > 0.7 ? -1 : 0,     // 落步瞬间盾略沉（负=不前推）
        headBob: Math.round(stomp),
        peek: 0,
        dust: stomp > 0.75 ? stomp : 0,          // 落地帧扬尘
        flash: 0
    }));
}
