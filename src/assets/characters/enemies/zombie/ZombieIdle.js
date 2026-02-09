import { ZombieGenerator } from './ZombieGenerator.js';

const generator = new ZombieGenerator();

export const ZOMBIE_IDLE_FRAMES = [];

// 16-frame breathing cycle with Twitching
for (let i = 0; i < 16; i++) {
    // 0..1 phase
    const phase = i / 16;
    
    // Breathing: Sine wave
    const breath = Math.sin(phase * Math.PI * 2);
    
    // Body moves up/down slightly
    const bodySquash = Math.floor(breath * 0.8); 
    
    // Head moves with body
    let headOffset = { x: 0, y: Math.floor(breath * 0.5) };
    
    // Twitch Logic (Frames 8-10)
    let headTwitch = { x: 0, y: 0 };
    if (i === 8) headTwitch = { x: 1, y: 0 };
    if (i === 9) headTwitch = { x: -1, y: 1 };
    if (i === 10) headTwitch = { x: 0, y: -1 };
    
    // Jaw Movement (Slow gape)
    const jawOpen = Math.floor(Math.sin(phase * Math.PI) * 2); // 0 to 2
    
    // Arm angle sways slightly (Asymmetric)
    const armAngle = Math.sin(phase * Math.PI * 2) * 0.1 + (i % 2 === 0 ? 0.05 : -0.05); // Jittery
    
    // Tie Sway
    const tieAngle = Math.sin(phase * Math.PI * 2 + 1) * 0.5;

    ZOMBIE_IDLE_FRAMES.push(generator.generateFrame({
        bodySquash,
        headOffset,
        headTwitch,
        jawOpen,
        armAngle,
        tieAngle,
        legFrame: 'idle'
    }));
}
