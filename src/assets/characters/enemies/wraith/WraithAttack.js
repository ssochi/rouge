// Wraith 怨爆动画：8 帧——怨气聚集外放（接触攻击/死亡爆散）。
import { WraithGenerator } from './WraithGenerator.js';

const generator = new WraithGenerator();

export const WRAITH_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7;
    WRAITH_ATTACK_FRAMES.push(generator.generateFrame({
        floatY: -Math.round(attackPhase * 2),
        tailWave: attackPhase,
        lean: 1,
        flare: attackPhase
    }));
}
