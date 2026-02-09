import { randomInt, rectsOverlapWithGap } from './GenerationUtils.js';

function collidesWithAny(candidate, existing, gap) {
    for (const rect of existing) {
        if (rectsOverlapWithGap(candidate, rect, gap)) return true;
    }
    return false;
}

export function planBuildingFootprints({ mapWidth, mapHeight, config, rng }) {
    const { buildings, reservedRects } = config;

    const targetCount = randomInt(rng, buildings.minCount, buildings.maxCount);
    const results = [];

    let attempts = 0;
    while (results.length < targetCount && attempts < buildings.placementAttempts) {
        attempts++;

        const w = randomInt(rng, buildings.minWidth, buildings.maxWidth);
        const h = randomInt(rng, buildings.minHeight, buildings.maxHeight);

        const minX = buildings.edgePadding;
        const minY = buildings.edgePadding;
        const maxX = mapWidth - buildings.edgePadding - w;
        const maxY = mapHeight - buildings.edgePadding - h;

        if (maxX < minX || maxY < minY) {
            break;
        }

        const x = randomInt(rng, minX, maxX);
        const y = randomInt(rng, minY, maxY);

        const candidate = {
            id: `building_${results.length + 1}`,
            x,
            y,
            w,
            h
        };

        if (collidesWithAny(candidate, results, buildings.gap)) {
            continue;
        }

        if (collidesWithAny(candidate, reservedRects, buildings.gap)) {
            continue;
        }

        results.push(candidate);
    }

    if (results.length < buildings.minCount) {
        return null;
    }

    return results;
}
