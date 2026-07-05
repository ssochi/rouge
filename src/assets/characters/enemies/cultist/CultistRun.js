// Cultist 移动动画：12 帧——袍摆前倾滑步（无独立腿帧）+ 烛焰摇动 + 火色内衬随摆闪现。
import { CultistGenerator } from './CultistGenerator.js';

const generator = new CultistGenerator();

export const CULTIST_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const bob = Math.abs(Math.sin(phase * Math.PI * 2));

    CULTIST_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: Math.round(bob * 1.2),
        robeWave: (phase * 2) % 1,                    // 袍摆双倍频
        lean: 2,
        cast: 0.15,                                   // 烛台略前伸
        flamePulse: 0.3,
        whisper: 0,
        emberCount: 0,
        hemFlip: 0
    }));
}
