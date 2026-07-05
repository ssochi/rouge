# 地牢玩法深度批次 —— 老虎机 / 异形房间与机关 / 机制遗物 / 机制敌人 / 小地图

> 状态：已完成并验收（2026-07-05）——五路全部交付：老虎机 / 机关+12 异形模板 / 12 机制遗物 / 4 机制敌人 / 小地图+大地图。全量 vitest 309 例 + build 绿。
> 目标：在「深渊监狱」三层故事化房间的基础上继续加深玩法密度——对标独立游戏（以撒、挺进地牢）的"每个房间都可能有惊喜"。

## 五个工作流

### 1. 老虎机（gamble-machine）
- 新交互实体 `SlotMachine`：投币（金币）→ 滚轮动画 → 加权结果表（空奖/小额返还/金币大奖/钥匙/medkit/武器/遗物稀有大奖/爆炸惩罚）。
- 每台机器随机 3-8 次耐久，耗尽后爆机（最后一次必出中奖以上）。
- 放置：商店房固定 1 台；每层随机 1-2 个战斗房角落（清房后可用）。
- 接线：PlayerSystem E 键交互链插入 `tryUseSlotMachine`；价格/概率进 EconomyConfig。

### 2. 房间形状与机关（room-depth）
- 每层新增 4 个异形模板，主打新轮廓：环形回廊、S 型、哑铃双厅、T 形、大对角雕刻（`#` 成块雕刻，连通性测试必须过）。
- 新机关物件（≥2 种做扎实）：
  - **尖刺陷阱**：周期弹出/收回，弹出时踩上扣血——加入模板 legend。
  - **奖励笼+拉杆**：房内铁笼锁着宝箱，清房后拉杆开笼。
  - （可选）诱饵雕像：击破随机掉金币或小爆炸。
- 机关需要每帧 update 与玩家判定——由 agent 调研现有物件/实体更新路径后选型。

**实现（room-depth 已完成）**：机关走 `BreakableObject` 管线（`Game.update` 每帧近相机门控 `obj.update(player)` + `def.update/interact/draw`），逻辑集中 `entities/objects/DungeonTrapObjects.js`，美术 4 文件 `assets/objects/dungeon/Dungeon{SpikeTrap,RewardCage,CageLever,DecoyStatue}Sprite.js`。
- 尖刺陷阱 `spike_trap`：`spikePhase` 三态周期（收回 2s/预警 0.5s/弹出 1s，相位按 x·7+y·13 哈希错开），弹出态对压在中央刺区的玩家+敌人各扣 8 血（本轮一次天然无敌帧，翻滚/驾驶免疫）+ 背向轻击退；`hitbox=0` 不挡移动、`getHurtboxes()=[]` 子弹穿过、`isLocked` 不可破坏。**敌人同样受刺**（可把敌人引上尖刺，走位博弈）。
- 奖励笼 `reward_cage` + 拉杆 `cage_lever`：清怪读 `DungeonManager.getRoomAt(x,y).state==='cleared'`；拉杆清怪前返回 false 显示“先清怪”，清怪后 `openCage` 撤笼碰撞/受击框 + 生成真实 `Chest`(iron) + 掷保底金币。机关经 `WorldSystem.initDungeonMap` decor 循环注入 `obj.worldSystem`。
- 诱饵雕像 `decoy_statue`：可击破，`WorldSystem._onBreakableBroken` 70% 金币 / 30% 小爆炸。
- 12 异形模板追加 `encounters/f{1,2,3}_*.js`（S 蛇道/哑铃双厅/环形回廊/T 形/对角大三角/回字嵌套 各 2），≥6 用机关。单测 `tests/dungeon-trap-objects.test.js`（尖刺周期 + 拉杆清房门控）。

### 3. 机制遗物（relic-maker-3）——已完成（34 → 46）
- 新增 12 个机制型遗物（禁纯数值乘区），全部落地：
  幽灵弹头（每第 7 发穿墙穿敌 ×2 蓝光）、金币护盾（受击散 5 金护体免伤 CD3s）、血肉契约（商店以 HP 补差额）、
  命运骰子（每进新房随机临时增益离房失效）、磁暴线圈（静止蓄能每 0.8s 放电 12）、环绕护刃（绕身旋转碰敌 10 伤）、
  收割回响（击杀 12% 尸体迸发 3 道追魂弹）、时间沙漏（出怪冻结新敌 2s）、保险柜（每局一次死亡半血复活保金币）、
  弹壳回收（击杀 20% 返还 1 发弹匣）、末日怀表（每 8s 下一发必暴击）、深渊之契（献祭一遗物换全能强化）。
- 收割回响以“亡魂弹迸发（复用 bullets）”实现（等价特色，免新建友军 AI 实体）。
- 新挂载点：`onRoomEnter`（命运骰子）/`tryRevive`（保险柜）/`tryBloodPactPurchase`（血肉契约）/`orbitBladeCanHit`（环绕护刃）；
  副作用回调 8 个（散币/放电/亡魂弹/返弹/复活/血契/掷骰/献祭）经 `setXxxHandler` 注入，RelicSystem 保持纯逻辑。
- 消费方接线（均 `[depth-batch:relics]` 锚点）：Game（handlers + 死亡复活 + 环绕护刃结算 + renderer.relicSystem）、
  DungeonManager（房间切换 onRoomEnter）、ShopItem（血肉契约）、Renderer（幽灵蓝光 + 护刃绘制）、UIManager（保险柜灰化）。
- 12×12 图标进 RelicIcons.js；LootTable `pickRelic` 自动入池（读 `RELIC_IDS`，无需改动，已验证）。
- 测试：`relic-data.test.js`（计数/稀有度/机制型断言）+ `relic-system.test.js`（+14 机制单测，rng 注入）；`npm test` + `npm run build` 全绿。
- 实机自查：环绕护刃/磁暴线圈/幽灵弹头三视觉型遗物均已注入并截图确认。

### 4. 机制敌人（enemy-mechanics）✅ 已完成
四个新敌人，机制优先（全套美术管线：Generator + Idle/Run/Attack，32×32 朝左，PixelDraw）：
- **盗宝地精 loot_goblin**：追着玩家偷金币，偷到或倒计时结束遁地跑路；击杀掉双倍所偷+奖励。
- **掘地虫 burrower**：潜地无敌接近（地表隆起提示），破土 AoE 攻击，露头窗口才能打。
- **电弧双子 arc_twin**：成对生成，两者之间拉一道伤害电弧封走位；杀掉一只，另一只狂暴。
- **复生亡灵 revenant**：第一次"死亡"留尸 3s 后原地复活（半血），必须补刀尸体或打第二次。
- HP ≥ 26（手枪两枪标准）；入 FloorConfigs 深度池与 roleMap 合适档位。

#### 实现说明（各自状态机要点）
- **盗宝地精 `LootGoblin`**（HP30/速2.4）：`chase`（贴身）↔`flee`（得手后逃窜 1.1s）循环；碰触半径 24 且冷却就绪时 `_trySteal(runState)` 抽 3-6（不超现有金币）扣 `dungeonRunState.coins` 并累加 `stolenCoins`。`stolenCoins≥10` 或存活 15s 触发 `burrow`（下沉裁剪动画 + 土堆 + 泥屑粒子），到点置 `escaped=true`。死亡金币由实体 `getDungeonCoinValue()=stolenCoins*2+5` 覆盖；`escaped` 逃走者在 WorldSystem 死亡清扫处直接移除（无掉落/onKill）。
- **掘地虫 `Burrower`**（HP45）：`submerged`(150f 无敌追踪，`getBulletHurtbox()`→null + `takeDamage` 吞伤，`_enterPhase('submerged')` 清空 frozen/slow/burn/poison/bleed/needle 免疫控制，地表隆起土痕)→`warning`(36f 破土预警圈)→`exposed`(120f 可打窗口，入场触发一次 `combatSystem.spawnGroundSlam` 半径50/12伤仅打玩家+可破坏物，前 14f 播破土爆发帧)。
- **电弧双子 `ArcTwin`**（HP28×2）：`WorldSystem._spawnArcTwinPartner` 在主体附近 4-8 tiles 生成伴生体并 `setTwinIdentity(0/1)` 互链（蓝/紫）。仅 master(index0) 在双子俱在且间距≤12tiles 时每 30f 判电弧伤（玩家中心到双子线段距离≤15px 判 8 伤），`_drawArc` 绘抖动折线闪电。移动绕到"伴生体→玩家"延长线对侧夹击，间距>10tiles 优先靠拢重连；伴生体死亡 → `twin=null`+`_enrage`（速×1.4、接触 CD×0.7、红化叠加）。**count 语义：池中每 1 个 arc_twin 计数 = 生成一对（2 只）。**
- **复生亡灵 `Revenant`**（HP40 近战）：`takeDamage` 首次致死置 `hp=1`（保持>0 使 WorldSystem 死亡清扫跳过掉落/onKill）并进入尸体（`corpseTimer=180`、`corpseHp=15`）。尸体阶段伤害走 `corpseHp`，打碎则 `hp=0` 真死；未打碎超时 `_revive()` 半血(20)+速×1.2+黑雾粒子+眼火转红，`hasRevived` 保证仅一次，复活后再死为正常真死。

#### 入池位置与权重（`FloorConfigs.js`）
- loot_goblin：F1/F2/F3 全部 shallow/mid/deep 权重 0.5（惊喜怪）。
- burrower：F2 mid/deep、F3 mid/deep 权重 1.5；进 F2/F3 `roleMap.m`。
- arc_twin：F2 mid/deep、F3 mid/deep 权重 1.0（每计数一对）；**不进模板 roleMap**（成对逻辑与固定点位冲突，只走 depthTiers）。
- revenant：F1 deep 权重 2、F2 全档权重 2；进 F1/F2 `roleMap.m`。
- 金币值 `EconomyConfig.ENEMY_COIN_VALUES`：burrower 5 / arc_twin 3 / revenant 4 / loot_goblin 2（实测由 `getDungeonCoinValue` 覆盖）。

#### 改动文件清单
- 新增实体：`src/core/entities/{LootGoblin,Burrower,ArcTwin,Revenant}.js`。
- 新增美术目录：`src/assets/characters/enemies/{loot_goblin,burrower,arc_twin,revenant}/`（各 Generator + Idle/Run/Attack；arc_twin 蓝紫双色帧、revenant 常态/复活眼红双色帧）。
- 共享插入（`[depth-batch:enemies]` 锚点）：`graphics/Assets.js`（帧注册）、`systems/WorldSystem.js`（类型映射 + 成对生成 + 死亡清扫 escaped 跳过/金币覆盖）、`dungeon/EconomyConfig.js`（金币值）。独占：`dungeon/FloorConfigs.js`（池 + roleMap）。
- 测试：`tests/depth-batch-enemies.test.js`（13 例）+ `tests/helpers/canvasStub.js`（无头 Canvas 桩）；`tests/encounter-templates.test.js` 已知敌人清单补 4 类型。

#### 测试与自查
- `npm test` 全绿（309 例，含新增 13 例：偷钱/掉落翻倍/遁走、复活一次/补刀、双子狂暴/电弧命中/断弧、掘地虫无敌/完整循环/免疫控制）；`npm run build` 通过。
- 美术预览：`scratchpad/unit_{loot_goblin,burrower,arc_twin,revenant}.png`（每单位 Idle/Run/Attack 帧网格）。
- 实机截图：`scratchpad/ingame_depth_A.png`（双子电弧扫玩家 + 地精偷钱 80→74 + 亡灵近身）、`ingame_depth_B.png`（电弧秒杀站桩玩家，地精偷满 10 遁走）、`ingame_burrower_emerge.png`（双掘地虫破土露头 + AoE 扣血）。
- 已知限制：arc_twin 精英词缀只作用于主体、伴生体不自动同步为精英；掘地虫潜地经过坑洞时仍可能被坠坑判定；成对生成在极窄房间可能退化为任意可用出生点（伴生体可能较远）。

### 5. 小地图优化（minimap-polish）✅ 已完成
- 走廊连线改正交折线（L 形），不再斜穿。
- 房间图标强化（Boss 骷髅像素图标等）、楼层标签（F1 监狱层…）、探索度 n/m。
- **全屏大地图**：Tab 键开关（Input.js 注册），整层已探索布局+图例；移动端点小地图展开。

**落地说明**：
- 走廊采用**真实门位几何**：`DungeonManager.getMinimapData` 用 `_closestEdgePoints`（复刻生成器 `closestEdgePoints`）从两房矩形推出真实门位，`layout.corridors` 的 tile 判定 L 形拐弯朝向，每层缓存一次 `path`；小/大地图共用 `Renderer._renderDungeonMap` 沿折线绘制，缺失时回退房心正交肘线。
- 图标：`_drawRoomIcon` 手绘骷髅/宝箱/金币/四角星，尺寸随房块自适应，过小回退字符。信息条：面板底部楼层名 + 探索度。当前房白色呼吸脉冲（区分锁门橙脉冲）。
- 大地图状态位 `input.bigMapOpen`：桌面 `Game.update` 边沿检测 `keys.tab`（`keydown` preventDefault 防焦点），移动端 `MobileControls._bindMinimapTap` 点右上小地图区切换、开图后点非操作区关闭；游戏不暂停，玩家仍可移动/射击。
- 附带修复：`peace=1` 布景模式下进房也标记 `visited`，便于走图/截图自查。
- 改动文件：`Input.js`、`Game.js`、`DungeonManager.js`（getMinimapData + 走廊几何 + visited）、`Renderer.js`（小地图区 + 大地图）、`MobileControls.js`（tap 接入）。

## 文件分区与冲突纪律

| Agent | 独占 | 共享（小幅锚定插入） |
|---|---|---|
| gamble-machine | entities/SlotMachine.js、assets/objects/dungeon/SlotMachine*、EconomyConfig 赌博段 | PlayerSystem、DungeonManager 放置、Assets、WorldSystem |
| room-depth | encounters/f1/f2/f3（追加）、新机关物件文件 | Assets、ObjectRegistry、DungeonManager |
| relic-maker-3 | RelicData、RelicIcons、RelicSystem | BulletSystem、WorldSystem、Game、DungeonManager |
| enemy-mechanics | 新实体×4、assets/characters/enemies/×4、FloorConfigs | WorldSystem 类型映射、Assets |
| minimap-polish | Renderer 小地图区、getMinimapData、Input Tab 键 | MobileControls |

- 共享文件：只做局部插入并带 `[depth-batch:<agent>]` 注释锚点；Edit 失配就重新 Read。
- 全员：禁 git 操作；vitest + `npm run build` 全绿；完成报告列改动文件与自测证据（截图）。
