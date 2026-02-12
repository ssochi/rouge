import { CatGenerator } from './CatGenerator.js';

const generator = new CatGenerator();

export const CAT_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // Breathing - gentle body bob
    const breath = Math.sin(rad);
    const bodyBob = Math.round(breath * 0.5);

    // Tail curve - slow S-curve sway
    const tailCurve = Math.sin(rad * 1.5) * 0.8;

    // Ear twitch - occasional
    let earTwitch = 0;
    if (i === 3 || i === 4) earTwitch = 1;
    if (i === 10 || i === 11) earTwitch = -0.5;

    CAT_IDLE_FRAMES.push(generator.generateFrame({
        bodyBob,
        tailCurve,
        earTwitch,
        legFrame: 'idle'
    }));
}
