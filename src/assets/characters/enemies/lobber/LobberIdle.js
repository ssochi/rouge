// Lobber 待机动画：16 帧——呼吸 + 抛接弹球小动作（上抛→接住循环）+ 引线火花闪烁（性格演出）。
import { LobberGenerator } from './LobberGenerator.js';

const generator = new LobberGenerator();

export const LOBBER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);

    LOBBER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(breath * 0.8),
        legFrame: 0,
        armPhase: 0.02,                              // 手垂于腰间，空手待接
        sparkTravel: (phase * 2) % 1,               // 火花在（腰间弹）引线上循环
        tossBall: phase,                            // 弹球每周期上抛下落一次（抛接）
        twist: 0
    }));
}
