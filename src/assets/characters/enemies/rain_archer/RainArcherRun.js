// 雨幕射手走位：12 帧——保持距离的碎步游走（步态循环 + 破布飘动 + 箭筒随身晃，长弓垂持）。
import { RainArcherGenerator } from './RainArcherGenerator.js';

const generator = new RainArcherGenerator();

export const RAIN_ARCHER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));
    RAIN_ARCHER_RUN_FRAMES.push(generator.generateFrame({
        bodyY: bob * 0.9,
        legFrame: Math.floor(phase * 4),
        aimUp: 0,
        draw: 0,
        headUp: 0,
        wrapWave: (phase * 1.5) % 1,
        glow: 0.5
    }));
}
