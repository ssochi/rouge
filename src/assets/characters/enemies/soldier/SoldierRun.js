import { SoldierGenerator } from './SoldierGenerator.js';

/**
 * Procedural Run Animation for Soldier
 * Standard: 12-Frame Cycle (Contact → Down → Pass → Up → Air → Reach)
 * Soldier-specific: Controlled, tactical movement — less wild than Hunter
 */

const generator = new SoldierGenerator();

export const SOLDIER_RUN_FRAMES = [];

const cycle = [
    // --- Phase 1: Right Leg Contact (Front), Left Leg Push (Back) ---
    { bodyY: 0, left: 'back2', right: 'fwd2' },   // Frame 0: Contact
    { bodyY: 1, left: 'tuck', right: 'stand' },    // Frame 1: Down
    { bodyY: 0, left: 'knee', right: 'back1' },    // Frame 2: Pass
    { bodyY: -1, left: 'fwd1', right: 'back2' },   // Frame 3: Up
    { bodyY: -1, left: 'fwd2', right: 'tuck' },    // Frame 4: Air
    { bodyY: 0, left: 'fwd2', right: 'back1' },    // Frame 5: Reach

    // --- Phase 2: Left Leg Contact (Front), Right Leg Push (Back) ---
    { bodyY: 0, left: 'fwd2', right: 'back2' },    // Frame 6: Contact
    { bodyY: 1, left: 'stand', right: 'tuck' },    // Frame 7: Down
    { bodyY: 0, left: 'back1', right: 'knee' },    // Frame 8: Pass
    { bodyY: -1, left: 'back2', right: 'fwd1' },   // Frame 9: Up
    { bodyY: -1, left: 'tuck', right: 'fwd2' },    // Frame 10: Air
    { bodyY: 0, left: 'back1', right: 'fwd2' }     // Frame 11: Reach
];

cycle.forEach((p) => {
    // Head stays slightly forward (tactical lean)
    const headOffset = {
        x: -1,
        y: p.bodyY
    };

    SOLDIER_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: p.bodyY,
        headOffset,
        legFrame: { left: p.left, right: p.right }
    }));
});
