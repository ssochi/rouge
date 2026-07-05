// Gargoyle 扑击移动动画：12 帧——展翼低扑 + 石腿交替 + 眼火炽亮。
import { GargoyleGenerator } from './GargoyleGenerator.js';

const generator = new GargoyleGenerator();

export const GARGOYLE_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const flap = Math.sin(phase * Math.PI * 2);
    GARGOYLE_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(Math.abs(flap) * 1.5),
        legFrame: Math.floor(phase * 4),
        wingSpread: 0.7 + flap * 0.25,
        headBow: 0,
        eyeGlow: 0.8,
        crack: 0
    }));
}
