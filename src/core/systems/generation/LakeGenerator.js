import { FLOOR_TYPES, FLOOR_TILES_PER_CELL } from '../../../utils/FloorTypes.js';

/**
 * Simple 2D value noise with smooth interpolation.
 * Used instead of a library to keep zero-dependency.
 */
class SimpleNoise2D {
    constructor(seed = 0) {
        // Build a 256-entry permutation table from seed
        this.perm = new Uint8Array(512);
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        // Fisher-Yates shuffle driven by seed
        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 1664525 + 1013904223) >>> 0;
            const j = s % (i + 1);
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    }

    _grad(hash, x, y) {
        const h = hash & 3;
        switch (h) {
            case 0: return  x + y;
            case 1: return -x + y;
            case 2: return  x - y;
            default: return -x - y;
        }
    }

    _fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    _lerp(a, b, t) {
        return a + t * (b - a);
    }

    noise(x, y) {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        const u = this._fade(xf);
        const v = this._fade(yf);

        const aa = this.perm[this.perm[xi] + yi];
        const ab = this.perm[this.perm[xi] + yi + 1];
        const ba = this.perm[this.perm[xi + 1] + yi];
        const bb = this.perm[this.perm[xi + 1] + yi + 1];

        return this._lerp(
            this._lerp(this._grad(aa, xf, yf), this._grad(ba, xf - 1, yf), u),
            this._lerp(this._grad(ab, xf, yf - 1), this._grad(bb, xf - 1, yf - 1), u),
            v
        );
    }

    /**
     * Fractal Brownian Motion — layered noise for natural variation.
     */
    fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxAmp = 0;
        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.noise(x * frequency, y * frequency);
            maxAmp += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }
        return value / maxAmp; // normalize to roughly [-1, 1]
    }
}

/**
 * Generate lake regions on the game map.
 *
 * Pipeline:
 *  1. Perlin FBM noise → threshold to get raw water mask
 *  2. Cellular automata smoothing (3-5 passes)
 *  3. Remove tiny lakes (flood fill, discard < minSize)
 *  4. Apply exclusion zones (buildings, spawn, portals)
 *  5. Return water tile set
 *
 * @param {Object} opts
 * @param {number} opts.mapWidth    - map width in tiles
 * @param {number} opts.mapHeight   - map height in tiles
 * @param {number} [opts.seed]      - random seed
 * @param {number} [opts.threshold] - noise threshold for water (lower = more water)
 * @param {number} [opts.frequency] - noise frequency (lower = bigger lakes)
 * @param {number} [opts.smoothPasses] - cellular automata iterations
 * @param {number} [opts.minLakeSize]  - min tiles for a lake to survive
 * @param {Set<string>} [opts.excludeTiles] - set of "x,y" tile keys to exclude
 * @param {Array<{x,y,w,h}>} [opts.excludeRects] - rectangular exclusion zones (tile coords)
 * @returns {{ waterTiles: Set<string>, waterGrid: Uint8Array, gridWidth: number, gridHeight: number }}
 */
export function generateLakes(opts) {
    const {
        mapWidth,
        mapHeight,
        seed = Date.now(),
        threshold = -0.08,
        frequency = 0.045,
        smoothPasses = 4,
        minLakeSize = 20,
        excludeTiles = new Set(),
        excludeRects = []
    } = opts;

    const w = mapWidth;
    const h = mapHeight;
    const noise = new SimpleNoise2D(seed);

    // Step 1: generate noise map and threshold
    const grid = new Uint8Array(w * h); // 0 = land, 1 = water
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // Edge falloff — prevent water at map borders
            const edgeDist = Math.min(x, y, w - 1 - x, h - 1 - y);
            const edgeFade = Math.min(1, edgeDist / 8); // fade within 8 tiles of border

            const n = noise.fbm(x * frequency, y * frequency, 4, 2.0, 0.5);
            const adjusted = n - (1 - edgeFade) * 0.5; // push edges toward land
            grid[y * w + x] = adjusted < threshold ? 1 : 0;
        }
    }

    // Step 2: Cellular automata smoothing
    const temp = new Uint8Array(w * h);
    for (let pass = 0; pass < smoothPasses; pass++) {
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let waterCount = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
                            // Treat out-of-bounds as land
                            continue;
                        }
                        waterCount += grid[ny * w + nx];
                    }
                }
                // Standard CA rule: >= 5 neighbors water → water
                temp[y * w + x] = waterCount >= 5 ? 1 : 0;
            }
        }
        grid.set(temp);
    }

    // Step 3: Apply exclusion zones
    const excluded = new Set(excludeTiles);
    for (const r of excludeRects) {
        for (let ty = r.y; ty < r.y + r.h; ty++) {
            for (let tx = r.x; tx < r.x + r.w; tx++) {
                excluded.add(`${tx},${ty}`);
            }
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (excluded.has(`${x},${y}`)) {
                grid[y * w + x] = 0;
            }
        }
    }

    // Step 4: Flood-fill to find connected components, remove tiny lakes
    const visited = new Uint8Array(w * h);
    const components = []; // array of { tiles: [idx, ...], size }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (grid[idx] !== 1 || visited[idx]) continue;

            // BFS flood fill
            const queue = [idx];
            visited[idx] = 1;
            const tiles = [];
            let head = 0;
            while (head < queue.length) {
                const ci = queue[head++];
                tiles.push(ci);
                const cx = ci % w;
                const cy = (ci - cx) / w;
                const neighbors = [
                    cy > 0 ? ci - w : -1,
                    cy < h - 1 ? ci + w : -1,
                    cx > 0 ? ci - 1 : -1,
                    cx < w - 1 ? ci + 1 : -1
                ];
                for (const ni of neighbors) {
                    if (ni >= 0 && grid[ni] === 1 && !visited[ni]) {
                        visited[ni] = 1;
                        queue.push(ni);
                    }
                }
            }
            components.push(tiles);
        }
    }

    // Remove small lakes
    for (const tiles of components) {
        if (tiles.length < minLakeSize) {
            for (const idx of tiles) {
                grid[idx] = 0;
            }
        }
    }

    // Step 5: Build result set
    const waterTiles = new Set();
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (grid[y * w + x] === 1) {
                waterTiles.add(`${x},${y}`);
            }
        }
    }

    return { waterTiles, waterGrid: grid, gridWidth: w, gridHeight: h };
}

/**
 * Compute a depth map: for each water tile, how far from the nearest shore.
 * Useful for rendering deeper vs shallower water.
 *
 * @param {Uint8Array} waterGrid
 * @param {number} w
 * @param {number} h
 * @returns {Uint8Array} depthMap — 0 for land, 1+ for water (distance from shore)
 */
export function computeDepthMap(waterGrid, w, h) {
    const depth = new Uint8Array(w * h);
    // BFS from all shore water tiles
    const queue = [];
    let head = 0;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = y * w + x;
            if (waterGrid[idx] !== 1) continue;
            // Check if this water tile is adjacent to land
            let isShore = false;
            for (let dy = -1; dy <= 1 && !isShore; dy++) {
                for (let dx = -1; dx <= 1 && !isShore; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h || waterGrid[ny * w + nx] === 0) {
                        isShore = true;
                    }
                }
            }
            if (isShore) {
                depth[idx] = 1;
                queue.push(idx);
            }
        }
    }

    // BFS outward
    while (head < queue.length) {
        const ci = queue[head++];
        const cx = ci % w;
        const cy = (ci - cx) / w;
        const cd = depth[ci];
        const neighbors = [
            cy > 0 ? ci - w : -1,
            cy < h - 1 ? ci + w : -1,
            cx > 0 ? ci - 1 : -1,
            cx < w - 1 ? ci + 1 : -1
        ];
        for (const ni of neighbors) {
            if (ni >= 0 && waterGrid[ni] === 1 && depth[ni] === 0) {
                depth[ni] = Math.min(255, cd + 1);
                queue.push(ni);
            }
        }
    }

    return depth;
}

/**
 * Paint lake water tiles onto an existing floor map (sub-tile resolution).
 *
 * @param {Uint8Array} floorMap - sub-tile floor map
 * @param {number} fw - floor map width in sub-tiles
 * @param {number} fh - floor map height in sub-tiles
 * @param {Set<string>} waterTiles - set of "x,y" tile keys
 */
export function paintLakesOnFloorMap(floorMap, fw, fh, waterTiles) {
    const S = FLOOR_TILES_PER_CELL;
    for (const key of waterTiles) {
        const [tx, ty] = key.split(',').map(Number);
        for (let dy = 0; dy < S; dy++) {
            for (let dx = 0; dx < S; dx++) {
                const sx = tx * S + dx;
                const sy = ty * S + dy;
                if (sx >= 0 && sx < fw && sy >= 0 && sy < fh) {
                    floorMap[sy * fw + sx] = FLOOR_TYPES.WATER;
                }
            }
        }
    }
}
