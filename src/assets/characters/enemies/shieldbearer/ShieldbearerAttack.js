// Shieldbearer 盾击动画：8 帧——后拉蓄力 → 全身前压猛推塔盾 → 盾面闪光 → 收势。
import { ShieldbearerGenerator } from './ShieldbearerGenerator.js';

const generator = new ShieldbearerGenerator();

export const SHIELDBEARER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7;
    // 前 35% 后拉蓄力，之后猛推（正弦冲出）
    const windup = t < 0.35;
    const push = windup ? -t * 2 : Math.sin((t - 0.35) / 0.65 * Math.PI) * 4;
    // 盾面闪光：命中瞬间（推程峰值附近）爆闪
    const flash = (!windup && t > 0.45 && t < 0.75) ? 1 - Math.abs(t - 0.6) / 0.15 : 0;

    SHIELDBEARER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: windup ? 1 : -1,             // 蓄力下沉、推击挺身
        step: 0,
        shieldForward: push,
        headBob: 0,
        peek: 0,
        dust: (!windup && t > 0.5) ? 0.8 : 0,    // 推击带起地面尘
        flash: Math.max(0, flash),
        lean: windup ? 0 : Math.round(push * 0.5) // 推击时全身前压
    }));
}
