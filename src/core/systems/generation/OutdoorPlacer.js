import { TILE_SIZE } from '../../../utils/Constants.js';

/**
 * Place outdoor nature objects (trees, bushes, grass) on open terrain.
 *
 * @param {{ buildingPlans: Array, mapWidth: number, mapHeight: number, rng: Function, config: Object }} opts
 * @returns {{ placements: Array<{x: number, y: number, type: string}> }}
 */
export function placeOutdoorObjects({ buildingPlans, mapWidth, mapHeight, rng, config }) {
    const outdoor = config.outdoor || {};
    const buffer = outdoor.buildingBuffer || 4;
    const minSpacing = outdoor.minSpacing || 1;

    // Build occupied set: building footprints + buffer zone
    const occupied = new Set();
    for (const b of buildingPlans) {
        const x0 = b.x - buffer;
        const y0 = b.y - buffer;
        const x1 = b.x + b.w - 1 + buffer;
        const y1 = b.y + b.h - 1 + buffer;
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                occupied.add(ty * mapWidth + tx);
            }
        }
    }

    // Reserved rects (portal area etc.)
    const reserved = config.reservedRects || [];
    for (const r of reserved) {
        for (let ty = r.y; ty < r.y + r.h; ty++) {
            for (let tx = r.x; tx < r.x + r.w; tx++) {
                occupied.add(ty * mapWidth + tx);
            }
        }
    }

    // Track placed object positions for spacing check
    const placed = new Set();
    const placements = [];

    function isSpacingOk(tx, ty) {
        for (let dy = -minSpacing; dy <= minSpacing; dy++) {
            for (let dx = -minSpacing; dx <= minSpacing; dx++) {
                if (placed.has((ty + dy) * mapWidth + (tx + dx))) return false;
            }
        }
        return true;
    }

    // Iterate all tiles (skip boundary walls: 2 tiles margin)
    for (let ty = 2; ty < mapHeight - 2; ty++) {
        for (let tx = 2; tx < mapWidth - 2; tx++) {
            const key = ty * mapWidth + tx;
            if (occupied.has(key)) continue;
            if (!isSpacingOk(tx, ty)) continue;

            // Determine what to place based on probability cascade
            const roll = rng();
            let type = null;

            const treeChance = outdoor.treeChance || 0.06;
            const treeSmallChance = outdoor.treeSmallChance || 0.08;
            const bushChance = outdoor.bushChance || 0.10;
            const grassChance = outdoor.grassChance || 0.12;

            let threshold = 0;
            threshold += treeChance;
            if (roll < threshold) { type = 'tree'; }
            else { threshold += treeSmallChance; if (roll < threshold) type = 'tree_small'; }
            if (!type) { threshold += bushChance; if (roll < threshold) type = 'bush'; }
            if (!type) { threshold += grassChance; if (roll < threshold) type = 'grass_tuft'; }

            if (type) {
                placements.push({
                    x: tx * TILE_SIZE,
                    y: ty * TILE_SIZE,
                    type
                });
                placed.add(key);
            }
        }
    }

    return { placements };
}
