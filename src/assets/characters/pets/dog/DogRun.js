import { DogGenerator } from './DogGenerator.js';

const generator = new DogGenerator();

export const DOG_RUN_FRAMES = [];

// 8-frame gallop cycle
// Pattern: contact → down → passing → up (x2 for both leg pairs)
const cycle = [
    { bodyBob: 0,  left: 'fwd2',  right: 'back2', tail: 0.0 },   // 0: Contact (left fwd, right back)
    { bodyBob: 1,  left: 'fwd1',  right: 'back1', tail: 0.3 },   // 1: Down (impact)
    { bodyBob: 0,  left: 'idle',  right: 'idle',  tail: 0.6 },   // 2: Passing
    { bodyBob: -1, left: 'back1', right: 'fwd1',  tail: 1.0 },   // 3: Up (airborne feel)
    { bodyBob: 0,  left: 'back2', right: 'fwd2',  tail: 0.5 },   // 4: Contact (mirrored)
    { bodyBob: 1,  left: 'back1', right: 'fwd1',  tail: 0.2 },   // 5: Down
    { bodyBob: 0,  left: 'idle',  right: 'idle',  tail: -0.3 },  // 6: Passing
    { bodyBob: -1, left: 'fwd1',  right: 'back1', tail: -0.8 }   // 7: Up
];

cycle.forEach((p, i) => {
    const phase = i / 8;

    // Ears flap during run (wind effect)
    const earFlop = Math.sin(phase * Math.PI * 4) * 1.2;

    // Tail wags fast and bounces with body
    const tailWag = Math.sin(phase * Math.PI * 4) * 1.0 + p.tail * 0.3;

    DOG_RUN_FRAMES.push(generator.generateFrame({
        bodyBob: p.bodyBob,
        tailWag,
        earFlop,
        legFrame: { left: p.left, right: p.right }
    }));
});
