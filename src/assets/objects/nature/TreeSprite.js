import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

export function createTreeSprite() {
    const d = new PixelDraw(32, 48);

    // === SHADOW ===
    d.ellipse(16, 45, 10, 3, P.shadow);

    // === TRUNK ===
    // Main shaft
    d.rect(13, 28, 6, 18, P.trunkOutline); // Outline
    d.rect(14, 29, 4, 16, P.trunk);        // Fill

    // Roots (Flared base)
    d.fillPath([{x:13, y:40}, {x:11, y:46}, {x:14, y:46}], P.trunkOutline); // Left root outline
    d.fillPath([{x:19, y:40}, {x:21, y:46}, {x:18, y:46}], P.trunkOutline); // Right root outline
    
    d.fillPath([{x:14, y:40}, {x:12, y:45}, {x:14, y:45}], P.trunk); // Left root fill
    d.fillPath([{x:18, y:40}, {x:20, y:45}, {x:18, y:45}], P.trunk); // Right root fill

    // Trunk Shading & Texture
    d.vLine(14, 29, 16, P.trunkLight); // Highlight left
    d.vLine(17, 29, 16, P.trunkDark);  // Shadow right
    // Random bark details
    d.pixel(15, 32, P.trunkDark);
    d.pixel(16, 36, P.trunkLight);
    d.pixel(15, 40, P.trunkDark);
    d.hLine(15, 34, 2, P.trunkOutline); // Scar

    // === CANOPY ===
    // Using meta-balls technique: overlapping circles to create organic shape
    // Structure: {x, y, r}
    const clusters = [
        {x: 16, y: 13, r: 10}, // Top
        {x: 10, y: 22, r: 9},  // Left
        {x: 22, y: 22, r: 9},  // Right
        {x: 16, y: 26, r: 10}, // Bottom Center
        {x: 13, y: 18, r: 8},  // Filler
        {x: 19, y: 18, r: 8}   // Filler
    ];

    // 1. Outline (Deepest Shadow)
    clusters.forEach(c => d.circle(c.x, c.y, c.r + 1, P.canopyOutline));

    // 2. Dark Body (Shadow areas)
    clusters.forEach(c => d.circle(c.x, c.y, c.r, P.canopyDark));

    // 3. Main Body (Mid-tone) - Shifted Up-Left slightly for volume
    clusters.forEach(c => d.circle(c.x, c.y - 2, c.r - 1, P.canopy));

    // 4. Light Areas (Top-Left lighting)
    clusters.forEach(c => {
        // Draw smaller circles offset to top-left
        d.circle(c.x - 2, c.y - 4, c.r - 4, P.canopyLight);
    });

    // 5. Highlights (Specularity)
    d.circle(14, 9, 3, P.canopyHighlight);  // Top peak
    d.pixel(8, 19, P.canopyHighlight);      // Left shoulder
    d.pixel(20, 19, P.canopyHighlight);     // Right shoulder

    // 6. Texture / Leaf Noise
    // Add some random pixels to break smoothness
    const noise = [
        {x: 18, y: 15, c: P.canopyDark},
        {x: 12, y: 25, c: P.canopyDark},
        {x: 20, y: 25, c: P.canopyDark},
        {x: 15, y: 30, c: P.canopyDark},
        {x: 14, y: 12, c: P.canopyLight},
        {x: 11, y: 20, c: P.canopyLight}
    ];
    noise.forEach(p => d.pixel(p.x, p.y, p.c));

    return d.getCanvas();
}
