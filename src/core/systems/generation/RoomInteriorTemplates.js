import { tileKey, randomInt } from './GenerationUtils.js';

/**
 * Room interior layout templates for dungeon generation.
 * Each template places permanent wall tiles inside a room to create tactical cover.
 */

const TEMPLATES = [
    {
        id: 'pillars',
        allowedTypes: ['normal'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 1.0,
        generate: generatePillars
    },
    {
        id: 'center_divide',
        allowedTypes: ['normal'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 1.0,
        generate: generateCenterDivide
    },
    {
        id: 'l_alcoves',
        allowedTypes: ['normal'],
        minInteriorW: 12,
        minInteriorH: 10,
        weight: 1.0,
        generate: generateLAlcoves
    },
    {
        id: 'cross',
        allowedTypes: ['normal'],
        minInteriorW: 12,
        minInteriorH: 12,
        weight: 1.0,
        generate: generateCross
    },
    {
        id: 'arena',
        allowedTypes: ['boss'],
        minInteriorW: 14,
        minInteriorH: 14,
        weight: 1.0,
        generate: generateArena
    },
    {
        id: 'corridors',
        allowedTypes: ['normal'],
        minInteriorW: 12,
        minInteriorH: 10,
        weight: 1.0,
        generate: generateCorridors
    }
];

/**
 * Select a template for a room.
 * @param {Object} room - { x, y, w, h, type }
 * @param {Function} rng - seeded random
 * @param {Set} usedIds - template IDs already used (for variety)
 * @returns {Object|null} template or null if none fits
 */
export function selectTemplate(room, rng, usedIds) {
    const interiorW = room.w - 4; // 2-tile margin each side
    const interiorH = room.h - 4;

    const candidates = TEMPLATES.filter(t => {
        if (!t.allowedTypes.includes(room.type)) return false;
        if (interiorW < t.minInteriorW || interiorH < t.minInteriorH) return false;
        return true;
    });

    if (candidates.length === 0) return null;

    // Weighted random, halve weight for already-used templates
    let totalWeight = 0;
    const weights = candidates.map(t => {
        const w = usedIds.has(t.id) ? t.weight * 0.5 : t.weight;
        totalWeight += w;
        return w;
    });

    let r = rng() * totalWeight;
    for (let i = 0; i < candidates.length; i++) {
        r -= weights[i];
        if (r <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
}

/**
 * Apply a template to a room.
 * @returns {{ walls: Array<{x,y}> }}
 */
export function applyTemplate(room, rng, usedIds) {
    if (room.type === 'start') return { walls: [] };

    const template = selectTemplate(room, rng, usedIds);
    if (!template) return { walls: [] };

    usedIds.add(template.id);
    return template.generate(room, rng);
}

// --- Helper: add a rectangular block of wall tiles ---
function addBlock(walls, x, y, w, h) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            walls.push({ x: x + dx, y: y + dy });
        }
    }
}

/**
 * Template 1: Pillars — 4 wall clusters in a grid
 */
function generatePillars(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    // Pillar size: 2x2 for rooms < 18, 3x3 for larger
    const ps = Math.min(iw, ih) >= 14 ? 3 : 2;

    // Positions at ~1/3 and ~2/3
    const x1 = ix + Math.floor(iw / 3) - Math.floor(ps / 2);
    const x2 = ix + Math.floor(iw * 2 / 3) - Math.floor(ps / 2);
    const y1 = iy + Math.floor(ih / 3) - Math.floor(ps / 2);
    const y2 = iy + Math.floor(ih * 2 / 3) - Math.floor(ps / 2);

    addBlock(walls, x1, y1, ps, ps);
    addBlock(walls, x2, y1, ps, ps);
    addBlock(walls, x1, y2, ps, ps);
    addBlock(walls, x2, y2, ps, ps);

    return { walls };
}

/**
 * Template 2: Center Divide — wall through the middle with openings
 */
function generateCenterDivide(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const horizontal = rng() > 0.5;

    if (horizontal) {
        const wallY = iy + Math.floor(ih / 2);
        // Place wall segments with 1-2 openings
        const openCount = iw >= 14 ? 2 : 1;
        const openPositions = [];

        if (openCount === 1) {
            openPositions.push(ix + Math.floor(iw / 2) - 1);
        } else {
            openPositions.push(ix + Math.floor(iw / 3) - 1);
            openPositions.push(ix + Math.floor(iw * 2 / 3) - 1);
        }

        for (let x = ix; x < ix + iw; x++) {
            let inOpening = false;
            for (const op of openPositions) {
                if (x >= op && x < op + 3) { inOpening = true; break; }
            }
            if (!inOpening) {
                walls.push({ x, y: wallY });
            }
        }
    } else {
        const wallX = ix + Math.floor(iw / 2);
        const openCount = ih >= 14 ? 2 : 1;
        const openPositions = [];

        if (openCount === 1) {
            openPositions.push(iy + Math.floor(ih / 2) - 1);
        } else {
            openPositions.push(iy + Math.floor(ih / 3) - 1);
            openPositions.push(iy + Math.floor(ih * 2 / 3) - 1);
        }

        for (let y = iy; y < iy + ih; y++) {
            let inOpening = false;
            for (const op of openPositions) {
                if (y >= op && y < op + 3) { inOpening = true; break; }
            }
            if (!inOpening) {
                walls.push({ x: wallX, y });
            }
        }
    }

    return { walls };
}

/**
 * Template 3: L-Alcoves — wall segments from edges creating nooks
 */
function generateLAlcoves(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    // 2-3 wall segments from different edges
    const segCount = randomInt(rng, 2, 3);
    const edges = [
        { side: 'top', used: false },
        { side: 'bottom', used: false },
        { side: 'left', used: false },
        { side: 'right', used: false }
    ];

    for (let i = edges.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [edges[i], edges[j]] = [edges[j], edges[i]];
    }

    for (let s = 0; s < segCount && s < edges.length; s++) {
        const edge = edges[s];
        const segLen = randomInt(rng, 3, Math.min(5, Math.floor(Math.min(iw, ih) * 0.4)));

        if (edge.side === 'top') {
            const sx = ix + randomInt(rng, 1, iw - segLen - 1);
            for (let d = 0; d < segLen; d++) walls.push({ x: sx + d, y: iy });
        } else if (edge.side === 'bottom') {
            const sx = ix + randomInt(rng, 1, iw - segLen - 1);
            for (let d = 0; d < segLen; d++) walls.push({ x: sx + d, y: iy + ih - 1 });
        } else if (edge.side === 'left') {
            const sy = iy + randomInt(rng, 1, ih - segLen - 1);
            for (let d = 0; d < segLen; d++) walls.push({ x: ix, y: sy + d });
        } else {
            const sy = iy + randomInt(rng, 1, ih - segLen - 1);
            for (let d = 0; d < segLen; d++) walls.push({ x: ix + iw - 1, y: sy + d });
        }
    }

    return { walls };
}

/**
 * Template 4: Cross — perpendicular walls creating 4 quadrants
 */
function generateCross(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const cx = ix + Math.floor(iw / 2);
    const cy = iy + Math.floor(ih / 2);

    // Horizontal wall with one opening
    const hOpenY = cy + randomInt(rng, -1, 1);
    const hOpenStart = ix + randomInt(rng, Math.floor(iw * 0.3), Math.floor(iw * 0.5));
    for (let x = ix; x < ix + iw; x++) {
        if (x >= hOpenStart && x < hOpenStart + 3) continue;
        walls.push({ x, y: cy });
    }

    // Vertical wall with one opening
    const vOpenStart = iy + randomInt(rng, Math.floor(ih * 0.3), Math.floor(ih * 0.5));
    for (let y = iy; y < iy + ih; y++) {
        if (y >= vOpenStart && y < vOpenStart + 3) continue;
        if (y === cy) continue; // skip intersection (already placed by horizontal)
        walls.push({ x: cx, y });
    }

    return { walls };
}

/**
 * Template 5: Arena — ring of wall stubs for boss rooms
 */
function generateArena(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    // 6-8 wall stubs (2x2) in a ring pattern, ~3 tiles from interior edges
    const stubCount = randomInt(rng, 6, 8);
    const inset = 3;
    const ps = 2;

    // Define potential positions around the perimeter ring
    const positions = [];
    // Top-left, top-right, bottom-left, bottom-right corners
    positions.push({ x: ix + inset, y: iy + inset });
    positions.push({ x: ix + iw - inset - ps, y: iy + inset });
    positions.push({ x: ix + inset, y: iy + ih - inset - ps });
    positions.push({ x: ix + iw - inset - ps, y: iy + ih - inset - ps });
    // Mid-edge positions
    positions.push({ x: ix + Math.floor(iw / 2) - 1, y: iy + inset });
    positions.push({ x: ix + Math.floor(iw / 2) - 1, y: iy + ih - inset - ps });
    positions.push({ x: ix + inset, y: iy + Math.floor(ih / 2) - 1 });
    positions.push({ x: ix + iw - inset - ps, y: iy + Math.floor(ih / 2) - 1 });

    // Shuffle and pick stubCount
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (let i = 0; i < Math.min(stubCount, positions.length); i++) {
        addBlock(walls, positions[i].x, positions[i].y, ps, ps);
    }

    return { walls };
}

/**
 * Template 6: Corridors — parallel walls creating a central passage
 */
function generateCorridors(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const horizontal = rng() > 0.5;

    if (horizontal) {
        // Two horizontal walls at ~1/3 and ~2/3 height
        const y1 = iy + Math.floor(ih / 3);
        const y2 = iy + Math.floor(ih * 2 / 3);
        const wallLen = Math.floor(iw * 0.4);

        // Top wall from left, bottom wall from right (creates S-curve)
        for (let d = 0; d < wallLen; d++) {
            walls.push({ x: ix + d, y: y1 });
        }
        for (let d = 0; d < wallLen; d++) {
            walls.push({ x: ix + iw - 1 - d, y: y2 });
        }
    } else {
        const x1 = ix + Math.floor(iw / 3);
        const x2 = ix + Math.floor(iw * 2 / 3);
        const wallLen = Math.floor(ih * 0.4);

        for (let d = 0; d < wallLen; d++) {
            walls.push({ x: x1, y: iy + d });
        }
        for (let d = 0; d < wallLen; d++) {
            walls.push({ x: x2, y: iy + ih - 1 - d });
        }
    }

    return { walls };
}
