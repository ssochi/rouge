import { MechaGolemGenerator } from './MechaGolemGenerator.js';

const generator = new MechaGolemGenerator();

/**
 * Generate 8 attack animation frames with a helper that applies per-frame overrides
 * @param {string} attackType - Attack type for the generator pose
 * @param {number} phase - Boss phase (1 or 2)
 * @param {Function} frameOverrides - (i, t) => Object of per-frame pose overrides
 * @returns {Array<HTMLCanvasElement>} Array of 8 animation frames
 */
function generateAttackFrames(attackType, phase, frameOverrides = () => ({})) {
    const frames = [];
    for (let i = 0; i < 8; i++) {
        const t = i / 8;
        const pose = {
            attackType,
            attackPhase: t,
            legFrame: 'idle',
            bodySquash: 0,
            pulsePhase: t,
            barrelRot: 0,
            armAngle: 0,
            headOffset: { x: 0, y: 0 },
            ...frameOverrides(i, t)
        };
        frames.push(generator.generateFrame(pose, phase));
    }
    return frames;
}

// ============================================================
// PHASE 1 ATTACKS (4 types: gatling_sweep, ring_burst, aimed_triple, rocket_salvo)
// ============================================================

// --- Gatling Sweep: Gatling arm sweeps while firing ---
export const MECHA_GOLEM_GATLING_PHASE1 = generateAttackFrames('gatling_sweep', 1, (i, t) => ({
    attackPhase: i / 8,
    barrelRot: i * 0.4,
    bodySquash: (i === 1 || i === 2) ? 1 : 0,
}));

// --- Ring Burst: Both arms raise for omnidirectional burst ---
export const MECHA_GOLEM_RING_PHASE1 = generateAttackFrames('ring_burst', 1, (i, t) => ({
    attackPhase: i / 8,
    bodySquash: (i === 3 || i === 4) ? -1 : 0,
    pulsePhase: i / 8,
}));

// --- Aimed Triple: Quick aim and fire (falls through to default arms) ---
export const MECHA_GOLEM_AIMED_PHASE1 = generateAttackFrames('aimed_triple', 1, (i, t) => ({
    attackPhase: i / 8,
    bodySquash: (i === 3 || i === 4) ? 1 : 0,
}));

// --- Rocket Salvo: Launcher arm aims and fires ---
export const MECHA_GOLEM_ROCKET_PHASE1 = generateAttackFrames('rocket_salvo', 1, (i, t) => ({
    attackPhase: i / 8,
    bodySquash: (i === 3 || i === 5) ? 1 : 0,
}));

// ============================================================
// PHASE 2 ATTACKS (all 7 types + transition)
// ============================================================

// --- Phase 2 versions of the 4 base attacks ---

export const MECHA_GOLEM_GATLING_PHASE2 = generateAttackFrames('gatling_sweep', 2, (i, t) => ({
    attackPhase: i / 8,
    barrelRot: i * 0.4,
    bodySquash: (i === 1 || i === 2) ? 1 : 0,
}));

export const MECHA_GOLEM_RING_PHASE2 = generateAttackFrames('ring_burst', 2, (i, t) => ({
    attackPhase: i / 8,
    bodySquash: (i === 3 || i === 4) ? -1 : 0,
    pulsePhase: i / 8,
}));

export const MECHA_GOLEM_AIMED_PHASE2 = generateAttackFrames('aimed_triple', 2, (i, t) => ({
    attackPhase: i / 8,
    bodySquash: (i === 3 || i === 4) ? 1 : 0,
}));

export const MECHA_GOLEM_ROCKET_PHASE2 = generateAttackFrames('rocket_salvo', 2, (i, t) => ({
    attackPhase: i / 8,
    bodySquash: (i === 3 || i === 5) ? 1 : 0,
}));

// --- 3 new Phase 2 exclusive attacks ---

// --- Spiral Storm: Continuous spinning fire (reuses ring_burst pose - arms raised) ---
export const MECHA_GOLEM_SPIRAL_PHASE2 = generateAttackFrames('ring_burst', 2, (i, t) => ({
    attackPhase: i / 8,
    barrelRot: i * 0.5,
    bodySquash: 0,
    pulsePhase: i / 8,
}));

// --- Cross Fire: Alternating + and x bursts (reuses ring_burst pose) ---
export const MECHA_GOLEM_CROSS_PHASE2 = generateAttackFrames('ring_burst', 2, (i, t) => ({
    attackPhase: (i % 4) / 4,
    pulsePhase: i / 8,
}));

// --- Desperation: Violent shaking, all weapons active (reuses ring_burst pose) ---
export const MECHA_GOLEM_DESPERATION_PHASE2 = generateAttackFrames('ring_burst', 2, (i, t) => ({
    attackPhase: i / 8,
    headOffset: { x: (i % 2 === 0) ? -1 : 1, y: 0 },
    bodySquash: (i % 2 === 0) ? 1 : -1,
    pulsePhase: i / 4,
}));

// --- Phase 2 Transition: Dramatic expand/contract with shaking ---
export const MECHA_GOLEM_TRANSITION_PHASE2 = generateAttackFrames('ring_burst', 2, (i, t) => ({
    attackPhase: i / 8,
    bodySquash: Math.sin(i / 8 * Math.PI) * 2,
    pulsePhase: i / 8,
    headOffset: { x: (i % 2 === 0) ? -1 : 1, y: -1 },
}));
