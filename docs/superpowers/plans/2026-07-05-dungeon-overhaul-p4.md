# 地牢重构 P4：敌人重构 实施计划

> 执行模式：主会话亲写代码（用户指定），vitest + `npm run build` 必跑，分支 feature/dungeon-overhaul。
> 依据：docs/feature/DUNGEON_ROGUELIKE_OVERHAUL.md §4.5。P5 已先行完成。

**目标**：战斗体验质变——6 种带独立威胁轴的新敌人、精英词缀、Boss 共享抽象与机械巨蛇正式接入、3 层数据驱动配置。

**关键现状（调研结论）**
- `Enemy` 基类：移动/击退/碰撞/hurtbox；update 注入 (player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver)。
- 远程敌人（Hunter/Soldier）走 EnemyWeaponController+EnemyHandSystem 开真实武器；Boss 弹幕走 `CombatSystem.spawnEnemyBullet({x,y,angle,damage,speed,color,size,life,type})`（source:'enemy'）——**新敌人弹幕用后者**，不依赖武器系统。
- 工厂：`WorldSystem._createEnemyByType`；死亡掉落链按 `spawnType` 查 `ENEMY_COIN_VALUES`。
- 美术管线：`<Type>Generator`（调色板+`generateFrame(pose)`）→ Idle/Run/Attack 帧文件 → `Assets.js` 注册 → 实体 draw 取 `Assets.<type>.idle/run`，32×32 默认朝左，`facingRight` 翻转。
- Boss 现状：MutantBeast 3 相位 / MechaGolem 2 相位（7 弹幕模式）/ SnakeBoss 3 阶段（`initSegments(worldSystem)` 将 SnakeSegment 推进 enemies，`isSegment` 不掉落）。相位状态机三家雷同、各自手写。
- 接触伤害：僵尸系 `this.damage` 直接 `player.takeDamage`。

---

## 任务分解

### T1 FloorConfigs 数据驱动 + 数值缩放
- Create `src/core/dungeon/FloorConfigs.js`：每层 {深度分层敌人池（薄/中/深 types+count 范围）、eliteSquad、boss 编成、hpMult、dmgMult、精英预算 eliteChance/词缀数}。F1 ×1.0 / F2 ×1.3 / F3 ×1.6。
- `DungeonLayoutGenerator.computeEnemyConfig*` 三函数改读 FloorConfigs（对外形状不变：{types, count}）。
- 缩放应用：`DungeonManager._spawnRoomEnemies` 生成后 `enemy.hp/maxHp ×= hpMult`、`enemy.damage ×= dmgMult`（接触伤害）、`enemy.damageMult = dmgMult`（弹幕伤害乘区，`spawnEnemyBullet` 调用处传入或敌人自算）。
- Tests：三层配置完备性 + 缩放单调 + computeEnemyConfig 走查（更新 dungeon-layout 测试）。

### T2 行为组件层（src/core/entities/behaviors/）
- `ChaseBehavior`（流场追击，抽 Hunter.moveTowards 逻辑通用化）
- `KiteBehavior`（距离带 [near, far] 维持：太近退、太远进，横向漂移）
- `StrafeBehavior`（垂直于玩家连线横移，周期换向）
- `RangedPatternBehavior`（弹幕模式库：`fan`（扇形散射）/`ring`（环形爆发）/`aimed_burst`（瞄准连发），数据配置 {count, spread, speed, damage, color, size, interval, cooldown}，驱动 spawnEnemyBullet）
- `SummonBehavior`（周期召唤，上限控制，召唤物注册进房间跟踪）
- `TelegraphedChargeBehavior`（预警线 telegraphTimer → 冲锋 dash → 恢复）
- 组件接口：`update(ctx)`，ctx = {enemy, player, combatSystem, moveResolver, getFlowDirection, getNavDirection, wallQuery, walls}。实体持组件实例组合调用。
- Tests：弹幕角度序列（fan/ring 数学）、Kite 距离带决策纯逻辑。

### T3 新敌人：弹幕法师 Warlock + 自爆蜂 Boomer
- **Warlock**（HP 30/速 0.9）：Kite(160~260) + RangedPattern（环形 12 发 / 扇形 5 发交替）+ 短距传送（受击累积后闪现 80~140px，粒子）。美术：紫袍法师，Generator+Idle16/Run12/Attack8。
- **Boomer**（HP 18/速 2.2）：高速 Chase + 近身预警自爆（0.6s 膨胀闪烁红光 → 半径 70 爆炸 `spawnExplosion`；被打死提前引爆但半径减半）。美术：绿胖爆虫。
- 注册：工厂、Assets、`ENEMY_COIN_VALUES`（warlock 6 / boomer 3）、FloorConfigs 敌人池接入（F1 深层+F2/F3）。

### T4 新敌人：召唤师 Summoner + 盾卫 Shieldbearer
- **Summoner**（HP 35/速 0.8）：Kite(200~300) + Summon（每 5s 召 2 只 zombie，场上召唤物上限 4；召唤动画帧）。召唤物入房间 enemies 跟踪（经 worldSystem.dungeonManager 当前激活房）。美术：骨袍萨满。
- **Shieldbearer**（HP 60/速 0.55）：慢速 Chase + 正面盾牌：来自前方 ±60° 的子弹伤害减 90%（`takeDamage` 覆盖，依据弹向与朝向夹角；玩家绕背打弱点）。接触伤害中等。美术：塔盾重甲兵（盾面朝向随 facing）。
- 注册同 T3（summoner 6 / shieldbearer 5）。

### T5 新敌人：哨戒炮 Sentry + 投弹手 Lobber
- **Sentry**（HP 45/固定）：不移动（speed 0，无 Run 动画）；索敌 → 蓄力 1s（炮管发光）→ 持续弹流 2.5s（aimed_burst 高频低伤）→ 冷却。美术：三脚机械炮塔（机械体、Idle 旋转扫描+Attack 帧）。
- **Lobber**（HP 28/速 1.0）：Kite(180~280) + 抛物线榴弹：落点预警圈（红圈收缩 0.8s）→ 爆炸（`spawnExplosion` 半径 60）。弹体用抛物线视觉（缩放模拟高度）。美术：背桶掷弹兵。
- 注册同 T3（sentry 5 / lobber 5）。

### T6 精英词缀系统（src/core/dungeon/EnemyAffixSystem.js）
- 词缀定义（数据）：迅捷（移速+40%）/ 坚韧（护盾=maxHp×0.5，破盾前受伤×0.5）/ 灼热（接触附燃烧+死亡留火圈 3s）/ 裂魂（死亡 8 向弹幕）/ 再生（3s 未受击每秒回 2%）。
- `applyAffixes(enemy, affixIds, worldSystem)`：包装 takeDamage/update 钩子 + `isElite`、`eliteScale=1.15`、词缀名列表。
- 视觉：Renderer 对 `eliteScale` 敌人围绕自身缩放绘制 + 脚下词缀色光环 + 头顶词缀名（7px）。
- 掉落：`updateEnemies` 死亡分支 isElite → 金币 ×3 + 30% 钥匙。
- 生成：FloorConfigs eliteChance（普通战斗房每只怪概率成精英，词缀随机 1-2 个）+ 精英房保底全员 1 词缀。挂 `DungeonManager._spawnRoomEnemies`。
- Tests：词缀应用数值断言（速度/护盾/回血计时逻辑）。

### T7 BossPhaseController 抽取 + 三 Boss 迁移
- Create `src/core/entities/bosses/BossPhaseController.js`：{phases: [{hpRatio, onEnter}], attacks: [{id, weight, cooldown, minPhase, condition}]}——相位阈值检测、招式加权抽取与冷却状态机。
- MutantBeast / MechaGolem / SnakeBoss 迁移：保留各自招式执行函数，用控制器管 phase 切换与招式选择。对外行为不变（相位阈值/权重照抄现值）。
- Tests：控制器纯逻辑（相位切换、冷却、加权选择、minPhase 过滤）。

### T8 机械巨蛇接入 F2 正式流程
- FloorConfigs：F2 boss → `snake_boss`（F3 保持 mecha_golem，符合最终规划 F1 巨兽→F2 巨蛇→F3 魔偶）。
- 确认 DungeonManager 房间跟踪兼容：SnakeSegment 死亡不触发掉落（isSegment 已处理）；房间 enemies 集合含 segments 时清房判定以 boss 本体为准（segments 随 boss 死亡消散——核实 SnakeBoss 死亡链）。
- Boss 房尺寸校验（16~20 tile 是否够蛇活动，必要时 F2 boss 房下限上调）。

### T9 文档 + 全量验证
- TECH_OVERVIEW（敌人清单/行为组件/词缀/Boss 控制器/FloorConfigs）、方案文档 P4 ✅。
- vitest 全绿 + build + 台账。

## 顺序
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9。每任务一提交。

## 风险
- 美术量：6 套 Generator 是最大工时项；Sentry 为机械体免 Run 减量。
- 召唤物与房间清除：召唤物必须入当前激活房 enemies 集合，否则清房判定失效（Summoner 全灭后遗留召唤物需一并计入）。
- 盾卫方向判定：以子弹速度向量 vs 敌人朝向夹角计算，避免依赖玩家位置（穿透/弹射弹正确处理）。
- Boss 迁移回归：招式执行函数不动，仅换调度器；现值照抄。
