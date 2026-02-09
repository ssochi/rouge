import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

export function createTreeSmallSprite() {
    const d = new PixelDraw(32, 36);

    // === SHADOW ===
    d.ellipse(16, 33, 8, 3, P.shadow);

    // === TRUNK ===
    // Main shaft
    d.rect(13, 18, 6, 15, P.trunkOutline);
    d.rect(14, 19, 4, 13, P.trunk);

    // Roots
    d.fillPath([{x:13, y:30}, {x:11, y:34}, {x:14, y:34}], P.trunkOutline);
    d.fillPath([{x:19, y:30}, {x:21, y:34}, {x:18, y:34}], P.trunkOutline);
    
    d.fillPath([{x:14, y:30}, {x:12, y:33}, {x:14, y:33}], P.trunk);
    d.fillPath([{x:18, y:30}, {x:20, y:33}, {x:18, y:33}], P.trunk);

    // Trunk Detail
    d.vLine(14, 20, 13, P.trunkLight);
    d.vLine(17, 20, 13, P.trunkDark);
    d.pixel(15, 24, P.trunkDark);
    d.pixel(16, 28, P.trunkLight);

    // === CANOPY ===
    // Meta-balls clusters
    const clusters = [
        {x: 16, y: 12, r: 9},  // Top
        {x: 10, y: 19, r: 8},  // Left
        {x: 22, y: 19, r: 8},  // Right
        {x: 16, y: 22, r: 8}   // Bottom Center
    ];

    // 1. Outline
    clusters.forEach(c => d.circle(c.x, c.y, c.r + 1, P.canopyOutline));

    // 2. Dark Body
    clusters.forEach(c => d.circle(c.x, c.y, c.r, P.canopyDark));

    // 3. Main Body
    clusters.forEach(c => d.circle(c.x, c.y - 1, c.r - 1, P.canopy));

    // 4. Light Areas
    clusters.forEach(c => {
        d.circle(c.x - 2, c.y - 3, c.r - 3, P.canopyLight);
    });

    // 5. Highlights
    d.circle(14, 8, 2, P.canopyHighlight);
    d.pixel(8, 16, P.canopyHighlight);
    d.pixel(20, 16, P.canopyHighlight);

    // 6. Texture
    d.pixel(16, 14, P.canopyDark);
    d.pixel(12, 22, P.canopyDark);
    d.pixel(20, 22, P.canopyDark);
    d.pixel(14, 10, P.canopyLight);

    return d.getCanvas();
}
