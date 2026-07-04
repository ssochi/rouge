/** Floor tile sub-grid constants */
export const FLOOR_TILE_SIZE = 16;
export const FLOOR_TILES_PER_CELL = 2;

/** Floor type enum */
export const FLOOR_TYPES = {
    NONE: 0,
    GRASS: 1,
    WOOD: 2,
    CONCRETE: 3,
    DIRT: 4,
    STONE: 5,
    // 地牢楼层专属石板（P5 楼层主题，色板见 DungeonThemes.js）
    DUNGEON_F1: 6,
    DUNGEON_F2: 7,
    DUNGEON_F3: 8
};

/** Map type ID → key string for Assets.floors lookup */
export const FLOOR_TYPE_KEYS = ['none', 'grass', 'wood', 'concrete', 'dirt', 'stone', 'dungeon_f1', 'dungeon_f2', 'dungeon_f3'];

/** Base color per floor type (for dithering transitions) */
export const FLOOR_BASE_COLORS = {
    1: '#4a7a3b',
    2: '#6d4c33',
    3: '#7a7a78',
    4: '#8b7355',
    5: '#5a5a6a',
    6: '#565d6e',
    7: '#525c4e',
    8: '#5c4747'
};
