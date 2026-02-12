import { Nier2bGenerator } from './Nier2bGenerator.js';

const generator = new Nier2bGenerator();

export const NIER2B_IDLE_FRAMES = [];

for (let i = 0; i < 16; i++) {
    const phase = i / 16;
    const rad = phase * Math.PI * 2;

    // Breathing - gentle body bob
    const breath = Math.sin(rad);
    const bodyBob = Math.round(breath * 0.5);

    // Hair sway - slow, elegant
    const hairFlow = Math.sin(rad * 1.5) * 0.8;

    // Skirt micro-flutter - subtle fabric movement
    const skirtFlutter = Math.sin(rad * 0.8) * 0.4;

    // Arm swing - almost still, slight weight shift
    let armSwing = 0;
    if (i === 6 || i === 7) armSwing = 0.3;
    if (i === 14 || i === 15) armSwing = -0.3;

    NIER2B_IDLE_FRAMES.push(generator.generateFrame({
        bodyBob,
        hairFlow,
        skirtFlutter,
        legFrame: 'idle',
        armSwing
    }));
}
