export const MAP_PROFILES = Object.freeze({
    hub: {
        id: 'hub',
        tileWidth: 130,
        tileHeight: 130,
        navGridSize: 8,
        localFlowFieldRadiusCells: null,
        floorChunking: false,
        generationPreset: 'hub'
    },
    test: {
        id: 'test',
        tileWidth: 130,
        tileHeight: 130,
        navGridSize: 8,
        localFlowFieldRadiusCells: null,
        floorChunking: false,
        generationPreset: 'test'
    },
    dungeon: {
        id: 'dungeon',
        tileWidth: 130,
        tileHeight: 130,
        navGridSize: 8,
        localFlowFieldRadiusCells: null,
        floorChunking: false,
        generationPreset: 'dungeon'
    },
    dungeon_f2: {
        id: 'dungeon_f2',
        tileWidth: 130,
        tileHeight: 130,
        navGridSize: 8,
        localFlowFieldRadiusCells: null,
        floorChunking: false,
        generationPreset: 'dungeon'
    },
    construction: {
        id: 'construction',
        tileWidth: 420,
        tileHeight: 420,
        navGridSize: 32,
        localFlowFieldRadiusCells: 72,
        floorChunking: true,
        generationPreset: 'town_large'
    },
    game: {
        id: 'game',
        tileWidth: 420,
        tileHeight: 420,
        navGridSize: 32,
        localFlowFieldRadiusCells: 72,
        floorChunking: true,
        generationPreset: 'town_large'
    }
});

export function getMapProfile(mapType = 'hub') {
    return MAP_PROFILES[mapType] || MAP_PROFILES.hub;
}
