import { PixelDraw } from '../../utils/PixelDraw.js';
import { FloorPalette as P } from './FloorPalette.js';

/**
 * Deterministic pseudo-random scatter for pixel placement.
 * Returns array of {x, y} positions within [0, w) × [0, h).
 */
function scatter(seed, count, w, h) {
    const pts = [];
    let s = seed;
    for (let i = 0; i < count; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const x = s % w;
        s = (s * 1664525 + 1013904223) >>> 0;
        const y = s % h;
        pts.push({ x, y });
    }
    return pts;
}

function createGrassVariant(seed) {
    const d = new PixelDraw(16, 16);

    // Base fill
    d.rect(0, 0, 16, 16, P.grassBase);

    // Light patches (3-5 pixels)
    const lights = scatter(seed, 4, 16, 16);
    lights.forEach(p => d.pixel(p.x, p.y, P.grassLight));

    // Dark shadow spots
    const darks = scatter(seed + 100, 3, 16, 16);
    darks.forEach(p => d.pixel(p.x, p.y, P.grassDark));

    // Blade tips (bright highlights)
    const blades = scatter(seed + 200, 2, 16, 16);
    blades.forEach(p => d.pixel(p.x, p.y, P.grassBlade));

    // Deep shadow
    const shadows = scatter(seed + 300, 2, 16, 16);
    shadows.forEach(p => d.pixel(p.x, p.y, P.grassShadow));

    return d.getCanvas();
}

function createWoodVariant(seed) {
    const d = new PixelDraw(16, 16);

    // 1. Base fill
    d.rect(0, 0, 16, 16, P.woodBase);

    // Define planks: [yStart, yEnd]
    // Plank 1: 0-4
    // Plank 2: 6-10
    // Plank 3: 12-15
    const planks = [
        { start: 0, end: 4 },
        { start: 6, end: 10 },
        { start: 12, end: 15 }
    ];

    // 2. Horizontal gaps (Fixed position for continuity)
    d.hLine(0, 5, 16, P.woodGap);
    d.hLine(0, 11, 16, P.woodGap);

    // 3. Process each plank
    planks.forEach((plank, i) => {
        // Plank specific seed derived from main seed and plank index
        let ps = seed + i * 100;

        // A. Edge Highlights/Shadows (Bevel effect for depth)
        d.hLine(0, plank.start, 16, P.woodLight); // Top edge highlight
        d.hLine(0, plank.end, 16, P.woodDark);    // Bottom edge shadow

        // B. Wood Grain (Random short lines, avoiding edges)
        // Draw 2-4 grain lines per plank
        const grainCount = 2 + (ps % 3);
        for (let g = 0; g < grainCount; g++) {
            ps = (ps * 1664525 + 1013904223) >>> 0;
            // Y position: avoid overwriting top/bottom bevels if possible, but mainly keep inside
            const gy = plank.start + 1 + (ps % (plank.end - plank.start - 1)); 
            
            ps = (ps * 1664525 + 1013904223) >>> 0;
            const gw = 2 + (ps % 6); // Width 2-7
            
            ps = (ps * 1664525 + 1013904223) >>> 0;
            const gx = 2 + (ps % (12 - gw)); // Start x between 2 and (12-gw), ensures strictly inside [2, 14]
            
            // Choose color: mostly grain, sometimes light or dark
            const colorType = g % 3;
            const color = colorType === 0 ? P.woodGrain : (colorType === 1 ? P.woodDark : P.woodLight);
            
            d.hLine(gx, gy, gw, color);
        }

        // C. Vertical Joint (Staggered plank ends)
        // Reduce probability to ~30% to create longer perceived planks across tiles
        ps = (ps * 1664525 + 1013904223) >>> 0;
        if ((ps % 100) < 30) { 
            ps = (ps * 1664525 + 1013904223) >>> 0;
            const jx = 2 + (ps % 12); // Joint between 2 and 13
            
            for (let jy = plank.start; jy <= plank.end; jy++) {
                d.pixel(jx, jy, P.woodGap);
                if (jx < 15) d.pixel(jx + 1, jy, P.woodLight); // Highlight edge of the joint
            }
        }
    });

    return d.getCanvas();
}

function createConcreteVariant(seed) {
    const d = new PixelDraw(16, 16);

    // Base fill
    d.rect(0, 0, 16, 16, P.concreteBase);

    // Light noise pixels
    const lights = scatter(seed, 3, 16, 16);
    lights.forEach(p => d.pixel(p.x, p.y, P.concreteLight));

    // Dark noise pixels
    const darks = scatter(seed + 50, 2, 16, 16);
    darks.forEach(p => d.pixel(p.x, p.y, P.concreteDark));

    // Patch pixels
    const patches = scatter(seed + 150, 2, 16, 16);
    patches.forEach(p => d.pixel(p.x, p.y, P.concretePatch));

    // Optional small crack (1 variant in 2)
    if (seed % 2 === 0) {
        const cx = 4 + (seed % 8);
        const cy = 4 + ((seed >> 3) % 8);
        d.pixel(cx, cy, P.concreteCrack);
        d.pixel(cx + 1, cy + 1, P.concreteCrack);
    }

    return d.getCanvas();
}

function createDirtVariant(seed) {
    const d = new PixelDraw(16, 16);

    // Base fill
    d.rect(0, 0, 16, 16, P.dirtBase);

    // Light pebble pixels
    const pebbles = scatter(seed, 3, 16, 16);
    pebbles.forEach(p => d.pixel(p.x, p.y, P.dirtLight));

    // Dark shadow spots
    const darks = scatter(seed + 80, 2, 16, 16);
    darks.forEach(p => d.pixel(p.x, p.y, P.dirtDark));

    // Highlight stone
    const stones = scatter(seed + 160, 1, 16, 16);
    stones.forEach(p => d.pixel(p.x, p.y, P.dirtPebble));

    // Deep shadow
    const shadows = scatter(seed + 240, 2, 16, 16);
    shadows.forEach(p => d.pixel(p.x, p.y, P.dirtShadow));

    return d.getCanvas();
}

/**
 * Generate all floor tile sprites.
 * @returns {{ grass: HTMLCanvasElement[], wood: HTMLCanvasElement[], concrete: HTMLCanvasElement[], dirt: HTMLCanvasElement[] }}
 */
export function createFloorSprites() {
    const seeds = [7, 31, 53, 89]; // 4 deterministic seeds per variant

    return {
        grass: seeds.map(s => createGrassVariant(s)),
        wood: seeds.map(s => createWoodVariant(s)),
        concrete: seeds.map(s => createConcreteVariant(s)),
        dirt: seeds.map(s => createDirtVariant(s))
    };
}
