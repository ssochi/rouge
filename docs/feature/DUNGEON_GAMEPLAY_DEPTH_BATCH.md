# 地牢玩法深度批次 —— 老虎机 / 异形房间与机关 / 机制遗物 / 机制敌人 / 小地图

> 状态：进行中（5 个并行 agent）
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

### 3. 机制遗物（relic-maker-3）
- 新增 12 个遗物（34 → 46），**必须是机制型**，禁止纯数值乘区。方向示例：
  幽灵子弹（每第 N 发穿墙双伤）、金币护盾（受击掉钱不掉血）、血肉契约（商店可用 HP 支付）、
  命运骰子（每进新房随机一个临时 buff）、磁暴线圈（静止蓄能放电）、环绕护刃（绕体旋转碰撞伤害）、
  收割回响（击杀概率生成短暂友军幽魂）、时间沙漏（进房敌人凝滞 2s）、保险柜（死亡保金币复活一次/局）。
- RelicSystem 需要的新挂载点（onRoomEnter / onCoinPickup / 复活等）由本 agent 增设并接线消费方。
- 12×12 图标进 RelicIcons.js；LootTable 自动入池需验证。

### 4. 机制敌人（enemy-mechanics）
四个新敌人，机制优先（全套美术管线：Generator + Idle/Run/Attack，32×32 朝左，PixelDraw）：
- **盗宝地精**：追着玩家偷金币，偷到或倒计时结束遁地跑路；击杀掉双倍所偷+奖励。
- **掘地虫**：潜地无敌接近（地表隆起提示），破土 AoE 攻击，露头窗口才能打。
- **电弧双子**：成对生成，两者之间拉一道伤害电弧封走位；杀掉一只，另一只狂暴。
- **复生亡灵**：第一次"死亡"留尸 3s 后原地复活（半血），必须补刀尸体或打第二次。
- HP ≥ 26（手枪两枪标准）；入 FloorConfigs 深度池与 roleMap 合适档位。

### 5. 小地图优化（minimap-polish）
- 走廊连线改正交折线（L 形），不再斜穿。
- 房间图标强化（Boss 骷髅像素图标等）、楼层标签（F1 监狱层…）、探索度 n/m。
- **全屏大地图**：Tab 键开关（Input.js 注册），整层已探索布局+图例；移动端点小地图展开。

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
