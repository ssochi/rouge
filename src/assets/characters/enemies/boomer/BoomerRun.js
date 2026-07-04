// Boomer 疾走动画：12 帧——短腿快摆 + 身体大幅摇晃。
import { BoomerGenerator } from './BoomerGenerator.js';

const generator = new BoomerGenerator();

export const BOOMER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;

    BOOMER_RUN_FRAMES.push(generator.generateFrame({
        squash: Math.floor(Math.sin(rad * 2) * 1.5),
        wobble: Math.round(Math.sin(rad) * 2),
        legFrame: i % 6,
        bloat: 0,
        redFlash: 0
    }));
}
