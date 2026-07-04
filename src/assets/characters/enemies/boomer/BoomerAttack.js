// Boomer 引信动画：8 帧——膨胀充能 + 红闪加速（自爆前摇）。
import { BoomerGenerator } from './BoomerGenerator.js';

const generator = new BoomerGenerator();

export const BOOMER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;

    BOOMER_ATTACK_FRAMES.push(generator.generateFrame({
        squash: -Math.round(attackPhase * 2), // 膨胀挺起
        wobble: i % 2 === 0 ? 1 : -1,          // 危险抖动
        legFrame: i % 6,
        bloat: attackPhase,
        redFlash: i % 2 === 0 ? attackPhase : attackPhase * 0.45 // 交替闪烁
    }));
}
