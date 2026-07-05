// Cultist 待机动画：16 帧——袍身微呼吸 + 烛焰轻曳 + 下颌低语开合（诵经性格演出）。
import { CultistGenerator } from './CultistGenerator.js';

const generator = new CultistGenerator();

export const CULTIST_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;
    const breath = Math.sin(rad);

    CULTIST_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(breath * 0.7),
        robeWave: phase,
        cast: 0,
        flamePulse: 0.25 + Math.abs(breath) * 0.15,      // 烛焰随呼吸轻曳
        whisper: (Math.sin(rad * 3) * 0.5 + 0.5),         // 下颌高频低语（诵经）
        emberCount: 0,
        hemFlip: 0
    }));
}
