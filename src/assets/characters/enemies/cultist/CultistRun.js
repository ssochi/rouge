// Cultist 移动动画：12 帧——袍摆前倾滑步（无独立腿帧）+ 烛焰摇动。
import { CultistGenerator } from './CultistGenerator.js';

const generator = new CultistGenerator();

export const CULTIST_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));
    CULTIST_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.floor(bob * 1.2),
        robeWave: (phase * 2) % 1,
        lean: 2,
        cast: 0.15,
        flamePulse: 0.3
    }));
}
