// Cultist 待机动画：16 帧——袍身微呼吸 + 烛焰轻曳。
import { CultistGenerator } from './CultistGenerator.js';

const generator = new CultistGenerator();

export const CULTIST_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const breath = Math.sin(phase * Math.PI * 2);
    CULTIST_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(breath * 0.7),
        robeWave: phase,
        cast: 0,
        flamePulse: 0.2 + Math.abs(breath) * 0.15
    }));
}
