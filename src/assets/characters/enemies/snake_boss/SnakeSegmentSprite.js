import { SnakeBossGenerator } from './SnakeBossGenerator.js';

const generator = new SnakeBossGenerator();

function generateBodyFrames(phase) {
    const frames = [];
    for (let i = 0; i < 8; i++) {
        const t = i / 8;
        frames.push(generator.generateBodySegment({
            pulsePhase: t
        }, phase));
    }
    return frames;
}

function generateTailFrames(phase) {
    const frames = [];
    for (let i = 0; i < 8; i++) {
        const t = i / 8;
        frames.push(generator.generateTail({
            pulsePhase: t
        }, phase));
    }
    return frames;
}

export const SNAKE_BOSS_BODY_PHASE1 = generateBodyFrames(1);
export const SNAKE_BOSS_BODY_PHASE2 = generateBodyFrames(2);
export const SNAKE_BOSS_TAIL_PHASE1 = generateTailFrames(1);
export const SNAKE_BOSS_TAIL_PHASE2 = generateTailFrames(2);
