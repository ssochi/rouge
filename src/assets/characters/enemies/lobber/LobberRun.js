// Lobber 小跑动画：12 帧——矮壮短腿快步 + 前倾 + 背桶随步伐颠 + 引线火花闪烁。
import { LobberGenerator } from './LobberGenerator.js';

const generator = new LobberGenerator();

export const LOBBER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));

    LOBBER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(bob * 1.2),
        legFrame: Math.floor(phase * 4),
        armPhase: 0.05,                              // 持弹小跑（腰间握弹）
        sparkTravel: (phase * 3) % 1,               // 奔跑中火花快速走线
        lean: 1,
        tossBall: -1                                 // 移动时不抛接
    }));
}
