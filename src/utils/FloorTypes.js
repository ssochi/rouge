/** Floor tile sub-grid constants */
export const FLOOR_TILE_SIZE = 16;
export const FLOOR_TILES_PER_CELL = 2;

/** Floor type enum */
export const FLOOR_TYPES = {
    NONE: 0,
    GRASS: 1,
    WOOD: 2,
    CONCRETE: 3,
    DIRT: 4
};

/** Map type ID → key string for Assets.floors lookup */
export const FLOOR_TYPE_KEYS = ['none', 'grass', 'wood', 'concrete', 'dirt'];

/** Base color per floor type (for dithering transitions) */
export const FLOOR_BASE_COLORS = {
    1: '#4a7a3b',
    2: '#6d4c33',
    3: '#7a7a78',
    4: '#8b7355'
};
