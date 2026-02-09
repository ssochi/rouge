import { HunterGenerator } from './HunterGenerator.js';

const generator = new HunterGenerator();

export const HUNTER_IDLE = [];

// 16-frame Bandit Idle (Confident, Alert)
for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    
    // Breathing (Steady, Controlled)
    const breath = Math.sin(phase * Math.PI * 2);
    
    // Minimal Body movement
    const bodySquash = breath > 0.5 ? 1 : 0; 
    
    // Coat Physics (Slight breeze) - Replaces Hair Physics
    const coatWave = phase;
    
    // Head Scan (Slow, intimidating check)
    // No twitching. Just a slow turn to check surroundings.
    let lookX = 0;
    if (i >= 2 && i <= 7) lookX = -1; // Look Left slowly
    // if (i >= 10 && i <= 15) lookX = 1; // Look Right? No, let's keep it subtle.
    
    const headOffset = { 
        x: lookX, 
        y: bodySquash 
    };

    HUNTER_IDLE.push(generator.generateFrame({
        bodySquash,
        headOffset,
        legFrame: 'idle',
        coatWave
    }));
}
