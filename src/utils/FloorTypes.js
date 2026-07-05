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
    DUNGEON_F3: 8,
    // 地牢坑（深渊：敌人坠杀/玩家掉落扣血/翻滚可跨越）
    PIT: 9,
    // ── F1 监狱层专属地板（ID 10-12，room-f1 独占）──
    PRISON_CELLBLOCK: 10,   // 铁锈格栅
    PRISON_WET: 11,         // 湿滑石板
    PRISON_BLOOD: 12,       // 血渍石板
    // ── F3 实验室层专属地板（ID 16-18，room-f3 独占）──
    LAB_GRATE: 16,   // 金属格栅
    LAB_TILE: 17,    // 无菌白瓷砖
    LAB_HAZARD: 18   // 警示条纹
};

/** Map type ID → key string for Assets.floors lookup */
export const FLOOR_TYPE_KEYS = ['none', 'grass', 'wood', 'concrete', 'dirt', 'stone', 'dungeon_f1', 'dungeon_f2', 'dungeon_f3', 'pit'];
// ── F1 监狱层地板键（ID 10-12，room-f1 独占；按索引赋值以兼容并行 append）──
FLOOR_TYPE_KEYS[10] = 'prison_cellblock';
FLOOR_TYPE_KEYS[11] = 'prison_wet';
FLOOR_TYPE_KEYS[12] = 'prison_blood';
// ── F3 实验室层地板键（ID 16-18，room-f3 独占；按索引赋值以兼容 F1/F2 并行 append 10-15）──
FLOOR_TYPE_KEYS[16] = 'lab_grate';
FLOOR_TYPE_KEYS[17] = 'lab_tile';
FLOOR_TYPE_KEYS[18] = 'lab_hazard';

/** Base color per floor type (for dithering transitions) */
export const FLOOR_BASE_COLORS = {
    1: '#4a7a3b',
    2: '#6d4c33',
    3: '#7a7a78',
    4: '#8b7355',
    5: '#5a5a6a',
    6: '#565d6e',
    7: '#525c4e',
    8: '#5c4747',
    9: '#050508',
    // ── F1 监狱层地板底色（room-f1 独占）──
    10: '#565d6e',
    11: '#454b57',
    12: '#5a5560',
    // ── F3 实验室层地板底色（room-f3 独占）──
    16: '#3a3f47',
    17: '#b9c2c4',
    18: '#6e5f2c'
};

// ── F2 圣殿层专属地板（ID 13-15，room-f2 独占；属性/索引追加以兼容并行 append）──
FLOOR_TYPES.TEMPLE_TILES = 13;    // 青石菱纹
FLOOR_TYPES.TEMPLE_CARPET = 14;   // 仪式红毯
FLOOR_TYPES.RITUAL_DARK = 15;     // 祭阵黑石
FLOOR_TYPE_KEYS[13] = 'temple_tiles';
FLOOR_TYPE_KEYS[14] = 'temple_carpet';
FLOOR_TYPE_KEYS[15] = 'ritual_dark';
FLOOR_BASE_COLORS[13] = '#3c4a44';
FLOOR_BASE_COLORS[14] = '#5a2230';
FLOOR_BASE_COLORS[15] = '#241a26';
