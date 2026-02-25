import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

export function createTreeSmallSprite() {
    // Upscaled to 40x56 for better detail and taller proportions
    const d = new PixelDraw(40, 56);

    // === SHADOW ===
    // Layered ellipses for a ground-hugging organic shadow
    d.ellipse(20, 53, 13, 2, P.shadow);
    d.ellipse(20, 52, 9, 2, P.shadow);

    // === TRUNK & ROOTS ===
    // 1. Trunk Base Outline
    d.rect(17, 28, 6, 20, P.trunkOutline);
    // Left spreading root outline
    d.fillPath([{x: 17, y: 46}, {x: 10, y: 53}, {x: 18, y: 53}], P.trunkOutline);
    // Right spreading root outline
    d.fillPath([{x: 23, y: 46}, {x: 30, y: 53}, {x: 22, y: 53}], P.trunkOutline);
    // Center forward root outline
    d.fillPath([{x: 18, y: 48}, {x: 15, y: 55}, {x: 25, y: 55}], P.trunkOutline);

    // 2. Trunk Core Fill
    d.rect(18, 28, 4, 20, P.trunk);
    d.fillPath([{x: 18, y: 46}, {x: 12, y: 52}, {x: 18, y: 52}], P.trunk);
    d.fillPath([{x: 22, y: 46}, {x: 28, y: 52}, {x: 22, y: 52}], P.trunk);
    d.fillPath([{x: 19, y: 48}, {x: 17, y: 54}, {x: 23, y: 54}], P.trunk);

    // 3. Trunk Shading (Simulating top-left light source)
    // Ambient Occlusion under canopy
    d.rect(18, 28, 4, 11, P.trunkDark);
    d.pixel(18, 39, P.trunkDark);
    d.pixel(21, 40, P.trunkDark);

    // Left Light Side
    d.vLine(18, 39, 9, P.trunkLight);
    d.pixel(17, 48, P.trunkLight);
    d.pixel(16, 49, P.trunkLight);
    d.pixel(15, 50, P.trunkLight);
    d.pixel(14, 51, P.trunkLight);

    // Right Dark Side
    d.vLine(21, 39, 9, P.trunkDark);
    d.pixel(22, 48, P.trunkDark);
    d.pixel(23, 49, P.trunkDark);
    d.pixel(24, 50, P.trunkDark);
    d.pixel(25, 51, P.trunkDark);

    // 4. Bark Details
    d.vLine(19, 41, 4, P.trunkDark);
    d.vLine(20, 44, 4, P.trunkLight);
    // Knothole feature
    d.rect(19, 46, 2, 2, P.trunkDark);
    d.pixel(19, 47, P.trunkOutline);
    d.pixel(19, 48, P.trunkLight);

    // === CANOPY META-BALLS ===
    // A rich mix of large volumes and small noise clusters
    const clusters = [
        // Main structural masses
        {x: 20, y: 10, r: 8},
        {x: 14, y: 15, r: 7},
        {x: 26, y: 16, r: 7},
        {x: 10, y: 22, r: 6},
        {x: 30, y: 23, r: 6},
        {x: 20, y: 20, r: 10},
        {x: 15, y: 28, r: 8},
        {x: 25, y: 29, r: 8},
        {x: 20, y: 32, r: 6},

        // Medium bumps for irregular shape
        {x: 17, y: 7,  r: 4},
        {x: 23, y: 9,  r: 4},
        {x: 8,  y: 18, r: 3},
        {x: 32, y: 20, r: 3},
        {x: 11, y: 29, r: 4},
        {x: 29, y: 31, r: 4},
        {x: 14, y: 33, r: 3},
        {x: 26, y: 34, r: 3},

        // Small leaf clusters (edge noise)
        {x: 12, y: 11, r: 2},
        {x: 28, y: 11, r: 2},
        {x: 9,  y: 15, r: 2},
        {x: 31, y: 16, r: 2},
        {x: 7,  y: 23, r: 2},
        {x: 33, y: 24, r: 2},
        {x: 12, y: 32, r: 2},
        {x: 28, y: 33, r: 2},
        {x: 20, y: 35, r: 2},
        {x: 17, y: 34, r: 1},
        {x: 23, y: 35, r: 1},
        {x: 10, y: 26, r: 1},
        {x: 31, y: 28, r: 1}
    ];

    // Build the 3D canopy from back to front lighting layers

    // 1. Outline Boundary
    clusters.forEach(c => d.circle(c.x, c.y, c.r + 1, P.canopyOutline));

    // 2. Dark Body (Shadows / Ambient)
    clusters.forEach(c => d.circle(c.x, c.y, c.r, P.canopyDark));

    // 3. Mid-tone (Main leaf color, offset top-left)
    clusters.forEach(c => {
        if (c.r >= 1) {
            d.circle(c.x - 1, c.y - 1, c.r - 1, P.canopy);
        }
    });

    // 4. Light Areas (Directional hit)
    clusters.forEach(c => {
        if (c.r >= 3) {
            d.circle(c.x - 2, c.y - 2, c.r - 3, P.canopyLight);
        }
    });

    // 5. Bright Specular Highlights
    clusters.forEach(c => {
        if (c.r >= 5) {
            d.circle(c.x - 3, c.y - 3, c.r - 5, P.canopyHighlight);
        }
    });

    // === CANOPY DITHERING & TEXTURE ===
    // Break up the smooth spherical lighting with organic leaf shapes

    // Dark cutting into Midtone
    [
        [20, 14], [14, 19], [26, 19], [18, 24], [23, 25],
        [12, 14], [28, 15], [16, 30], [24, 31], [20, 22]
    ].forEach(p => d.pixel(p[0], p[1], P.canopyDark));

    // Midtone cutting into Light
    [
        [18, 10], [22, 12], [13, 15], [25, 16],
        [17, 21], [21, 20], [14, 26], [23, 27]
    ].forEach(p => d.pixel(p[0], p[1], P.canopy));

    // Light extending or cutting inward
    [
        [19, 8], [15, 12], [25, 13], [11, 21],
        [29, 22], [19, 19], [16, 26]
    ].forEach(p => d.pixel(p[0], p[1], P.canopyLight));

    return d.getCanvas();
}
