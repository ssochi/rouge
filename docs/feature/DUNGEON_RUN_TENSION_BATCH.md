# 一局的张力批次 —— 危机感 / 房间动词 / 成长曲线

> 状态：已完成并验收（2026-07-05）——三路全部交付：危机感行为包/三种房间动词+门口预告/遗物三选一祭坛+掉落曲线。346 例全绿。总验收三条待用户实机体验拍板。
> 背景：用户实测反馈"能过关但无聊"，三个确诊痛点：**房间重复、没有危机感、变强没感觉**（打击感未中选，音效/juice 延后）。
> 总验收标准（实测 3 个种子局）：每层 ≥1-2 次濒死时刻（HP<30）；每局能成型一套遗物 build（≥6 个遗物）；一局中出现 ≥3 种不同玩法动词的房间。

## 1. 危机感（tension-ai）

诊断：治疗太易得（清房 50% 掉消耗品+商店 15 金 medkit）、敌人行为被动（走向你/站桩射击）、精英太稀。

- **治疗紧缩**：清房消耗品掉率 50%→15%；商店 medkit 15→25 金；ROOM_CLEAR chestChance 复核。
- **侵略性行为包**（改现有敌人行为，不加新敌人）：
  - 近战怪冲刺：距玩家 100-200px 时概率蓄力 0.5s 后直线扑击（1.5 倍速），有预警姿态。给 zombie_female/hellhound/revenant 级别的敏捷近战装配。
  - 远程怪走位：射击后横向拉扯 + 与玩家保持 150-250px 距离带（太近后撤、太远逼近），弩手/教徒/士兵装配。
  - 包抄偏置：同房 ≥3 只近战时，flow field 方向加左右翼偏置让怪从两侧合围（NavigationGrid/流场消费处做向量偏转，注意性能）。
- **精英上调**：eliteChance F1 0.06→0.10 / F2 0.10→0.15 / F3 0.14→0.20；波2 与波1 间隔缩短制造喘不过气感。
- **验收**：3 个种子局实测（可截图 HP 条低谷），每层至少 1-2 次 HP<30。

> **[已交付 tension-batch:ai]** 行为包：`PounceChargeBehavior`（冲刺扑击，装 ZombieFemale/Revenant；Hellhound 沿用等价 `TelegraphedChargeBehavior`）、`FlankingBias`（包抄偏置，装 Zombie/ZombieFemale/ZombieBrute，存活近战 ≥3 时 ±25° 分翼）、远程走位（Archer/Cultist 距离带 150-250、Soldier 新增 `retreatMove`）。数值：清房消耗品掉率 50%→15%、medkit 15→25、eliteChance 0.10/0.15/0.20、增援波预警 50→32 帧。vitest 新增扑击状态机/距离带/包抄向量数学 7 例（全绿 316/316）、build 通过、balance_report 全通过。实机（seed=7）截图确认蓄力预警线、扑击命中（HP 100→82）、Soldier 后撤（96→202px）。

## 2. 房间动词（room-verbs）

诊断：60+ 模板只有一个动词"杀两波开门"，选路无意义。

三种新房型接入 DungeonManager 房间状态机（普通战斗房的约 25-30% 被替换）：

1. **生存房 survival**：进房封门后敌人小股持续涌入（每 4-6s 一小批），撑 30 秒后全灭现存敌人、掉落丰厚（HUD 倒计时）。
2. **猎杀房 hunt**：刷一只强化"目标怪"（高速逃窜、少量护卫），45 秒内击杀 → 丰厚奖励；超时目标遁地逃走，门照开但无奖励。
3. **契约房 pact**：进房不封门、中央一根契约拉杆——拉下才开战：敌人数量 +50% 且全体精英，奖励翻倍 + 保底遗物；不拉白走（无奖励无战斗）。风险自选。

- **门口预告**：房间连接门上方挂世界内类型图标（生存=沙漏/猎杀=靶/契约=手掌/精英=星/宝藏=箱），选路变成决策。图标 PixelDraw 小 sprite。
- 小地图/大地图图标同步补三种房型（Renderer 小改锚定）。

> **实现落地（room-verbs，已完成）**：状态机纯逻辑 `src/core/systems/dungeon/RoomVerbs.js`（副作用经 ctx 回调注入，`DungeonManager._buildVerbCtx` 提供真实实现）；布局分配 `DungeonLayoutGenerator.assignVerbRooms`（普通战斗房约 35% 替换、下限 3，保底同层三型同现）。门口预告 `DungeonManager.getDoorPreviews` + `Renderer._drawDoorPreviews`（绘于光照之上），sprite `assets/objects/dungeon/DoorPreviewIconSprites.js`；契约拉杆 `entities/objects/DungeonPactObjects.js` + `assets/objects/dungeon/DungeonPactLeverSprite.js`；HUD 倒计时 `Renderer.drawVerbTimerHud`；猎杀目标金环 `Renderer._drawHuntTargetMark`。单测 `tests/room-verbs.test.js` + `tests/dungeon-verb-rooms.test.js`。详见 `docs/TECH_OVERVIEW.md`「房间玩法动词」。

## 3. 成长曲线（power-curve）

诊断：一局捡不到几个遗物成不了 build，武器升级看脸，商店可买可不买。

- **遗物三选一祭坛**：新交互物 RelicAltar——三个底座各展示一个遗物（图标+名字+描述），E 选一个、其余两个消失。每层保底 1 座（宝藏房固定摆放替代裸掉落）。
- **武器升级保底**：每层清房武器掉落的稀有度权重按层数上移（F1 common/uncommon 为主 → F3 rare+ 为主，对齐 COMBAT_BALANCE_METHODOLOGY §4.3）；每层至少 1 把当层带宽武器（保底计数器）。
- **遗物获取量**：目标每局 6-8 个。盘点当前来源（宝箱 relicChance/商店/Boss/老虎机），按目标校准概率。
- **经济核算**：金币收入（清房/精英/Boss/卖出?）对商店价格，保证每层能买得起 1-2 件——让进商店有期待。

## 文件分区与冲突纪律

| Agent | 独占 | 共享（`[tension-batch:<agent>]` 锚点小幅插入） |
|---|---|---|
| tension-ai | 行为包新文件（entities/behaviors/）、FloorConfigs eliteChance | EconomyConfig、DungeonManager 波次参数、各敌人实体装配行为 |
| room-verbs | 房型逻辑新文件、门口图标 sprite | DungeonManager 房间状态机、DungeonLayoutGenerator category、Renderer/小地图图标、Assets |
| power-curve | RelicAltar 实体+sprite、保底计数逻辑 | EconomyConfig、LootTable、DungeonManager 掉落、WorldSystem 摆放、Assets |

- DungeonManager 是三方热点：room-verbs 做大改（房间状态机），其余两方只做参数行/单点插入；Edit 失配重新 Read。
- 全员：禁 git；vitest + `npm run build` 全绿；数值改动后跑 `node tools/balance_report.mjs` 确认不破坏带宽；实机截图自查；报告附证据。
