import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

export function createGrassTuftSprite() {
    const d = new PixelDraw(16, 14);

    // Base cluster
    d.rect(6, 12, 4, 2, P.grassDark);

    // Blade 1: far left, short, leans left
    d.pixel(3, 7, P.grassTip);
    d.pixel(4, 8, P.grassLight);
    d.pixel(5, 9, P.grass);
    d.pixel(5, 10, P.grass);
    d.pixel(6, 11, P.grassDark);

    // Blade 2: left of center, medium height
    d.pixel(5, 4, P.grassTip);
    d.pixel(6, 5, P.grassLight);
    d.pixel(6, 6, P.grassLight);
    d.pixel(6, 7, P.grass);
    d.pixel(7, 8, P.grass);
    d.pixel(7, 9, P.grass);
    d.pixel(7, 10, P.grassDark);
    d.pixel(7, 11, P.grassDark);

    // Blade 3: center, tallest
    d.pixel(8, 1, P.grassTip);
    d.pixel(8, 2, P.grassTip);
    d.pixel(8, 3, P.grassLight);
    d.pixel(8, 4, P.grassLight);
    d.pixel(8, 5, P.grass);
    d.pixel(8, 6, P.grass);
    d.pixel(8, 7, P.grass);
    d.pixel(8, 8, P.grass);
    d.pixel(8, 9, P.grassDark);
    d.pixel(8, 10, P.grassDark);
    d.pixel(8, 11, P.grassDark);

    // Blade 4: right of center, medium height
    d.pixel(11, 4, P.grassTip);
    d.pixel(10, 5, P.grassLight);
    d.pixel(10, 6, P.grassLight);
    d.pixel(10, 7, P.grass);
    d.pixel(9, 8, P.grass);
    d.pixel(9, 9, P.grass);
    d.pixel(9, 10, P.grassDark);
    d.pixel(9, 11, P.grassDark);

    // Blade 5: far right, short, leans right
    d.pixel(13, 7, P.grassTip);
    d.pixel(12, 8, P.grassLight);
    d.pixel(11, 9, P.grass);
    d.pixel(11, 10, P.grass);
    d.pixel(10, 11, P.grassDark);

    return d.getCanvas();
}
