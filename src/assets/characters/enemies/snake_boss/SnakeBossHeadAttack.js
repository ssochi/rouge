import { SnakeBossGenerator } from './SnakeBossGenerator.js';

const generator = new SnakeBossGenerator();

function generateAttackFrames(phase) {
    const frames = [];
    for (let i = 0; i < 8; i++) {
        const t = i / 8;
        // Attack: jaw opens wide, head lunges forward
        const jawOpen = t < 0.3 ? t / 0.3 : (t < 0.7 ? 1.0 : (1.0 - (t - 0.7) / 0.3));
        const lungeY = t < 0.4 ? -t * 5 : -5 + (t - 0.4) * 8.3;
        frames.push(generator.generateHead({
            pulsePhase: t * 2 % 1,
            jawOpen: jawOpen,
            headOffset: { x: 0, y: Math.round(lungeY) }
        }, phase));
    }
    return frames;
}

export const SNAKE_BOSS_HEAD_ATTACK_PHASE1 = generateAttackFrames(1);
export const SNAKE_BOSS_HEAD_ATTACK_PHASE2 = generateAttackFrames(2);
