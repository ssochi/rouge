import { randomInt } from './GenerationUtils.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function rectFromBounds(left, top, right, bottom) {
    return {
        x: Math.floor(left),
        y: Math.floor(top),
        w: Math.max(0, Math.floor(right - left)),
        h: Math.max(0, Math.floor(bottom - top))
    };
}

function insetRect(rect, inset) {
    return rectFromBounds(
        rect.x + inset,
        rect.y + inset,
        rect.x + rect.w - inset,
        rect.y + rect.h - inset
    );
}

function pushBlock(blocks, block) {
    if (!block) return;
    if (!block.rect || block.rect.w < 12 || block.rect.h < 12) return;
    blocks.push(block);
}

function mix(...entries) {
    return entries.map(([category, weight]) => ({ category, weight }));
}

export function planTownDistricts({ mapWidth, mapHeight, rng = Math.random }) {
    const margin = 16;
    const centerX = Math.floor(mapWidth / 2);
    const centerY = Math.floor(mapHeight / 2);

    const plazaW = 40 + randomInt(rng, 0, 2) * 2;
    const plazaH = 32 + randomInt(rng, 0, 2) * 2;
    const plazaRect = rectFromBounds(
        centerX - Math.floor(plazaW / 2),
        centerY - Math.floor(plazaH / 2),
        centerX + Math.ceil(plazaW / 2),
        centerY + Math.ceil(plazaH / 2)
    );

    const mainRoadWidth = 7;
    const secondaryRoadWidth = 5;
    const mainHorizontal = rectFromBounds(
        margin,
        centerY - Math.floor(mainRoadWidth / 2),
        mapWidth - margin,
        centerY + Math.ceil(mainRoadWidth / 2)
    );
    const mainVertical = rectFromBounds(
        centerX - Math.floor(mainRoadWidth / 2),
        margin,
        centerX + Math.ceil(mainRoadWidth / 2),
        mapHeight - margin
    );

    const northRoadY = clamp(plazaRect.y - 82 + randomInt(rng, -4, 4), margin + 20, plazaRect.y - 48);
    const southRoadY = clamp(plazaRect.y + plazaRect.h + 46 + randomInt(rng, -4, 4), plazaRect.y + plazaRect.h + 36, mapHeight - margin - 26);
    const westRoadX = clamp(plazaRect.x - 86 + randomInt(rng, -4, 4), margin + 20, plazaRect.x - 48);
    const eastRoadX = clamp(plazaRect.x + plazaRect.w + 42 + randomInt(rng, -4, 4), plazaRect.x + plazaRect.w + 32, mapWidth - margin - 26);

    const northRoad = rectFromBounds(margin + 8, northRoadY, mapWidth - margin - 8, northRoadY + secondaryRoadWidth);
    const southRoad = rectFromBounds(margin + 8, southRoadY, mapWidth - margin - 8, southRoadY + secondaryRoadWidth);
    const westRoad = rectFromBounds(westRoadX, margin + 8, westRoadX + secondaryRoadWidth, mapHeight - margin - 8);
    const eastRoad = rectFromBounds(eastRoadX, margin + 8, eastRoadX + secondaryRoadWidth, mapHeight - margin - 8);

    const roadRects = [mainHorizontal, mainVertical, northRoad, southRoad, westRoad, eastRoad];
    const blocks = [];

    const plazaNorth = rectFromBounds(plazaRect.x - 30, plazaRect.y - 18, plazaRect.x + plazaRect.w + 30, plazaRect.y - 4);
    const plazaSouth = rectFromBounds(plazaRect.x - 30, plazaRect.y + plazaRect.h + 4, plazaRect.x + plazaRect.w + 30, plazaRect.y + plazaRect.h + 20);
    const plazaWest = rectFromBounds(plazaRect.x - 18, plazaRect.y - 24, plazaRect.x - 4, plazaRect.y + plazaRect.h + 24);
    const plazaEast = rectFromBounds(plazaRect.x + plazaRect.w + 4, plazaRect.y - 24, plazaRect.x + plazaRect.w + 18, plazaRect.y + plazaRect.h + 24);

    const avenueWestNorth = rectFromBounds(westRoad.x + westRoad.w + 8, mainHorizontal.y - 18, plazaRect.x - 24, mainHorizontal.y - 4);
    const avenueEastNorth = rectFromBounds(plazaRect.x + plazaRect.w + 24, mainHorizontal.y - 18, eastRoad.x - 8, mainHorizontal.y - 4);
    const avenueWestSouth = rectFromBounds(westRoad.x + westRoad.w + 8, mainHorizontal.y + mainHorizontal.h + 4, plazaRect.x - 24, mainHorizontal.y + mainHorizontal.h + 18);
    const avenueEastSouth = rectFromBounds(plazaRect.x + plazaRect.w + 24, mainHorizontal.y + mainHorizontal.h + 4, eastRoad.x - 8, mainHorizontal.y + mainHorizontal.h + 18);

    pushBlock(blocks, {
        id: 'plaza_north',
        type: 'main_street_commercial',
        strategy: 'street_row',
        density: 'dense',
        priority: 1,
        facing: 'south',
        rect: plazaNorth,
        categoryMix: mix(['commercial', 0.9], ['residential', 0.1])
    });
    pushBlock(blocks, {
        id: 'plaza_south',
        type: 'main_street_commercial',
        strategy: 'street_row',
        density: 'dense',
        priority: 1,
        facing: 'north',
        rect: plazaSouth,
        categoryMix: mix(['commercial', 0.9], ['residential', 0.1])
    });
    pushBlock(blocks, {
        id: 'plaza_west',
        type: 'main_street_commercial',
        strategy: 'street_row',
        density: 'dense',
        priority: 1,
        facing: 'east',
        rect: plazaWest,
        categoryMix: mix(['commercial', 0.85], ['service', 0.15])
    });
    pushBlock(blocks, {
        id: 'plaza_east',
        type: 'main_street_commercial',
        strategy: 'street_row',
        density: 'dense',
        priority: 1,
        facing: 'west',
        rect: plazaEast,
        categoryMix: mix(['commercial', 0.85], ['service', 0.15])
    });

    for (const [id, facing, rect] of [
        ['avenue_west_north', 'south', avenueWestNorth],
        ['avenue_east_north', 'south', avenueEastNorth],
        ['avenue_west_south', 'north', avenueWestSouth],
        ['avenue_east_south', 'north', avenueEastSouth]
    ]) {
        pushBlock(blocks, {
            id,
            type: 'main_street_commercial',
            strategy: 'street_row',
            density: 'medium',
            priority: 2,
            facing,
            rect,
            categoryMix: mix(['commercial', 0.75], ['residential', 0.15], ['service', 0.1])
        });
    }

    const northMixedWest = insetRect(rectFromBounds(westRoad.x + westRoad.w + 8, northRoad.y + northRoad.h + 8, mainVertical.x - 10, plazaNorth.y - 8), 2);
    const northMixedEast = insetRect(rectFromBounds(mainVertical.x + mainVertical.w + 10, northRoad.y + northRoad.h + 8, eastRoad.x - 8, plazaNorth.y - 8), 2);
    const southMixedWest = insetRect(rectFromBounds(westRoad.x + westRoad.w + 8, plazaSouth.y + plazaSouth.h + 8, mainVertical.x - 10, southRoad.y - 8), 2);
    const southMixedEast = insetRect(rectFromBounds(mainVertical.x + mainVertical.w + 10, plazaSouth.y + plazaSouth.h + 8, eastRoad.x - 8, southRoad.y - 8), 2);

    for (const [id, facing, rect] of [
        ['north_mixed_west', 'south', northMixedWest],
        ['north_mixed_east', 'south', northMixedEast],
        ['south_mixed_west', 'north', southMixedWest],
        ['south_mixed_east', 'north', southMixedEast]
    ]) {
        pushBlock(blocks, {
            id,
            type: 'mixed_residential',
            strategy: 'mixed_row',
            density: 'medium',
            priority: 3,
            facing,
            rect,
            categoryMix: mix(['residential', 0.72], ['commercial', 0.18], ['service', 0.1])
        });
    }

    const outerNw = insetRect(rectFromBounds(margin + 6, margin + 6, westRoad.x - 8, northRoad.y - 8), 2);
    const outerNe = insetRect(rectFromBounds(eastRoad.x + eastRoad.w + 8, margin + 6, mapWidth - margin - 6, northRoad.y - 8), 2);
    const outerSw = insetRect(rectFromBounds(margin + 6, southRoad.y + southRoad.h + 8, westRoad.x - 8, mapHeight - margin - 6), 2);
    const outerSe = insetRect(rectFromBounds(eastRoad.x + eastRoad.w + 8, southRoad.y + southRoad.h + 8, mapWidth - margin - 6, mapHeight - margin - 6), 2);

    for (const [id, facing, rect] of [
        ['outer_nw_residential', 'east', outerNw],
        ['outer_ne_residential', 'west', outerNe],
        ['outer_sw_residential', 'east', outerSw],
        ['outer_se_residential', 'west', outerSe]
    ]) {
        pushBlock(blocks, {
            id,
            type: 'residential_outer',
            strategy: 'paired_houses',
            density: 'sparse',
            priority: 4,
            facing,
            rect,
            categoryMix: mix(['residential', 0.88], ['service', 0.12])
        });
    }

    const northService = insetRect(rectFromBounds(westRoad.x + westRoad.w + 8, margin + 6, eastRoad.x - 8, northRoad.y - 8), 2);
    const southService = insetRect(rectFromBounds(westRoad.x + westRoad.w + 8, southRoad.y + southRoad.h + 8, eastRoad.x - 8, mapHeight - margin - 6), 2);
    const westService = insetRect(rectFromBounds(margin + 6, northRoad.y + northRoad.h + 8, westRoad.x - 8, southRoad.y - 8), 2);
    const eastService = insetRect(rectFromBounds(eastRoad.x + eastRoad.w + 8, northRoad.y + northRoad.h + 8, mapWidth - margin - 6, southRoad.y - 8), 2);

    for (const [id, facing, rect] of [
        ['north_service_edge', 'south', northService],
        ['south_service_edge', 'north', southService],
        ['west_service_edge', 'east', westService],
        ['east_service_edge', 'west', eastService]
    ]) {
        pushBlock(blocks, {
            id,
            type: 'service_edge',
            strategy: 'courtyard_cluster',
            density: 'medium',
            priority: 5,
            facing,
            rect,
            categoryMix: mix(['service', 0.72], ['residential', 0.2], ['commercial', 0.08])
        });
    }

    const hubPortalTile = {
        x: centerX - 1,
        y: plazaRect.y + plazaRect.h + 2
    };
    const spawnTile = {
        x: centerX + 2,
        y: plazaRect.y + plazaRect.h + 2
    };

    return {
        plazaRect,
        roadRects,
        blocks: blocks.sort((a, b) => a.priority - b.priority),
        hubPortalTile,
        spawnTile
    };
}
