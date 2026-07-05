# 房间系统 V2 —— 分层代码化房间 + 图优先连接

> 状态：已确认（2026-07-06）——连接采用宏观网格嵌入；分期 P1 IR+适配器 → P2 构建器 → P3 连接重做 → P4 渐进迁移；人潮批次（horde-enemies/cover-templates）落地合并后开工。
>
> **P1 已交付（2026-07-06）**：`generation/rooms/RoomPlan.js`（IR + `createRoomPlan`/`validateRoomPlan`/`checkConnectivity`）+ `generation/rooms/EncounterAdapter.js`（`encounterToRoomPlan` 字符模板适配器 + `roomPlanToParsed` 旧口径视图）；`selectEncounter` 返回 RoomPlan、`placeEncounter` 只吃 RoomPlan、`parseEncounter` 降级为兼容视图（`[room-v2:p1]` 锚点）。零观感/零行为变化，三重验证守护（黄金测试 70/70 + placeEncounter 字节等价 + 全楼层 SHA-256 指纹一致，seed 7/42 × floor 1/2/3）。详见本文档末「P1 交付记录」。
> 背景：用户提出两点架构诉求——①房间设计从字符画转向"像素化分层+代码构建"（类比 PixelDraw：每个 tile 是一个像素，分地板/物件/出怪多层，形状任意自定义）；②连接算法重做（现状被评"没有逻辑，瞎连的"——属实，见下文诊断）。

## 0. 现状诊断

### 字符模板的天花板
- **单层位图**：一格一字符，地板/物件/出怪/坑挤在同一层，legend 越长越难读；
- **无参数化**：同一模板每局长得一模一样——没有种子变体、没有对称/散布/环阵等结构化表达；
- **形状受限**：矩形行+`#` 雕刻，做不出圆厅、放射对称、参数化柱阵；
- **易错**：宽度必须逐行对齐，人工数格子。

### 连接算法的病根（DungeonLayoutGenerator 实读）
BSP 撒房 → 选离中心最近的 N 间 → 房心距离建边 → 最近邻 K+短边阈值取候选 → MST → **随机**补 1-3 条环边 → 事后按 BFS 深度指派房型。问题：
1. **拓扑无意图**：主线长度、支线位置、环路走向全是几何巧合，Boss/商店/宝藏是"事后贴标签"；
2. **门位无纪律**：走廊从两房最近点出发，门可能挤同一面墙、走廊互相穿插、长短随缘；
3. **环边随机抽**：捷径毫无叙事逻辑（起点房可能直通 Boss 前厅隔壁）。

## 1. 目标架构

### 1.1 RoomPlan：分层中间表示（IR，一切后端只认它）

```js
RoomPlan {
  w, h,
  mask,      // 形状层：Uint8Array，1=房内 0=虚空 —— 任意形状（圆/L/环/多边形）
  floor,     // 地板层：per-tile FLOOR_TYPES id（0=沿用楼层默认）—— 地板本身就是一张像素画
  objects,   // 物件层：[{x, y, type, props?}]
  spawns,    // 出怪层：[{x, y, role: 'm|r|h|e', wave: 1|2}]
  pits,      // 危险层：[{x, y}]（坑；尖刺等机关走 objects）
  doorSlots, // 开门位建议：[{side: 'N|S|E|W', offset}] —— 连接算法消费，缺省=各边中点
  meta: { id, tier, weight, floors, floorType, story }
}
```

### 1.2 RoomBuilder：PixelDraw 式代码构建器（新授权前端）

```js
defineRoom('f1_arrow_court', { tier: 'mid', floors: [1], weight: 1.5 }, (R) => {
  R.shape.ellipse();                          // 圆厅（字符画做不到）
  R.floor.fill('PRISON_WET').border('PRISON_CELLBLOCK', 1);
  R.objects.ring('dungeon_pillar', { radius: 0.55, count: 6, skip: [0, 3] });  // 放射柱阵留双缺口
  R.objects.scatter('dungeon_bone_pile', { count: [2, 4] });                   // 种子驱动的每局变体
  R.spawns.wave(1).ring('r', { radius: 0.35, count: 4 });
  R.spawns.wave(2).cluster('m', { count: [5, 7], near: 'edges' });
  R.mirrorX();                                // 对称工具
});
```
- 构建时注入**种子 rng**：`count: [2,4]`、scatter 落点等每局不同——手工结构+程序化变体，这是字符画给不了的核心增益；
- 工具集：shape.rect/ellipse/carve/union、floor.fill/rect/checker/scatter、objects.place/row/ring/scatter、spawns.wave().at/ring/cluster、mirrorX/rot4。

### 1.3 字符模板适配器（存量 68 个零迁移）

`parseEncounter(rows, legend) → RoomPlan`。字符画降级为"另一种授权前端"，产物同为 RoomPlan；`placeEncounter` 重写为只消费 RoomPlan。**cover-templates agent 正在翻新的内容不白做**——内容是数据，经适配器原样进入新系统。

### 1.4 连接算法 V2：图优先 + 宏观网格嵌入（推荐）

**先规划拓扑，再落空间**（以撒/哈迪斯做法，反转现状）：
1. **拓扑规划**：主干 spine（起点 → 4-6 战斗/动词房 → Boss 前厅 → Boss）+ 支线 branch（宝藏/商店/精英/赌博挂在指定 spine 节点的侧枝，深度有设计：商店 ~60% 处、宝藏 ~40% 处）+ 至多 1 条**有意图的环**（从深处开回主干前段的捷径）；
2. **宏观网格嵌入**：楼层切成 cell 网格（如 17×13 tile/格），普通房占 1 格、Boss/大战斗房占 2×1 或 2×2；spine 沿主方向蛇形推进、支线垂直外挂——房间只在**共享格边**相邻；
3. **开门纪律**：门永远开在共享边中点（或 RoomPlan.doorSlots 指定位），走廊恒为 2-3 tile 短直段，永不交叉、永不斜穿；
4. 小地图直接受益：拓扑即视觉，主干/支线一眼可读。

## 2. 分期执行

| 期 | 内容 | 风险控制 |
|---|---|---|
| **P1 IR+适配器 ✅** | RoomPlan 定义 + encounterToRoomPlan 适配器 + placeEncounter 只吃 RoomPlan（**已交付 2026-07-06**） | 纯重构零观感变化，黄金测试 70/70 + 布局指纹一致 |
| **P2 RoomBuilder** | 构建器 API+种子变体+对称/散布工具；5 个示范房（圆厅/放射对称/参数化柱阵/巨型 2×2/环形回廊 v2） | 新旧前端并存，示范房入池验证 |
| **P3 连接 V2** | 拓扑规划器+宏观网格嵌入+开门纪律；DungeonManager/小地图适配 | 老算法留 `?layout=v1` 调试开关一个版本期 |
| **P4 存量迁移**（渐进） | 字符模板按层逐步改写为代码模板（每层翻新时顺手做） | 无 deadline，双前端长期共存也可接受 |

## 3. 决策点（待确认）

1. **连接嵌入方式**：宏观网格（以撒式，门位/走廊绝对整齐，推荐）vs 保留自由摆放只重做拓扑与门位纪律（房间位置更"有机"，但门位对齐工程量更大）；
2. **分期认可**：P1→P2→P3 顺序（先保真重构、再新能力、最后动连接）；
3. **开工时机**：等人潮批次两个 agent（horde-enemies/cover-templates）交付合并后开工——它们的施工面正是模板文件与布局生成器，并行必然打架。

## 4. P1 交付记录（2026-07-06）

### 4.1 RoomPlan 字段（`generation/rooms/RoomPlan.js`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `w, h` | int | 房间模板栅格尺寸（tile） |
| `mask` | Uint8Array(w·h) | 形状层：1=房内地板，0=虚空/内墙（字符画 `#` 挖除） |
| `floor` | Uint8Array(w·h) | 地板层：逐 tile FLOOR_TYPES id，0=沿用楼层默认（字符模板恒全 0，整房材质走 `meta.floorType`） |
| `objects` | `[{x,y,kind,type?}]` | 物件层：`kind` ∈ cover(掩体,具体件放置期随机)/decor(装饰,主题权重抽)/prop(叙事道具,type 为具体 id) |
| `spawns` | `[{x,y,role,wave}]` | 出怪层：role ∈ m/r/h/e，**wave ∈ 1\|2**（对齐 P2 `spawns.wave(1/2)` 授权 API） |
| `pits` | `[{x,y}]` | 危险层：坑 |
| `doorSlots` | `[{side,offset}]` | 开门位建议（连接算法消费，字符模板缺省=空，留给 P3） |
| `meta` | object | `{id, tier, weight, floors, floorType, story}` |

辅助：`createRoomPlan(spec)`（补齐缺省层）、`validateRoomPlan(plan)`（尺寸一致 + 坐标在 mask 内 + 连通不封死）、`checkConnectivity`（mask=0 与坑视为阻挡的 BFS，复用现有测试思想）、`maskToWallCoords`/`objectsOfKind`。

### 4.2 字符语义 → IR 层映射表（`EncounterAdapter.encounterToRoomPlan`）

| 字符 | 旧 parseEncounter | RoomPlan IR 层 |
|---|---|---|
| `.` | 跳过 | mask=1（默认地板），不落任何层 |
| `#` | walls[] | `mask` 该格置 0 |
| `p` | pits[] | `pits[]` |
| `c` | covers[] | `objects{kind:'cover'}` |
| `d` | decors[] | `objects{kind:'decor'}` |
| `m/r/h/e` | spawns{wave:0} | `spawns{role, wave:1}` |
| `M/R/H/E` | spawns{wave:1}(小写 role) | `spawns{role(小写), wave:2}` |
| legend 字符 | props{type} | `objects{kind:'prop', type}` |
| `floorType` opt | 顶层 floorType | `meta.floorType`（整房覆写，非逐格） |

字符判定优先级与旧实现完全一致（保留字先判、legend 兜底最后判、未知字符静默忽略）；扫描 row-major，`objects/spawns/pits` 相对顺序即字符画阅读顺序。

### 4.3 placeEncounter 改造点

- 入参由旧 `parsed` 改为 **RoomPlan**；居中偏移公式不变（`interior + floor((interiorW - plan.w)/2)`）。
- 输出保持旧契约 `{id, floorType, walls, covers, decors, spawns, props, pits}`（绝对坐标），故 DungeonLayoutGenerator 消费块（铺墙/坑/floorOverrides/掩体/装饰/道具/出怪）**代码字节不变**：
  - `walls` 由 `mask===0` 还原；`covers/decors/props` 按 `kind` 拆分（保留 row-major → 放置期 `rng()`/`pickWeighted` 序列一致）；
  - `spawns.wave` 由 IR 的 1\|2 还原为下游 0\|1（DungeonManager 按 `!wave`/`wave===1` 分波）；`floorType` 取自 `meta.floorType`。
- `selectEncounter` 改为返回 RoomPlan（rng 仅用于选模板，解析层确定性）；DungeonLayoutGenerator 仅 `parsed.id`→`plan.meta.id` 一处随之调整（w/h 同名）。
- `parseEncounter` 保留为旧口径兼容视图（`roomPlanToParsed(encounterToRoomPlan(t))`），现存模板测试零改动。

### 4.4 验证（零回归三重网）

1. **黄金回归** `tests/room-plan-golden.test.js`：改造前用当前代码 dump `tests/fixtures/room-plan-golden.json`（70 模板的墙/坑/掩体/装饰/道具/出怪/地板覆写坐标集合，规范化排序）；改造后断言「字符模板 → 适配器 → RoomPlan」产物逐模板与 fixture 完全一致（**70/70**）+ 全模板 `validateRoomPlan` 自洽。解析层无 rng，故无需固定种子。
2. **placeEncounter 字节等价**：老 parse+place（原始源码复刻）vs 新 encounterToRoomPlan+place，70 模板 × 4 房间偏移 = 280 组逐字段 deepEqual 全通过。
3. **全楼层布局 SHA-256 指纹**：真实 `generateDungeonLayout(130,130,seed,floor)` 输出（墙/地板/坑 tile、floorOverrides、掩体/装饰物件、每房出怪、灯光、贴花）规范化后哈希，seed 7/42 × floor 1/2/3 共 6 布局，改造前后指纹逐字节一致。

**测试总量 393 → 465（+72，全绿）；`npm run build` 通过。**

### 4.5 已知限制 / 交接 P2

- `RoomPlan.floor`（逐格地板层）与 `doorSlots` 对字符模板恒为空/全 0——它们是给 P2 RoomBuilder / P3 连接算法预留的层，本期不产内容。
- `objects.kind` 的 cover/decor 为「延迟具体化」标记（具体箱桶/主题装饰仍在放置期由 rng 决定），P2 代码构建器若要放确定性物件，直接产 `kind:'prop', type` 即可复用同一 placeEncounter。
- 波次口径 IR 用 1\|2、下游用 0\|1，转换点唯一（placeEncounter 输出边界），P2 产 spawns 时须用 1\|2。
