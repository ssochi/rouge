import { FLOOR_TYPES, FLOOR_TILES_PER_CELL } from '../../../utils/FloorTypes.js';
import { parseTileKey } from './GenerationUtils.js';

/**
 * Generate a floor tile map for the construction scene.
 *
 * @param {{ buildingPlans: Array, mapWidth: number, mapHeight: number, rng: Function, roadRects?: Array, plazaRects?: Array }} opts
 * @returns {{ floorMap: Uint8Array, width: number, height: number }}
 */
export function generateFloorMap({
    buildingPlans,
    mapWidth,
    mapHeight,
    rng,
    roadRects = [],
    plazaRects = []
}) {
    const S = FLOOR_TILES_PER_CELL; // 2 sub-tiles per tile axis
    const fw = mapWidth * S;
    const fh = mapHeight * S;
    const floorMap = new Uint8Array(fw * fh);

    // Step 1: Fill entire map with GRASS
    floorMap.fill(FLOOR_TYPES.GRASS);

    // Step 2-3: Paint building interiors; split perimeter wall/door sub-tiles
    for (const building of buildingPlans) {
        // Rooms → full WOOD
        for (const room of building.rooms) {
            paintRect(floorMap, fw, fh, room.x * S, room.y * S, room.w * S, room.h * S, FLOOR_TYPES.WOOD);
        }

        // Wall tiles: perimeter walls split inner/outer, internal walls full WOOD
        const bx0 = building.x;
        const by0 = building.y;
        const bx1 = building.x + building.w - 1;
        const by1 = building.y + building.h - 1;

        for (const key of building.wallTiles) {
            const { x, y } = parseTileKey(key);
            const isTop = (y === by0);
            const isBottom = (y === by1);
            const isLeft = (x === bx0);
            const isRight = (x === bx1);

            if (!isTop && !isBottom && !isLeft && !isRight) {
                // Internal wall → full WOOD
                paintRect(floorMap, fw, fh, x * S, y * S, S, S, FLOOR_TYPES.WOOD);
            } else {
                // Perimeter wall → only inner sub-tiles get WOOD, outer stays GRASS→CONCRETE
                paintPerimeterSplit(floorMap, fw, fh, x, y, S, isTop, isBottom, isLeft, isRight);
            }
        }

        // Door tiles: entrance door splits inner/outer, internal doors full WOOD
        const entrX = building.entranceDoor ? building.entranceDoor.x : -1;
        const entrY = building.entranceDoor ? building.entranceDoor.y : -1;

        for (const door of building.doors) {
            if (door.x === entrX && door.y === entrY) {
                // Entrance door on perimeter → split
                const isTop = (door.y === by0);
                const isBottom = (door.y === by1);
                const isLeft = (door.x === bx0);
                const isRight = (door.x === bx1);
                paintPerimeterSplit(floorMap, fw, fh, door.x, door.y, S, isTop, isBottom, isLeft, isRight);
            } else {
                // Internal door → full WOOD
                paintRect(floorMap, fw, fh, door.x * S, door.y * S, S, S, FLOOR_TYPES.WOOD);
            }
        }
    }

    // Step 4: Paint CONCRETE buffer zone around each building (3 tiles outward)
    const concreteBuffer = 3;
    for (const building of buildingPlans) {
        const bx0 = (building.x - concreteBuffer) * S;
        const by0 = (building.y - concreteBuffer) * S;
        const bw = (building.w + concreteBuffer * 2) * S;
        const bh = (building.h + concreteBuffer * 2) * S;

        for (let sy = by0; sy < by0 + bh; sy++) {
            for (let sx = bx0; sx < bx0 + bw; sx++) {
                if (sx < 0 || sx >= fw || sy < 0 || sy >= fh) continue;
                const idx = sy * fw + sx;
                // Only overwrite GRASS, not WOOD
                if (floorMap[idx] === FLOOR_TYPES.GRASS) {
                    floorMap[idx] = FLOOR_TYPES.CONCRETE;
                }
            }
        }
    }

    // Step 5: Paint road/plaza hardscape for town-scale layouts.
    for (const rect of [...plazaRects, ...roadRects]) {
        if (!rect || rect.w <= 0 || rect.h <= 0) continue;
        paintRect(floorMap, fw, fh, rect.x * S, rect.y * S, rect.w * S, rect.h * S, FLOOR_TYPES.CONCRETE);
    }

    // Step 6: Create entrance connectors.
    const entrances = [];
    for (const building of buildingPlans) {
        if (building.entranceDoor && building.entranceDoor.outside) {
            const out = building.entranceDoor.outside;
            entrances.push({
                sx: out.x * S + Math.floor(S / 2),
                sy: out.y * S + Math.floor(S / 2)
            });
        }
    }

    const hardscapeTargets = [...plazaRects, ...roadRects].filter((rect) => rect && rect.w > 0 && rect.h > 0);
    if (hardscapeTargets.length > 0) {
        for (const entrance of entrances) {
            const target = findNearestHardscapePoint(entrance, hardscapeTargets, S);
            if (!target) continue;
            paintLPath(floorMap, fw, fh, entrance, target, 2);
        }
    } else {
        for (let i = 0; i < entrances.length - 1; i++) {
            paintLPath(floorMap, fw, fh, entrances[i], entrances[i + 1], 2);
        }
    }

    // Step 7: Add DIRT transition band between GRASS and CONCRETE
    addDirtTransitions(floorMap, fw, fh, rng);

    // Clear map boundary row/col (walls occupy tile 0 and tile max-1)
    clearBoundary(floorMap, fw, fh, S);

    return { floorMap, width: fw, height: fh };
}

/** Paint only the interior sub-tiles of a perimeter wall/door tile as WOOD.
 *  Outer sub-tiles are left as GRASS so the concrete buffer step converts them. */
function paintPerimeterSplit(floorMap, fw, fh, tx, ty, S, isTop, isBottom, isLeft, isRight) {
    const sx0 = tx * S;
    const sy0 = ty * S;
    for (let dsy = 0; dsy < S; dsy++) {
        for (let dsx = 0; dsx < S; dsx++) {
            let isOutside = false;
            if (isTop && dsy === 0) isOutside = true;
            if (isBottom && dsy === S - 1) isOutside = true;
            if (isLeft && dsx === 0) isOutside = true;
            if (isRight && dsx === S - 1) isOutside = true;

            if (!isOutside) {
                const px = sx0 + dsx;
                const py = sy0 + dsy;
                if (px >= 0 && px < fw && py >= 0 && py < fh) {
                    floorMap[py * fw + px] = FLOOR_TYPES.WOOD;
                }
            }
        }
    }
}

/** Fill a rect in the sub-tile grid */
function paintRect(floorMap, fw, fh, sx0, sy0, sw, sh, type) {
    for (let sy = sy0; sy < sy0 + sh; sy++) {
        for (let sx = sx0; sx < sx0 + sw; sx++) {
            if (sx >= 0 && sx < fw && sy >= 0 && sy < fh) {
                floorMap[sy * fw + sx] = type;
            }
        }
    }
}

function findNearestHardscapePoint(entrance, rects, S) {
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const rect of rects) {
        const left = rect.x * S;
        const top = rect.y * S;
        const right = (rect.x + rect.w) * S - 1;
        const bottom = (rect.y + rect.h) * S - 1;
        const sx = Math.max(left, Math.min(entrance.sx, right));
        const sy = Math.max(top, Math.min(entrance.sy, bottom));
        const dist = Math.abs(entrance.sx - sx) + Math.abs(entrance.sy - sy);
        if (dist < bestDist) {
            bestDist = dist;
            best = { sx, sy };
        }
    }

    return best;
}

/** Paint an L-shaped concrete path between two sub-tile points */
function paintLPath(floorMap, fw, fh, a, b, halfWidth) {
    // Horizontal then vertical
    paintSegment(floorMap, fw, fh, a.sx, a.sy, b.sx, a.sy, halfWidth);
    paintSegment(floorMap, fw, fh, b.sx, a.sy, b.sx, b.sy, halfWidth);
}

/** Paint a straight line segment (axis-aligned) with thickness */
function paintSegment(floorMap, fw, fh, x0, y0, x1, y1, halfWidth) {
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    let x = x0, y = y0;
    const maxSteps = Math.abs(x1 - x0) + Math.abs(y1 - y0) + 1;

    for (let step = 0; step < maxSteps; step++) {
        for (let oy = -halfWidth; oy <= halfWidth; oy++) {
            for (let ox = -halfWidth; ox <= halfWidth; ox++) {
                const px = x + ox;
                const py = y + oy;
                if (px >= 0 && px < fw && py >= 0 && py < fh) {
                    const idx = py * fw + px;
                    if (floorMap[idx] === FLOOR_TYPES.GRASS || floorMap[idx] === FLOOR_TYPES.DIRT) {
                        floorMap[idx] = FLOOR_TYPES.CONCRETE;
                    }
                }
            }
        }
        if (x === x1 && y === y1) break;
        if (x !== x1) x += dx;
        else if (y !== y1) y += dy;
    }
}

/** Convert GRASS tiles adjacent to CONCRETE into DIRT (~60% probability) */
function addDirtTransitions(floorMap, fw, fh, rng) {
    const candidates = [];

    for (let sy = 1; sy < fh - 1; sy++) {
        for (let sx = 1; sx < fw - 1; sx++) {
            const idx = sy * fw + sx;
            if (floorMap[idx] !== FLOOR_TYPES.GRASS) continue;

            // Check 4 cardinal neighbors for CONCRETE
            if (floorMap[idx - 1] === FLOOR_TYPES.CONCRETE ||
                floorMap[idx + 1] === FLOOR_TYPES.CONCRETE ||
                floorMap[idx - fw] === FLOOR_TYPES.CONCRETE ||
                floorMap[idx + fw] === FLOOR_TYPES.CONCRETE) {
                candidates.push(idx);
            }
        }
    }

    for (const idx of candidates) {
        if (rng() < 0.6) {
            floorMap[idx] = FLOOR_TYPES.DIRT;
        }
    }

    // Second pass: expand dirt one more sub-tile outward for wider band
    const expand = [];
    for (let sy = 1; sy < fh - 1; sy++) {
        for (let sx = 1; sx < fw - 1; sx++) {
            const idx = sy * fw + sx;
            if (floorMap[idx] !== FLOOR_TYPES.GRASS) continue;

            if (floorMap[idx - 1] === FLOOR_TYPES.DIRT ||
                floorMap[idx + 1] === FLOOR_TYPES.DIRT ||
                floorMap[idx - fw] === FLOOR_TYPES.DIRT ||
                floorMap[idx + fw] === FLOOR_TYPES.DIRT) {
                expand.push(idx);
            }
        }
    }

    for (const idx of expand) {
        if (rng() < 0.35) {
            floorMap[idx] = FLOOR_TYPES.DIRT;
        }
    }
}

/** Set boundary wall tiles (row/col 0 and max-1) to NONE */
function clearBoundary(floorMap, fw, fh, S) {
    for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < fw; sx++) {
            floorMap[sy * fw + sx] = FLOOR_TYPES.NONE;
            floorMap[(fh - 1 - sy) * fw + sx] = FLOOR_TYPES.NONE;
        }
    }
    for (let sy = 0; sy < fh; sy++) {
        for (let sx = 0; sx < S; sx++) {
            floorMap[sy * fw + sx] = FLOOR_TYPES.NONE;
            floorMap[sy * fw + (fw - 1 - sx)] = FLOOR_TYPES.NONE;
        }
    }
}
