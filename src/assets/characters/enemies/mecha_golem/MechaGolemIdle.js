import { MechaGolemGenerator } from './MechaGolemGenerator.js';

const generator = new MechaGolemGenerator();

// Generate idle frames for a given phase
function generateIdleFrames(phase) {
    const frames = [];
    for (let i = 0; i < 16; i++) {
        const t = i / 16;

        // Subtle mechanical breathing
        const bodySquash = Math.round(Math.sin(t * Math.PI * 2) * 0.5);

        // Core pulse animation (0 to 1 across frames)
        const pulsePhase = t;

        // Very slow idle barrel rotation
        const barrelRot = t * 0.3;

        // Arms at rest
        const armAngle = 0;

        // Subtle mechanical head bob
        const headOffset = { x: 0, y: Math.round(Math.sin(t * Math.PI * 2) * 0.3) };

        frames.push(generator.generateFrame({
            bodySquash,
            pulsePhase,
            barrelRot,
            armAngle,
            legFrame: 'idle',
            headOffset
        }, phase));
    }
    return frames;
}

export const MECHA_GOLEM_IDLE_PHASE1 = generateIdleFrames(1);
export const MECHA_GOLEM_IDLE_PHASE2 = generateIdleFrames(2);
