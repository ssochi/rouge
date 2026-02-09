import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

function createRoundBush() {
    const d = new PixelDraw(24, 20);

    // Clusters for organic shape
    const clusters = [
        {x: 12, y: 10, r: 8}, // Center
        {x: 7, y: 12, r: 6},  // Left
        {x: 17, y: 12, r: 6}, // Right
        {x: 12, y: 6, r: 5}   // Top
    ];

    // Shadow
    d.ellipse(12, 18, 10, 3, P.shadow);

    // 1. Outline
    clusters.forEach(c => d.circle(c.x, c.y, c.r + 1, P.bushOutline));
    // 2. Dark Body
    clusters.forEach(c => d.circle(c.x, c.y, c.r, P.bushDark));
    // 3. Main Body (Offset up)
    clusters.forEach(c => d.circle(c.x, c.y - 1, c.r - 1, P.bush));
    // 4. Light Areas (Top-Left)
    clusters.forEach(c => d.circle(c.x - 2, c.y - 3, c.r - 3, P.bushLight));

    // Highlights
    d.pixel(12, 4, P.bushHighlight);
    d.pixel(7, 9, P.bushHighlight);
    d.pixel(17, 9, P.bushHighlight);

    // Texture
    d.pixel(10, 14, P.bushDark);
    d.pixel(14, 14, P.bushDark);
    
    return d.getCanvas();
}

function createSpikyBush() {
    const d = new PixelDraw(24, 22);

    // Shadow
    d.ellipse(12, 19, 9, 3, P.shadow);

    // Draw jagged shape using polygon
    const points = [
        {x: 4, y: 18}, {x: 2, y: 12}, {x: 6, y: 14}, {x: 8, y: 8}, 
        {x: 12, y: 12}, {x: 12, y: 4}, {x: 16, y: 10}, {x: 20, y: 6},
        {x: 18, y: 14}, {x: 22, y: 12}, {x: 20, y: 18}, {x: 12, y: 20}
    ];
    
    // Outline
    // For pixel art spikiness, manual pixel placement or filled path works.
    // Let's use filled path for base shape then add details.
    
    // Dark Base
    d.fillPath(points.map(p => ({x: p.x, y: p.y + 1})), P.bushOutline);
    d.fillPath(points, P.bushDark);
    
    // Main Body (Inset)
    const innerPoints = points.map(p => ({x: p.x, y: p.y + 1})); // Actually we want to shrink it? 
    // Let's stick to simple drawing for spiky look
    
    // Center mass
    d.circle(12, 14, 6, P.bushDark);
    d.circle(12, 13, 5, P.bush);

    // Spikes (Triangles)
    const spikes = [
        {x: 6, y: 16, h: 6, c: P.bush},
        {x: 10, y: 8, h: 8, c: P.bushLight},
        {x: 14, y: 18, h: 5, c: P.bushDark},
        {x: 18, y: 12, h: 7, c: P.bush},
        {x: 12, y: 6, h: 6, c: P.bushLight}, // Top
        {x: 2, y: 14, h: 5, c: P.bushDark}, // Left
        {x: 21, y: 14, h: 5, c: P.bushDark} // Right
    ];

    spikes.forEach(s => {
        // Draw a triangle
        d.fillPath([
            {x: s.x - 2, y: s.y},
            {x: s.x, y: s.y - s.h},
            {x: s.x + 2, y: s.y}
        ], s.c);
        // Outline bottom
        d.hLine(s.x - 1, s.y + 1, 3, P.bushOutline);
    });

    return d.getCanvas();
}

function createBerryBush() {
    const d = new PixelDraw(24, 20);
    
    // Reuse Round Bush base logic manually for variations
    const clusters = [
        {x: 12, y: 11, r: 7}, 
        {x: 8, y: 13, r: 6}, 
        {x: 16, y: 13, r: 6},
        {x: 12, y: 7, r: 5}
    ];

    d.ellipse(12, 18, 10, 3, P.shadow);
    clusters.forEach(c => d.circle(c.x, c.y, c.r + 1, P.bushOutline));
    clusters.forEach(c => d.circle(c.x, c.y, c.r, P.bushDark));
    clusters.forEach(c => d.circle(c.x, c.y - 1, c.r - 1, P.bush));
    clusters.forEach(c => d.circle(c.x - 2, c.y - 3, c.r - 3, P.bushLight));

    // Berries (Red/Purple dots)
    const berries = [
        {x: 10, y: 10}, {x: 14, y: 12}, {x: 8, y: 14}, 
        {x: 17, y: 11}, {x: 12, y: 6}, {x: 15, y: 9}
    ];
    
    berries.forEach(b => {
        d.pixel(b.x, b.y + 1, P.bushOutline); // Shadow
        d.pixel(b.x, b.y, '#e74c3c'); // Red Berry
        d.pixel(b.x, b.y, 'rgba(255, 255, 255, 0.4)'); // Shine
    });

    return d.getCanvas();
}

export function createBushSprites() {
    return {
        bush: createRoundBush(),        // Default
        bush_spiky: createSpikyBush(),
        bush_berry: createBerryBush()
    };
}
