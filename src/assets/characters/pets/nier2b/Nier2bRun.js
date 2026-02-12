import { Nier2bGenerator } from './Nier2bGenerator.js';

const generator = new Nier2bGenerator();

export const NIER2B_RUN_FRAMES = [];

// 8-frame human jogging cycle
// Elegant, composed movement befitting 2B's character
const cycle = [
    { bodyBob: 0,  left: 'fwd2',  right: 'back1', arm: 0.8 },   // 0: Left stride forward
    { bodyBob: -1, left: 'fwd1',  right: 'back2', arm: 0.4 },   // 1: Push off (slight lift)
    { bodyBob: 0,  left: 'idle',  right: 'idle',  arm: 0.0 },   // 2: Passing
    { bodyBob: 1,  left: 'back1', right: 'fwd1',  arm: -0.4 },  // 3: Landing
    { bodyBob: 0,  left: 'back2', right: 'fwd2',  arm: -0.8 },  // 4: Right stride forward
    { bodyBob: -1, left: 'back1', right: 'fwd1',  arm: -0.4 },  // 5: Push off
    { bodyBob: 0,  left: 'idle',  right: 'idle',  arm: 0.0 },   // 6: Passing
    { bodyBob: 1,  left: 'fwd1',  right: 'back1', arm: 0.4 }    // 7: Landing
];

cycle.forEach((p, i) => {
    const phase = i / 8;

    // Hair flows back during run (more dramatic)
    const hairFlow = Math.sin(phase * Math.PI * 2) * 1.5 + 0.5;

    // Skirt flutters with movement
    const skirtFlutter = Math.sin(phase * Math.PI * 4) * 1.2;

    NIER2B_RUN_FRAMES.push(generator.generateFrame({
        bodyBob: p.bodyBob,
        hairFlow,
        skirtFlutter,
        legFrame: { left: p.left, right: p.right },
        armSwing: p.arm
    }));
});
