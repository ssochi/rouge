// Boomer 待机动画：16 帧——腹囊鼓胀呼吸 + 荧液缓慢左右晃动 + 脓包错相明灭。
import { BoomerGenerator } from './BoomerGenerator.js';

const generator = new BoomerGenerator();

export const BOOMER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;
    const breath = Math.sin(rad);

    BOOMER_IDLE_FRAMES.push(generator.generateFrame({
        squash: Math.round(breath * 1.2),                 // 鼓胀呼吸
        wobble: Math.round(Math.sin(rad * 0.5) * 2),      // 荧液慢晃（半频，来回一次）
        legFrame: 0,
        bloat: 0,
        redFlash: 0,
        pustulePhase: phase,                              // 脓包整周期明灭一轮
        crackSpread: 0
    }));
}
