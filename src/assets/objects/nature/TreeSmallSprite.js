import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

export function createTreeSmallSprite() {
    const d = new PixelDraw(32, 36);

    // === TRUNK (drawn first — canopy overlaps upper portion) ===
    d.rect(14, 14, 4, 19, P.trunk);         // shaft x14-17, y14-32
    d.rect(13, 31, 6, 3, P.trunk);          // wider base x13-18, y31-33
    d.rect(12, 34, 8, 2, P.trunkDark);      // roots x12-19, y34-35

    // Bark texture
    d.vLine(14, 19, 11, P.trunkLight);
    d.vLine(17, 19, 11, P.trunkDark);
    d.pixel(15, 22, P.trunkLight);
    d.pixel(15, 26, P.trunkLight);
    d.pixel(16, 24, P.trunkDark);
    d.pixel(16, 28, P.trunkDark);

    // Trunk outline
    d.vLine(13, 17, 14, P.trunkOutline);    // left shaft y17-30
    d.vLine(18, 17, 14, P.trunkOutline);    // right shaft y17-30
    d.vLine(12, 31, 3, P.trunkOutline);     // left base y31-33
    d.vLine(19, 31, 3, P.trunkOutline);     // right base y31-33
    d.vLine(11, 34, 2, P.trunkOutline);     // left root y34-35
    d.vLine(20, 34, 2, P.trunkOutline);     // right root y34-35
    d.hLine(12, 35, 8, P.trunkOutline);     // ground line

    // === CANOPY dark layer ===
    const darkRows = [
        [1, 13, 6], [2, 11, 10], [3, 10, 13],
        [4, 8, 16], [5, 7, 18], [6, 7, 19],
        [7, 6, 20], [8, 6, 21], [9, 6, 21],
        [10, 6, 20], [11, 7, 19], [12, 7, 18],
        [13, 8, 16], [14, 10, 13], [15, 11, 10],
        [16, 13, 6]
    ];
    for (const [y, x, w] of darkRows) d.rect(x, y, w, 1, P.canopyDark);

    // === CANOPY main color ===
    const mainRows = [
        [2, 12, 8], [3, 11, 11],
        [4, 9, 14], [5, 8, 16], [6, 8, 17],
        [7, 7, 18], [8, 7, 19], [9, 7, 19],
        [10, 7, 18], [11, 8, 17], [12, 8, 16],
        [13, 9, 14], [14, 11, 11], [15, 12, 8]
    ];
    for (const [y, x, w] of mainRows) d.rect(x, y, w, 1, P.canopy);

    // === CANOPY light (upper-left) ===
    const lightRows = [
        [4, 10, 8], [5, 9, 8], [6, 9, 8],
        [7, 8, 8], [8, 8, 7], [9, 8, 6],
        [10, 9, 4]
    ];
    for (const [y, x, w] of lightRows) d.rect(x, y, w, 1, P.canopyLight);

    // Highlights
    d.pixel(11, 5, P.canopyHighlight);
    d.pixel(10, 7, P.canopyHighlight);
    d.pixel(9, 9, P.canopyHighlight);

    // Leaf cluster depth
    d.pixel(18, 8, P.canopyDark);
    d.pixel(20, 11, P.canopyDark);
    d.pixel(16, 13, P.canopyDark);

    // Right shadow edge
    d.pixel(26, 8, P.canopyOutline);
    d.pixel(25, 11, P.canopyOutline);

    return d.getCanvas();
}
