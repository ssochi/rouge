// Hellhound 前扑动画：8 帧——低伏蓄势（前段）→ 焰鬃暴涨前扑（后段）。
import { HellhoundGenerator } from './HellhoundGenerator.js';

const generator = new HellhoundGenerator();

export const HELLHOUND_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    HELLHOUND_ATTACK_FRAMES.push(generator.generateFrame({
        legPhase: 0,
        bob: attackPhase < 0.4 ? 1 : -Math.round(attackPhase * 2),
        lunge: Math.min(1, attackPhase * 1.2),
        ember: 0.6 + attackPhase * 0.4
    }));
}
