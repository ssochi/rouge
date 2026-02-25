import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

function createRoundBush() {
    const d = new PixelDraw(24, 20);

    // Deep cast shadow
    d.ellipse(12, 17, 10, 2, P.shadow);

    // Well-distributed clusters for organic fullness
    const clusters = [
        {x: 7,  y: 13, r: 4},
        {x: 17, y: 13, r: 4},
        {x: 12, y: 14, r: 5},
        {x: 9,  y: 9,  r: 4},
        {x: 15, y: 9,  r: 4},
        {x: 12, y: 6,  r: 4}
    ];

    // Layers with offset for beautiful lighting and volume
    clusters.forEach(c => d.circle(c.x, c.y, c.r + 1, P.bushOutline));
    clusters.forEach(c => d.circle(c.x, c.y, c.r, P.bushDark));
    clusters.forEach(c => d.circle(c.x - 1, c.y - 1, c.r, P.bush));
    clusters.forEach(c => d.circle(c.x - 2, c.y - 2, c.r - 1, P.bushLight));

    // Refined crisp highlights on top-left of each major volume
    const highlights = [
        [10, 3], [11, 3], [9, 4], [8, 5],
        [5, 11], [6, 10], [14, 7], [15, 6],
        [11, 12], [10, 13]
    ];
    highlights.forEach(p => d.pixel(p[0], p[1], P.bushHighlight));

    // Extra stray leaves and surface textures for an organic pixel-art look
    const details = [
        // Dark indents
        {x: 5, y: 15, c: P.bushDark}, {x: 6, y: 16, c: P.bushOutline},
        {x: 19, y: 15, c: P.bushDark}, {x: 18, y: 16, c: P.bushOutline},
        {x: 9, y: 15, c: P.bushDark}, {x: 14, y: 15, c: P.bushDark},
        // Midtone blend dots
        {x: 8, y: 12, c: P.bush}, {x: 16, y: 12, c: P.bush},
        {x: 13, y: 8, c: P.bush}, {x: 11, y: 7, c: P.bush}
    ];
    details.forEach(p => d.pixel(p.x, p.y, p.c));

    return d.getCanvas();
}

function createSpikyBush() {
    const d = new PixelDraw(24, 22);

    d.ellipse(12, 19, 9, 2, P.shadow);

    const cx = 12, cy = 16;
    const spikesDir = [
        {x: 12, y: 1, r: 3},    // Top
        {x: 6,  y: 5, r: 2},    // Top L
        {x: 18, y: 5, r: 2},    // Top R
        {x: 3,  y: 11, r: 2},   // L
        {x: 21, y: 11, r: 2},   // R
        {x: 7,  y: 15, r: 2},   // Bot L
        {x: 17, y: 15, r: 2},   // Bot R
        // Inner overlapping shorter spikes
        {x: 9,  y: 8,  r: 2},
        {x: 15, y: 8,  r: 2},
        {x: 12, y: 10, r: 2},
        {x: 9,  y: 13, r: 2}
    ];

    // Brush stroke function to create smooth tapering spikes
    function brushSpike(sx, sy, ex, ey, maxR, color) {
        const dx = ex - sx;
        const dy = ey - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.ceil(dist));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const r = maxR * (1 - t);
            if (r >= 0) {
                d.circle(Math.round(sx + dx * t), Math.round(sy + dy * t), Math.round(r), color);
            }
        }
    }

    // Core central mass to connect everything
    d.circle(cx, cy, 5, P.bushOutline);

    // Apply layers from back (shadow/outline) to front (highlights)
    // 1. Outline silhouette
    spikesDir.forEach(s => brushSpike(cx, cy, s.x, s.y, s.r + 2, P.bushOutline));
    // 2. Dark depth
    spikesDir.forEach(s => brushSpike(cx, cy, s.x, s.y, s.r + 1, P.bushDark));
    // 3. Main base (Light offset left/up)
    spikesDir.forEach(s => brushSpike(cx - 1, cy - 1, s.x - 1, s.y - 1, s.r, P.bush));
    // 4. Highlight rim
    spikesDir.forEach(s => brushSpike(cx - 2, cy - 2, s.x - 2, s.y - 1, Math.max(0, s.r - 1), P.bushLight));

    // Extreme specular highlights right at the sharp tips
    const tips = [ [11, 2], [5, 6], [17, 6], [2, 12], [8, 9] ];
    tips.forEach(t => d.pixel(t[0], t[1], P.bushHighlight));

    // Solidify center cluster lighting
    d.circle(cx - 1, cy - 1, 3, P.bush);
    d.circle(cx - 2, cy - 2, 2, P.bushLight);

    return d.getCanvas();
}

function createBerryBush() {
    const d = new PixelDraw(24, 20);

    d.ellipse(12, 17, 10, 2, P.shadow);

    const clusters = [
        {x: 8,  y: 14, r: 4},
        {x: 16, y: 14, r: 4},
        {x: 12, y: 15, r: 4},
        {x: 7,  y: 9,  r: 4},
        {x: 17, y: 9,  r: 4},
        {x: 12, y: 10, r: 4},
        {x: 12, y: 6,  r: 4}
    ];

    clusters.forEach(c => d.circle(c.x, c.y, c.r + 1, P.bushOutline));
    clusters.forEach(c => d.circle(c.x, c.y, c.r, P.bushDark));
    clusters.forEach(c => d.circle(c.x - 1, c.y - 1, c.r, P.bush));
    clusters.forEach(c => d.circle(c.x - 2, c.y - 2, c.r - 1, P.bushLight));

    const leafHighlights = [
        [10, 4], [11, 4], [8, 8], [15, 7], [18, 8]
    ];
    leafHighlights.forEach(p => d.pixel(p[0], p[1], P.bushHighlight));

    // Abundant placement of shiny distinct berries
    const berries = [
        {x: 9,  y: 11}, {x: 14, y: 13}, {x: 11, y: 8},  {x: 16, y: 9},
        {x: 12, y: 13}, {x: 7,  y: 14}, {x: 18, y: 13}, {x: 10, y: 6},
        {x: 13, y: 5},  {x: 15, y: 11}, {x: 6,  y: 9},  {x: 19, y: 10}
    ];

    berries.forEach(b => {
        // Outline block to pop against the green leaves
        d.pixel(b.x - 1, b.y, P.bushDark);
        d.pixel(b.x, b.y - 1, P.bushDark);

        // Exquisite tiny 2x2 shape
        d.pixel(b.x, b.y, '#ff7675');      // Top Left (High light)
        d.pixel(b.x + 1, b.y, '#e74c3c');  // Top Right (Mid red)
        d.pixel(b.x, b.y + 1, '#e74c3c');  // Bottom Left (Mid red)
        d.pixel(b.x + 1, b.y + 1, '#c0392b'); // Bottom Right (Shadow/Core red)
    });

    return d.getCanvas();
}

export function createBushSprites() {
    return {
        bush: createRoundBush(),
        bush_spiky: createSpikyBush(),
        bush_berry: createBerryBush()
    };
}
