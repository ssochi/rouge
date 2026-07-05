// Archer 待机动画：16 帧——骨架轻晃 + 弩垂放。
import { ArcherGenerator } from './ArcherGenerator.js';

const generator = new ArcherGenerator();

export const ARCHER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    ARCHER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(breath * 0.7),
        legFrame: 0,
        aim: 0.1,
        charge: 0
    }));
}
