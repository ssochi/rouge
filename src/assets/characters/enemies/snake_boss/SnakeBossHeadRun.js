import { SnakeBossGenerator } from './SnakeBossGenerator.js';

const generator = new SnakeBossGenerator();

function generateRunFrames(phase) {
    const frames = [];
    for (let i = 0; i < 12; i++) {
        const t = i / 12;
        // More dynamic head bob during movement
        const bobY = Math.round(Math.sin(t * Math.PI * 2) * 1.5);
        const bobX = Math.round(Math.sin(t * Math.PI * 4) * 0.5);
        frames.push(generator.generateHead({
            pulsePhase: t,
            jawOpen: 0.1 + Math.sin(t * Math.PI * 2) * 0.1,
            headOffset: { x: bobX, y: bobY }
        }, phase));
    }
    return frames;
}

export const SNAKE_BOSS_HEAD_RUN_PHASE1 = generateRunFrames(1);
export const SNAKE_BOSS_HEAD_RUN_PHASE2 = generateRunFrames(2);
