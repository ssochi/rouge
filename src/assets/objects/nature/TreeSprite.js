import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

export function createTreeSprite() {
    const d = new PixelDraw(32, 48);

    // === TRUNK (drawn first — canopy overlaps upper portion) ===
    d.rect(14, 24, 4, 22, P.trunk);         // shaft x14-17, y24-45
    d.rect(13, 42, 6, 4, P.trunk);          // wider base x13-18, y42-45
    d.rect(12, 46, 8, 2, P.trunkDark);      // root spread x12-19, y46-47

    // Bark texture
    d.vLine(14, 28, 14, P.trunkLight);
    d.vLine(17, 28, 14, P.trunkDark);
    d.pixel(15, 31, P.trunkLight);
    d.pixel(15, 35, P.trunkLight);
    d.pixel(15, 39, P.trunkLight);
    d.pixel(16, 33, P.trunkDark);
    d.pixel(16, 37, P.trunkDark);
    d.pixel(16, 41, P.trunkDark);

    // Trunk outline
    d.vLine(13, 26, 16, P.trunkOutline);    // left shaft y26-41
    d.vLine(18, 26, 16, P.trunkOutline);    // right shaft y26-41
    d.vLine(12, 42, 4, P.trunkOutline);     // left base y42-45
    d.vLine(19, 42, 4, P.trunkOutline);     // right base y42-45
    d.vLine(11, 46, 2, P.trunkOutline);     // left root y46-47
    d.vLine(20, 46, 2, P.trunkOutline);     // right root y46-47
    d.hLine(12, 47, 8, P.trunkOutline);     // ground line

    // === CANOPY dark layer (outline shape) ===
    const darkRows = [
        [1, 12, 8], [2, 10, 12], [3, 8, 16],
        [4, 7, 19], [5, 6, 21], [6, 5, 23],
        [7, 4, 24], [8, 4, 25], [9, 3, 26], [10, 3, 26],
        [11, 3, 27], [12, 3, 27], [13, 3, 27],
        [14, 4, 26], [15, 4, 25], [16, 5, 23],
        [17, 5, 22], [18, 6, 21], [19, 7, 19],
        [20, 8, 17], [21, 9, 15], [22, 10, 13],
        [23, 11, 11], [24, 12, 9], [25, 14, 5]
    ];
    for (const [y, x, w] of darkRows) d.rect(x, y, w, 1, P.canopyDark);

    // === CANOPY main color (1px inset) ===
    const mainRows = [
        [2, 11, 10], [3, 9, 14],
        [4, 8, 17], [5, 7, 19], [6, 6, 21],
        [7, 5, 22], [8, 5, 23], [9, 4, 24], [10, 4, 24],
        [11, 4, 25], [12, 4, 25], [13, 4, 25],
        [14, 5, 24], [15, 5, 23], [16, 6, 21],
        [17, 6, 20], [18, 7, 19], [19, 8, 17],
        [20, 9, 15], [21, 10, 13], [22, 11, 11],
        [23, 12, 9], [24, 13, 7]
    ];
    for (const [y, x, w] of mainRows) d.rect(x, y, w, 1, P.canopy);

    // === CANOPY light (upper-left) ===
    const lightRows = [
        [4, 9, 10], [5, 8, 11], [6, 7, 12],
        [7, 6, 12], [8, 6, 11], [9, 5, 11],
        [10, 5, 10], [11, 5, 10], [12, 6, 8],
        [13, 7, 6], [14, 8, 4]
    ];
    for (const [y, x, w] of lightRows) d.rect(x, y, w, 1, P.canopyLight);

    // Highlights (bright spots)
    d.pixel(10, 5, P.canopyHighlight);
    d.pixel(9, 7, P.canopyHighlight);
    d.pixel(8, 9, P.canopyHighlight);
    d.pixel(11, 6, P.canopyHighlight);
    d.pixel(7, 8, P.canopyHighlight);

    // Leaf cluster depth (dark spots in main zone)
    d.pixel(17, 10, P.canopyDark);
    d.pixel(19, 14, P.canopyDark);
    d.pixel(14, 18, P.canopyDark);
    d.pixel(21, 9, P.canopyDark);
    d.pixel(16, 16, P.canopyDark);
    d.pixel(22, 12, P.canopyDark);

    // Right-side shadow edge
    d.pixel(28, 10, P.canopyOutline);
    d.pixel(29, 12, P.canopyOutline);
    d.pixel(28, 15, P.canopyOutline);
    d.pixel(26, 18, P.canopyOutline);

    return d.getCanvas();
}
