// Boomer 引信动画：8 帧——腹囊膨胀充能 + 背裂扩大发光 + 红闪加速 + 末段裂纹网蔓延（自爆前摇）。
import { BoomerGenerator } from './BoomerGenerator.js';

const generator = new BoomerGenerator();

export const BOOMER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7; // 0 → 1 引信推进

    BOOMER_ATTACK_FRAMES.push(generator.generateFrame({
        squash: -Math.round(t * 2),                       // 膨胀挺起（变高）
        wobble: i % 2 === 0 ? 1 : -1,                     // 危险高频抖动
        legFrame: i % 6,                                  // 腿部躁动
        bloat: t,                                         // 膨胀 + 背裂随之扩大发光
        redFlash: i % 2 === 0 ? t : t * 0.45,             // 交替闪烁，越近越强
        pustulePhase: (t * 3) % 1,                        // 脓包狂闪
        crackSpread: Math.max(0, (t - 0.5) / 0.5)         // 后半程裂纹网蔓延
    }));
}
