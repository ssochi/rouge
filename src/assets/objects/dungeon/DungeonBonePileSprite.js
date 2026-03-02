import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createDungeonBonePileSprite() {
    const d = new PixelDraw(32, 32);

    const shadow = 'rgba(0,0,0,0.26)';
    const boneDark = '#8f8677';
    const boneMid = '#c2b8a6';
    const boneLight = '#e2d8c4';

    d.ellipse(16, 27, 10, 3, shadow);

    // Crossed long bones.
    d.fillPath([
        { x: 9, y: 24 },
        { x: 11, y: 22 },
        { x: 20, y: 16 },
        { x: 22, y: 17 },
        { x: 12, y: 24 }
    ], boneMid);

    d.fillPath([
        { x: 22, y: 24 },
        { x: 20, y: 22 },
        { x: 12, y: 17 },
        { x: 10, y: 18 },
        { x: 19, y: 24 }
    ], boneMid);

    // Bone tips.
    d.circle(10, 23, 2, boneLight);
    d.circle(21, 17, 2, boneLight);
    d.circle(21, 23, 2, boneLight);
    d.circle(11, 18, 2, boneLight);

    // Skull chunk.
    d.circle(16, 22, 4, boneDark);
    d.circle(16, 21, 3, boneLight);
    d.pixel(15, 21, '#2f2a24');
    d.pixel(17, 21, '#2f2a24');
    d.rect(15, 23, 3, 1, boneDark);

    return d.getCanvas();
}
