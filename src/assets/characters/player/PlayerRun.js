import { PlayerGenerator } from './PlayerGenerator.js';

/**
 * Procedural Run Animation
 * Standard: 12-Frame Cycle (Smooth)
 * Cycle: Contact -> Down -> Pass -> Up -> Air -> Reach
 */

const generator = new PlayerGenerator();
const frames = [];

// Define the cycle phases
// Each phase defines:
// - Body Y offset (Bobbing)
// - Left Leg Pose
// - Right Leg Pose
// - Hair Wave Phase (0..1)
const cycle = [
    // --- Phase 1: Right Leg Contact (Front), Left Leg Push (Back) ---
    
    // Frame 0: Contact (Right Fwd2, Left Back2) - Mid height
    { bodyY: 0, left: 'back2', right: 'fwd2', hair: 0.0, coat: 0.0 },
    
    // Frame 1: Down (Right Stand/Bent, Left Tuck/Kick) - Low height (Squash)
    // Weight on Right leg
    { bodyY: 1, left: 'tuck', right: 'stand', hair: 0.1, coat: 0.2 },
    
    // Frame 2: Pass (Right Push Back1, Left Knee Up) - Mid height
    { bodyY: 0, left: 'knee', right: 'back1', hair: 0.2, coat: 0.4 },
    
    // Frame 3: Up (Right Push Back2, Left Fwd1 Air) - High height (Leap)
    { bodyY: -1, left: 'fwd1', right: 'back2', hair: 0.3, coat: 0.6 },
    
    // Frame 4: Air (Right Tuck, Left Fwd2 Reach) - High height
    { bodyY: -1, left: 'fwd2', right: 'tuck', hair: 0.4, coat: 0.8 },
    
    // Frame 5: Reach (Prep Contact) - Mid height
    { bodyY: 0, left: 'fwd2', right: 'back1', hair: 0.5, coat: 0.9 },
    
    // --- Phase 2: Left Leg Contact (Back), Right Leg Push (Front) ---
    
    // Frame 6: Contact (Left Fwd2, Right Back2) - Mid height
    { bodyY: 0, left: 'fwd2', right: 'back2', hair: 0.5, coat: 1.0 }, // Peak swing back
    
    // Frame 7: Down (Left Stand, Right Tuck) - Low height
    { bodyY: 1, left: 'stand', right: 'tuck', hair: 0.6, coat: 0.8 },
    
    // Frame 8: Pass (Left Back1, Right Knee) - Mid height
    { bodyY: 0, left: 'back1', right: 'knee', hair: 0.7, coat: 0.6 },
    
    // Frame 9: Up (Left Back2, Right Fwd1) - High height
    { bodyY: -1, left: 'back2', right: 'fwd1', hair: 0.8, coat: 0.4 },
    
    // Frame 10: Air (Left Tuck, Right Fwd2) - High height
    { bodyY: -1, left: 'tuck', right: 'fwd2', hair: 0.9, coat: 0.2 },
    
    // Frame 11: Reach - Mid height
    { bodyY: 0, left: 'back1', right: 'fwd2', hair: 1.0, coat: 0.1 }
];

cycle.forEach(p => {
    frames.push(generator.generateFrame({
        bodySquash: p.bodyY,
        legFrame: { left: p.left, right: p.right },
        // Head lags slightly behind body bobbing? Or just follows.
        // Let's add slight head lag: offset head opposite to body movement direction?
        // Simple approach: Head follows body (p.bodyY) + subtle independent bounce.
        headOffset: { x: 0, y: p.bodyY },
        hairWave: p.hair, // Hair flows in sine wave
        coatWave: p.coat // Coat flows dynamically
    }));
});

export const PLAYER_RUN_FRAMES = frames;
