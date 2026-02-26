import { SnakeBossGenerator } from './SnakeBossGenerator.js';

const generator = new SnakeBossGenerator();

function generateIdleFrames(phase) {
    const frames = [];
    for (let i = 0; i < 16; i++) {
        const t = i / 16;
        frames.push(generator.generateHead({
            pulsePhase: t,
            jawOpen: 0,
            headOffset: { x: 0, y: Math.round(Math.sin(t * Math.PI * 2) * 0.5) }
        }, phase));
    }
    return frames;
}

export const SNAKE_BOSS_HEAD_IDLE_PHASE1 = generateIdleFrames(1);
export const SNAKE_BOSS_HEAD_IDLE_PHASE2 = generateIdleFrames(2);
