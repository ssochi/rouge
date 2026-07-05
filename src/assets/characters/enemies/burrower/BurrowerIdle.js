// 掘地虫露头待机：16 帧——完全拔起、体节缓慢波动 + 大颚咀嚼开合 + 复眼明灭。
import { BurrowerGenerator } from './BurrowerGenerator.js';

const generator = new BurrowerGenerator();

export const BURROWER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const chew = (Math.sin(phase * Math.PI * 4) + 1) / 2; // 两次咀嚼
    BURROWER_IDLE_FRAMES.push(generator.generateFrame({
        rear: 1,
        undulate: phase,
        mandible: 0.2 + chew * 0.4,
        burst: 0,
        glow: 0.35 + chew * 0.25
    }));
}
