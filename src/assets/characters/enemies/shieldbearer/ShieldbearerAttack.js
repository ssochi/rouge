// Shieldbearer 盾击动画：8 帧——蓄力后猛推塔盾。
import { ShieldbearerGenerator } from './ShieldbearerGenerator.js';

const generator = new ShieldbearerGenerator();

export const SHIELDBEARER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    // 前 40% 后拉蓄力，之后猛推
    const push = attackPhase < 0.4
        ? -attackPhase * 2
        : Math.sin((attackPhase - 0.4) / 0.6 * Math.PI) * 3;

    SHIELDBEARER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: attackPhase > 0.4 ? -1 : 1,
        step: 0,
        shieldForward: push,
        headBob: 0
    }));
}
