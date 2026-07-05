// Hellhound 待机动画：16 帧——低伏狂喘（胸腔起伏 + 吐舌）+ 焰鬃焰眼明灭摇曳（性格=狂暴）。
import { HellhoundGenerator } from './HellhoundGenerator.js';

const generator = new HellhoundGenerator();

export const HELLHOUND_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // 狂喘：正弦胸腔起伏（快频，急促喘息感）
    const pant = 0.4 + Math.sin(phase * Math.PI * 4) * 0.4;
    // 身体随喘息轻微起伏
    const bob = Math.round(Math.sin(rad) * 1);
    // 焰强度随呼吸明灭
    const ember = 0.45 + Math.sin(rad) * 0.2;
    // 背脊随喘息微拱
    const spineArc = Math.sin(rad) * 0.3;

    HELLHOUND_IDLE_FRAMES.push(generator.generateFrame({
        legPhase: 0,
        bob,
        lunge: 0,
        ember,
        spineArc,
        pant,
        clawSpread: 0
    }));
}
