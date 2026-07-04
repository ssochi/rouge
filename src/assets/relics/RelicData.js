// RelicData.js
// 地牢遗物定义（纯数据，无逻辑）。effect 字段由 RelicSystem 消费。
// 三类：stat（属性乘区）/ ballistic（弹道改造）/ trigger（事件触发）。
// 数值为初值，P6 统一调参。

export const RELIC_CATEGORIES = ['stat', 'ballistic', 'trigger'];

export const RELICS = {
    // ── 属性类（6）──
    swift_boots: {
        id: 'swift_boots',
        name: '疾行之靴',
        category: 'stat',
        desc: '移动速度 +15%',
        effect: { moveSpeedMult: 1.15 },
    },
    rapid_gloves: {
        id: 'rapid_gloves',
        name: '速射手套',
        category: 'stat',
        desc: '开火间隔 -20%',
        effect: { fireIntervalMult: 0.8 },
    },
    power_core: {
        id: 'power_core',
        name: '力量核心',
        category: 'stat',
        desc: '子弹伤害 +15%',
        effect: { damageMult: 1.15 },
    },
    vital_heart: {
        id: 'vital_heart',
        name: '生命之心',
        category: 'stat',
        desc: '生命上限 +25',
        effect: { maxHpBonus: 25 },
    },
    magnet_ring: {
        id: 'magnet_ring',
        name: '磁力指环',
        category: 'stat',
        desc: '拾取磁吸半径 ×2',
        effect: { magnetMult: 2 },
    },
    lucky_dice: {
        id: 'lucky_dice',
        name: '幸运骰子',
        category: 'stat',
        desc: '暴击率 +10%（暴击造成双倍伤害）',
        effect: { critChance: 0.1 },
    },

    // ── 弹道改造类（7）──
    ember_rounds: {
        id: 'ember_rounds',
        name: '余烬弹头',
        category: 'ballistic',
        desc: '子弹命中附加燃烧',
        effect: { burn: { damage: 2, duration: 180, tickInterval: 20 } },
    },
    frost_rounds: {
        id: 'frost_rounds',
        name: '霜寒弹头',
        category: 'ballistic',
        desc: '子弹命中叠加冰冻',
        effect: { freezeStack: { slowAmount: 0.3, slowDuration: 60, freezeThreshold: 8, freezeDuration: 90 } },
    },
    piercing_tip: {
        id: 'piercing_tip',
        name: '穿甲尖端',
        category: 'ballistic',
        desc: '子弹穿透 +1',
        effect: { piercingBonus: 1 },
    },
    rubber_shell: {
        id: 'rubber_shell',
        name: '弹性外壳',
        category: 'ballistic',
        desc: '子弹碰墙弹射 +1',
        effect: { bounceBonus: 1 },
    },
    blast_powder: {
        id: 'blast_powder',
        name: '爆裂火药',
        category: 'ballistic',
        desc: '击杀敌人时产生小爆炸',
        effect: { killExplosion: { radius: 40, damage: 15 } },
    },
    split_chamber: {
        id: 'split_chamber',
        name: '分裂弹膛',
        category: 'ballistic',
        desc: '弹丸 +1，全部弹丸伤害 ×0.8',
        effect: { extraPellets: 1, pelletDamageMult: 0.8 },
    },
    heavy_caliber: {
        id: 'heavy_caliber',
        name: '重型口径',
        category: 'ballistic',
        desc: '弹丸体积 +50%，伤害 +5%',
        effect: { bulletSizeMult: 1.5, damageMult: 1.05 },
    },

    // ── 触发类（5）──
    reactive_plate: {
        id: 'reactive_plate',
        name: '反应装甲',
        category: 'trigger',
        desc: '受击时释放击退冲击波（冷却 3 秒）',
        effect: { hitShockwave: { radius: 90, knockback: 12, cooldown: 180 } },
    },
    leech_fang: {
        id: 'leech_fang',
        name: '汲血獠牙',
        category: 'trigger',
        desc: '击杀敌人 10% 概率回复 2 点生命',
        effect: { killHeal: { chance: 0.1, amount: 2 } },
    },
    berserker_totem: {
        id: 'berserker_totem',
        name: '狂战图腾',
        category: 'trigger',
        desc: '生命低于 30% 时伤害 +30%、开火间隔 -20%',
        effect: { lowHpRage: { threshold: 0.3, damageMult: 1.3, fireIntervalMult: 0.8 } },
    },
    golden_idol: {
        id: 'golden_idol',
        name: '黄金神像',
        category: 'trigger',
        desc: '清理房间奖励金币翻倍',
        effect: { roomClearCoinMult: 2 },
    },
    treasure_scope: {
        id: 'treasure_scope',
        name: '寻宝透镜',
        category: 'trigger',
        desc: '开启宝箱 20% 概率双倍产出',
        effect: { chestDoubleChance: 0.2 },
    },
};

export const RELIC_IDS = Object.keys(RELICS);
