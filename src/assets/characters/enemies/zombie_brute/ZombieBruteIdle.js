import { ZombieBruteGenerator } from './ZombieBruteGenerator.js';

const generator = new ZombieBruteGenerator();

/**
 * 16-frame Idle Animation for the Zombie Brute
 * Heavy, slow breathing + occasional twitch + jaw gaping + vest sway
 * Feels more lumbering and weighty than standard zombie
 */
export const ZOMBIE_BRUTE_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const t = i / 16;

    // Heavy breathing (larger amplitude, slower feel)
    const breathe = Math.sin(t * Math.PI * 2) * 1.2;
    const bodySquash = Math.round(breathe);

    // Head follows body with slight delay
    const headOffset = { x: 0, y: bodySquash * 0.8 };

    // Twitch / jerk (frames 9-11, heavier spasm)
    let headTwitch = { x: 0, y: 0 };
    if (i >= 9 && i <= 11) {
        const spasm = (i === 10) ? 1 : 0.5;
        headTwitch = { x: Math.round(spasm * 2), y: Math.round(-spasm) };
    }

    // Jaw slowly opens and closes
    let jawOpen = 0;
    if (i >= 4 && i <= 12) {
        jawOpen = Math.round(Math.sin((i - 4) / 8 * Math.PI) * 2);
    }

    // Arm swing (subtle sway while idle)
    const armSwing = Math.sin(t * Math.PI * 2 + 0.5) * 0.3;

    // Vest flap wave (slow)
    const coatWave = t;

    ZOMBIE_BRUTE_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash,
        headOffset,
        headTwitch,
        jawOpen,
        armSwing,
        coatWave,
        legFrame: 'idle'
    }));
}
