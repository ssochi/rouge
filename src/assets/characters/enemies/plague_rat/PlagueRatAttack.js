// PlagueRat 撕咬动画：8 帧——猛地前扑张口啃咬（接触伤害瞬间播放）。
import { PlagueRatGenerator } from './PlagueRatGenerator.js';

const generator = new PlagueRatGenerator();

export const PLAGUE_RAT_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    const lunge = Math.sin(attackPhase * Math.PI); // 0→1→0 前扑
    PLAGUE_RAT_ATTACK_FRAMES.push(generator.generateFrame({
        legPhase: 0,
        bob: -Math.round(lunge * 1),
        tailWave: attackPhase,
        twitch: 1
    }));
}
