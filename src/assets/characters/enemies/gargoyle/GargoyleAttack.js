// Gargoyle 破石苏醒 / 扑击动画：8 帧——裂石抖尘（前段）→ 展翼睁眼前扑（后段）。
import { GargoyleGenerator } from './GargoyleGenerator.js';

const generator = new GargoyleGenerator();

export const GARGOYLE_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7;
    GARGOYLE_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: i < 3 ? Math.round(Math.sin(i) * 1) : -Math.round(t * 2),
        wingSpread: Math.min(1, t * 1.3),
        headBow: Math.max(0, 1 - t * 2), // 抬头
        eyeGlow: Math.min(1, t * 1.5),
        crack: Math.max(0, 1 - t * 1.5) // 裂纹随苏醒剥落
    }));
}
