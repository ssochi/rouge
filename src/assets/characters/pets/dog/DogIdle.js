import { DogGenerator } from './DogGenerator.js';

const generator = new DogGenerator();

export const DOG_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // Breathing - gentle body bob
    const breath = Math.sin(rad);
    const bodyBob = Math.round(breath * 0.5);

    // Tail wagging - slow, happy sway
    const tailWag = Math.sin(rad * 2) * 0.8;

    // Ear flop - occasional twitch
    let earFlop = 0;
    if (i === 4 || i === 5) earFlop = 1;
    if (i === 12 || i === 13) earFlop = -0.5;

    DOG_IDLE_FRAMES.push(generator.generateFrame({
        bodyBob,
        tailWag,
        earFlop,
        legFrame: 'idle'
    }));
}
