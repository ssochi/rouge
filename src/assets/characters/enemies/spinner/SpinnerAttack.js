// 焰旋妖施法：8 帧——高速旋转（每帧转 3/4 圈）+ 焰刃拉满 + 妖眼睁亮 + 焰痕拖尾。
import { SpinnerGenerator } from './SpinnerGenerator.js';

const generator = new SpinnerGenerator();

export const SPINNER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const phase = i / 8;
    SPINNER_ATTACK_FRAMES.push(generator.generateFrame({
        spin: (phase * 3) % 1,             // 极快转
        flare: 0.75 + Math.sin(phase * Math.PI * 2) * 0.2,
        bob: 0,
        eyeGlow: 0.85,
        trail: 0.9
    }));
}
