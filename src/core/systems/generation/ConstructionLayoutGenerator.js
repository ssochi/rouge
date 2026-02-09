import { TILE_SIZE } from '../../../utils/Constants.js';
import { DEFAULT_GENERATION_CONFIG } from './GenerationConfig.js';
import { planBuildingFootprints } from './BuildingFootprintPlanner.js';
import { partitionBuildingRooms } from './RoomPartitioner.js';
import { connectBuildingDoors } from './DoorConnector.js';
import { assignRoomSemantics } from './RoomSemanticAssigner.js';
import { placeFurnitureForBuilding } from './FurniturePlacer.js';
import { validateBuildingLayout } from './LayoutValidator.js';
import { compileConstructionLayout } from './LayoutCompiler.js';
import { generateFloorMap } from './FloorMapGenerator.js';
import { clamp } from './GenerationUtils.js';

function mergeConfig(base, overrides) {
    if (!overrides) return base;

    return {
        ...base,
        ...overrides,
        generation: { ...base.generation, ...(overrides.generation || {}) },
        buildings: { ...base.buildings, ...(overrides.buildings || {}) },
        rooms: { ...base.rooms, ...(overrides.rooms || {}) },
        doors: { ...base.doors, ...(overrides.doors || {}) },
        furniture: { ...base.furniture, ...(overrides.furniture || {}) },
        reservedRects: overrides.reservedRects || base.reservedRects
    };
}

function pickPlayerSpawn(buildingPlans, mapWidth, mapHeight, tileSize) {
    const first = buildingPlans[0];
    if (!first) {
        return {
            x: tileSize * 6,
            y: tileSize * 6
        };
    }

    let spawnTile = null;
    if (first.entranceDoor && first.entranceDoor.outside) {
        spawnTile = first.entranceDoor.outside;
    } else {
        const room = first.rooms[0];
        if (room) {
            spawnTile = {
                x: Math.floor(room.x + room.w / 2),
                y: Math.floor(room.y + room.h / 2)
            };
        }
    }

    if (!spawnTile) {
        spawnTile = {
            x: first.x + 1,
            y: first.y + 1
        };
    }

    const clampedX = clamp(spawnTile.x, 1, mapWidth - 2);
    const clampedY = clamp(spawnTile.y, 1, mapHeight - 2);

    return {
        x: clampedX * tileSize + tileSize / 2,
        y: clampedY * tileSize + tileSize / 2
    };
}

export function generateConstructionLayout({ mapWidth, mapHeight, config: overrides = null, rng = Math.random } = {}) {
    const config = mergeConfig(DEFAULT_GENERATION_CONFIG, overrides);

    for (let attempt = 0; attempt < config.generation.globalAttempts; attempt++) {
        const footprints = planBuildingFootprints({
            mapWidth,
            mapHeight,
            config,
            rng
        });

        if (!footprints) continue;

        const buildingPlans = [];
        let failed = false;

        for (const footprint of footprints) {
            const partition = partitionBuildingRooms({
                footprint,
                config,
                rng
            });

            if (!partition || !partition.rooms || partition.rooms.length === 0) {
                failed = true;
                break;
            }

            const doorResult = connectBuildingDoors({
                footprint,
                rooms: partition.rooms,
                splitSegments: partition.splitSegments,
                config,
                rng,
                mapWidth,
                mapHeight
            });

            if (!doorResult.ok) {
                failed = true;
                break;
            }

            const semanticResult = assignRoomSemantics({
                rooms: partition.rooms,
                entranceDoor: doorResult.entranceDoor
            });

            if (!semanticResult.ok) {
                failed = true;
                break;
            }

            const furnitureResult = placeFurnitureForBuilding({
                rooms: semanticResult.rooms,
                doors: doorResult.doors,
                config,
                rng
            });

            if (!furnitureResult.ok) {
                failed = true;
                break;
            }

            const validation = validateBuildingLayout({
                rooms: semanticResult.rooms,
                doors: doorResult.doors,
                furniture: furnitureResult.placements
            });

            if (!validation.ok) {
                failed = true;
                break;
            }

            buildingPlans.push({
                ...footprint,
                rooms: semanticResult.rooms,
                splitSegments: partition.splitSegments,
                wallTiles: doorResult.wallTiles,
                doors: doorResult.doors,
                entranceDoor: doorResult.entranceDoor,
                furniture: furnitureResult.placements
            });
        }

        if (failed || buildingPlans.length === 0) {
            continue;
        }

        const compiled = compileConstructionLayout({
            buildingPlans,
            tileSize: TILE_SIZE
        });

        const floorData = generateFloorMap({
            buildingPlans,
            mapWidth,
            mapHeight,
            rng
        });

        return {
            ok: true,
            breakables: compiled.breakables,
            floorMap: floorData.floorMap,
            floorMapWidth: floorData.width,
            floorMapHeight: floorData.height,
            spawn: pickPlayerSpawn(buildingPlans, mapWidth, mapHeight, TILE_SIZE),
            stats: {
                attempts: attempt + 1,
                buildings: buildingPlans.length,
                walls: compiled.wallCount,
                doors: compiled.doorCount,
                furniture: compiled.furnitureCount
            }
        };
    }

    return {
        ok: false,
        breakables: [],
        spawn: null,
        reason: 'layout_generation_failed'
    };
}
