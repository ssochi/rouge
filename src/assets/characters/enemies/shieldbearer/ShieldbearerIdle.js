// Shieldbearer 待机动画：16 帧——沉重呼吸 + 盾微沉 + 头盔缓慢探出盾缘观察（探眼红光明灭）。
import { ShieldbearerGenerator } from './ShieldbearerGenerator.js';

const generator = new ShieldbearerGenerator();

export const SHIELDBEARER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;
    const breath = Math.sin(rad);
    // 探头：半周期缓慢探出再缩回（0→1→0）
    const peek = Math.max(0, Math.sin(rad));

    SHIELDBEARER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(breath * 0.7),
        step: 0,
        shieldForward: breath > 0.3 ? 0 : 1,     // 呼气时盾微沉一格
        headBob: Math.round(breath * 0.5),
        peek,                                     // 探眼观察
        dust: 0,
        flash: 0
    }));
}
