import { TILE_SIZE } from '../../../utils/Constants.js';
import { DEFAULT_GENERATION_CONFIG } from './GenerationConfig.js';
import { tileKey } from './GenerationUtils.js';
import { compileConstructionLayout } from './LayoutCompiler.js';
import { generateFloorMap } from './FloorMapGenerator.js';
import { placeOutdoorObjects } from './OutdoorPlacer.js';
import { planTownDistricts } from './TownDistrictPlanner.js';
import { allocateTownBuildings } from './TownBlockAllocator.js';
import { getBuildingTemplate, getFacingFootprint, pickBuildingTemplate } from './BuildingTemplateLibrary.js';
import { assembleBuildingPlan } from './BuildingTemplateAssembler.js';

const TOWN_GENERATION_OVERRIDES = Object.freeze({
    outdoor: {
        treeChance: 0.008,
        treeSmallChance: 0.012,
        bushChance: 0.016,
        grassChance: 0.02,
        buildingBuffer: 5,
        minSpacing: 2,
        vegetationSampleStep: 2,
        maxTreeCount: 90,
        maxSmallTreeCount: 140,
        maxBushCount: 180,
        maxGrassCount: 260,
        maxOutdoorTotal: 720,
        clutterMinCount: 18,
        clutterChanceNearBuilding: 0.02
    }
});

function mergeConfig(base, overrides) {
    if (!overrides) return base;
    return {
        ...base,
        ...overrides,
        generation: { ...base.generation, ...(overrides.generation || {}) },
        furniture: { ...base.furniture, ...(overrides.furniture || {}) },
        outdoor: { ...base.outdoor, ...(overrides.outdoor || {}) },
        reservedRects: overrides.reservedRects || base.reservedRects
    };
}

function collectIndoorSpawnTiles(buildingPlans) {
    const occupied = new Set();

    for (const building of buildingPlans) {
        for (const wallKey of building.wallTiles) {
            occupied.add(wallKey);
        }

        for (const door of building.doors) {
            occupied.add(tileKey(door.x, door.y));
        }

        for (const furn of building.furniture) {
            const fw = furn.w || 1;
            const fh = furn.h || 1;
            for (let y = furn.y; y < furn.y + fh; y++) {
                for (let x = furn.x; x < furn.x + fw; x++) {
                    occupied.add(tileKey(x, y));
                }
            }
        }
    }

    const out = [];
    for (const building of buildingPlans) {
        for (const room of building.rooms || []) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    const key = tileKey(x, y);
                    if (occupied.has(key)) continue;
                    out.push({
                        x,
                        y,
                        roomId: room.id,
                        buildingId: building.id
                    });
                }
            }
        }
    }

    return out;
}

function collectIndoorRooms(buildingPlans) {
    const rooms = [];
    for (const building of buildingPlans) {
        for (const room of building.rooms || []) {
            rooms.push({
                id: room.id,
                buildingId: building.id,
                x: room.x,
                y: room.y,
                w: room.w,
                h: room.h,
                semantic: room.semantic || null
            });
        }
    }
    return rooms;
}

function spawnFromTile(tile) {
    return {
        x: tile.x * TILE_SIZE + TILE_SIZE / 2,
        y: tile.y * TILE_SIZE + TILE_SIZE / 2
    };
}

function buildDistrictSummary(blocks, buildingPlans) {
    const counts = new Map();
    for (const building of buildingPlans) {
        const key = building.districtType || 'unknown';
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    return {
        blockCount: blocks.length,
        districtBuildingCounts: Object.fromEntries(counts)
    };
}

function assemblePlacementWithRetry({ placement, config, rng, buildingId }) {
    const baseTemplate = getBuildingTemplate(placement.templateId);
    if (!baseTemplate) {
        return { ok: false, reason: `Unknown placement template ${placement.templateId}` };
    }

    const footprint = getFacingFootprint(baseTemplate, placement.facing);
    const attemptedIds = new Set();

    for (let attempt = 0; attempt < 4; attempt++) {
        const template = attempt === 0
            ? baseTemplate
            : pickBuildingTemplate({
                category: placement.category,
                districtType: placement.districtType,
                facing: placement.facing,
                maxWidth: footprint.width,
                maxHeight: footprint.height,
                recentTemplateIds: [...attemptedIds],
                rng
            });

        if (!template || attemptedIds.has(template.id)) continue;
        attemptedIds.add(template.id);

        const assembled = assembleBuildingPlan({
            template,
            x: placement.x,
            y: placement.y,
            facing: placement.facing,
            buildingId,
            config,
            rng
        });
        if (assembled.ok) {
            assembled.buildingPlan.districtType = placement.districtType;
            assembled.buildingPlan.blockId = placement.blockId;
            return assembled;
        }
    }

    return {
        ok: false,
        reason: `Failed to assemble ${placement.templateId}`
    };
}

export function generateTownLayout({
    mapWidth,
    mapHeight,
    config: overrides = null,
    rng = Math.random
} = {}) {
    const config = mergeConfig(
        mergeConfig(DEFAULT_GENERATION_CONFIG, TOWN_GENERATION_OVERRIDES),
        overrides
    );
    const townPlan = planTownDistricts({ mapWidth, mapHeight, rng });
    const placements = allocateTownBuildings({ blocks: townPlan.blocks, rng });
    const buildingPlans = [];

    for (let index = 0; index < placements.length; index++) {
        const placement = placements[index];
        const assembled = assemblePlacementWithRetry({
            placement,
            config,
            rng,
            buildingId: `town_building_${index + 1}`
        });
        if (!assembled.ok) continue;
        buildingPlans.push(assembled.buildingPlan);
    }

    if (buildingPlans.length < 14) {
        return {
            ok: false,
            reason: 'Town generation produced too few buildings'
        };
    }

    const compiled = compileConstructionLayout({
        buildingPlans,
        tileSize: TILE_SIZE
    });

    const floorData = generateFloorMap({
        buildingPlans,
        mapWidth,
        mapHeight,
        rng,
        roadRects: townPlan.roadRects,
        plazaRects: [townPlan.plazaRect]
    });

    const outdoorResult = placeOutdoorObjects({
        buildingPlans,
        mapWidth,
        mapHeight,
        floorMap: floorData.floorMap,
        floorMapWidth: floorData.width,
        floorMapHeight: floorData.height,
        rng,
        config
    });

    const indoorSpawnTiles = collectIndoorSpawnTiles(buildingPlans);
    const indoorRooms = collectIndoorRooms(buildingPlans);

    return {
        ok: true,
        breakables: compiled.breakables.concat(outdoorResult.placements),
        floorMap: floorData.floorMap,
        floorMapWidth: floorData.width,
        floorMapHeight: floorData.height,
        spawn: spawnFromTile(townPlan.spawnTile),
        meta: {
            indoorSpawnTiles,
            indoorRooms,
            hubPortalTile: townPlan.hubPortalTile,
            town: {
                plazaRect: townPlan.plazaRect,
                roadRects: townPlan.roadRects,
                ...buildDistrictSummary(townPlan.blocks, buildingPlans),
                buildingCount: buildingPlans.length
            }
        }
    };
}
