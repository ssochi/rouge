import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

export function createBushSprite() {
    const d = new PixelDraw(24, 20);

    // === Dark outline shape ===
    const darkRows = [
        [1, 8, 8], [2, 6, 12], [3, 4, 16],
        [4, 3, 18], [5, 2, 20], [6, 1, 22],
        [7, 1, 22], [8, 1, 22], [9, 1, 22],
        [10, 1, 22], [11, 2, 20], [12, 2, 20],
        [13, 3, 18], [14, 3, 18], [15, 4, 16],
        [16, 5, 14], [17, 7, 10], [18, 9, 6]
    ];
    for (const [y, x, w] of darkRows) d.rect(x, y, w, 1, P.bushDark);

    // === Main color ===
    const mainRows = [
        [2, 7, 10], [3, 5, 14],
        [4, 4, 16], [5, 3, 18], [6, 2, 20],
        [7, 2, 20], [8, 2, 20], [9, 2, 20],
        [10, 2, 20], [11, 3, 18], [12, 3, 18],
        [13, 4, 16], [14, 4, 16], [15, 5, 14],
        [16, 6, 12], [17, 8, 8]
    ];
    for (const [y, x, w] of mainRows) d.rect(x, y, w, 1, P.bush);

    // === Light patches (upper-left) ===
    const lightRows = [
        [3, 6, 8], [4, 5, 9], [5, 4, 9],
        [6, 3, 9], [7, 3, 8], [8, 4, 6],
        [9, 5, 4]
    ];
    for (const [y, x, w] of lightRows) d.rect(x, y, w, 1, P.bushLight);

    // Highlights
    d.pixel(7, 4, P.bushHighlight);
    d.pixel(6, 6, P.bushHighlight);
    d.pixel(8, 5, P.bushHighlight);

    // Leaf cluster depth
    d.pixel(14, 8, P.bushDark);
    d.pixel(12, 12, P.bushDark);
    d.pixel(16, 10, P.bushDark);

    // Right shadow edge
    d.pixel(21, 8, P.bushOutline);
    d.pixel(20, 12, P.bushOutline);
    d.pixel(18, 15, P.bushOutline);

    return d.getCanvas();
}
