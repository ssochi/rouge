import { HunterGenerator } from './HunterGenerator.js';

/**
 * Procedural Run Animation for Hunter
 * Standard: 12-Frame Cycle (Contact → Down → Pass → Up → Air → Reach)
 * Hunter-specific: Aggressive forward lean, controlled bob, scarf/coat dynamics
 */

const generator = new HunterGenerator();

export const HUNTER_RUN = [];

const cycle = [
    // --- Phase 1: Right Leg Contact (Front), Left Leg Push (Back) ---
    // Frame 0: Contact
    { bodyY: 0, left: 'back2', right: 'fwd2', coat: 0.0 },
    // Frame 1: Down (Impact)
    { bodyY: 1, left: 'tuck', right: 'stand', coat: 0.15 },
    // Frame 2: Pass
    { bodyY: 0, left: 'knee', right: 'back1', coat: 0.3 },
    // Frame 3: Up
    { bodyY: -1, left: 'fwd1', right: 'back2', coat: 0.45 },
    // Frame 4: Air
    { bodyY: -1, left: 'fwd2', right: 'tuck', coat: 0.6 },
    // Frame 5: Reach
    { bodyY: 0, left: 'fwd2', right: 'back1', coat: 0.75 },

    // --- Phase 2: Left Leg Contact (Front), Right Leg Push (Back) ---
    // Frame 6: Contact
    { bodyY: 0, left: 'fwd2', right: 'back2', coat: 0.85 },
    // Frame 7: Down (Impact)
    { bodyY: 1, left: 'stand', right: 'tuck', coat: 0.7 },
    // Frame 8: Pass
    { bodyY: 0, left: 'back1', right: 'knee', coat: 0.55 },
    // Frame 9: Up
    { bodyY: -1, left: 'back2', right: 'fwd1', coat: 0.4 },
    // Frame 10: Air
    { bodyY: -1, left: 'tuck', right: 'fwd2', coat: 0.25 },
    // Frame 11: Reach
    { bodyY: 0, left: 'back1', right: 'fwd2', coat: 0.1 }
];

cycle.forEach((p, i) => {
    const phase = i / 12;

    // Head leans forward aggressively
    const headOffset = {
        x: -1,
        y: p.bodyY
    };

    // Scarf flies back dramatically
    const scarfWave = phase;

    // Hair flows with movement
    const hairWave = phase;

    HUNTER_RUN.push(generator.generateFrame({
        bodySquash: p.bodyY,
        headOffset,
        legFrame: { left: p.left, right: p.right },
        coatWave: p.coat,
        scarfWave,
        hairWave
    }));
});
