import { ZombieGenerator } from './ZombieGenerator.js';

/**
 * Procedural Run Animation for Zombie
 * Standard: 12-Frame Cycle (Contact → Down → Pass → Up → Air → Reach)
 * Zombie-specific: Exaggerated bob, head whiplash, jaw gaping, tie/coat sway
 */

const generator = new ZombieGenerator();

export const ZOMBIE_RUN_FRAMES = [];

// 12-frame cycle matching Player/Hunter structure
// but with heavier bob and zombie shamble characteristics
const cycle = [
    // --- Phase 1: Right Leg Contact (Front), Left Leg Push (Back) ---

    // Frame 0: Contact (Right Fwd2, Left Back2) - Mid height
    { bodyY: 0, left: 'back2', right: 'fwd2', coat: 0.0 },

    // Frame 1: Down (Heavy impact) - Low height (Squash)
    { bodyY: 2, left: 'tuck', right: 'stand', coat: 0.15 },

    // Frame 2: Pass (Right Push Back1, Left Knee Up) - Mid height
    { bodyY: 1, left: 'knee', right: 'back1', coat: 0.3 },

    // Frame 3: Up (Right Push Back2, Left Fwd1 Air) - Slight rise
    { bodyY: 0, left: 'fwd1', right: 'back2', coat: 0.45 },

    // Frame 4: Air (Right Tuck, Left Fwd2 Reach)
    { bodyY: -1, left: 'fwd2', right: 'tuck', coat: 0.6 },

    // Frame 5: Reach (Prep Contact) - Mid height
    { bodyY: 0, left: 'fwd2', right: 'back1', coat: 0.75 },

    // --- Phase 2: Left Leg Contact (Front), Right Leg Push (Back) ---

    // Frame 6: Contact (Left Fwd2, Right Back2) - Mid height
    { bodyY: 0, left: 'fwd2', right: 'back2', coat: 0.85 },

    // Frame 7: Down (Heavy impact)
    { bodyY: 2, left: 'stand', right: 'tuck', coat: 0.7 },

    // Frame 8: Pass (Left Back1, Right Knee) - Mid height
    { bodyY: 1, left: 'back1', right: 'knee', coat: 0.55 },

    // Frame 9: Up (Left Back2, Right Fwd1)
    { bodyY: 0, left: 'back2', right: 'fwd1', coat: 0.4 },

    // Frame 10: Air (Left Tuck, Right Fwd2)
    { bodyY: -1, left: 'tuck', right: 'fwd2', coat: 0.25 },

    // Frame 11: Reach - Mid height
    { bodyY: 0, left: 'back1', right: 'fwd2', coat: 0.1 }
];

cycle.forEach((p, i) => {
    const phase = i / 12;

    // Head whiplash: offset opposite to body movement
    let headTwitch = { x: 0, y: 0 };
    if (i === 1 || i === 7) headTwitch = { x: 1, y: 1 };   // Impact frames
    if (i === 4 || i === 10) headTwitch = { x: -1, y: -1 }; // Air frames

    // Jaw hangs open while running (wider on impact)
    const jawOpen = (p.bodyY >= 2) ? 3 : 2;

    // Tie swings with large amplitude during run
    const tieAngle = Math.sin(phase * Math.PI * 4) * 1.5;

    // Arm swing (erratic, zombie-like)
    const armSwing = Math.sin(phase * Math.PI * 2) * 2;

    ZOMBIE_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: p.bodyY,
        headOffset: { x: 0, y: p.bodyY },
        headTwitch,
        jawOpen,
        tieAngle,
        armSwing,
        coatWave: p.coat,
        legFrame: { left: p.left, right: p.right }
    }));
});
