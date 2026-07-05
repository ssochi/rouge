// Lobber 投掷动画：8 帧——下蹲蓄力 → 拧腰 → 抡臂过肩 → 释放跟随。引线火花随蓄力烧向线端。
import { LobberGenerator } from './LobberGenerator.js';

const generator = new LobberGenerator();

export const LOBBER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7;
    // 阶段划分：0~0.3 下蹲蓄力；0.3~0.85 拧腰抡臂；0.85~1 释放跟随
    let squash, arm, twist;
    if (t < 0.3) {
        // 下蹲蓄力：身体压低，手臂后压腰间
        const s = t / 0.3;
        squash = 2;
        arm = -0.05 * s;             // 手略后引（负→贴腰后）
        twist = -s;                  // 反向拧腰蓄力
    } else if (t < 0.85) {
        // 拧腰抡臂：起身发力，手臂过肩
        const s = (t - 0.3) / 0.55;
        squash = Math.round(2 - s * 3);   // 由蹲转挺
        arm = s;                          // 抡臂 0→1
        twist = -1 + s * 2;               // 由后拧转前送
    } else {
        // 释放跟随
        const s = (t - 0.85) / 0.15;
        squash = -1;
        arm = 1;                          // 已释放（>0.95 空手）
        twist = 1 - s * 0.5;              // 前送后回收
    }

    LOBBER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: squash,
        legFrame: 0,
        armPhase: Math.max(0, arm),
        sparkTravel: Math.min(1, t * 1.2),          // 火花随蓄力烧向线端
        twist,
        tossBall: -1
    }));
}
