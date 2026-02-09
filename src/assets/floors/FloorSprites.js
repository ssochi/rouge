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

    // Base fill
    d.rect(0, 0, 16, 16, P.woodBase);

    // Fixed horizontal plank seams (identical across ALL variants → cross-tile continuity)
    // 3 planks: [y 0-4], [y 6-10], [y 12-15]
    d.hLine(0, 5, 16, P.woodGap);
    d.hLine(0, 11, 16, P.woodGap);

    // Full-width grain lines at fixed Y (identical across all variants → seamless tiling)
    // Plank 1
    d.hLine(0, 1, 16, P.woodGrain);
    d.hLine(0, 3, 16, P.woodLight);
    // Plank 2
    d.hLine(0, 6, 16, P.woodDark);   // shadow below seam
    d.hLine(0, 8, 16, P.woodGrain);
    d.hLine(0, 10, 16, P.woodLight);
    // Plank 3
    d.hLine(0, 12, 16, P.woodDark);  // shadow below seam
    d.hLine(0, 14, 16, P.woodGrain);

    // Vertical joint (plank end) — the ONLY per-variant difference, staggered X
    const plankBands = [[0, 4], [6, 10], [12, 15]];
    const jointPlank = seed % 3;
    const [jyStart, jyEnd] = plankBands[jointPlank];
    const jointX = 3 + (seed % 10);
    for (let jy = jyStart; jy <= jyEnd; jy++) {
        d.pixel(jointX, jy, P.woodGap);
    }

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
