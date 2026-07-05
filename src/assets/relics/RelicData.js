// RelicData.js
// 地牢遗物定义（纯数据，无逻辑）。effect 字段由 RelicSystem 消费。
// 三类：stat（属性乘区）/ ballistic（弹道改造）/ trigger（事件触发）。
// 数值为初值，P6 统一调参。
// 当前 34 个：属性 10 / 弹道 9 / 触发 15（P8 追加 8 个，见文件末 P8 扩展块）。

export const RELIC_CATEGORIES = ['stat', 'ballistic', 'trigger'];
// 稀有度（P7 扩展遗物起标注；数值平衡与掉落加权后续接入）。
export const RELIC_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const RELICS = {
    // ── 属性类（8）──
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
    golden_fleece: {
        id: 'golden_fleece',
        name: '金羊羔毛',
        category: 'stat',
        rarity: 'uncommon',
        desc: '金币拾取价值 +25%',
        effect: { coinValueMult: 1.25 },
    },
    swift_quiver: {
        id: 'swift_quiver',
        name: '迅捷箭袋',
        category: 'stat',
        rarity: 'uncommon',
        desc: '子弹飞行速度 +30%',
        effect: { bulletSpeedMult: 1.3 },
    },

    // ── 弹道改造类（9）──
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
    giant_belt: {
        id: 'giant_belt',
        name: '巨人腰带',
        category: 'ballistic',
        rarity: 'uncommon',
        desc: '子弹击退 +8（可将敌人轰入坑中）',
        effect: { knockbackBonus: 8 },
    },
    abyss_eye: {
        id: 'abyss_eye',
        name: '深渊之眼',
        category: 'ballistic',
        rarity: 'epic',
        desc: '对满血敌人伤害 +50%',
        effect: { firstStrikeMult: 1.5 },
    },

    // ── 触发类（9）──
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
    vampiric_crown: {
        id: 'vampiric_crown',
        name: '血牙冠冕',
        category: 'trigger',
        rarity: 'rare',
        desc: '子弹暴击命中敌人时回复 1 点生命',
        effect: { critHeal: 1 },
    },
    thorn_mail: {
        id: 'thorn_mail',
        name: '荆棘胸甲',
        category: 'trigger',
        rarity: 'rare',
        desc: '受击时向 8 方向反射荆棘小刺弹',
        effect: { thornBurst: { count: 8, damage: 6, speed: 5, size: 3, life: 40, color: '#8bc34a' } },
    },
    chrono_watch: {
        id: 'chrono_watch',
        name: '冷血怀表',
        category: 'trigger',
        rarity: 'epic',
        desc: '房间出怪波刷新后 3 秒内敌人移速 ×0.7',
        effect: { waveSlow: { duration: 180, slowAmount: 0.3 } },
    },
    bone_charm: {
        id: 'bone_charm',
        name: '白骨护符',
        category: 'trigger',
        rarity: 'rare',
        desc: '击杀敌人 15% 概率额外掉落 1 枚金币',
        effect: { bonusCoin: { chance: 0.15, amount: 1 } },
    },

    // ── P8 扩展（8）：金币/翻滚/坑/波次/收藏/护罩 联动 ──
    // 贪狼之戒：持币越多伤害越高，鼓励囤积（花钱会削弱），与金币经济系统联动。
    tycoon_ring: {
        id: 'tycoon_ring',
        name: '贪狼之戒',
        category: 'stat',
        rarity: 'rare',
        desc: '持有金币越多伤害越高：每 25 金币 +2%（上限 +30%）',
        effect: { coinDamage: { per: 25, mult: 0.02, maxBonus: 0.30 } },
    },
    // 石肤护符：受到的所有伤害按比例削减（至少保留 1 点），纯防御向。
    stoneskin_charm: {
        id: 'stoneskin_charm',
        name: '石肤护符',
        category: 'trigger',
        rarity: 'rare',
        desc: '受到的伤害减少 15%（至少造成 1 点）',
        effect: { damageReduction: 0.15 },
    },
    // 疾风斗篷：翻滚闪避结束后短暂爆发移速，鼓励用翻滚走位/接近。
    windrunner_cloak: {
        id: 'windrunner_cloak',
        name: '疾风斗篷',
        category: 'trigger',
        rarity: 'uncommon',
        desc: '翻滚闪避结束后 1.5 秒内移动速度 +25%',
        effect: { rollSpeedBuff: { moveSpeedMult: 1.25, duration: 90 } },
    },
    // 深渊回响：敌人坠坑坠杀时回血，与巨人腰带/反应装甲的击退坠坑联动。
    abyss_echo: {
        id: 'abyss_echo',
        name: '深渊回响',
        category: 'trigger',
        rarity: 'uncommon',
        desc: '敌人坠入坑中被坠杀时回复 4 点生命',
        effect: { pitKillHeal: 4 },
    },
    // 战意图腾：连续击杀叠加伤害层数，2.5 秒无击杀清空，鼓励贴脸速杀。
    momentum_totem: {
        id: 'momentum_totem',
        name: '战意图腾',
        category: 'trigger',
        rarity: 'rare',
        desc: '连续击杀叠加战意：每层子弹伤害 +4%（最多 6 层），2.5 秒无击杀清空',
        effect: { killMomentum: { perStack: 0.04, maxStacks: 6, duration: 150 } },
    },
    // 战鼓号角：每波出怪刷新后短暂提升开火速度，与波次系统联动（对玩家增益，区别于冷血怀表减速敌人）。
    war_horn: {
        id: 'war_horn',
        name: '战鼓号角',
        category: 'trigger',
        rarity: 'uncommon',
        desc: '每波敌人刷新后 2.5 秒内开火间隔 -25%',
        effect: { waveHaste: { fireIntervalMult: 0.75, duration: 150 } },
    },
    // 收藏家之瞳：暴击率随持有遗物数量增长，奖励堆叠遗物（与血牙冠冕暴击回血联动）。
    collector_eye: {
        id: 'collector_eye',
        name: '收藏家之瞳',
        category: 'stat',
        rarity: 'epic',
        desc: '每持有一件遗物（含自身）暴击率 +1.5%（上限 +20%）',
        effect: { collectionCrit: { perRelic: 0.015, maxBonus: 0.20 } },
    },
    // 能量护罩：周期性充能一层护罩，抵挡下一次受到的伤害（复用 mitigateDamage 挂载点，可挡敌弹）。
    energy_barrier: {
        id: 'energy_barrier',
        name: '能量护罩',
        category: 'trigger',
        rarity: 'epic',
        desc: '每 8 秒充能一层护罩，抵挡下一次受到的伤害',
        effect: { barrier: { cooldown: 480 } },
    },
};

export const RELIC_IDS = Object.keys(RELICS);
