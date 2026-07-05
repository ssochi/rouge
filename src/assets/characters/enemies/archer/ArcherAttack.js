// Archer 射击动画：8 帧——举弩锁定（头转向+咬合）→ 弩弦满张蓄力发光 → 击发后坐+弦释放。
import { ArcherGenerator } from './ArcherGenerator.js';

const generator = new ArcherGenerator();

export const ARCHER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const isFiring = i >= 6;          // 后 2 帧：击发
    const raise = Math.min(1, i / 2); // 前 2 帧抬弩到水平
    const drawT = Math.min(1, Math.max(0, (i - 1) / 4)); // 第 1~5 帧张弦

    let stringDraw, charge, recoil, bodySquash, jawClench;
    if (isFiring) {
        // 击发瞬间：弦骤然释放、后坐、颚骨猛合
        stringDraw = 0;
        charge = 0;
        recoil = true;
        bodySquash = 1;
        jawClench = 1;
    } else {
        // 蓄力：弦逐渐满张、箭矢越来越亮、颚骨死咬瞄准
        stringDraw = drawT;
        charge = drawT;
        recoil = false;
        bodySquash = 0;
        jawClench = 1;
    }

    ARCHER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash,
        legFrame: 0,
        aim: raise,
        charge,
        recoil,
        headTurn: -0.8,  // 头骨死死转向目标（朝左锁定）
        jawClench,
        stringDraw,
        cloakWave: 0
    }));
}
