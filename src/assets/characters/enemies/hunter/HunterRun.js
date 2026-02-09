import { HunterGenerator } from './HunterGenerator.js';

const generator = new HunterGenerator();

export const HUNTER_RUN = [];

// 12-frame Aggressive Run (Bandit Style)
for (let i = 0; i < 12; i++) {
    const pose = {};
    const phase = i / 12;
    
    // Body Bobbing (Athletic)
    // Bob down on contact (frames 1-3, 7-9)
    let bob = 0;
    if (i >= 1 && i <= 3) bob = 1;
    if (i >= 7 && i <= 9) bob = 1;
    
    pose.bodySquash = bob;
    
    // Coat Physics (Dynamic swing) - Replaces Hair Physics
    pose.coatWave = phase;
    
    // Head Leans Forward slightly (Aggressive but not hunched)
    pose.headOffset = { 
        x: -1,       // Slight forward lean
        y: bob       // Follows body
    };
    
    // Leg Cycle (Standard Athletic)
    if (i >= 0 && i < 2) pose.legFrame = { left: 'back1', right: 'fwd1' }; 
    else if (i >= 2 && i < 4) pose.legFrame = { left: 'back2', right: 'fwd2' }; 
    else if (i >= 4 && i < 6) pose.legFrame = { left: 'tuck', right: 'back1' }; 
    else if (i >= 6 && i < 8) pose.legFrame = { left: 'fwd1', right: 'back1' }; 
    else if (i >= 8 && i < 10) pose.legFrame = { left: 'fwd2', right: 'back2' }; 
    else pose.legFrame = { left: 'back1', right: 'tuck' }; 
    
    HUNTER_RUN.push(generator.generateFrame(pose));
}
