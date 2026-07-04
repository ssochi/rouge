import { randomInt } from './GenerationUtils.js';

/**
 * Room interior layout templates for dungeon generation.
 * Templates are selected by room type + room category for stronger identity.
 */

const TEMPLATES = [
    {
        id: 'pillars',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_cover', 'combat_open'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 1.0,
        generate: generatePillars
    },
    {
        id: 'center_divide',
        allowedTypes: ['normal'],
        allowedCategories: ['challenge_trapline', 'combat_maze'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 1.0,
        generate: generateCenterDivide
    },
    {
        id: 'l_alcoves',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_cover', 'combat_maze'],
        minInteriorW: 11,
        minInteriorH: 10,
        weight: 1.0,
        generate: generateLAlcoves
    },
    {
        id: 'cross',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_maze', 'challenge_trapline'],
        minInteriorW: 12,
        minInteriorH: 12,
        weight: 0.9,
        generate: generateCross
    },
    {
        id: 'corridors',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_maze', 'challenge_trapline'],
        minInteriorW: 12,
        minInteriorH: 10,
        weight: 1.0,
        generate: generateCorridors
    },
    {
        id: 'offset_pillars',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_open', 'combat_cover'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 0.9,
        generate: generateOffsetPillars
    },
    {
        id: 'checker_blocks',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_cover', 'treasure'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 0.8,
        generate: generateCheckerBlocks
    },
    {
        id: 'broken_ring',
        allowedTypes: ['normal'],
        allowedCategories: ['challenge_trapline', 'elite'],
        minInteriorW: 12,
        minInteriorH: 10,
        weight: 0.8,
        generate: generateBrokenRing
    },
    {
        id: 'zigzag_walls',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_maze', 'challenge_trapline'],
        minInteriorW: 12,
        minInteriorH: 11,
        weight: 0.9,
        generate: generateZigZagWalls
    },
    {
        id: 'gate_channels',
        allowedTypes: ['normal'],
        allowedCategories: ['challenge_trapline', 'combat_maze'],
        minInteriorW: 12,
        minInteriorH: 10,
        weight: 0.8,
        generate: generateGateChannels
    },
    {
        id: 'arena',
        allowedTypes: ['boss'],
        allowedCategories: ['boss_arena'],
        minInteriorW: 14,
        minInteriorH: 14,
        weight: 1.0,
        generate: generateArena
    },
    {
        id: 'boss_spokes',
        allowedTypes: ['boss'],
        allowedCategories: ['boss_arena'],
        minInteriorW: 15,
        minInteriorH: 15,
        weight: 0.9,
        generate: generateBossSpokes
    }
];

function roomCategoryForTemplate(room) {
    if (room.category) return room.category;
    if (room.type === 'boss') return 'boss_arena';
    if (room.type === 'start') return 'start';
    return 'combat_cover';
}

export function selectTemplate(room, rng, usedIds) {
    const interiorW = room.w - 4;
    const interiorH = room.h - 4;
    const category = roomCategoryForTemplate(room);

    const candidates = TEMPLATES.filter(t => {
        if (!t.allowedTypes.includes(room.type)) return false;
        if (Array.isArray(t.allowedCategories) && !t.allowedCategories.includes(category)) return false;
        if (interiorW < t.minInteriorW || interiorH < t.minInteriorH) return false;
        return true;
    });

    if (candidates.length === 0) return null;

    let totalWeight = 0;
    const weights = candidates.map(t => {
        const weight = usedIds.has(t.id) ? t.weight * 0.5 : t.weight;
        totalWeight += weight;
        return weight;
    });

    let roll = rng() * totalWeight;
    for (let i = 0; i < candidates.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return candidates[i];
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

function addBlock(walls, x, y, w, h) {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            walls.push({ x: x + dx, y: y + dy });
        }
    }
}

function generatePillars(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const ps = Math.min(iw, ih) >= 14 ? 3 : 2;
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

function generateCenterDivide(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const horizontal = rng() > 0.5;

    if (horizontal) {
        const wallY = iy + Math.floor(ih / 2);
        const openings = iw >= 14
            ? [ix + Math.floor(iw / 3) - 1, ix + Math.floor(iw * 2 / 3) - 1]
            : [ix + Math.floor(iw / 2) - 1];

        for (let x = ix; x < ix + iw; x++) {
            let inOpening = false;
            for (const op of openings) {
                if (x >= op && x < op + 3) {
                    inOpening = true;
                    break;
                }
            }
            if (!inOpening) walls.push({ x, y: wallY });
        }
    } else {
        const wallX = ix + Math.floor(iw / 2);
        const openings = ih >= 14
            ? [iy + Math.floor(ih / 3) - 1, iy + Math.floor(ih * 2 / 3) - 1]
            : [iy + Math.floor(ih / 2) - 1];

        for (let y = iy; y < iy + ih; y++) {
            let inOpening = false;
            for (const op of openings) {
                if (y >= op && y < op + 3) {
                    inOpening = true;
                    break;
                }
            }
            if (!inOpening) walls.push({ x: wallX, y });
        }
    }

    return { walls };
}

function generateLAlcoves(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const sides = ['top', 'bottom', 'left', 'right'];
    for (let i = sides.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [sides[i], sides[j]] = [sides[j], sides[i]];
    }

    const segCount = randomInt(rng, 2, 3);

    for (let s = 0; s < segCount; s++) {
        const side = sides[s];
        const segLen = randomInt(rng, 3, Math.min(6, Math.max(3, Math.floor(Math.min(iw, ih) * 0.45))));

        if (side === 'top') {
            const sx = ix + randomInt(rng, 1, Math.max(1, iw - segLen - 1));
            for (let d = 0; d < segLen; d++) walls.push({ x: sx + d, y: iy });
        } else if (side === 'bottom') {
            const sx = ix + randomInt(rng, 1, Math.max(1, iw - segLen - 1));
            for (let d = 0; d < segLen; d++) walls.push({ x: sx + d, y: iy + ih - 1 });
        } else if (side === 'left') {
            const sy = iy + randomInt(rng, 1, Math.max(1, ih - segLen - 1));
            for (let d = 0; d < segLen; d++) walls.push({ x: ix, y: sy + d });
        } else {
            const sy = iy + randomInt(rng, 1, Math.max(1, ih - segLen - 1));
            for (let d = 0; d < segLen; d++) walls.push({ x: ix + iw - 1, y: sy + d });
        }
    }

    return { walls };
}

function generateCross(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const cx = ix + Math.floor(iw / 2);
    const cy = iy + Math.floor(ih / 2);

    const hOpenStart = ix + randomInt(rng, Math.floor(iw * 0.28), Math.floor(iw * 0.55));
    const vOpenStart = iy + randomInt(rng, Math.floor(ih * 0.28), Math.floor(ih * 0.55));

    for (let x = ix; x < ix + iw; x++) {
        if (x >= hOpenStart && x < hOpenStart + 3) continue;
        walls.push({ x, y: cy });
    }

    for (let y = iy; y < iy + ih; y++) {
        if (y >= vOpenStart && y < vOpenStart + 3) continue;
        if (y === cy) continue;
        walls.push({ x: cx, y });
    }

    return { walls };
}

function generateArena(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const stubCount = randomInt(rng, 6, 8);
    const inset = 3;
    const ps = 2;

    const positions = [
        { x: ix + inset, y: iy + inset },
        { x: ix + iw - inset - ps, y: iy + inset },
        { x: ix + inset, y: iy + ih - inset - ps },
        { x: ix + iw - inset - ps, y: iy + ih - inset - ps },
        { x: ix + Math.floor(iw / 2) - 1, y: iy + inset },
        { x: ix + Math.floor(iw / 2) - 1, y: iy + ih - inset - ps },
        { x: ix + inset, y: iy + Math.floor(ih / 2) - 1 },
        { x: ix + iw - inset - ps, y: iy + Math.floor(ih / 2) - 1 }
    ];

    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (let i = 0; i < Math.min(stubCount, positions.length); i++) {
        addBlock(walls, positions[i].x, positions[i].y, ps, ps);
    }

    return { walls };
}

function generateCorridors(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const horizontal = rng() > 0.5;

    if (horizontal) {
        const y1 = iy + Math.floor(ih / 3);
        const y2 = iy + Math.floor(ih * 2 / 3);
        const wallLen = Math.floor(iw * 0.45);

        for (let d = 0; d < wallLen; d++) walls.push({ x: ix + d, y: y1 });
        for (let d = 0; d < wallLen; d++) walls.push({ x: ix + iw - 1 - d, y: y2 });
    } else {
        const x1 = ix + Math.floor(iw / 3);
        const x2 = ix + Math.floor(iw * 2 / 3);
        const wallLen = Math.floor(ih * 0.45);

        for (let d = 0; d < wallLen; d++) walls.push({ x: x1, y: iy + d });
        for (let d = 0; d < wallLen; d++) walls.push({ x: x2, y: iy + ih - 1 - d });
    }

    return { walls };
}

function generateOffsetPillars(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const ps = 2;
    const count = randomInt(rng, 3, 5);

    for (let i = 0; i < count; i++) {
        const px = ix + randomInt(rng, 1, Math.max(1, iw - ps - 1));
        const py = iy + randomInt(rng, 1, Math.max(1, ih - ps - 1));
        addBlock(walls, px, py, ps, ps);
    }

    return { walls };
}

function generateCheckerBlocks(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    for (let y = iy + 1; y < iy + ih - 1; y += 3) {
        for (let x = ix + 1 + ((y - iy) % 2); x < ix + iw - 1; x += 4) {
            addBlock(walls, x, y, 2, 2);
        }
    }

    return { walls };
}

function generateBrokenRing(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const left = ix + 1;
    const right = ix + iw - 2;
    const top = iy + 1;
    const bottom = iy + ih - 2;

    const gapSide = randomInt(rng, 0, 3); // 0 top, 1 right, 2 bottom, 3 left
    const gapStart = 2;
    const gapLen = 4;

    for (let x = left; x <= right; x++) {
        const inTopGap = gapSide === 0 && x >= left + gapStart && x < left + gapStart + gapLen;
        const inBottomGap = gapSide === 2 && x >= left + gapStart && x < left + gapStart + gapLen;
        if (!inTopGap) walls.push({ x, y: top });
        if (!inBottomGap) walls.push({ x, y: bottom });
    }

    for (let y = top + 1; y < bottom; y++) {
        const inLeftGap = gapSide === 3 && y >= top + gapStart && y < top + gapStart + gapLen;
        const inRightGap = gapSide === 1 && y >= top + gapStart && y < top + gapStart + gapLen;
        if (!inLeftGap) walls.push({ x: left, y });
        if (!inRightGap) walls.push({ x: right, y });
    }

    return { walls };
}

function generateZigZagWalls(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const segments = Math.max(3, Math.floor(iw / 4));
    const midY = iy + Math.floor(ih / 2);
    let x = ix + 1;

    for (let i = 0; i < segments; i++) {
        const up = i % 2 === 0;
        const yBase = up ? midY - 2 : midY + 1;
        for (let d = 0; d < 3 && x + d < ix + iw - 1; d++) {
            walls.push({ x: x + d, y: yBase + d - 1 });
        }
        x += 3;
    }

    return { walls };
}

function generateGateChannels(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const laneY1 = iy + Math.floor(ih * 0.33);
    const laneY2 = iy + Math.floor(ih * 0.66);

    for (let x = ix + 1; x < ix + iw - 1; x++) {
        if (x % 5 === 0 || x % 5 === 1) continue;
        walls.push({ x, y: laneY1 });
        walls.push({ x, y: laneY2 });
    }

    return { walls };
}

function generateBossSpokes(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const cx = ix + Math.floor(iw / 2);
    const cy = iy + Math.floor(ih / 2);

    // Central 2x2 hub.
    addBlock(walls, cx - 1, cy - 1, 2, 2);

    // Four short spokes with 2-tile gaps from room edges.
    for (let y = iy + 2; y < cy - 2; y++) walls.push({ x: cx, y });
    for (let y = cy + 3; y < iy + ih - 2; y++) walls.push({ x: cx, y });
    for (let x = ix + 2; x < cx - 2; x++) walls.push({ x, y: cy });
    for (let x = cx + 3; x < ix + iw - 2; x++) walls.push({ x, y: cy });

    return { walls };
}
