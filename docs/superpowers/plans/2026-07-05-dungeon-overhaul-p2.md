# 地牢重构 P2 实施计划 — 遗物系统

> 主会话直接实现（用户指定不派发）。每任务 `npm test` + `npm run build` 必过后提交。
> 依赖：P1 经济骨架（DungeonRunState / LootTable / Chest / DungeonPickup 均已就绪）。

**Goal:** 18 个遗物（属性 6 / 弹道 7 / 触发 5）+ RelicSystem 三挂载点 + 获取链（宝箱/Boss）+ HUD 遗物栏与拾取 toast。

## 遗物清单（数值为初值，P6 统一调）

| id | 类 | 名称 | 效果 |
|---|---|---|---|
| swift_boots | stat | 疾行之靴 | 移速 +15% |
| rapid_gloves | stat | 速射手套 | 开火间隔 ×0.8 |
| power_core | stat | 力量核心 | 子弹伤害 +15% |
| vital_heart | stat | 生命之心 | maxHp +25（拾取时同步回血，退局回退） |
| magnet_ring | stat | 磁力指环 | 拾取磁吸半径 ×2 |
| lucky_dice | stat | 幸运骰子 | 暴击率 +10%（暴击 ×2 伤害） |
| ember_rounds | ballistic | 余烬弹头 | 子弹附燃烧 DOT（2/180f） |
| frost_rounds | ballistic | 霜寒弹头 | 子弹附冰冻叠层（复用 ice_shard 机制） |
| piercing_tip | ballistic | 穿甲尖端 | 穿透 +1 |
| rubber_shell | ballistic | 弹性外壳 | 碰墙弹射 +1 |
| blast_powder | ballistic | 爆裂火药 | 击杀敌人产生小爆炸（radius 40, dmg 15） |
| split_chamber | ballistic | 分裂弹膛 | 弹丸 +1，全弹丸伤害 ×0.8 |
| heavy_caliber | ballistic | 重型口径 | 弹丸体积 +50%，伤害 +5% |
| reactive_plate | trigger | 反应装甲 | 受击释放击退冲击波（CD 180f） |
| leech_fang | trigger | 汲血獠牙 | 杀敌 10% 概率回 2 HP |
| berserker_totem | trigger | 狂战图腾 | HP<30% 时伤害 +30%、开火间隔 ×0.8 |
| golden_idol | trigger | 黄金神像 | 清房金币 ×2 |
| treasure_scope | trigger | 寻宝透镜 | 开箱 20% 概率双倍产出 |

## 挂载点（已核实的代码位置）

- 开火间隔：`CombatSystem.tryShoot` `const FIRE_RATE = weapon.fireRate || 150` → ×`relicSystem.fireIntervalMult()`
- 弹丸数/弹道注入：`CombatSystem._pushWeaponProjectiles`（玩家/敌人统一漏斗）——`source==='player'` 时 pellets += extraPellets()，push 前 `modifyPlayerBullet(bullet)`（伤害乘区/暴击 roll/burn/freeze/pierce/bounce/size）
- 燃烧命中泛化：`BulletSystem` 命中块 `b.type === 'flame' && b.burnDamage` → `b.burnDamage`；冰冻 `b.type === 'ice_shard'` → `|| b.applyFreezeStack`；弹射 `bounceCount` 已为通用字段（ricochet 类型判断需核对墙反弹处）
- 移速：`PlayerSystem` :395-397 有效速度返回处 ×`moveSpeedMult()`
- 磁吸半径：`WorldSystem.updatePickups` 计算 mult 传入 `pickup.update`
- 击杀事件：`WorldSystem.updateEnemies` 死亡清扫块（已有地牢金币逻辑处）→ `relicSystem.onKill(x, y)`
- 受击事件：`Game.js:99` `player.hp -= amount` 处 → `relicSystem.onPlayerHit()`（冲击波需 enemies/particles 引用）
- 清房金币：`DungeonManager._dropRoomRewards` 金币数 ×`roomClearCoinMult()`
- 开箱：`Chest.tryOpen` → `relicSystem.chestDoubleRoll()` 为 true 时产出双份
- 获取：`rollChest` 扩展 relicChance（wood 0.10/iron 0.25/mithril 0.45/dragon 0.55），返回 `{kind:'weapon'|'relic', ...}`，排除已持有；Boss 保底箱必出遗物（未全收集时）
- 拾取：`DroppedItem` 支持 `relic:<id>`（名称/图标）；`PlayerSystem.tryPickupWeapon` 前置分支 → `relicSystem.addRelic` + toast，不入背包
- 清算：`RelicSystem` 以 `runState.relicIds` 为唯一事实源；`runState.end()` 后效果自动消失，maxHp 增量由 RelicSystem 记账回退

## 任务分解

- T11 RelicData + 图标（`src/assets/relics/RelicData.js` + `RelicIcons.js`，18 图标 12×12）+ schema 测试
- T12 RelicSystem 纯逻辑（乘区聚合/条件狂暴/CD/记账回退）+ 测试
- T13 战斗与移动挂载（fire rate/pellets/modifyPlayerBullet/BulletSystem 泛化/移速/磁吸）
- T14 获取链（rollChest 扩展+测试 / DroppedItem relic 类型 / 拾取分支 / Boss 保底）
- T15 事件挂载（onKill/onPlayerHit/清房金币/开箱双倍）+ HUD 遗物栏 + 拾取 toast
- T16 收尾（TECH_OVERVIEW/方案文档更新、全量验证）
