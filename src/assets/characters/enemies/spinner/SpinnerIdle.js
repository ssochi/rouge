// 焰旋妖待机：16 帧——慢速整圈旋转 + 悬浮升降 + 焰体轻脉动。
import { SpinnerGenerator } from './SpinnerGenerator.js';

const generator = new SpinnerGenerator();

export const SPINNER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    SPINNER_IDLE_FRAMES.push(generator.generateFrame({
        spin: phase,                       // 一圈慢转
        flare: 0.35 + Math.abs(breath) * 0.12,
        bob: Math.round(breath * 1.2),
        eyeGlow: 0.3 + Math.abs(breath) * 0.1,
        trail: 0
    }));
}
