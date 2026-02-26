import { PixelDraw } from '../../utils/PixelDraw.js';
import { FloorPalette as P } from './FloorPalette.js';

const TILE = 16;
const FRAME_COUNT = 4;

/**
 * Generate a single water tile frame.
 * Uses sine-wave based highlights that shift per frame to create ripple animation.
 *
 * @param {number} frame - animation frame index (0..FRAME_COUNT-1)
 * @param {number} seed  - deterministic seed for variant
 * @param {number} depth - 0 = shore, 1 = shallow, 2+ = deep
 * @returns {HTMLCanvasElement}
 */
function createWaterFrame(frame, seed, depth) {
    const d = new PixelDraw(TILE, TILE);
    const phase = (frame / FRAME_COUNT) * Math.PI * 2;

    // Base color depends on depth
    const baseColor = depth <= 1 ? P.waterBase : P.waterDeep;
    const midColor = depth <= 1 ? P.waterMid : P.waterBase;

    // Fill base
    d.rect(0, 0, TILE, TILE, baseColor);

    // Wave pattern — horizontal sine bands that shift per frame
    for (let y = 0; y < TILE; y++) {
        // Two overlapping sine waves at different frequencies
        const wave1 = Math.sin(phase + y * 0.7 + seed * 0.3) * 0.5 + 0.5;
        const wave2 = Math.sin(phase * 1.3 + y * 0.5 + seed * 0.7 + 2.0) * 0.5 + 0.5;
        const combined = (wave1 + wave2) / 2;

        if (combined > 0.65) {
            // Highlight band
            const startX = Math.floor(Math.sin(phase + y * 0.4 + seed) * 3 + 4);
            const length = 3 + Math.floor(combined * 5);
            for (let x = startX; x < Math.min(startX + length, TILE); x++) {
                if (x >= 0) d.pixel(x, y, P.waterLight);
            }
        } else if (combined > 0.45) {
            // Mid-tone variation
            const startX = Math.floor(Math.sin(phase * 0.8 + y * 0.6 + seed * 1.1) * 4 + 6);
            const length = 2 + Math.floor(combined * 3);
            for (let x = startX; x < Math.min(startX + length, TILE); x++) {
                if (x >= 0) d.pixel(x, y, midColor);
            }
        }
    }

    // Specular highlights — small bright dots that wander
    const highlightCount = depth <= 1 ? 3 : 2;
    let s = seed + frame * 37;
    for (let i = 0; i < highlightCount; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const hx = (s % TILE);
        s = (s * 1664525 + 1013904223) >>> 0;
        const hy = (s % TILE);
        // Shift position with frame
        const ox = Math.round(Math.sin(phase + i * 2.1) * 1.5);
        const oy = Math.round(Math.cos(phase + i * 1.7) * 1.0);
        const px = (hx + ox + TILE) % TILE;
        const py = (hy + oy + TILE) % TILE;
        d.pixel(px, py, P.waterHighlight);
        // Occasional extra-bright shine
        if (i === 0 && depth <= 1) {
            d.pixel((px + 1) % TILE, py, P.waterShine);
        }
    }

    // Dark shadow spots in deep water
    if (depth >= 2) {
        s = seed + frame * 53 + 100;
        for (let i = 0; i < 2; i++) {
            s = (s * 1664525 + 1013904223) >>> 0;
            const dx = s % TILE;
            s = (s * 1664525 + 1013904223) >>> 0;
            const dy = s % TILE;
            d.pixel(dx, dy, P.waterDark);
        }
    }

    return d.getCanvas();
}

/**
 * Create all water tile frames for the 4 depth-seed variants.
 * Returns arrays of 4 animation frames per variant (matching the existing floor pattern of 4 seeds).
 *
 * @returns {{ water: HTMLCanvasElement[][] }}
 *   water[variantIndex][frameIndex]
 */
export function createWaterSprites() {
    const seeds = [7, 31, 53, 89];
    const variants = seeds.map(seed => {
        const frames = [];
        for (let f = 0; f < FRAME_COUNT; f++) {
            frames.push(createWaterFrame(f, seed, 2));
        }
        return frames;
    });
    return variants;
}

/**
 * Create shore water tiles — lighter, with foam edge on specified sides.
 * Returns an array of 4 frames for a given shore configuration.
 *
 * @param {number} seed
 * @param {{ top: boolean, bottom: boolean, left: boolean, right: boolean }} shores
 *   Which sides face land (should get foam)
 * @returns {HTMLCanvasElement[]}
 */
export function createShoreWaterFrames(seed, shores) {
    const frames = [];
    for (let f = 0; f < FRAME_COUNT; f++) {
        const d = new PixelDraw(TILE, TILE);
        const phase = (f / FRAME_COUNT) * Math.PI * 2;

        // Shallow water base
        d.rect(0, 0, TILE, TILE, P.waterShore);

        // Subtle wave lines
        for (let y = 0; y < TILE; y++) {
            const wave = Math.sin(phase + y * 0.6 + seed * 0.4) * 0.5 + 0.5;
            if (wave > 0.55) {
                const sx = Math.floor(Math.sin(phase + y * 0.35) * 2 + 5);
                const len = 2 + Math.floor(wave * 4);
                for (let x = sx; x < Math.min(sx + len, TILE); x++) {
                    if (x >= 0) d.pixel(x, y, P.waterLight);
                }
            }
        }

        // Foam edges
        const foamOffset = Math.round(Math.sin(phase) * 1);

        if (shores.top) {
            for (let x = 0; x < TILE; x++) {
                const dy = Math.round(Math.sin(phase + x * 0.5) * 0.8);
                const fy = Math.max(0, dy + foamOffset);
                d.pixel(x, fy, P.waterFoam);
                if (fy + 1 < TILE) d.pixel(x, fy + 1, P.waterHighlight);
            }
        }
        if (shores.bottom) {
            for (let x = 0; x < TILE; x++) {
                const dy = Math.round(Math.sin(phase + x * 0.5) * 0.8);
                const fy = Math.min(TILE - 1, TILE - 1 - dy - foamOffset);
                d.pixel(x, fy, P.waterFoam);
                if (fy - 1 >= 0) d.pixel(x, fy - 1, P.waterHighlight);
            }
        }
        if (shores.left) {
            for (let y = 0; y < TILE; y++) {
                const dx = Math.round(Math.sin(phase + y * 0.5) * 0.8);
                const fx = Math.max(0, dx + foamOffset);
                d.pixel(fx, y, P.waterFoam);
                if (fx + 1 < TILE) d.pixel(fx + 1, y, P.waterHighlight);
            }
        }
        if (shores.right) {
            for (let y = 0; y < TILE; y++) {
                const dx = Math.round(Math.sin(phase + y * 0.5) * 0.8);
                const fx = Math.min(TILE - 1, TILE - 1 - dx - foamOffset);
                d.pixel(fx, y, P.waterFoam);
                if (fx - 1 >= 0) d.pixel(fx - 1, y, P.waterHighlight);
            }
        }

        frames.push(d.getCanvas());
    }
    return frames;
}

export const WATER_FRAME_COUNT = FRAME_COUNT;
