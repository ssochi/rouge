// 掘地虫破土：8 帧——出土爆发（attackPhase 0~1）：由地表冲起、泥屑四溅、大颚猛张咬合。
import { BurrowerGenerator } from './BurrowerGenerator.js';

const generator = new BurrowerGenerator();

export const BURROWER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    // 0→0.5 拔地冲起 + 爆土；0.5→1 大颚猛咬
    const rear = Math.min(1, attackPhase * 2);
    const burst = attackPhase < 0.5 ? 1 - attackPhase * 1.4 : 0.15;
    const mandible = attackPhase < 0.5 ? 0.9 : 0.9 - (attackPhase - 0.5) * 1.4;
    BURROWER_ATTACK_FRAMES.push(generator.generateFrame({
        rear,
        undulate: attackPhase * 0.5,
        mandible: Math.max(0, mandible),
        burst: Math.max(0, burst),
        glow: 0.8
    }));
}
