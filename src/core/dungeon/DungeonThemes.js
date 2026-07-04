// DungeonThemes —— 楼层主题数据（纯配置，无逻辑）。
// 单主题「石牢监狱」下的楼层微差异：F1 冷蓝灰 → F2 暗绿苔藓 → F3 暗红炽热。
// 消费方：
//   - DungeonWallSprites / DungeonFloorSprites（wall/floor 色板）
//   - LightBufferRenderer 环境光填充（ambient，经 WorldSystem.ambientLightOverride 暴露）
//   - 火把/火盆实例 lightColor 覆盖（torchColor/brazierColor）
//   - 生成器装饰/贴花配比（decorWeights/decalWeights，P5-T4/T5 接入）

export const DUNGEON_THEMES = {
    1: {
        id: 'f1',
        name: '冷狱',
        wall: {
            top: '#6a7288',
            topMortar: '#565d70',
            front: '#4b5165',
            frontMortar: '#3d4254',
            highlight: '#828aa0',
            accent: '#5d6e6a',   // 淡苔痕
            crack: '#333848'
        },
        floor: {
            base: '#565d6e',
            light: '#666e80',
            dark: '#484e5e',
            gap: '#3f4453',
            accent: '#4f5a68'
        },
        // 环境光基色（默认全局 115 灰，地牢压暗并染色以突出火光）
        ambient: { r: 62, g: 68, b: 86 },
        torchColor: '#ffbe72',
        brazierColor: '#ffa85c',
        // 贴花抽取权重（P5-T5）：冷狱以裂纹/蛛网为主
        decalWeights: { crack: 4, web: 3, moss: 1, blood: 1, puddle: 1, pages: 2 },
        // 装饰抽取权重（P5-T4）：类型 → 权重
        decorWeights: {
            dungeon_rubble: 3,
            dungeon_bone_pile: 2,
            dungeon_iron_cage: 1,
            dungeon_pillar: 2,
            dungeon_pillar_broken: 2,
            dungeon_statue: 1,
            dungeon_bars: 2,
            dungeon_rack: 1,
            dungeon_mushrooms: 1
        }
    },
    2: {
        id: 'f2',
        name: '苔窟',
        wall: {
            top: '#5f6f5e',
            topMortar: '#4d5a4c',
            front: '#454f42',
            frontMortar: '#383f36',
            highlight: '#79876f',
            accent: '#6d8a4f',   // 浓苔藓
            crack: '#2e352c'
        },
        floor: {
            base: '#525c4e',
            light: '#616c5a',
            dark: '#434c40',
            gap: '#383f36',
            accent: '#5c7247'
        },
        ambient: { r: 56, g: 72, b: 58 },
        torchColor: '#ffc98a',
        brazierColor: '#ffb066',
        decalWeights: { crack: 2, web: 1, moss: 5, blood: 1, puddle: 3, pages: 1 },
        decorWeights: {
            dungeon_rubble: 2,
            dungeon_bone_pile: 2,
            dungeon_iron_cage: 1,
            dungeon_pillar: 1,
            dungeon_pillar_broken: 3,
            dungeon_statue: 1,
            dungeon_bars: 1,
            dungeon_rack: 1,
            dungeon_mushrooms: 4
        }
    },
    3: {
        id: 'f3',
        name: '燔狱',
        wall: {
            top: '#75585a',
            topMortar: '#5e4547',
            front: '#54393c',
            frontMortar: '#43292c',
            highlight: '#8f6f6c',
            accent: '#a4523c',   // 炽热焦痕
            crack: '#38201f'
        },
        floor: {
            base: '#5c4747',
            light: '#6d5352',
            dark: '#4a3737',
            gap: '#3c2b2b',
            accent: '#6e4238'
        },
        ambient: { r: 74, g: 56, b: 52 },
        torchColor: '#ff9a52',
        brazierColor: '#ff8442',
        decalWeights: { crack: 3, web: 1, moss: 0, blood: 4, puddle: 0, pages: 1 },
        decorWeights: {
            dungeon_rubble: 3,
            dungeon_bone_pile: 3,
            dungeon_iron_cage: 2,
            dungeon_pillar: 2,
            dungeon_pillar_broken: 2,
            dungeon_statue: 2,
            dungeon_bars: 1,
            dungeon_rack: 2,
            dungeon_mushrooms: 0
        }
    }
};

/**
 * 取楼层主题；越界回退 F1。
 * @param {number} floor 楼层（1 起）
 */
export function getDungeonTheme(floor) {
    return DUNGEON_THEMES[floor] || DUNGEON_THEMES[1];
}
