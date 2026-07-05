// Archer 射击动画：8 帧——举弩瞄准蓄力（前 6 帧），击发后坐（后 2 帧）。
import { ArcherGenerator } from './ArcherGenerator.js';

const generator = new ArcherGenerator();

export const ARCHER_ATTACK_FRAMES = [];

for (let i = 0; i < 8; i++) {
    const isFiring = i >= 6;
    const chargePhase = Math.min(1, i / 5);
    ARCHER_ATTACK_FRAMES.push(generator.generateFrame({
        bodySquash: isFiring ? 1 : 0,
        legFrame: 0,
        aim: 1,
        charge: isFiring ? 0 : chargePhase,
        recoil: isFiring
    }));
}
