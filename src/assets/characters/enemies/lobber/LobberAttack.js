// Lobber 投掷动画：8 帧——下蹲蓄力 → 抡臂过肩释放。
import { LobberGenerator } from './LobberGenerator.js';

const generator = new LobberGenerator();

export const LOBBER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    // 前 30% 蓄力下蹲，之后抡臂
    const arm = attackPhase < 0.3 ? 0 : (attackPhase - 0.3) / 0.7;

    LOBBER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: attackPhase < 0.3 ? 2 : -1,
        legFrame: 0,
        armPhase: arm,
        spark: true
    }));
}
