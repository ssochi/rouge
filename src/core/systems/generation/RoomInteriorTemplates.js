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
        id: 'corner_cuts',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_open', 'combat_cover'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 0.9,
        generate: generateCornerCuts
    },
    {
        id: 'alcove_niches',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_cover', 'treasure'],
        minInteriorW: 11,
        minInteriorH: 10,
        weight: 0.9,
        generate: generateAlcoveNiches
    },
    {
        id: 'twin_chambers',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_maze', 'challenge_trapline'],
        minInteriorW: 10,
        minInteriorH: 12,
        weight: 1.0,
        generate: generateTwinChambers
    },
    {
        id: 'funnel_throat',
        allowedTypes: ['normal'],
        allowedCategories: ['challenge_trapline', 'combat_maze'],
        minInteriorW: 12,
        minInteriorH: 12,
        weight: 0.9,
        generate: generateFunnelThroat
    },
    {
        id: 'hex_pillars',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_open', 'combat_cover'],
        minInteriorW: 12,
        minInteriorH: 10,
        weight: 0.9,
        generate: generateHexPillars
    },
    {
        id: 'side_gallery',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_maze', 'combat_cover'],
        minInteriorW: 12,
        minInteriorH: 10,
        weight: 0.9,
        generate: generateSideGallery
    },
    {
        id: 'diamond_core',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_cover', 'challenge_trapline'],
        minInteriorW: 11,
        minInteriorH: 11,
        weight: 0.9,
        generate: generateDiamondCore
    },
    {
        id: 'parallel_fins',
        allowedTypes: ['normal'],
        allowedCategories: ['combat_maze', 'challenge_trapline'],
        minInteriorW: 12,
        minInteriorH: 11,
        weight: 0.9,
        generate: generateParallelFins
    },
    {
        id: 'treasure_vault',
        allowedTypes: ['normal'],
        allowedCategories: ['treasure'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 1.4,
        generate: generateTreasureVault
    },
    {
        id: 'treasure_pockets',
        allowedTypes: ['normal'],
        allowedCategories: ['treasure'],
        minInteriorW: 12,
        minInteriorH: 12,
        weight: 1.0,
        generate: generateTreasurePockets
    },
    {
        id: 'shop_stalls',
        allowedTypes: ['normal'],
        allowedCategories: ['shop'],
        minInteriorW: 10,
        minInteriorH: 10,
        weight: 1.0,
        generate: generateShopStalls
    },
    {
        id: 'elite_pit',
        allowedTypes: ['normal'],
        allowedCategories: ['elite'],
        minInteriorW: 11,
        minInteriorH: 11,
        weight: 1.2,
        generate: generateElitePit
    },
    {
        id: 'elite_gauntlet',
        allowedTypes: ['normal'],
        allowedCategories: ['elite'],
        minInteriorW: 12,
        minInteriorH: 11,
        weight: 1.0,
        generate: generateEliteGauntlet
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
    },
    {
        id: 'boss_quadrants',
        allowedTypes: ['boss'],
        allowedCategories: ['boss_arena'],
        minInteriorW: 14,
        minInteriorH: 14,
        weight: 0.9,
        generate: generateBossQuadrants
    }
];

// 供 vitest 健全性测试使用（生产代码走 selectTemplate/applyTemplate）
export { TEMPLATES };

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

// ─────────────────────── P5 新增模板（12 → 26） ───────────────────────

/** 四角阶梯斜切：非矩形轮廓感，中场开阔（开阔/掩体房）。 */
function generateCornerCuts(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const s = Math.min(iw, ih) >= 14 ? 4 : 3;
    for (let i = 0; i < s; i++) {
        for (let j = 0; j < s - i; j++) {
            walls.push({ x: ix + j, y: iy + i });
            walls.push({ x: ix + iw - 1 - j, y: iy + i });
            walls.push({ x: ix + j, y: iy + ih - 1 - i });
            walls.push({ x: ix + iw - 1 - j, y: iy + ih - 1 - i });
        }
    }

    return { walls };
}

/** 左右内凸壁龛：两侧 U 形臂形成掩体龛位。 */
function generateAlcoveNiches(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const nicheH = 4;
    const depth = 3;
    const y1 = iy + Math.floor(ih / 2) - Math.floor(nicheH / 2);

    for (let d = 0; d < depth; d++) {
        walls.push({ x: ix + d, y: y1 });
        walls.push({ x: ix + d, y: y1 + nicheH - 1 });
        walls.push({ x: ix + iw - 1 - d, y: y1 });
        walls.push({ x: ix + iw - 1 - d, y: y1 + nicheH - 1 });
    }

    return {
        walls,
        coverSpots: [
            { x: ix + 1, y: y1 + 1 },
            { x: ix + iw - 2, y: y1 + 1 }
        ]
    };
}

/** 双厅：2 tile 厚横墙 + 双开口，把房间切成前后厅。 */
function generateTwinChambers(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const wy = iy + Math.floor(ih / 2) - 1;
    const op1 = ix + 2;
    const op2 = ix + iw - 5;

    for (let x = ix; x < ix + iw; x++) {
        if ((x >= op1 && x < op1 + 3) || (x >= op2 && x < op2 + 3)) continue;
        walls.push({ x, y: wy });
        walls.push({ x, y: wy + 1 });
    }

    return { walls };
}

/** 漏斗喉道：上下中央楔形收口，中场形成窄喉压制带。 */
function generateFunnelThroat(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const cx = ix + Math.floor(iw / 2);
    const cy = iy + Math.floor(ih / 2);
    const depth = Math.min(Math.floor(ih / 2) - 2, 4);

    for (let i = 0; i < depth; i++) {
        const half = depth - i;
        for (let dx = -half; dx <= half; dx++) {
            walls.push({ x: cx + dx, y: iy + i });
            walls.push({ x: cx + dx, y: iy + ih - 1 - i });
        }
    }

    return {
        walls,
        coverSpots: [
            { x: cx - 3, y: cy },
            { x: cx + 3, y: cy }
        ]
    };
}

/** 蜂窝柱阵：错行 2×1 短柱，撒豆式软掩体网。 */
function generateHexPillars(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    for (let row = 0; iy + 2 + row * 4 <= iy + ih - 3; row++) {
        const y = iy + 2 + row * 4;
        const offset = row % 2 === 0 ? 0 : 3;
        for (let x = ix + 2 + offset; x < ix + iw - 3; x += 6) {
            walls.push({ x, y });
            walls.push({ x: x + 1, y });
        }
    }

    return { walls };
}

/** 边廊：单侧隔墙圈出通长走廊，双开口进出。 */
function generateSideGallery(room, rng) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const leftSide = rng() > 0.5;
    const gx = leftSide ? ix + 3 : ix + iw - 4;
    const op1 = iy + 1;
    const op2 = iy + ih - 3;

    for (let y = iy; y < iy + ih; y++) {
        if ((y >= op1 && y < op1 + 2) || (y >= op2 && y < op2 + 2)) continue;
        walls.push({ x: gx, y });
    }

    return {
        walls,
        coverSpots: [
            { x: leftSide ? gx + 2 : gx - 2, y: iy + Math.floor(ih / 2) }
        ]
    };
}

/** 中央菱形岛：环岛走位掩体。 */
function generateDiamondCore(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const cx = ix + Math.floor(iw / 2);
    const cy = iy + Math.floor(ih / 2);
    const r = Math.min(3, Math.floor(Math.min(iw, ih) / 4));

    for (let dy = -r; dy <= r; dy++) {
        const span = r - Math.abs(dy);
        for (let dx = -span; dx <= span; dx++) {
            walls.push({ x: cx + dx, y: cy + dy });
        }
    }

    return { walls };
}

/** 平行鳍墙：上下交替梳齿，强制蛇形动线。 */
function generateParallelFins(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const finLen = Math.max(3, Math.floor(ih * 0.55));
    let idx = 0;
    for (let x = ix + 2; x < ix + iw - 2; x += 4) {
        if (idx % 2 === 0) {
            for (let d = 0; d < finLen; d++) walls.push({ x, y: iy + d });
        } else {
            for (let d = 0; d < finLen; d++) walls.push({ x, y: iy + ih - 1 - d });
        }
        idx++;
    }

    return { walls };
}

/** 宝箱房·圣坛围合：北墙+双臂 U 形龛护住中央宝箱区，开口朝南。 */
function generateTreasureVault(room) {
    const walls = [];
    const cx = room.x + Math.floor(room.w / 2);
    const cy = room.y + Math.floor(room.h / 2);
    const armX = Math.min(4, Math.floor((room.w - 4) / 2) - 1);

    for (let dx = -2; dx <= 2; dx++) walls.push({ x: cx + dx, y: cy - 2 });
    walls.push({ x: cx - 3, y: cy - 2 });
    walls.push({ x: cx + 3, y: cy - 2 });
    if (armX >= 4) {
        for (let dy = -2; dy <= 0; dy++) {
            walls.push({ x: cx - armX, y: cy + dy });
            walls.push({ x: cx + armX, y: cy + dy });
        }
    }

    return { walls };
}

/** 宝箱房·X 形拱卫：对角双列短墙护卫中央（d 2..4，中心留空给宝箱）。 */
function generateTreasurePockets(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const cx = ix + Math.floor(iw / 2);
    const cy = iy + Math.floor(ih / 2);
    const reach = Math.min(4, Math.floor(Math.min(iw, ih) / 2) - 2);

    for (let d = 2; d <= reach; d++) {
        walls.push({ x: cx - d, y: cy - d });
        walls.push({ x: cx - d + 1, y: cy - d });
        walls.push({ x: cx + d, y: cy - d });
        walls.push({ x: cx + d - 1, y: cy - d });
        walls.push({ x: cx - d, y: cy + d });
        walls.push({ x: cx - d + 1, y: cy + d });
        walls.push({ x: cx + d, y: cy + d });
        walls.push({ x: cx + d - 1, y: cy + d });
    }

    return { walls };
}

/** 商店房·货架墙：商人身后两段货架，中央留过道。 */
function generateShopStalls(room) {
    const walls = [];
    const cx = room.x + Math.floor(room.w / 2);
    const cy = room.y + Math.floor(room.h / 2);
    const reach = Math.min(4, Math.floor((room.w - 4) / 2) - 1);
    if (cy - 3 < room.y + 2 || reach < 2) return { walls };

    for (let dx = 1; dx <= reach; dx++) {
        walls.push({ x: cx - dx, y: cy - 3 });
        walls.push({ x: cx + dx, y: cy - 3 });
    }

    return { walls };
}

/** 精英房·角斗坑：四角 L 形围墙，中央开阔角斗场。 */
function generateElitePit(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const arm = 3;
    for (let d = 0; d < arm; d++) {
        walls.push({ x: ix + 1 + d, y: iy + 1 });
        walls.push({ x: ix + 1, y: iy + 1 + d });
        walls.push({ x: ix + iw - 2 - d, y: iy + 1 });
        walls.push({ x: ix + iw - 2, y: iy + 1 + d });
        walls.push({ x: ix + 1 + d, y: iy + ih - 2 });
        walls.push({ x: ix + 1, y: iy + ih - 2 - d });
        walls.push({ x: ix + iw - 2 - d, y: iy + ih - 2 });
        walls.push({ x: ix + iw - 2, y: iy + ih - 2 - d });
    }

    return { walls };
}

/** 精英房·递进走廊：两道错位长半墙切出三段递进战区。 */
function generateEliteGauntlet(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const y1 = iy + Math.floor(ih / 3);
    const y2 = iy + Math.floor(ih * 2 / 3);
    const len = Math.floor(iw * 0.6);

    for (let d = 0; d < len; d++) walls.push({ x: ix + d, y: y1 });
    for (let d = 0; d < len; d++) walls.push({ x: ix + iw - 1 - d, y: y2 });

    return { walls };
}

/** Boss 房·四象限块：象限各一 3×2 块，中心与十字通道开阔。 */
function generateBossQuadrants(room) {
    const walls = [];
    const ix = room.x + 2;
    const iy = room.y + 2;
    const iw = room.w - 4;
    const ih = room.h - 4;

    const cx = ix + Math.floor(iw / 2);
    const cy = iy + Math.floor(ih / 2);
    const ox = Math.floor(iw / 4);
    const oy = Math.floor(ih / 4);

    addBlock(walls, cx - ox - 1, cy - oy - 1, 3, 2);
    addBlock(walls, cx + ox - 1, cy - oy - 1, 3, 2);
    addBlock(walls, cx - ox - 1, cy + oy, 3, 2);
    addBlock(walls, cx + ox - 1, cy + oy, 3, 2);

    return { walls };
}
