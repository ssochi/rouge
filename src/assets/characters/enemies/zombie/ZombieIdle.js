import { ZombieGenerator } from './ZombieGenerator.js';

/**
 * Procedural Idle Animation for Zombie
 * Standard: 16-frame breathing cycle with twitching
 * Features:
 * - Breathing (body/head rise/fall)
 * - Head twitching at specific frames (creepy)
 * - Jaw gaping cycle
 * - Tie sway (wind)
 * - Coat tail gentle sway
 * - Arm jitter
 */

const generator = new ZombieGenerator();

export const ZOMBIE_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // Breathing: Sine wave
    const breath = Math.sin(rad);

    // Body moves up/down slightly
    const bodySquash = Math.floor(breath * 0.8);

    // Head follows body
    const headOffset = { x: 0, y: Math.floor(breath * 0.5) };

    // Twitch Logic (Frames 8-10: Sudden jerky movement)
    let headTwitch = { x: 0, y: 0 };
    if (i === 8) headTwitch = { x: 1, y: 0 };
    if (i === 9) headTwitch = { x: -1, y: 1 };
    if (i === 10) headTwitch = { x: 0, y: -1 };

    // Jaw Movement (Slow gape)
    const jawOpen = Math.floor(Math.sin(phase * Math.PI) * 2); // 0 to 2

    // Arm jitter (subtle, asymmetric)
    const armSwing = Math.sin(rad) * 0.1 + (i % 2 === 0 ? 0.05 : -0.05);

    // Tie Sway (gentle wind)
    const tieAngle = Math.sin(rad + 1) * 0.5;

    // Coat tail gentle sway
    const coatWave = phase;

    ZOMBIE_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash,
        headOffset,
        headTwitch,
        jawOpen,
        armSwing,
        tieAngle,
        coatWave,
        legFrame: 'idle'
    }));
}
