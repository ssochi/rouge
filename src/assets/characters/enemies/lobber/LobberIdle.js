// Lobber 待机动画：16 帧——呼吸 + 引线火花闪烁。
import { LobberGenerator } from './LobberGenerator.js';

const generator = new LobberGenerator();

export const LOBBER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);

    LOBBER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(breath * 0.8),
        legFrame: 0,
        armPhase: 0,
        spark: i % 4 < 2
    }));
}
