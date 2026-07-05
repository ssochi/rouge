// Gargoyle 破石苏醒 / 俯冲扑击动画：8 帧——
// 前段：裂石抖尘、展翼睁眼、抬头；后段：翼后掠俯冲下扑。
import { GargoyleGenerator } from './GargoyleGenerator.js';

const generator = new GargoyleGenerator();

export const GARGOYLE_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const diving = t > 0.6; // 后段：俯冲

    GARGOYLE_ATTACK_FRAMES.push(generator.generateFrame({
        // 苏醒微弹（前段）→ 俯冲下压（后段）
        bodySquash: i < 3 ? Math.round(Math.sin(i) * 1) : -Math.round(t * 2),
        wingSpread: Math.min(1, t * 1.3),        // 展翼渐全展
        wingFlap: diving ? -1 : 0.3,             // 俯冲时翼尖猛下压
        diveSweep: diving ? (t - 0.6) / 0.4 : 0, // 后段翼后掠
        headBow: Math.max(0, 1 - t * 2),         // 抬头
        eyeGlow: Math.min(1, t * 1.5),           // 睁眼炯炯
        hover: diving ? 0.5 : 0,                 // 俯冲腾空
        crack: Math.max(0, 1 - t * 1.5)          // 裂纹随苏醒剥落
    }));
}
