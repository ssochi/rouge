// Boomer 疾走动画：16→12 帧——六腿快摆 + 腹囊大幅摇晃 + 荧液剧烈晃动 + 脓包快闪。
import { BoomerGenerator } from './BoomerGenerator.js';

const generator = new BoomerGenerator();

export const BOOMER_RUN_FRAMES = [];

for (let i = 0; i < 12; i++) {
    const phase = i / 12;
    const rad = phase * Math.PI * 2;

    BOOMER_RUN_FRAMES.push(generator.generateFrame({
        squash: Math.round(Math.sin(rad * 2) * 1.5),      // 双频颠簸
        wobble: Math.round(Math.sin(rad) * 2),            // 腹囊左右大摆（荧液随之甩动）
        legFrame: i % 6,                                  // 六腿循环
        bloat: 0,
        redFlash: 0,
        pustulePhase: (phase * 2) % 1,                    // 奔跑时脓包快闪
        crackSpread: 0
    }));
}
