import { MutantBeastGenerator } from './MutantBeastGenerator.js';

const generator = new MutantBeastGenerator();

// Generate idle frames for all 3 phases
function generateIdleFrames(phase) {
    const frames = [];
    for (let i = 0; i < 16; i++) {
        const t = i / 16;
        const rad = t * Math.PI * 2;

        // Heavy, ominous breathing (larger amplitude than brute)
        const breathe = Math.sin(rad) * 1.5;
        const bodySquash = Math.round(breathe);

        // Head follows body with menacing bob
        const headOffset = { x: 0, y: bodySquash * 0.6 };

        // Violent head twitching (frames 8-11, more intense than brute)
        let headTwitch = { x: 0, y: 0 };
        if (i >= 8 && i <= 11) {
            const spasm = (i === 9 || i === 10) ? 1.5 : 0.5;
            headTwitch = { x: Math.round(spasm * 2), y: Math.round(-spasm) };
        }

        // Jaw - menacing gape
        let jawOpen = 0;
        if (i >= 3 && i <= 13) {
            jawOpen = Math.round(Math.sin((i - 3) / 10 * Math.PI) * 3);
        }

        // Arm swing (slow, heavy sway)
        const armSwing = Math.sin(rad + 0.5) * 0.4;

        // Coat/cloth wave
        const coatWave = t;

        // Spine pulse for phase 2+ (subtle glow variation)
        const pulsePhase = t;

        frames.push(generator.generateFrame({
            bodySquash,
            headOffset,
            headTwitch,
            jawOpen,
            armSwing,
            coatWave,
            pulsePhase,
            legFrame: 'idle'
        }, phase));
    }
    return frames;
}

export const MUTANT_BEAST_IDLE_PHASE1 = generateIdleFrames(1);
export const MUTANT_BEAST_IDLE_PHASE2 = generateIdleFrames(2);
export const MUTANT_BEAST_IDLE_PHASE3 = generateIdleFrames(3);
