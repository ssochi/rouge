import { ZombieBruteGenerator } from './ZombieBruteGenerator.js';

/**
 * Zombie Brute Attack Animation — 8 frames
 * Phases: Wind-up (2) → Lunge (2) → Strike (2) → Recovery (2)
 * Slower, heavier smash attack with big fists
 */
const generator = new ZombieBruteGenerator();

const ATTACK_KEYFRAMES = [
    // Frame 0-1: Wind-up — heavy coil, fists raised
    { attackPhase: 0.0,  bodySquash: 2,  jawOpen: 0, headTwitch: { x: 0, y: 1 } },
    { attackPhase: 0.15, bodySquash: 2,  jawOpen: 0, headTwitch: { x: 1, y: 1 } },
    // Frame 2-3: Lunge — massive forward thrust
    { attackPhase: 0.35, bodySquash: -2, jawOpen: 1, headTwitch: { x: -1, y: -1 } },
    { attackPhase: 0.48, bodySquash: -2, jawOpen: 2, headTwitch: { x: -1, y: -1 } },
    // Frame 4-5: Strike — ground pound, max extension
    { attackPhase: 0.6,  bodySquash: -1, jawOpen: 2, headTwitch: { x: -1, y: 0 } },
    { attackPhase: 0.72, bodySquash: 0,  jawOpen: 2, headTwitch: { x: 0, y: 0 } },
    // Frame 6-7: Recovery
    { attackPhase: 0.88, bodySquash: 0,  jawOpen: 1, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 1.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
];

export const ZOMBIE_BRUTE_ATTACK_FRAMES = ATTACK_KEYFRAMES.map(kf =>
    generator.generateFrame({
        attackPhase: kf.attackPhase,
        bodySquash: kf.bodySquash,
        headOffset: { y: kf.bodySquash > 0 ? 1 : kf.bodySquash < 0 ? -1 : 0 },
        headTwitch: kf.headTwitch,
        jawOpen: kf.jawOpen,
        coatWave: kf.attackPhase * 0.5,
        legFrame: 'idle'
    })
);
