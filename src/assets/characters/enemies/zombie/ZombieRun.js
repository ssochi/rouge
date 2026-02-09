import { ZombieGenerator } from './ZombieGenerator.js';

const generator = new ZombieGenerator();

export const ZOMBIE_RUN_FRAMES = [];

// 12-frame Exaggerated Limping Run Cycle
for (let i = 0; i < 12; i++) {
    const pose = {};
    
    // Phase 1: Heavy Step (Left) 0-5
    // Phase 2: Drag (Right) 6-11
    
    // Body Bobbing (More dramatic)
    // Deep dip when dragging leg forward
    let bob = 0;
    if (i >= 0 && i <= 3) bob = 2; // Heavy impact left
    if (i >= 6 && i <= 9) bob = 1; // Drag right
    
    pose.bodySquash = bob;
    
    // Head Flailing (Whiplash effect)
    let headTwitch = { x: 0, y: 0 };
    if (i === 1) headTwitch = { x: 1, y: 1 };
    if (i === 7) headTwitch = { x: -1, y: 0 };
    
    pose.headOffset = { x: 0, y: bob };
    pose.headTwitch = headTwitch;
    
    // Jaw hangs open while running
    pose.jawOpen = 2 + Math.floor(Math.random() * 2); // 2-3px open
    
    // Arms Flailing (Wildly)
    // One arm up, one down?
    // Use fast sine wave but larger amplitude
    pose.armAngle = Math.sin((i / 12) * Math.PI * 4) * 0.4 + (Math.random() * 0.2 - 0.1); 
    
    // Tie Flying
    pose.tieAngle = Math.sin((i / 12) * Math.PI * 2) * 1.5; // Large swing
    
    // Legs: Asymmetric Limp
    if (i < 6) {
        pose.legFrame = {
            left: 'step',
            right: 'drag'
        };
    } else {
        pose.legFrame = {
            left: 'drag',
            right: 'step'
        };
    }
    
    ZOMBIE_RUN_FRAMES.push(generator.generateFrame(pose));
}
