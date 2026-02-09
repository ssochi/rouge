import { parseTileKey, tileKey } from './GenerationUtils.js';

function sortTiles(a, b) {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
}

export function compileConstructionLayout({ buildingPlans, tileSize }) {
    const globalWalls = new Set();
    const doorMap = new Map();
    const furniture = [];

    for (const building of buildingPlans) {
        for (const key of building.wallTiles) {
            globalWalls.add(key);
        }

        for (const door of building.doors) {
            doorMap.set(tileKey(door.x, door.y), door.type);
        }

        for (const item of building.furniture) {
            furniture.push(item);
        }
    }

    for (const key of doorMap.keys()) {
        globalWalls.delete(key);
    }

    const wallTiles = [...globalWalls].map(parseTileKey).sort(sortTiles);
    const doorTiles = [...doorMap.entries()]
        .map(([key, type]) => ({ ...parseTileKey(key), type }))
        .sort(sortTiles);

    const breakables = [];

    for (const wall of wallTiles) {
        breakables.push({
            x: wall.x * tileSize,
            y: wall.y * tileSize,
            type: 'wall'
        });
    }

    for (const door of doorTiles) {
        breakables.push({
            x: door.x * tileSize,
            y: door.y * tileSize,
            type: door.type
        });
    }

    furniture.sort(sortTiles);
    for (const item of furniture) {
        breakables.push({
            x: item.x * tileSize,
            y: item.y * tileSize,
            type: item.type
        });
    }

    return {
        breakables,
        wallCount: wallTiles.length,
        doorCount: doorTiles.length,
        furnitureCount: furniture.length
    };
}
