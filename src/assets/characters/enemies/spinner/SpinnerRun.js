// 焰旋妖移动：12 帧——中速旋转 + 倾斜漂移（tilt 摆动）+ 焰体拉长。
import { SpinnerGenerator } from './SpinnerGenerator.js';

const generator = new SpinnerGenerator();

export const SPINNER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const sway = Math.sin(phase * Math.PI * 2);
    SPINNER_RUN_FRAMES.push(generator.generateFrame({
        spin: (phase * 1.5) % 1,           // 稍快转
        flare: 0.45,
        tilt: Math.round(sway * 2),        // 左右漂移倾斜
        bob: Math.round(Math.cos(phase * Math.PI * 2) * 1),
        eyeGlow: 0.35,
        trail: 0.25
    }));
}
