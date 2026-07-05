// Cultist 施法动画：8 帧——举烛台蓄力（幽焰渐盛），末帧掌心汇聚幽焰球待发。
import { CultistGenerator } from './CultistGenerator.js';

const generator = new CultistGenerator();

export const CULTIST_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const chargePhase = Math.min(1, i / 6);
    CULTIST_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: 0,
        robeWave: i / 8,
        cast: chargePhase,
        flamePulse: chargePhase
    }));
}
