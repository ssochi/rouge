// Gargoyle 雕像态：单帧——收翼低头、灰岩配色、无光眼（与石雕混淆）。
import { GargoyleGenerator } from './GargoyleGenerator.js';

const generator = new GargoyleGenerator();

export const GARGOYLE_DORMANT_FRAMES = [
    generator.generateFrame({
        bodySquash: 0,
        legFrame: 0,
        wingSpread: 0,
        headBow: 1,
        eyeGlow: 0,
        crack: 0,
        dormant: true
    })
];
