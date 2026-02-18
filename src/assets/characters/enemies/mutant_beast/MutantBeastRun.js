import { MutantBeastGenerator } from './MutantBeastGenerator.js';

const generator = new MutantBeastGenerator();

/**
 * 12-frame Run Cycle for the Mutant Beast BOSS
 * Standard Contact→Down→Pass→Up→Air→Reach bipedal cycle (x2 for each leg)
 * Features:
 * - Heavy body squash/extension due to massive size
 * - Coat/fabric flaps waving during movement
 * - Jaw slightly open (breathing/snarling while running)
 * - Arms swing with running motion
 * - 3 phase variants (color shifts only)
 */

// Standard 12-frame run cycle with heavier body dynamics for the beast
const RUN_CYCLE = [
    // Phase 1: Right leg forward, left leg pushes
    { bodySquash:  0, left: 'back2', right: 'fwd2', coat: 0.0  },  // F0: Contact
    { bodySquash:  2, left: 'tuck',  right: 'stand', coat: 0.15 },  // F1: Down (heavy squat)
    { bodySquash:  1, left: 'knee',  right: 'back1', coat: 0.3  },  // F2: Pass
    { bodySquash: -1, left: 'fwd1',  right: 'back2', coat: 0.45 },  // F3: Up (rise)
    { bodySquash: -1, left: 'fwd2',  right: 'tuck',  coat: 0.6  },  // F4: Air
    { bodySquash:  0, left: 'fwd2',  right: 'back1', coat: 0.75 },  // F5: Reach
    // Phase 2: Left leg forward, right leg pushes (mirror)
    { bodySquash:  0, left: 'fwd2',  right: 'back2', coat: 0.8  },  // F6: Contact
    { bodySquash:  2, left: 'stand', right: 'tuck',  coat: 0.85 },  // F7: Down
    { bodySquash:  1, left: 'back1', right: 'knee',  coat: 0.9  },  // F8: Pass
    { bodySquash: -1, left: 'back2', right: 'fwd1',  coat: 0.95 },  // F9: Up
    { bodySquash: -1, left: 'tuck',  right: 'fwd2',  coat: 0.0  },  // F10: Air
    { bodySquash:  0, left: 'back1', right: 'fwd2',  coat: 0.1  },  // F11: Reach
];

/**
 * Generate run frames for a specific boss phase
 * @param {number} phase - 1, 2, or 3 (boss phase)
 * @returns {Array<HTMLCanvasElement>} 12 animation frames
 */
function generateRunFrames(phase) {
    return RUN_CYCLE.map((frame, i) => {
        const t = i / 12;

        // Head movement: slight vertical bob with body squash
        const headOffset = {
            x: 0,
            y: frame.bodySquash > 0 ? 1 : frame.bodySquash < 0 ? -1 : 0
        };

        // Head twitch: subtle side-to-side lurch while running
        const headTwitch = {
            x: Math.round(Math.sin(t * Math.PI * 4) * 0.5),
            y: 0
        };

        // Jaw slightly open (breathing/snarling)
        const jawOpen = 1;

        // Arm swing: arms swing opposite to legs for natural running motion
        // Wider swing range for the massive beast
        const armSwing = Math.sin(t * Math.PI * 2) * 1.5;

        return generator.generateFrame({
            bodySquash: frame.bodySquash,
            headOffset,
            headTwitch,
            jawOpen,
            armSwing,
            coatWave: frame.coat,
            legFrame: { left: frame.left, right: frame.right }
        }, phase);
    });
}

// Export run frames for all 3 boss phases
export const MUTANT_BEAST_RUN_PHASE1 = generateRunFrames(1);
export const MUTANT_BEAST_RUN_PHASE2 = generateRunFrames(2);
export const MUTANT_BEAST_RUN_PHASE3 = generateRunFrames(3);
