import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createDungeonIronCageSprite() {
    const d = new PixelDraw(32, 32);

    const shadow = 'rgba(0,0,0,0.3)';
    const frameDark = '#3c434f';
    const frameMid = '#5d6673';
    const frameLight = '#8b95a3';
    const rust = '#7b5544';

    d.ellipse(16, 28, 9, 3, shadow);

    // Floor plate.
    d.rect(8, 24, 16, 3, frameDark);
    d.hLine(8, 24, 16, frameLight);

    // Vertical bars.
    for (let x = 10; x <= 22; x += 3) {
        d.rect(x, 13, 1, 11, frameMid);
        d.pixel(x, 13, frameLight);
    }

    // Back bars for depth.
    d.rect(9, 14, 14, 1, frameDark);
    d.rect(9, 18, 14, 1, frameDark);

    // Top frame.
    d.rect(8, 11, 16, 3, frameDark);
    d.hLine(8, 11, 16, frameLight);
    d.vLine(8, 11, 14, frameMid);
    d.vLine(23, 11, 14, frameMid);

    // Door ring + latch.
    d.rect(15, 18, 2, 2, frameLight);
    d.pixel(16, 20, rust);
    d.rect(14, 21, 4, 1, rust);

    return d.getCanvas();
}
