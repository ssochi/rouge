import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createDungeonRubbleSprite() {
    const d = new PixelDraw(32, 32);

    const shadow = 'rgba(0,0,0,0.28)';
    const dark = '#4f535d';
    const mid = '#6b707c';
    const light = '#8c929f';
    const moss = '#5b6d45';

    d.ellipse(16, 27, 11, 4, shadow);

    // Base rubble mass.
    d.fillPath([
        { x: 5, y: 24 },
        { x: 8, y: 19 },
        { x: 13, y: 16 },
        { x: 20, y: 17 },
        { x: 25, y: 21 },
        { x: 26, y: 24 }
    ], dark);

    d.fillPath([
        { x: 8, y: 23 },
        { x: 11, y: 19 },
        { x: 16, y: 18 },
        { x: 21, y: 20 },
        { x: 23, y: 23 }
    ], mid);

    // Highlight shards.
    d.rect(11, 20, 2, 1, light);
    d.rect(14, 19, 3, 1, light);
    d.rect(19, 21, 2, 1, light);
    d.pixel(17, 22, light);

    // Dark cracks.
    d.pixel(10, 22, '#2e3239');
    d.pixel(13, 23, '#2e3239');
    d.pixel(18, 23, '#2e3239');

    // Small moss hints for biome variety.
    d.rect(8, 23, 2, 1, moss);
    d.rect(21, 23, 2, 1, moss);

    return d.getCanvas();
}
