import { TILE_SIZE } from '../../../utils/Constants.js';
import { DEFAULT_GENERATION_CONFIG } from './GenerationConfig.js';
import { planBuildingFootprints } from './BuildingFootprintPlanner.js';
import { partitionBuildingRooms } from './RoomPartitioner.js';
import { connectBuildingDoors } from './DoorConnector.js';
import { assignRoomSemantics } from './RoomSemanticAssigner.js';
import {
    computeGlobalRoleQuota,
    promoteGlobalMissingRoles,
    resolveBuildingSemanticProfile
} from './RoomSemanticRepair.js';
import { placeFurnitureForBuilding } from './FurniturePlacer.js';
import { validateBuildingLayout } from './LayoutValidator.js';
import { compileConstructionLayout } from './LayoutCompiler.js';
import { generateFloorMap } from './FloorMapGenerator.js';
import { placeOutdoorObjects } from './OutdoorPlacer.js';
import { clamp, tileKey } from './GenerationUtils.js';

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
        semantic: {
            ...base.semantic,
            ...(overrides.semantic || {}),
            tierThresholds: {
                ...(base.semantic?.tierThresholds || {}),
                ...(overrides.semantic?.tierThresholds || {})
            },
            tierRequiredRoles: {
                ...(base.semantic?.tierRequiredRoles || {}),
                ...(overrides.semantic?.tierRequiredRoles || {})
            },
            tierPreferredRoles: {
                ...(base.semantic?.tierPreferredRoles || {}),
                ...(overrides.semantic?.tierPreferredRoles || {})
            },
            globalRoleQuota: {
                ...(base.semantic?.globalRoleQuota || {}),
                ...(overrides.semantic?.globalRoleQuota || {})
            }
        },
        reservedRects: overrides.reservedRects || base.reservedRects
    };
}

function createFailBreakdown() {
    return {
        footprint: 0,
        partition: 0,
        door: 0,
        semantic: 0,
        globalQuota: 0,
        furniture: 0,
        validate: 0
    };
}

function bumpFailReason(map, reason, defaultKey) {
    const key = reason || defaultKey;
    map.set(key, (map.get(key) || 0) + 1);
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

    const candidates = [];
    for (const building of buildingPlans) {
        for (const room of building.rooms) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    const key = tileKey(x, y);
                    if (occupied.has(key)) continue;

                    candidates.push({
                        x,
                        y,
                        roomId: room.id,
                        buildingId: building.id
                    });
                }
            }
        }
    }

    return candidates;
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

export function generateConstructionLayout({ mapWidth, mapHeight, config: overrides = null, rng = Math.random } = {}) {
    const config = mergeConfig(DEFAULT_GENERATION_CONFIG, overrides);
    const failReasonBreakdown = createFailBreakdown();
    const failReasonDetails = new Map();

    const maxSemanticAttemptsPerBuilding = Math.max(
        1,
        Number.isFinite(config?.semantic?.maxSemanticAttemptsPerBuilding)
            ? Math.floor(config.semantic.maxSemanticAttemptsPerBuilding)
            : 1
    );

    for (let attempt = 0; attempt < config.generation.globalAttempts; attempt++) {
        const footprints = planBuildingFootprints({
            mapWidth,
            mapHeight,
            config,
            rng
        });

        if (!footprints) {
            failReasonBreakdown.footprint++;
            bumpFailReason(failReasonDetails, 'footprint_planning_failed', 'footprint_planning_failed');
            continue;
        }

        const buildingPlans = [];
        let failed = false;
        let repairedBuildings = 0;
        let repairRerolls = 0;

        for (const footprint of footprints) {
            const semanticProfile = resolveBuildingSemanticProfile({ footprint, config });
            let selectedPlan = null;

            for (let localAttempt = 0; localAttempt < maxSemanticAttemptsPerBuilding; localAttempt++) {
                const partition = partitionBuildingRooms({
                    footprint,
                    config,
                    rng
                });

                if (!partition || !partition.rooms || partition.rooms.length === 0) {
                    failReasonBreakdown.partition++;
                    bumpFailReason(failReasonDetails, 'partition_failed', 'partition_failed');
                    continue;
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
                    failReasonBreakdown.door++;
                    bumpFailReason(failReasonDetails, doorResult.reason, 'door_failed');
                    continue;
                }

                const semanticResult = assignRoomSemantics({
                    rooms: partition.rooms,
                    entranceDoor: doorResult.entranceDoor,
                    requiredRoles: semanticProfile.requiredRoles,
                    preferredRoles: semanticProfile.preferredRoles
                });

                if (!semanticResult.ok) {
                    failReasonBreakdown.semantic++;
                    bumpFailReason(failReasonDetails, semanticResult.reason, 'semantic_failed');
                    continue;
                }

                selectedPlan = {
                    ...footprint,
                    semanticTier: semanticProfile.tier,
                    rooms: semanticResult.rooms,
                    splitSegments: partition.splitSegments,
                    wallTiles: doorResult.wallTiles,
                    doors: doorResult.doors,
                    entranceDoor: doorResult.entranceDoor,
                    furniture: []
                };

                if (localAttempt > 0) {
                    repairedBuildings++;
                    repairRerolls += localAttempt;
                }
                break;
            }

            if (!selectedPlan) {
                failed = true;
                break;
            }

            buildingPlans.push(selectedPlan);
        }

        if (failed || buildingPlans.length === 0) {
            continue;
        }

        const globalRoleQuota = computeGlobalRoleQuota({
            buildingCount: buildingPlans.length,
            config
        });

        const globalQuotaResult = promoteGlobalMissingRoles({
            buildingPlans,
            globalRoleQuota,
            config
        });

        if (!globalQuotaResult.ok) {
            failReasonBreakdown.globalQuota++;
            bumpFailReason(failReasonDetails, globalQuotaResult.reason, 'global_quota_failed');
            failed = true;
        }

        if (failed) {
            continue;
        }

        for (const building of buildingPlans) {
            const furnitureResult = placeFurnitureForBuilding({
                rooms: building.rooms,
                doors: building.doors,
                config,
                rng
            });

            if (!furnitureResult.ok) {
                failReasonBreakdown.furniture++;
                bumpFailReason(failReasonDetails, furnitureResult.reason, 'furniture_failed');
                failed = true;
                break;
            }

            const validation = validateBuildingLayout({
                rooms: building.rooms,
                doors: building.doors,
                furniture: furnitureResult.placements
            });

            if (!validation.ok) {
                failReasonBreakdown.validate++;
                bumpFailReason(failReasonDetails, validation.reason, 'validate_failed');
                failed = true;
                break;
            }

            building.furniture = furnitureResult.placements;
        }

        if (failed) {
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

        const allBreakables = compiled.breakables.concat(outdoorResult.placements);
        const indoorSpawnTiles = collectIndoorSpawnTiles(buildingPlans);
        const indoorRooms = collectIndoorRooms(buildingPlans);

        return {
            ok: true,
            breakables: allBreakables,
            floorMap: floorData.floorMap,
            floorMapWidth: floorData.width,
            floorMapHeight: floorData.height,
            spawn: pickPlayerSpawn(buildingPlans, mapWidth, mapHeight, TILE_SIZE),
            meta: {
                indoorSpawnTiles,
                indoorRooms
            },
            stats: {
                attempts: attempt + 1,
                buildings: buildingPlans.length,
                walls: compiled.wallCount,
                doors: compiled.doorCount,
                furniture: compiled.furnitureCount,
                repairedBuildings,
                repairRerolls,
                globalQuotaAdjustments: globalQuotaResult.adjustments || 0,
                failReasonBreakdown: { ...failReasonBreakdown },
                failReasonDetails: Object.fromEntries(failReasonDetails.entries())
            }
        };
    }

    return {
        ok: false,
        breakables: [],
        spawn: null,
        reason: 'layout_generation_failed',
        stats: {
            failReasonBreakdown: { ...failReasonBreakdown },
            failReasonDetails: Object.fromEntries(failReasonDetails.entries())
        }
    };
}
