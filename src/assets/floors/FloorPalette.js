/** Shared color palette for all floor tile types */
export const FloorPalette = {
    // Grass
    grassBase: '#4a7a3b',
    grassLight: '#5d8e4c',
    grassDark: '#3d6630',
    grassBlade: '#6ba35a',
    grassShadow: '#345a28',

    // Wood (Lighter Oak/Birch style to contrast with dark furniture)
    woodBase: '#a69580',
    woodLight: '#b8a894',
    woodDark: '#8c7d6b',
    woodGrain: '#968673',
    woodGap: '#706354',
    woodHighlight: '#d1c4b5',

    // Concrete
    concreteBase: '#7a7a78',
    concreteLight: '#8e8e8b',
    concreteDark: '#686865',
    concreteCrack: '#5a5a58',
    concretePatch: '#828280',

    // Dirt
    dirtBase: '#8b7355',
    dirtLight: '#a08968',
    dirtDark: '#6d5a42',
    dirtPebble: '#9e8d70',
    dirtShadow: '#5c4a35',

    // Stone (dungeon floor)
    stoneBase: '#5a5a6a',
    stoneLight: '#6b6b7a',
    stoneDark: '#4a4a58',
    stoneGap: '#3e3e4c',
    stoneHighlight: '#75758a',
    stoneCrack: '#404050',

    // ── F3 实验室层地板（room-f3 独占）──
    // 金属格栅 LAB_GRATE：深钢底板 + 网格棱线 + 格孔透出的黑暗
    grateBase: '#3a3f47',
    grateLight: '#525965',
    grateDark: '#252a31',
    grateHole: '#14171c',
    grateHi: '#6a7280',
    grateRust: '#5c4a34',

    // 无菌白瓷砖 LAB_TILE：苍白瓷面 + 冷缝 + 陈旧污渍
    tileBase: '#b9c2c4',
    tileLight: '#cfd7d8',
    tileDark: '#9aa4a6',
    tileGrout: '#828d8f',
    tileStain: '#a7b0af',
    tileHi: '#e0e6e6',

    // 警示条纹 LAB_HAZARD：褪色工业警示漆（暗脏基底 + 芥末黄漆 + 侵蚀磨损，读作地面而非标语）
    hazardBase: '#37352d',      // 脏污钢/混凝土基底（漆面剥落露出）
    hazardYellow: '#8a7834',    // 褪色芥末黄（降饱和压暗）
    hazardYellowHi: '#9c8940',  // 轻微受光（非亮胶带高光）
    hazardYellowDk: '#5f5126',  // 黄漆阴影 / 磨损缝
    hazardBlack: '#2a2822',     // 暖黑漆条（贴近基底，降对比）
    hazardWear: '#524b3a',      // 磨损露底
    hazardGrime: '#433e30',     // 油污锈渍斑

    // ── F1 监狱层地板（room-f1 独占）──
    // 铁锈格栅 PRISON_CELLBLOCK：冷钢肋条 + 凹槽 + 锈斑
    cellBase: '#565d6e',
    cellLight: '#69707f',
    cellDark: '#454b57',
    cellGap: '#363b45',
    cellHi: '#7a828f',
    cellRust: '#6e4a2a',

    // 湿滑石板 PRISON_WET：暗石 + 积水 + 冷蓝水光
    wetBase: '#454b57',
    wetLight: '#565d6a',
    wetDark: '#353a44',
    wetGap: '#2a2e37',
    wetPool: '#3b444f',
    wetSheen: '#6d7a86',

    // 血渍石板 PRISON_BLOOD：灰石 + 干涸暗红渍
    bloodBase: '#5a5560',
    bloodLight: '#6a6572',
    bloodDark: '#48434f',
    bloodGap: '#38343f',
    bloodStain: '#5c2323',
    bloodStainDk: '#3a1414'
};

// ── F2 圣殿层地板（room-f2 独占；属性追加以兼容并行 append）──
// 青石菱纹 TEMPLE_TILES：暗青石 + 菱形嵌纹 + 微金线
FloorPalette.templeBase = '#3c4a44';
FloorPalette.templeLight = '#4e5e56';
FloorPalette.templeDark = '#2e3a35';
FloorPalette.templeGap = '#232c28';
FloorPalette.templeDiamond = '#576b60';
FloorPalette.templeGold = '#897233';

// 仪式红毯 TEMPLE_CARPET：深绯绒毯 + 金织边 + 磨损
FloorPalette.carpetBase = '#5a2230';
FloorPalette.carpetLight = '#6e2b3b';
FloorPalette.carpetDark = '#431722';
FloorPalette.carpetGold = '#b28a2c';
FloorPalette.carpetGoldDk = '#7d5f1e';
FloorPalette.carpetWear = '#4a2029';

// 祭阵黑石 RITUAL_DARK：近墨黑石 + 幽紫符阵微光
FloorPalette.ritualBase = '#241a26';
FloorPalette.ritualLight = '#332536';
FloorPalette.ritualDark = '#160f18';
FloorPalette.ritualGap = '#0e090f';
FloorPalette.ritualRune = '#7a3a86';
FloorPalette.ritualRuneHi = '#a85ab0';
