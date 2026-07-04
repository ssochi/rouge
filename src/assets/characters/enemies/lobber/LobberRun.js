// Lobber 小跑动画：12 帧——短腿快步 + 前倾。
import { LobberGenerator } from './LobberGenerator.js';

const generator = new LobberGenerator();

export const LOBBER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));

    LOBBER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(bob * 1.2),
        legFrame: Math.floor(phase * 4),
        armPhase: 0,
        spark: i % 4 < 2,
        lean: 1
    }));
}
