# 稀有度与价值系统方案

## 1. 背景

当前物品系统已经具备基础可玩性，但缺少统一的经济表达：
- 武器强弱主要靠体感，缺少可视化价值锚点。
- 物品之间缺少统一的比较维度，不利于后续掉落与商店扩展。
- 稀有度是离散标签，不够细，难以在平衡期做连续调参。

本方案在不引入商店系统的前提下，先建立统一的“价值 + 稀有度”底层模型。

---

## 2. 目标

- 所有物品具备统一的 `finalValue`（真实价值）。
- 稀有度内部使用浮点数 `rarityScore`，外显等级由 `rarityScore` 计算得到。
- 价值计算采用“自动公式 + 手工调参”双通道。
- 第一阶段仅实现数据层与展示层，不改掉落和交易流程。

---

## 3. 范围（Phase 1）

### 3.1 包含
- 武器、可放置物的价值计算与字段落地。
- `rarityScore` 浮点稀有度与等级映射。
- Tooltip 显示稀有度与价值。
- 手工调参机制（系数、固定值、微调、硬锁）。

### 3.2 不包含
- 商店买卖与货币系统。
- 掉落概率重构。
- 存档格式迁移。

---

## 4. 稀有度模型（浮点驱动）

## 4.1 外显等级
- `common`（普通）
- `uncommon`（优秀）
- `rare`（稀有）
- `epic`（史诗）
- `legendary`（传说）

## 4.2 内部主数据

```text
rarityScore: number  // 0.0 ~ 100.0，允许小数
```

## 4.3 计算流程

1. 先得到 `finalValue`。
2. 将 `finalValue` 归一化为 `rarityScore`。
3. 根据 `rarityScore` 映射外显等级 `rarity`。

归一化公式（默认）：

```text
rarityScore = clamp( ln(finalValue + 1) / ln(legendaryAnchor + 1) * 100, 0, 100 )
```

默认参数：
- `legendaryAnchor = 900`

等级映射阈值（默认）：
- `[0.0, 20.0)` => `common`
- `[20.0, 40.0)` => `uncommon`
- `[40.0, 65.0)` => `rare`
- `[65.0, 85.0)` => `epic`
- `[85.0, 100.0]` => `legendary`

## 4.4 覆写优先级

```text
rarityScoreOverride > auto rarityScore > rarity 映射
```

---

## 5. 价值模型（公式 + 手工）

统一计算：

```text
autoValue = roundTo5(outputValue * functionalCoeff + functionalValue)
finalValue = lockedFinalValue ?? roundTo5(autoValue + manualDelta)
```

字段语义：
- `outputValue`: 自动计算出的核心输出价值。
- `functionalCoeff`: 功能性系数（0~N）。
- `functionalValue`: 功能性固定价值。
- `manualDelta`: 人工微调值，可正可负。
- `lockedFinalValue`: 硬锁最终价值（可选，最高优先级）。

## 5.1 武器 outputValue

定义：
- `perShot = damage * (pelletCount || 1)`
- `sustainDps = (perShot * magazineSize) / (magazineSize * fireRate / 1000 + reloadTime / 1000)`
- `outputValue = roundTo5(sustainDps * 12 + perShot * 1.8)`

功能性参数（默认）：
- `typeCoeff`:
- `rocket` +0.20
- `grenade` +0.15
- `bolt` +0.08
- `typeFlat`:
- `rocket` +80
- `grenade` +60
- `bolt` +25

```text
functionalCoeff = 1 + blastRadius * 0.002 + knockback * 0.015 + piercing * 0.12 + typeCoeff
functionalValue = roundTo5(blastRadius * 0.5 + knockback * 3 + piercing * 35 + typeFlat)
```

## 5.2 可放置物 outputValue

定义：
- `durability = HP`（地毯类为 0）
- `footprint = sum(hitbox.width * hitbox.height)`（多碰撞盒求和）
- `outputValue = roundTo5(durability * 0.9 + footprint / 40)`

默认功能性分组：
- `wall / wall_h / wall_v / door_h / door_v`: `functionalCoeff=1.15`, `functionalValue=40`
- `explosive_barrel`: `functionalCoeff=1.20`, `functionalValue=30`
- 家具类: `functionalCoeff=1.05`, `functionalValue=15`
- 地毯类: `functionalCoeff=0.90`, `functionalValue=10`
- 其他: `functionalCoeff=1.00`, `functionalValue=0`

---

## 6. 数据结构改造

目标文件：`src/core/systems/InventorySystem.js`

`ItemDefinition` 扩展建议：

```js
{
  id: string,
  type: 'weapon' | 'placeable',
  name: string,
  icon: string,
  maxStack: number,
  data: object,
  rarityScore: number,           // 0.0 ~ 100.0
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
  outputValue: number,
  functionalCoeff: number,
  functionalValue: number,
  autoValue: number,
  manualDelta: number,
  lockedFinalValue?: number,
  finalValue: number,
  tuningSource: 'auto' | 'semi_manual' | 'manual_lock',
  valueBreakdown?: object
}
```

新增模块：
- `src/core/economy/RarityConfig.js`
- `src/core/economy/ValueCalculator.js`
- `src/core/economy/ManualValueTuning.js`

---

## 7. 当前数值基线（现状）

> 用于对比系统接入前后变化。

## 7.1 武器配置（WeaponData）

| weaponConfigId | 名称 | fireRate(ms) | damage | pelletCount | spread | magazine | reserve | reload(ms) | bulletType | blastRadius | knockback | piercing |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|
| default_rifle | Assault Rifle | 150 | 10 | 1 | 0 | 30 | 120 | 2000 | standard | 0 | 0 | 0 |
| default_pistol | Pistol | 400 | 25 | 1 | 0 | 12 | 60 | 1500 | standard | 0 | 0 | 0 |
| rocket_launcher | RPG-7 | 1500 | 30 | 1 | 0 | 1 | 10 | 3000 | rocket | 96 | 12 | 0 |
| shotgun | Shotgun | 800 | 8 | 6 | 25 | 6 | 36 | 2500 | standard | 0 | 0 | 0 |
| smg | SMG | 80 | 6 | 1 | 0 | 40 | 200 | 1800 | standard | 0 | 0 | 0 |
| sniper | Sniper Rifle | 1200 | 80 | 1 | 0 | 5 | 25 | 3000 | standard | 0 | 0 | 1 |
| crossbow | Crossbow | 1000 | 45 | 1 | 0 | 1 | 20 | 1500 | bolt | 0 | 0 | 0 |
| grenade_launcher | Grenade Launcher | 1000 | 20 | 1 | 0 | 1 | 15 | 2000 | grenade | 64 | 8 | 0 |
| hammer | Hammer | 0 | 0 | 0 | 0 | 0 | 0 | 0 | - | 0 | 0 | 0 |

## 7.2 武器物品定义（Inventory）

| itemId | type | maxStack | weaponConfigId |
|---|---|---:|---|
| weapon:rifle | weapon | 1 | default_rifle |
| weapon:rocket_launcher | weapon | 1 | rocket_launcher |
| weapon:pistol | weapon | 1 | default_pistol |
| weapon:smg | weapon | 1 | smg |
| weapon:shotgun | weapon | 1 | shotgun |
| weapon:sniper | weapon | 1 | sniper |
| weapon:crossbow | weapon | 1 | crossbow |
| weapon:grenade_launcher | weapon | 1 | grenade_launcher |

## 7.3 可放置物基线

| itemId | breakableType | maxStack | HP | hitbox(offsetX,offsetY,w,h) |
|---|---|---:|---:|---|
| placeable:door_h | door_h | 64 | 50 | (0,10,32,12) |
| placeable:door_v | door_v | 64 | 50 | (10,0,12,32) |
| placeable:box | box | 64 | 30 | (4,20,24,10) |
| placeable:barrel | barrel | 64 | 40 | (6,20,20,10) |
| placeable:vase | vase | 64 | 10 | (8,22,16,8) |
| placeable:explosive_barrel | explosive_barrel | 64 | 20 | (6,20,20,10) |
| placeable:wall | wall | 64 | 100 | 初始(0,0,32,32)，运行期可变 |
| placeable:wall_h | wall_h | 64 | 100 | (0,10,32,12) |
| placeable:wall_v | wall_v | 64 | 100 | (10,0,12,32) |
| placeable:bed | bed | 64 | 50 | (3,-10,26,40) |
| placeable:bed_h | bed_h | 64 | 50 | (2,3,44,26) |
| placeable:nightstand | nightstand | 64 | 30 | (8,16,16,16) |
| placeable:wardrobe | wardrobe | 64 | 80 | (0,8,32,24) |
| placeable:table | table | 64 | 40 | (1,12,30,20) |
| placeable:sofa | sofa | 64 | 60 | (2,12,44,20) |
| placeable:bookshelf | bookshelf | 64 | 60 | (0,16,32,16) |
| placeable:tv_stand | tv_stand | 64 | 40 | (0,16,40,16) |
| placeable:carpet_rug_large | carpet_rug_large | 64 | - | 使用贴图尺寸 |
| placeable:carpet_rug_round | carpet_rug_round | 64 | - | 使用贴图尺寸 |
| placeable:carpet_doormat | carpet_doormat | 64 | - | 使用贴图尺寸 |
| placeable:carpet_tutorial_r | carpet_tutorial_r | 64 | - | 使用贴图尺寸 |
| placeable:carpet_tutorial_b | carpet_tutorial_b | 64 | - | 使用贴图尺寸 |
| placeable:carpet_tutorial_e | carpet_tutorial_e | 64 | - | 使用贴图尺寸 |

---

## 8. 实施步骤

1. 新增 `RarityConfig.js`：分数范围、映射阈值、展示色。
2. 新增 `ValueCalculator.js`：武器/可放置物 outputValue 与 autoValue。
3. 新增 `ManualValueTuning.js`：手工调参与硬锁配置。
4. 改造 `InventorySystem` 注册逻辑，写入新字段。
5. 计算顺序固定为：`outputValue -> autoValue -> finalValue -> rarityScore -> rarity`。
6. 改造 UI Tooltip，展示 `rarity` 与 `finalValue`（可选显示 `rarityScore`）。
7. 兼容旧数据：字段缺失时使用默认值回退。

---

## 9. 验收标准

- 每个物品都有 `finalValue` 与浮点 `rarityScore`。
- 稀有度等级由 `rarityScore` 映射，非硬编码写死。
- 武器与可放置物价值有分层，且可通过手工参数稳定调节。
- 不影响现有拾取、背包、建造流程。

---

## 10. 风险与后续

风险：
- 手工覆写过多会抬高维护成本。
- `legendaryAnchor` 与阈值若设置不当会导致分档挤压。

后续：
- 接入掉落权重（优先读取 `rarityScore`）。
- 接入商店买卖与货币。
- 支持调参配置热更新与数据导出校验。

