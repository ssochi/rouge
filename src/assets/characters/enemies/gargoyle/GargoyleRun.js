// Gargoyle 扑击移动动画：12 帧——半飞行（脚离地）+ 翼扇动 2 相位 + 眼火炽亮。
import { GargoyleGenerator } from './GargoyleGenerator.js';

const generator = new GargoyleGenerator();

export const GARGOYLE_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    // 翼扇动 2 相位：每个移动循环上/下扇两拍
    const flap = Math.sin(phase * Math.PI * 4);

    GARGOYLE_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(flap * 1),
        legFrame: Math.floor(phase * 4),
        wingSpread: 0.8,
        wingFlap: flap,                       // 上/下双相位扇动
        hover: 0.6 + Math.abs(flap) * 0.2,    // 半飞行离地（随扇动起伏）
        headBow: 0,
        eyeGlow: 0.85,
        crack: 0
    }));
}
