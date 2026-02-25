import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

export function createTreeSprite() {
    // Canvas 56x72 — extra 8px width so canopy clusters aren't clipped
    const d = new PixelDraw(56, 72);
    d.ctx.translate(4, 0); // shift all drawing 4px right to center in wider canvas

    // === SHADOW ===
    // Wide base shadow anchoring the large tree
    d.ellipse(24, 69, 20, 4, P.shadow);
    d.ellipse(24, 69, 14, 2, P.shadow); // Darker/denser center core

    // === TRUNK & ROOTS ===
    // Custom helper for pixel-perfect trunk segment
    // Builds crisp block rows avoiding anti-aliased slopes
    const drawTrSegment = (x, y, w, h) => {
        d.rect(x, y, w, h, P.trunk);
        d.vLine(x, y, h, P.trunkOutline);                 // Left edge
        d.vLine(x + w - 1, y, h, P.trunkOutline);         // Right edge
        d.vLine(x + 1, y, h, P.trunkLight);               // Left highlight for volume
        d.vLine(x + w - 2, y, h, P.trunkDark);            // Right core shadow
        if (w > 5) d.vLine(x + w - 3, y, h, P.trunkDark); // Wider right shadow
    };

    // Main central shaft (from hidden top to visible bottom)
    drawTrSegment(21, 28, 6, 10);
    drawTrSegment(20, 38, 8, 8);
    drawTrSegment(19, 46, 10, 8);
    drawTrSegment(18, 54, 12, 8);

    // Deep lateral roots digging into ground
    drawTrSegment(15, 60, 6, 4);
    drawTrSegment(13, 64, 6, 4);
    drawTrSegment(11, 68, 5, 3); // Left tip

    drawTrSegment(27, 60, 6, 4);
    drawTrSegment(29, 64, 6, 4);
    drawTrSegment(32, 68, 5, 3); // Right tip

    drawTrSegment(21, 62, 8, 5);
    drawTrSegment(22, 67, 6, 4); // Center tip

    // Erase horizontal outlines between stacked chunks to blend them seamlessly
    d.hLine(21, 38, 6, P.trunk); d.pixel(21, 38, P.trunkLight); d.pixel(26, 38, P.trunkDark);
    d.hLine(20, 46, 8, P.trunk); d.pixel(20, 46, P.trunkLight); d.pixel(27, 46, P.trunkDark);
    d.hLine(19, 54, 10, P.trunk); d.pixel(19, 54, P.trunkLight); d.pixel(28, 54, P.trunkDark);

    // Blend root connections
    d.hLine(16, 60, 4, P.trunk); d.pixel(16, 60, P.trunkLight);
    d.hLine(14, 64, 4, P.trunk); d.pixel(14, 64, P.trunkLight);
    d.hLine(12, 68, 3, P.trunk); d.pixel(12, 68, P.trunkLight);

    d.hLine(28, 60, 4, P.trunk); d.pixel(31, 60, P.trunkDark);
    d.hLine(30, 64, 4, P.trunk); d.pixel(33, 64, P.trunkDark);
    d.hLine(33, 68, 3, P.trunk); d.pixel(35, 68, P.trunkDark);

    d.hLine(22, 62, 6, P.trunk);
    d.hLine(23, 67, 4, P.trunkDark);

    // Trunk Texture (Scars, Knots & Bark Splits)
    d.hLine(20, 49, 3, P.trunkDark);
    d.hLine(19, 50, 4, P.trunkOutline);
    d.pixel(20, 50, P.trunkDark);
    d.pixel(19, 51, P.trunkLight); // Left hollow knot highlight

    d.hLine(25, 41, 2, P.trunkOutline);
    d.pixel(26, 42, P.trunkLight); // Scar right

    d.vLine(23, 34, 4, P.trunkDark);
    d.vLine(22, 44, 5, P.trunkDark);
    d.vLine(24, 56, 6, P.trunkLight); // Bark ridge peeling out
    d.vLine(25, 50, 4, P.trunkDark);


    // === CANOPY ===
    // Meta-balls logic with carefully tailored overlapping clusters
    const clusters = [
        // Silhouette fillers / Background masses
        {x: 24, y: 14, r: 14},
        {x: 14, y: 24, r: 13},
        {x: 34, y: 24, r: 13},
        {x: 9,  y: 35, r: 10},
        {x: 39, y: 35, r: 10},

        // Lower overhangs concealing trunk
        {x: 16, y: 41, r: 8},
        {x: 32, y: 41, r: 8},
        {x: 24, y: 43, r: 9},

        // Primary dense/foreground volumes
        {x: 24, y: 26, r: 16},
        {x: 17, y: 35, r: 13},
        {x: 31, y: 35, r: 13},

        // Bumps and details pushing out boundaries
        {x: 11, y: 27, r: 8},
        {x: 37, y: 27, r: 8},
        {x: 24, y: 8,  r: 10}, // Uppermost crown
        {x: 20, y: 44, r: 7},
        {x: 28, y: 44, r: 7}
    ];

    // Build dimensional bulk via separate sequential layers (Base up to High Specular)
    // 1. Outline (Deepest occluded shadow)
    clusters.forEach(c => d.circle(c.x, c.y, c.r + 1, P.canopyOutline));

    // 2. Dark Body (Volume shadow)
    clusters.forEach(c => d.circle(c.x, c.y, c.r, P.canopyDark));

    // 3. Main Body (Mid-tone base, shifted top-left)
    clusters.forEach(c => d.circle(c.x - 1, c.y - 1, c.r - 1, P.canopy));

    // 4. Light Areas (Foliage catching the primary light)
    clusters.forEach(c => d.circle(c.x - 3, c.y - 4, Math.max(0, c.r - 4), P.canopyLight));

    // 5. Highlights (Specularity restricted to robust volumes)
    clusters.forEach(c => {
        if (c.r >= 12) {
            d.circle(c.x - 5, c.y - 7, Math.max(0, c.r - 9), P.canopyHighlight);
            d.pixel(c.x - 4, c.y - 9, P.canopyHighlight); // Sharp gleam spike
            d.pixel(c.x - 8, c.y - 6, P.canopyHighlight);
        }
    });

    // 6. Texture & Edge Noise
    // Breaks up perfectly mathematical spheres for organic leaf clusters
    clusters.forEach(c => {
        // Tame lower/right shadow edge with protruding sprigs
        d.pixel(c.x + c.r + 1, c.y + c.r - 2, P.canopyOutline);
        d.pixel(c.x + c.r - 1, c.y + c.r + 1, P.canopyDark);

        // Add scattered sunlit leaves to upper/left edges
        d.pixel(c.x - c.r, c.y - c.r + 3, P.canopyLight);
        d.pixel(c.x - c.r + 2, c.y - c.r - 1, P.canopy);

        // Internal dither to bridge flat colors
        d.pixel(c.x + 2, c.y + c.r - 3, P.canopyDark);
        d.pixel(c.x - 3, c.y + 1, P.canopyLight);

        if (c.r > 8) {
            d.pixel(c.x + 4, c.y - 4, P.canopyLight);
            d.pixel(c.x - 2, c.y + 3, P.canopyDark);
            d.pixel(c.x + 6, c.y + 2, P.canopyDark);
        }
    });

    // Floating/falling leaves
    d.pixel(12, 52, P.canopy);      d.pixel(13, 53, P.canopyLight);
    d.pixel(38, 56, P.canopyDark);  d.pixel(37, 57, P.canopy);
    d.pixel(9,  60, P.canopy);

    // Hanging ambient vines from the canopy
    d.vLine(16, 44, 6, P.canopyDark);
    d.pixel(16, 50, P.canopyOutline);
    d.vLine(32, 44, 4, P.canopyOutline);
    d.vLine(32, 44, 2, P.canopyDark);


    // === ENVIRONMENT / BASE DETAILS ===
    // Grass/Moss clumps growing around the giant roots
    const grassPoints = [
        {x: 14, y: 69}, {x: 18, y: 70}, {x: 24, y: 71},
        {x: 30, y: 70}, {x: 35, y: 69},
        {x: 11, y: 68}, {x: 38, y: 67}
    ];

    grassPoints.forEach(p => {
        d.vLine(p.x, p.y - 2, 3, P.canopyOutline); // Root/grass drop shadow
        d.pixel(p.x, p.y - 1, P.canopyDark);
        d.pixel(p.x, p.y - 2, P.canopy);
        d.pixel(p.x, p.y - 3, P.canopyLight); // Fresh green tip

        // Offset a leaf occasionally for unkempt wild look
        if (p.x % 2 === 0) {
            d.pixel(p.x - 1, p.y - 2, P.canopy);
        } else {
            d.pixel(p.x + 1, p.y - 2, P.canopy);
        }
    });

    return d.getCanvas();
}
