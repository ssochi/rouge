// Hellhound 待机动画：16 帧——低伏喘息 + 焰鬃摇曳。
import { HellhoundGenerator } from './HellhoundGenerator.js';

const generator = new HellhoundGenerator();

export const HELLHOUND_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    HELLHOUND_IDLE_FRAMES.push(generator.generateFrame({
        legPhase: 0,
        bob: Math.round(Math.sin(phase * Math.PI * 2) * 1),
        lunge: 0,
        ember: 0.4 + Math.sin(phase * Math.PI * 2) * 0.2
    }));
}
