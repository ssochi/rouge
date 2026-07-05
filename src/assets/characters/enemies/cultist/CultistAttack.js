// Cultist 施法动画：8 帧——举烛台蓄力（三枝幽焰渐盛 + 周身浮焰渐增），末段三连喷发（袍摆后掀）。
import { CultistGenerator } from './CultistGenerator.js';

const generator = new CultistGenerator();

export const CULTIST_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const t = i / 7;                 // 0 → 1
    const releasing = t > 0.72;      // 末段三连喷发
    const charge = Math.min(1, t / 0.72);

    CULTIST_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: -Math.round(charge * 1.5),          // 蓄力挺身
        headOffset: { x: 0, y: -Math.round(charge) },
        robeWave: 0.25 + t * 0.5,
        cast: charge,                                    // 举烛台
        flamePulse: charge,                              // 三枝幽焰渐盛
        whisper: 0,
        emberCount: charge,                              // 周身浮焰渐增
        hemFlip: releasing ? (t - 0.72) / 0.28 : 0       // 喷发瞬间袍摆后掀
    }));
}
