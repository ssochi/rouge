import { MechaGolemGenerator } from './MechaGolemGenerator.js';

const generator = new MechaGolemGenerator();

/**
 * 12-frame Run Cycle for the MechaGolem (机械魔偶) BOSS
 * Standard 6-pose leg sequence with paired frames (2 frames per pose)
 * Features:
 * - Mechanical piston leg movement with paired frame timing
 * - Slight body compression on landing frames
 * - Barrel rotation during movement
 * - Subtle arm swing for weight shift
 * - Head bounce synced to stride cycle
 * - 2 phase variants (Armed Protocol / Overload)
 */

// 12-frame run cycle: 6 leg poses, each held for 2 frames
const RUN_CYCLE = [
    // Frames 0-1: Left forward, right back
    { left: 'fwd1',  right: 'back1' },
    { left: 'fwd1',  right: 'back1' },
    // Frames 2-3: Left extended forward, right extended back
    { left: 'fwd2',  right: 'back2' },
    { left: 'fwd2',  right: 'back2' },
    // Frames 4-5: Left knee up, right idle (passing)
    { left: 'knee',  right: 'idle'  },
    { left: 'knee',  right: 'idle'  },
    // Frames 6-7: Mirror - left back, right forward
    { left: 'back1', right: 'fwd1'  },
    { left: 'back1', right: 'fwd1'  },
    // Frames 8-9: Left extended back, right extended forward
    { left: 'back2', right: 'fwd2'  },
    { left: 'back2', right: 'fwd2'  },
    // Frames 10-11: Left idle, right knee up (passing)
    { left: 'idle',  right: 'knee'  },
    { left: 'idle',  right: 'knee'  },
];

/**
 * Generate run frames for a specific boss phase
 * @param {number} phase - 1 or 2 (boss phase)
 * @returns {Array<HTMLCanvasElement>} 12 animation frames
 */
function generateRunFrames(phase) {
    return RUN_CYCLE.map((frame, i) => {
        // Body squash: slight compression on landing frames (0 and 6)
        const bodySquash = (i === 0 || i === 6) ? 1 : 0;

        // Energy core pulse phase (0-1 cycle over 12 frames)
        const pulsePhase = i / 12;

        // Barrel spins slightly during movement
        const barrelRot = i * 0.2;

        // Slight arm swing following a sine wave over the full cycle
        const armAngle = Math.sin(i / 12 * Math.PI * 2) * 8;

        // Head bounce: slight vertical offset on first 2 frames of each half-cycle
        const headOffset = {
            x: 0,
            y: (i % 6 < 2) ? 1 : 0
        };

        return generator.generateFrame({
            bodySquash,
            pulsePhase,
            barrelRot,
            armAngle,
            headOffset,
            legFrame: { left: frame.left, right: frame.right }
        }, phase);
    });
}

// Export run frames for both boss phases
export const MECHA_GOLEM_RUN_PHASE1 = generateRunFrames(1);
export const MECHA_GOLEM_RUN_PHASE2 = generateRunFrames(2);
