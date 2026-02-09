import { HunterGenerator } from './HunterGenerator.js';

/**
 * Procedural Idle Animation for Hunter
 * Standard: 16-frame cycle
 * Features:
 * - Smooth breathing (sine wave)
 * - Coat tail gentle sway
 * - Scarf wind physics
 * - Subtle head scan (alert, intimidating)
 * - Hair physics (wind)
 */

const generator = new HunterGenerator();

export const HUNTER_IDLE = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // Smooth breathing
    const breath = Math.sin(rad);
    const bodySquash = breath * -0.8;

    // Coat tail gentle sway
    const coatWave = phase;

    // Scarf wind (offset phase from coat)
    const scarfWave = phase + 0.25;

    // Head scan: slow, confident look-around
    let lookX = 0;
    if (i >= 3 && i <= 6) lookX = -1;     // Look left
    if (i >= 11 && i <= 14) lookX = 1;    // Look right

    const headOffset = {
        x: lookX,
        y: bodySquash
    };

    // Hair wind physics
    const hairWave = phase;

    HUNTER_IDLE.push(generator.generateFrame({
        bodySquash,
        headOffset,
        legFrame: 'idle',
        coatWave,
        scarfWave,
        hairWave
    }));
}
