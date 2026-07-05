// 雨幕射手待机：16 帧——微弱呼吸起伏 + 破布轻摆 + 独目幽蓝火明灭（垂弓，斗笠低压）。
import { RainArcherGenerator } from './RainArcherGenerator.js';

const generator = new RainArcherGenerator();

export const RAIN_ARCHER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    RAIN_ARCHER_IDLE_FRAMES.push(generator.generateFrame({
        bodyY: breath * 0.5,
        legFrame: 0,
        aimUp: 0,
        draw: 0,
        headUp: 0,
        wrapWave: phase,
        glow: 0.4 + (breath + 1) * 0.15
    }));
}
