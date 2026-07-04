// Boomer 待机动画：16 帧——鼓胀呼吸 + 脓包蠕动。
import { BoomerGenerator } from './BoomerGenerator.js';

const generator = new BoomerGenerator();

export const BOOMER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;
    const breath = Math.sin(rad);

    BOOMER_IDLE_FRAMES.push(generator.generateFrame({
        squash: Math.floor(breath * 1.2),
        wobble: Math.round(Math.sin(rad * 0.5)),
        legFrame: 0,
        bloat: 0,
        redFlash: 0
    }));
}
