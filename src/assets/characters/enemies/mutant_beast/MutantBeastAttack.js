import { MutantBeastGenerator } from './MutantBeastGenerator.js';

const generator = new MutantBeastGenerator();

// --- Smash: Heavy overhead slam ---
const SMASH_KEYFRAMES = [
    { attackPhase: 0.0,  bodySquash: 2,  jawOpen: 0, headTwitch: { x: 0, y: 1 } },
    { attackPhase: 0.12, bodySquash: 3,  jawOpen: 0, headTwitch: { x: 0, y: 2 } },
    { attackPhase: 0.28, bodySquash: 2,  jawOpen: 1, headTwitch: { x: -1, y: 0 } },
    { attackPhase: 0.40, bodySquash: -2, jawOpen: 2, headTwitch: { x: -1, y: -1 } },
    { attackPhase: 0.55, bodySquash: -3, jawOpen: 3, headTwitch: { x: -2, y: -1 } },
    { attackPhase: 0.70, bodySquash: -1, jawOpen: 2, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 0.85, bodySquash: 0,  jawOpen: 1, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 1.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
];

// --- Sweep: Wide horizontal claw swipe ---
const SWEEP_KEYFRAMES = [
    { attackPhase: 0.0,  bodySquash: 1,  jawOpen: 0, headTwitch: { x: 1, y: 0 } },
    { attackPhase: 0.10, bodySquash: 1,  jawOpen: 0, headTwitch: { x: 2, y: 0 } },
    { attackPhase: 0.25, bodySquash: 0,  jawOpen: 1, headTwitch: { x: 1, y: -1 } },
    { attackPhase: 0.40, bodySquash: -1, jawOpen: 2, headTwitch: { x: -1, y: -1 } },
    { attackPhase: 0.55, bodySquash: -1, jawOpen: 2, headTwitch: { x: -2, y: 0 } },
    { attackPhase: 0.72, bodySquash: 0,  jawOpen: 1, headTwitch: { x: -1, y: 0 } },
    { attackPhase: 0.88, bodySquash: 0,  jawOpen: 1, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 1.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
];

// --- Stomp: Ground pound shockwave ---
const STOMP_KEYFRAMES = [
    { attackPhase: 0.0,  bodySquash: -2, jawOpen: 0, headTwitch: { x: 0, y: -2 } },
    { attackPhase: 0.12, bodySquash: -3, jawOpen: 0, headTwitch: { x: 0, y: -2 } },
    { attackPhase: 0.25, bodySquash: -2, jawOpen: 1, headTwitch: { x: 0, y: -1 } },
    { attackPhase: 0.40, bodySquash: 3,  jawOpen: 2, headTwitch: { x: 0, y: 2 } },
    { attackPhase: 0.50, bodySquash: 4,  jawOpen: 3, headTwitch: { x: 0, y: 2 } },
    { attackPhase: 0.65, bodySquash: 2,  jawOpen: 2, headTwitch: { x: 0, y: 1 } },
    { attackPhase: 0.82, bodySquash: 1,  jawOpen: 1, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 1.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
];

// --- Charge: Wind-up for charge attack ---
const CHARGE_KEYFRAMES = [
    { attackPhase: 0.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 0.15, bodySquash: 2,  jawOpen: 0, headTwitch: { x: 0, y: 1 } },
    { attackPhase: 0.30, bodySquash: 3,  jawOpen: 1, headTwitch: { x: 0, y: 2 } },
    { attackPhase: 0.45, bodySquash: 2,  jawOpen: 2, headTwitch: { x: -1, y: 1 } },
    { attackPhase: 0.60, bodySquash: -2, jawOpen: 2, headTwitch: { x: -1, y: -1 } },
    { attackPhase: 0.75, bodySquash: -2, jawOpen: 2, headTwitch: { x: -1, y: -1 } },
    { attackPhase: 0.88, bodySquash: -1, jawOpen: 1, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 1.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
];

// --- Leap Slam: Jump up and come crashing down ---
const LEAP_SLAM_KEYFRAMES = [
    { attackPhase: 0.0,  bodySquash: 2,  jawOpen: 0, headTwitch: { x: 0, y: 1 } },
    { attackPhase: 0.14, bodySquash: 3,  jawOpen: 0, headTwitch: { x: 0, y: 2 } },
    { attackPhase: 0.28, bodySquash: -3, jawOpen: 1, headTwitch: { x: 0, y: -2 } },
    { attackPhase: 0.42, bodySquash: -3, jawOpen: 2, headTwitch: { x: 0, y: -2 } },
    { attackPhase: 0.57, bodySquash: -2, jawOpen: 2, headTwitch: { x: 0, y: -1 } },
    { attackPhase: 0.71, bodySquash: 4,  jawOpen: 3, headTwitch: { x: 0, y: 2 } },
    { attackPhase: 0.86, bodySquash: 2,  jawOpen: 2, headTwitch: { x: 0, y: 1 } },
    { attackPhase: 1.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
];

// --- Roar: Phase transition / Summon call ---
const ROAR_KEYFRAMES = [
    { attackPhase: 0.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 0.0,  bodySquash: -1, jawOpen: 1, headTwitch: { x: 0, y: -1 } },
    { attackPhase: 0.0,  bodySquash: -2, jawOpen: 3, headTwitch: { x: -1, y: -2 } },
    { attackPhase: 0.0,  bodySquash: -2, jawOpen: 3, headTwitch: { x: 1, y: -2 } },
    { attackPhase: 0.0,  bodySquash: -2, jawOpen: 3, headTwitch: { x: -1, y: -2 } },
    { attackPhase: 0.0,  bodySquash: -1, jawOpen: 3, headTwitch: { x: 0, y: -1 } },
    { attackPhase: 0.0,  bodySquash: 0,  jawOpen: 2, headTwitch: { x: 0, y: 0 } },
    { attackPhase: 0.0,  bodySquash: 0,  jawOpen: 0, headTwitch: { x: 0, y: 0 } },
];

/**
 * Generates attack animation frames for a specific attack type and boss phase
 * @param {Array} keyframes - Array of keyframe objects with attackPhase, bodySquash, jawOpen, headTwitch
 * @param {number} phase - Boss phase (1, 2, or 3)
 * @param {string} attackType - Attack type ('smash', 'sweep', 'stomp')
 * @returns {Array<HTMLCanvasElement>} Array of 8 animation frames
 */
function generateAttackFrames(keyframes, phase, attackType) {
    return keyframes.map(kf => generator.generateFrame({
        attackPhase: kf.attackPhase,
        attackType: attackType,
        bodySquash: kf.bodySquash,
        headOffset: { y: kf.bodySquash > 0 ? 1 : kf.bodySquash < 0 ? -1 : 0 },
        headTwitch: kf.headTwitch,
        jawOpen: kf.jawOpen,
        coatWave: kf.attackPhase * 0.5,
        legFrame: 'idle'
    }, phase));
}

// ============================================================
// PHASE 1 ATTACKS (Basic: Smash, Sweep, Stomp, Roar)
// ============================================================

export const MUTANT_BEAST_SMASH_PHASE1 = generateAttackFrames(SMASH_KEYFRAMES, 1, 'smash');
export const MUTANT_BEAST_SWEEP_PHASE1 = generateAttackFrames(SWEEP_KEYFRAMES, 1, 'sweep');
export const MUTANT_BEAST_STOMP_PHASE1 = generateAttackFrames(STOMP_KEYFRAMES, 1, 'stomp');
export const MUTANT_BEAST_ROAR_PHASE1 = generateAttackFrames(ROAR_KEYFRAMES, 1, 'smash');

// ============================================================
// PHASE 2 ATTACKS (All: Smash, Sweep, Stomp, Charge, Leap, Roar)
// ============================================================

export const MUTANT_BEAST_SMASH_PHASE2 = generateAttackFrames(SMASH_KEYFRAMES, 2, 'smash');
export const MUTANT_BEAST_SWEEP_PHASE2 = generateAttackFrames(SWEEP_KEYFRAMES, 2, 'sweep');
export const MUTANT_BEAST_STOMP_PHASE2 = generateAttackFrames(STOMP_KEYFRAMES, 2, 'stomp');
export const MUTANT_BEAST_CHARGE_PHASE2 = generateAttackFrames(CHARGE_KEYFRAMES, 2, 'smash');
export const MUTANT_BEAST_LEAP_PHASE2 = generateAttackFrames(LEAP_SLAM_KEYFRAMES, 2, 'smash');
export const MUTANT_BEAST_ROAR_PHASE2 = generateAttackFrames(ROAR_KEYFRAMES, 2, 'smash');

// ============================================================
// PHASE 3 ATTACKS (All: Smash, Sweep, Stomp, Charge, Leap, Roar)
// ============================================================

export const MUTANT_BEAST_SMASH_PHASE3 = generateAttackFrames(SMASH_KEYFRAMES, 3, 'smash');
export const MUTANT_BEAST_SWEEP_PHASE3 = generateAttackFrames(SWEEP_KEYFRAMES, 3, 'sweep');
export const MUTANT_BEAST_STOMP_PHASE3 = generateAttackFrames(STOMP_KEYFRAMES, 3, 'stomp');
export const MUTANT_BEAST_CHARGE_PHASE3 = generateAttackFrames(CHARGE_KEYFRAMES, 3, 'smash');
export const MUTANT_BEAST_LEAP_PHASE3 = generateAttackFrames(LEAP_SLAM_KEYFRAMES, 3, 'smash');
export const MUTANT_BEAST_ROAR_PHASE3 = generateAttackFrames(ROAR_KEYFRAMES, 3, 'smash');
