import { ZombieFemaleGenerator } from './ZombieFemaleGenerator.js';

/**
 * Procedural Idle Animation for Female Zombie
 * Standard: 16-frame breathing cycle with twitching
 * Features:
 * - Breathing (body/head rise/fall)
 * - Head twitching at specific frames (creepy)
 * - Jaw gaping cycle
 * - Hair wave (long hair physics)
 * - Coat hem gentle sway
 * - Arm jitter
 */

const generator = new ZombieFemaleGenerator();

export const ZOMBIE_FEMALE_IDLE_FRAMES = [];

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
    const jawOpen = Math.floor(Math.sin(phase * Math.PI) * 2);

    // Hair wave (long hair physics, offset from body)
    const hairWave = phase;

    // Arm jitter (subtle, asymmetric)
    const armSwing = Math.sin(rad) * 0.1 + (i % 2 === 0 ? 0.05 : -0.05);

    // Coat hem gentle sway
    const coatWave = phase;

    ZOMBIE_FEMALE_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash,
        headOffset,
        headTwitch,
        jawOpen,
        hairWave,
        armSwing,
        coatWave,
        legFrame: 'idle'
    }));
}
