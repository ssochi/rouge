import { ZombieFemaleGenerator } from './ZombieFemaleGenerator.js';

/**
 * Female Zombie Attack Animation — 8 frames
 * Phases: Wind-up (2) → Lunge (2) → Strike (2) → Recovery (2)
 * Quicker, scratchier attack than male zombie
 */
const generator = new ZombieFemaleGenerator();

const ATTACK_KEYFRAMES = [
    // Frame 0-1: Wind-up
    { attackPhase: 0.0,  bodySquash: 1,  jawOpen: 0, hairWave: 0 },
    { attackPhase: 0.15, bodySquash: 1,  jawOpen: 0, hairWave: 0.1 },
    // Frame 2-3: Lunge
    { attackPhase: 0.35, bodySquash: -1, jawOpen: 1, hairWave: 0.3 },
    { attackPhase: 0.48, bodySquash: -1, jawOpen: 1, hairWave: 0.4 },
    // Frame 4-5: Strike
    { attackPhase: 0.6,  bodySquash: -1, jawOpen: 2, hairWave: 0.5 },
    { attackPhase: 0.72, bodySquash: 0,  jawOpen: 2, hairWave: 0.6 },
    // Frame 6-7: Recovery
    { attackPhase: 0.88, bodySquash: 0,  jawOpen: 1, hairWave: 0.7 },
    { attackPhase: 1.0,  bodySquash: 0,  jawOpen: 0, hairWave: 0.8 },
];

export const ZOMBIE_FEMALE_ATTACK_FRAMES = ATTACK_KEYFRAMES.map(kf =>
    generator.generateFrame({
        attackPhase: kf.attackPhase,
        bodySquash: kf.bodySquash,
        headOffset: { y: kf.bodySquash > 0 ? 1 : kf.bodySquash < 0 ? -1 : 0 },
        headTwitch: { x: kf.bodySquash < 0 ? -1 : 0, y: 0 },
        jawOpen: kf.jawOpen,
        hairWave: kf.hairWave,
        coatWave: kf.attackPhase * 0.5,
        legFrame: 'idle'
    })
);
