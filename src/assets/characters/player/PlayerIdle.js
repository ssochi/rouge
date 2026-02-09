import { PlayerGenerator } from './PlayerGenerator.js';

/**
 * Procedural Idle Animation
 * Standard: High Quality (Smooth 16-frame cycle)
 * Features:
 * - Sub-pixel Breathing (Body & Head rise/fall)
 * - Independent Hair Physics (Sine wave wind)
 * - Coat adjustments (optional)
 */

const generator = new PlayerGenerator();
const frames = [];
const TOTAL_FRAMES = 16; 

for (let i = 0; i < TOTAL_FRAMES; i++) {
    const progress = i / TOTAL_FRAMES; // 0 to 1
    const rad = progress * Math.PI * 2;
    
    // 1. Breathing Cycle (Body)
    // Sine wave: Starts at 0, goes up to 1, down to -1.
    // We want: Neutral -> Inhale (Up) -> Neutral -> Exhale (Down/Squash)
    // Let's use sin(rad). 
    // Amplitude: 0.8 pixels (Subtle)
    const breathe = Math.sin(rad); 
    const bodyYOffset = breathe * -0.8; // Up when sin is positive (Inhale)
    
    // 2. Head Bob
    // Head follows body but with slight lag or exaggerated motion?
    // Let's make head move slightly LESS than body to simulate neck compression?
    // Or SAME. Let's do SAME for solid connection.
    const headYOffset = bodyYOffset;
    
    // 3. Hair Wave (Wind)
    // Offset phase by PI/2 so hair reacts to movement?
    // Or just independent wind.
    // Let's do independent wind cycle.
    const hairPhase = progress; 
    
    frames.push(generator.generateFrame({
        bodySquash: bodyYOffset,
        headOffset: { x: 0, y: headYOffset },
        hairWave: hairPhase
    }));
}

export const PLAYER_IDLE_FRAMES = frames;
