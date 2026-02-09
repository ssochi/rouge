import { ZombieBruteGenerator } from './ZombieBruteGenerator.js';

const generator = new ZombieBruteGenerator();

/**
 * 12-frame Run Cycle for the Zombie Brute
 * Standard Contact→Down→Pass→Up→Air→Reach cycle
 * Heavier bodyBob (ground-shaking feel), vest sway, jaw gaping
 */
export const ZOMBIE_BRUTE_RUN_FRAMES = [];

// Phase 1 (0-5): Right leg forward, Left leg back
// Phase 2 (6-11): Left leg forward, Right leg back
const cycle = [
    // Phase 1
    { bodyY:  0, left: 'back2', right: 'fwd2',  coat: 0.0  }, // 0: Contact
    { bodyY:  2, left: 'back1', right: 'fwd1',  coat: 0.08 }, // 1: Down (heavy impact)
    { bodyY:  1, left: 'knee',  right: 'idle',   coat: 0.16 }, // 2: Pass
    { bodyY: -1, left: 'fwd1',  right: 'back1', coat: 0.25 }, // 3: Up
    { bodyY: -2, left: 'tuck',  right: 'back2', coat: 0.33 }, // 4: Air
    { bodyY: -1, left: 'fwd2',  right: 'back2', coat: 0.42 }, // 5: Reach

    // Phase 2 (mirror)
    { bodyY:  0, left: 'fwd2',  right: 'back2', coat: 0.50 }, // 6: Contact
    { bodyY:  2, left: 'fwd1',  right: 'back1', coat: 0.58 }, // 7: Down (heavy impact)
    { bodyY:  1, left: 'idle',   right: 'knee',  coat: 0.66 }, // 8: Pass
    { bodyY: -1, left: 'back1', right: 'fwd1',  coat: 0.75 }, // 9: Up
    { bodyY: -2, left: 'back2', right: 'tuck',  coat: 0.83 }, // 10: Air
    { bodyY: -1, left: 'back2', right: 'fwd2',  coat: 0.92 }, // 11: Reach
];

cycle.forEach((p, i) => {
    const t = i / 12;

    // Head movement: forward lean + vertical bob
    const headTwitch = {
        x: Math.round(Math.sin(t * Math.PI * 4) * 1.5), // Side-to-side lurch
        y: 0
    };

    // Jaw gaping (more on impact frames)
    let jawOpen = 0;
    if (p.bodyY >= 1) {
        jawOpen = 2; // Jaw drops on heavy impact
    } else if (p.bodyY <= -1) {
        jawOpen = 1;
    }

    // Arm swing (opposite to legs, heavier)
    const armSwing = Math.sin(t * Math.PI * 2) * 1.5;

    ZOMBIE_BRUTE_RUN_FRAMES.push(generator.generateFrame({
        bodySquash: p.bodyY,
        headOffset: { x: 0, y: p.bodyY },
        headTwitch,
        jawOpen,
        armSwing,
        coatWave: p.coat,
        legFrame: { left: p.left, right: p.right }
    }));
});
