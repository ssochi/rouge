// Archer 待机动画：16 帧——骨架轻晃 + 弩垂放 + 头骨机械扫视 + 下颌咔哒咬合（性格=机械刻板）。
import { ArcherGenerator } from './ArcherGenerator.js';

const generator = new ArcherGenerator();

export const ARCHER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);

    // 头骨机械扫视：分段跳变而非平滑（刻板感）——每 4 帧切一个朝向
    const scan = [0, 0, -0.6, -0.6, -0.6, 0, 0.6, 0.6, 0.6, 0, 0, -0.6, -0.6, 0, 0.6, 0.6];
    const headTurn = scan[i];

    // 下颌咬合：固定节拍开合（第 3、11 帧张口“咔哒”一下）
    let jawClench = 1;
    if (i === 3 || i === 11) jawClench = 0;

    ARCHER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(breath * 0.7),
        legFrame: 0,
        aim: 0.1,
        charge: 0,
        headTurn,
        jawClench,
        stringDraw: 0.2,
        cloakWave: phase // 披肩随风轻摆
    }));
}
