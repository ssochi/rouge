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
            top: '#8b91a2',
            topMortar: '#7b818f',
            front: '#737787',
            frontMortar: '#585e70',
            highlight: '#9ea4b5',
            accent: '#818e8b',   // 淡苔痕
            crack: '#474c5c'
        },
        floor: {
            base: '#7b818e',
            light: '#888e9c',
            dark: '#6b7180',
            gap: '#54596a',
            accent: '#767e89'
        },
        // 环境光基色（默认全局 115 灰；地牢略暗并染色——可读性优先，火光是氛围层）
        ambient: { r: 100, g: 104, b: 118 },
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
            dungeon_mushrooms: 1,
            computer_desk: 0.6,
            fish_tank: 0.5,
            tv_stand: 0.5
        }
    },
    2: {
        id: 'f2',
        name: '苔窟',
        wall: {
            top: '#828f81',
            topMortar: '#747e73',
            front: '#6e766c',
            frontMortar: '#565c54',
            highlight: '#96a18f',
            accent: '#8da476',   // 浓苔藓
            crack: '#454a44'
        },
        floor: {
            base: '#788075',
            light: '#848c7e',
            dark: '#687064',
            gap: '#4f5450',
            accent: '#80916f'
        },
        ambient: { r: 96, g: 110, b: 98 },
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
            dungeon_mushrooms: 4,
            computer_desk: 0.6,
            fish_tank: 0.5,
            tv_stand: 0.5
        }
    },
    3: {
        id: 'f3',
        name: '燔狱',
        wall: {
            top: '#937d7e',
            topMortar: '#816e6f',
            front: '#7a6567',
            frontMortar: '#5c4c4e',
            highlight: '#a88f8c',
            accent: '#b87867',   // 炽热焦痕
            crack: '#4e403f'
        },
        floor: {
            base: '#806f6f',
            light: '#8d7978',
            dark: '#6e5f5f',
            gap: '#524646',
            accent: '#8e6c64'
        },
        ambient: { r: 118, g: 100, b: 96 },
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
            dungeon_mushrooms: 0,
            computer_desk: 0.6,
            fish_tank: 0.5,
            tv_stand: 0.5
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
