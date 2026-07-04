// Warlock 施法动画：8 帧——举杖蓄力，宝珠充能到爆闪后收杖。
import { WarlockGenerator } from './WarlockGenerator.js';

const generator = new WarlockGenerator();

export const WARLOCK_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const attackPhase = i / 7; // 0 → 1
    const raise = Math.sin(attackPhase * Math.PI); // 举起后收回
    const pulse = attackPhase < 0.75 ? attackPhase * 1.2 : 1 - (attackPhase - 0.75) * 2;

    WARLOCK_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: -Math.floor(raise * 1.5), // 蓄力挺身
        headOffset: { x: 0, y: -Math.floor(raise) },
        robeWave: attackPhase,
        staffRaise: raise,
        orbPulse: Math.min(1, Math.max(0, pulse))
    }));
}
