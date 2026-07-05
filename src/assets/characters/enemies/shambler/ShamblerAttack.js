// 尸群蹒跚者扑抓：8 帧——蓄力(2)→前扑(2)→抓咬(2)→恢复(2)。
// drawAttackArms 按 attackPhase(0~1) 驱动双臂前伸扑抓，配合张嘴与身体前倾。
import { ShamblerGenerator } from './ShamblerGenerator.js';

const generator = new ShamblerGenerator();

export const SHAMBLER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    // 蓄力段（<0.25）身体后仰缩臂，之后猛地前扑
    const lunge = attackPhase < 0.25 ? -0.4 : Math.sin((attackPhase - 0.25) * Math.PI);
    SHAMBLER_ATTACK_FRAMES.push(generator.generateFrame({
        bodyY: lunge * 1.2,
        sway: -0.3 + attackPhase * 0.6,
        legPhase: 0,
        headTilt: 0.5,
        mouthOpen: attackPhase < 0.25 ? 0.4 : 1,
        attackPhase: Math.max(0, (attackPhase - 0.1) / 0.9)
    }));
}
