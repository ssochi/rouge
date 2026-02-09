import { HunterGenerator } from './HunterGenerator.js';

const generator = new HunterGenerator();

// Avatar is just a static high-quality frame
// Maybe close up? For now, standard frame.
export const HUNTER_AVATAR = generator.generateFrame({
    headOffset: { x: 0, y: 0 },
    bodySquash: 0,
    legFrame: 'idle'
});
