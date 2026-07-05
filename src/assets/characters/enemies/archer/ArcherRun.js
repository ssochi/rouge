// Archer 移动动画：12 帧——骨腿交替 + 持弩半举。
import { ArcherGenerator } from './ArcherGenerator.js';

const generator = new ArcherGenerator();

export const ARCHER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));
    ARCHER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(bob * 1.2),
        legFrame: Math.floor(phase * 4),
        aim: 0.3,
        charge: 0
    }));
}
