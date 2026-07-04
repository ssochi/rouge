import { TILE_SIZE } from '../../../utils/Constants.js';
import { FLOOR_TYPES, FLOOR_TILES_PER_CELL } from '../../../utils/FloorTypes.js';

function addRectToSet(set, mapWidth, mapHeight, x0, y0, x1, y1) {
    const sx0 = Math.max(0, x0);
    const sy0 = Math.max(0, y0);
    const sx1 = Math.min(mapWidth - 1, x1);
    const sy1 = Math.min(mapHeight - 1, y1);

    for (let ty = sy0; ty <= sy1; ty++) {
        for (let tx = sx0; tx <= sx1; tx++) {
            set.add(ty * mapWidth + tx);
        }
    }
}

function chebyshevDistanceToRect(tx, ty, rect) {
    const x0 = rect.x;
    const y0 = rect.y;
    const x1 = rect.x + rect.w - 1;
    const y1 = rect.y + rect.h - 1;

    const dx = tx < x0 ? (x0 - tx) : (tx > x1 ? (tx - x1) : 0);
    const dy = ty < y0 ? (y0 - ty) : (ty > y1 ? (ty - y1) : 0);
    return Math.max(dx, dy);
}

function pickWeightedType(types, weights, rng) {
    if (!types || types.length === 0) return null;

    let total = 0;
    const resolved = [];
    for (const type of types) {
        const weight = Math.max(0, Number(weights[type]) || 0);
        resolved.push({ type, weight });
        total += weight;
    }

    if (total <= 0) {
        return types[Math.floor(rng() * types.length)];
    }

    let roll = rng() * total;
    for (const entry of resolved) {
        roll -= entry.weight;
        if (roll <= 0) return entry.type;
    }
    return resolved[resolved.length - 1].type;
}

function shuffleInPlace(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
}

/**
 * Place outdoor nature objects (trees, bushes, grass) on open terrain.
 *
 * @param {{ buildingPlans: Array, mapWidth: number, mapHeight: number, floorMap?: Uint8Array, floorMapWidth?: number, floorMapHeight?: number, rng: Function, config: Object }} opts
 * @returns {{ placements: Array<{x: number, y: number, type: string}> }}
 */
export function placeOutdoorObjects({
    buildingPlans,
    mapWidth,
    mapHeight,
    floorMap,
    floorMapWidth,
    floorMapHeight,
    rng,
    config
}) {
    const outdoor = config.outdoor || {};
    const vegetationBuffer = outdoor.buildingBuffer ?? 4;
    const minSpacing = outdoor.minSpacing ?? 1;
    const vegetationSampleStep = Math.max(1, outdoor.vegetationSampleStep ?? 1);
    const maxTreeCount = Number.isFinite(outdoor.maxTreeCount) ? outdoor.maxTreeCount : Infinity;
    const maxSmallTreeCount = Number.isFinite(outdoor.maxSmallTreeCount) ? outdoor.maxSmallTreeCount : Infinity;
    const maxBushCount = Number.isFinite(outdoor.maxBushCount) ? outdoor.maxBushCount : Infinity;
    const maxGrassCount = Number.isFinite(outdoor.maxGrassCount) ? outdoor.maxGrassCount : Infinity;
    const maxOutdoorTotal = Number.isFinite(outdoor.maxOutdoorTotal) ? outdoor.maxOutdoorTotal : Infinity;

    // Occupied for all outdoor objects: building footprint + reserved rects.
    const occupiedBase = new Set();
    // Occupied for vegetation only: keep extra clearance from buildings.
    const occupiedVegetation = new Set();
    for (const b of buildingPlans) {
        addRectToSet(
            occupiedBase,
            mapWidth,
            mapHeight,
            b.x,
            b.y,
            b.x + b.w - 1,
            b.y + b.h - 1
        );

        addRectToSet(
            occupiedVegetation,
            mapWidth,
            mapHeight,
            b.x - vegetationBuffer,
            b.y - vegetationBuffer,
            b.x + b.w - 1 + vegetationBuffer,
            b.y + b.h - 1 + vegetationBuffer
        );
    }

    // Reserved rects (portal area etc.)
    const reserved = config.reservedRects || [];
    for (const r of reserved) {
        addRectToSet(
            occupiedBase,
            mapWidth,
            mapHeight,
            r.x,
            r.y,
            r.x + r.w - 1,
            r.y + r.h - 1
        );
        addRectToSet(
            occupiedVegetation,
            mapWidth,
            mapHeight,
            r.x,
            r.y,
            r.x + r.w - 1,
            r.y + r.h - 1
        );
    }

    // Track placed object positions for spacing check
    const placed = new Set();
    const placements = [];
    const vegetationCounts = {
        tree: 0,
        tree_small: 0,
        bush: 0,
        grass: 0
    };

    function vegetationBucket(type) {
        if (type === 'tree') return 'tree';
        if (type === 'tree_small') return 'tree_small';
        if (type === 'bush') return 'bush';
        if (type === 'grass_tuft' || type === 'grass_tall' || type === 'grass_flower') return 'grass';
        return null;
    }

    function canPlaceVegetation(type) {
        const bucket = vegetationBucket(type);
        if (!bucket) return true;
        if (placements.length >= maxOutdoorTotal) return false;
        if (bucket === 'tree') return vegetationCounts.tree < maxTreeCount;
        if (bucket === 'tree_small') return vegetationCounts.tree_small < maxSmallTreeCount;
        if (bucket === 'bush') return vegetationCounts.bush < maxBushCount;
        if (bucket === 'grass') return vegetationCounts.grass < maxGrassCount;
        return true;
    }

    function markVegetationPlaced(type) {
        const bucket = vegetationBucket(type);
        if (!bucket) return;
        vegetationCounts[bucket]++;
    }

    function isSpacingOk(tx, ty, spacing) {
        for (let dy = -spacing; dy <= spacing; dy++) {
            for (let dx = -spacing; dx <= spacing; dx++) {
                if (placed.has((ty + dy) * mapWidth + (tx + dx))) return false;
            }
        }
        return true;
    }

    function tileMatchesGround(tx, ty, checker) {
        if (!floorMap || !floorMapWidth || !floorMapHeight) return true;

        const S = FLOOR_TILES_PER_CELL;
        const sx0 = tx * S;
        const sy0 = ty * S;

        for (let dsy = 0; dsy < S; dsy++) {
            for (let dsx = 0; dsx < S; dsx++) {
                const sx = sx0 + dsx;
                const sy = sy0 + dsy;
                if (sx < 0 || sx >= floorMapWidth || sy < 0 || sy >= floorMapHeight) return false;

                const floorType = floorMap[sy * floorMapWidth + sx];
                if (!checker(floorType)) {
                    return false;
                }
            }
        }

        return true;
    }

    // Restrict outdoor vegetation to natural ground only (GRASS / DIRT).
    function isNaturalGround(tx, ty) {
        return tileMatchesGround(tx, ty, (type) => (
            type === FLOOR_TYPES.GRASS || type === FLOOR_TYPES.DIRT
        ));
    }

    // Clutter (box/barrel/vase) should be on grass only.
    function isGrassGround(tx, ty) {
        return tileMatchesGround(tx, ty, (type) => type === FLOOR_TYPES.GRASS);
    }

    function getNearestBuildingDistance(tx, ty) {
        let minDist = Number.POSITIVE_INFINITY;
        for (const b of buildingPlans) {
            const dist = chebyshevDistanceToRect(tx, ty, b);
            if (dist < minDist) minDist = dist;
            if (minDist === 0) return 0;
        }
        return minDist;
    }

    const clutterEnabled = outdoor.clutterEnabled !== false;
    const clutterChanceNearBuilding = outdoor.clutterChanceNearBuilding ?? 0.025;
    const clutterNearMinDist = outdoor.clutterNearBuildingMinDist ?? 4;
    const clutterNearMaxDist = outdoor.clutterNearBuildingMaxDist ?? 8;
    const clutterMinSpacing = outdoor.clutterMinSpacing ?? 2;
    const clutterMinCount = outdoor.clutterMinCount ?? Math.max(4, buildingPlans.length * 2);
    const clutterMaxSearchDist = outdoor.clutterMaxSearchDist ?? 14;
    const clutterSearchExpandStep = outdoor.clutterSearchExpandStep ?? 2;
    const clutterTypes = Array.isArray(outdoor.clutterTypes) && outdoor.clutterTypes.length > 0
        ? outdoor.clutterTypes
        : ['box', 'barrel', 'vase'];
    const clutterWeights = outdoor.clutterWeights || { box: 0.4, barrel: 0.35, vase: 0.25 };

    if (clutterEnabled && buildingPlans.length > 0) {
        const allClutterCandidates = [];
        for (let ty = 2; ty < mapHeight - 2; ty++) {
            for (let tx = 2; tx < mapWidth - 2; tx++) {
                const key = ty * mapWidth + tx;
                if (occupiedBase.has(key)) continue;
                if (!isGrassGround(tx, ty)) continue;

                const dist = getNearestBuildingDistance(tx, ty);
                if (!Number.isFinite(dist)) continue;

                allClutterCandidates.push({ tx, ty, key, dist });
            }
        }

        let activeMaxDist = clutterNearMaxDist;
        let clutterCandidates = allClutterCandidates.filter((candidate) => (
            candidate.dist >= clutterNearMinDist && candidate.dist <= activeMaxDist
        ));

        while (clutterCandidates.length < clutterMinCount && activeMaxDist < clutterMaxSearchDist) {
            activeMaxDist = Math.min(clutterMaxSearchDist, activeMaxDist + clutterSearchExpandStep);
            clutterCandidates = allClutterCandidates.filter((candidate) => (
                candidate.dist >= clutterNearMinDist && candidate.dist <= activeMaxDist
            ));
        }

        shuffleInPlace(clutterCandidates, rng);

        let clutterPlacedCount = 0;
        for (const candidate of clutterCandidates) {
            if (!isSpacingOk(candidate.tx, candidate.ty, clutterMinSpacing)) continue;
            if (rng() >= clutterChanceNearBuilding) continue;

            const clutterType = pickWeightedType(clutterTypes, clutterWeights, rng);
            if (!clutterType) continue;

            placements.push({
                x: candidate.tx * TILE_SIZE,
                y: candidate.ty * TILE_SIZE,
                type: clutterType
            });
            placed.add(candidate.key);
            clutterPlacedCount++;
        }

        // Ensure low-density clutter is still visible even when random rolls are unlucky.
        if (clutterPlacedCount < clutterMinCount) {
            for (const candidate of clutterCandidates) {
                if (clutterPlacedCount >= clutterMinCount) break;
                if (!isSpacingOk(candidate.tx, candidate.ty, clutterMinSpacing)) continue;

                const clutterType = pickWeightedType(clutterTypes, clutterWeights, rng);
                if (!clutterType) continue;

                placements.push({
                    x: candidate.tx * TILE_SIZE,
                    y: candidate.ty * TILE_SIZE,
                    type: clutterType
                });
                placed.add(candidate.key);
                clutterPlacedCount++;
            }
        }
    }

    // Iterate all tiles (skip boundary walls: 2 tiles margin)
    for (let ty = 2; ty < mapHeight - 2; ty += vegetationSampleStep) {
        for (let tx = 2; tx < mapWidth - 2; tx += vegetationSampleStep) {
            const key = ty * mapWidth + tx;
            if (occupiedVegetation.has(key)) continue;
            if (!isNaturalGround(tx, ty)) continue;
            if (!isSpacingOk(tx, ty, minSpacing)) continue;

            // Determine what to place based on probability cascade
            const roll = rng();
            let type = null;

            const treeChance = outdoor.treeChance ?? 0.06;
            const treeSmallChance = outdoor.treeSmallChance ?? 0.08;
            const bushChance = outdoor.bushChance ?? 0.10;
            const grassChance = outdoor.grassChance ?? 0.12;

            let threshold = 0;
            threshold += treeChance;
            if (roll < threshold) { type = 'tree'; }
            else { threshold += treeSmallChance; if (roll < threshold) type = 'tree_small'; }
            if (!type) { threshold += bushChance; if (roll < threshold) type = 'bush'; }
            if (!type) {
                threshold += grassChance;
                if (roll < threshold) {
                    const grassTypes = ['grass_tuft', 'grass_tall', 'grass_flower'];
                    type = grassTypes[Math.floor(rng() * grassTypes.length)];
                }
            }

            if (type) {
                if (!canPlaceVegetation(type)) continue;
                placements.push({
                    x: tx * TILE_SIZE,
                    y: ty * TILE_SIZE,
                    type
                });
                placed.add(key);
                markVegetationPlaced(type);
            }
        }
    }

    return { placements };
}
