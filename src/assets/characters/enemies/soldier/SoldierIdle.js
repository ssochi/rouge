import { SoldierGenerator } from './SoldierGenerator.js';

/**
 * Procedural Idle Animation for Soldier
 * Standard: 16-frame cycle
 * Features:
 * - Subtle breathing
 * - Head scanning left/right (alert, vigilant)
 * - Minimal body movement (disciplined stance)
 */

const generator = new SoldierGenerator();

export const SOLDIER_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // Subtle breathing (military discipline — less movement than Hunter)
    const breath = Math.sin(rad);
    const bodySquash = breath * -0.5;

    // Head scan: slow, methodical sweep (alert guard)
    let lookX = 0;
    if (i >= 2 && i <= 5) lookX = -1;      // Look left
    if (i >= 10 && i <= 13) lookX = 1;     // Look right

    const headOffset = {
        x: lookX,
        y: bodySquash
    };

    SOLDIER_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash,
        headOffset,
        legFrame: 'idle'
    }));
}
