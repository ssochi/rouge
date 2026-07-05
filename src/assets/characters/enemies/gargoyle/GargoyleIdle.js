// Gargoyle 待机动画：16 帧（苏醒后）——半展翼微扇 + 眼火明灭 + 躯体微呼吸。
import { GargoyleGenerator } from './GargoyleGenerator.js';

const generator = new GargoyleGenerator();

export const GARGOYLE_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const flap = Math.sin(phase * Math.PI * 2);

    GARGOYLE_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(flap * 0.6),
        wingSpread: 0.35 + flap * 0.15, // 半展、微幅张敛
        wingFlap: flap * 0.5,            // 翼尖轻扇
        headBow: 0,
        eyeGlow: 0.5 + flap * 0.25,      // 眼火明灭
        hover: 0,
        crack: 0
    }));
}
