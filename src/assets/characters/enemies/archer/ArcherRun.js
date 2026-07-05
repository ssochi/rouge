// Archer 移动动画：12 帧——骨腿交替 + 半举弩 + 部件相位错开的骨架咔嗒感 + 披肩甩摆。
import { ArcherGenerator } from './ArcherGenerator.js';

const generator = new ArcherGenerator();

export const ARCHER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));

    // 部件错相：头/肩取“慢一帧”的相位，形成骨架松散的咔嗒错位
    const lagPhase = (i - 1 + 12) % 12 / 12;
    const partPhase = Math.sin(lagPhase * Math.PI * 2) * 1.2;

    ARCHER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(bob * 1.2),
        legFrame: Math.floor(phase * 4),
        aim: 0.35,
        charge: 0,
        partPhase,
        headTurn: -0.3,          // 前行时头略朝行进方向（左）
        jawClench: i % 2 === 0 ? 1 : 0, // 逐帧咬合，颚骨随步伐咔嗒
        stringDraw: 0.3,
        cloakWave: (phase * 2) % 1 // 披肩双循环大幅甩摆
    }));
}
