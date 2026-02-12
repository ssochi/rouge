import { CatGenerator } from './CatGenerator.js';

const generator = new CatGenerator();

export const CAT_RUN_FRAMES = [];

// 8-frame run cycle - cat gallop is more fluid/elastic than dog
// Pattern: stretch → gather → leap → land
const cycle = [
    { bodyBob: 0,  left: 'fwd2',  right: 'back2', tail: -0.5 },  // 0: Stretch out
    { bodyBob: 1,  left: 'fwd1',  right: 'back1', tail: -0.2 },  // 1: Landing
    { bodyBob: 0,  left: 'idle',  right: 'idle',  tail: 0.0 },   // 2: Gathering
    { bodyBob: -1, left: 'tuck',  right: 'tuck',  tail: 0.5 },   // 3: Crouched / spring
    { bodyBob: -1, left: 'back2', right: 'fwd2',  tail: 1.0 },   // 4: Leap (airborne)
    { bodyBob: 0,  left: 'back1', right: 'fwd1',  tail: 0.8 },   // 5: Extending
    { bodyBob: 1,  left: 'idle',  right: 'idle',  tail: 0.3 },   // 6: Contact
    { bodyBob: 0,  left: 'fwd1',  right: 'back1', tail: -0.3 }   // 7: Recovery
];

cycle.forEach((p, i) => {
    const phase = i / 8;

    // Ears flatten during run (wind effect)
    const earTwitch = Math.sin(phase * Math.PI * 4) * 0.8;

    // Tail streams behind, curves with motion
    const tailCurve = Math.sin(phase * Math.PI * 2) * 0.6 + p.tail * 0.4;

    CAT_RUN_FRAMES.push(generator.generateFrame({
        bodyBob: p.bodyBob,
        tailCurve,
        earTwitch,
        legFrame: { left: p.left, right: p.right }
    }));
});
