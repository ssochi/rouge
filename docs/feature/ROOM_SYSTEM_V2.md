# 房间系统 V2 —— 分层代码化房间 + 图优先连接

> 状态：P1-P3 全部交付（2026-07-06，commit 6e3aedd/453a926/237a0b0）——IR+适配器零回归、RoomBuilder+5示范房、图优先拓扑+宏观网格连接（默认 V2，?layout=v1 回退）。P4 存量迁移渐进不设期限。调参决策：主干房数 10-11 维持、偶现中心 hub 布局可接受、2×2 大 Boss 房进后续待办——三项均待用户实测后可推翻。
>
> **P1 已交付（2026-07-06）**：`generation/rooms/RoomPlan.js`（IR + `createRoomPlan`/`validateRoomPlan`/`checkConnectivity`）+ `generation/rooms/EncounterAdapter.js`（`encounterToRoomPlan` 字符模板适配器 + `roomPlanToParsed` 旧口径视图）；`selectEncounter` 返回 RoomPlan、`placeEncounter` 只吃 RoomPlan、`parseEncounter` 降级为兼容视图（`[room-v2:p1]` 锚点）。零观感/零行为变化，三重验证守护（黄金测试 70/70 + placeEncounter 字节等价 + 全楼层 SHA-256 指纹一致，seed 7/42 × floor 1/2/3）。详见本文档末「P1 交付记录」。
>
> **P2 已交付（2026-07-06）**：`generation/rooms/RoomBuilder.js`（PixelDraw 式链式构建器 `defineRoom` + shape/floor/objects/spawns/pits 工具集 + mirror/rot4 对称 + 归一化坐标 + 种子变体）+ 5 个示范房 `generation/encounters/v2_showcase.js`（圆形大厅/放射八向柱阵/参数化柱廊/同心环回廊/渐变污渍大厅，全字符画做不出的形态）；代码模板与字符模板同池选中（`SELECTABLE_TEMPLATES` + `selectEncounterById`），逐格地板层经 `placeEncounter.floorCells` → 1×1 `floorOverrides` 落地渲染（`[room-v2:p2]` 锚点）。测试 `tests/room-builder.test.js`（40 例）；全量 508 + build 全绿；5 房实机截图双种子对比通过。详见本文档末「P2 交付记录」。
>
> **P3 已交付（2026-07-06）**：连接算法重做——`generation/rooms/FloorTopology.js`（图优先拓扑规划 + 宏观网格嵌入）+ `DungeonLayoutGenerator.js` 拆分为 v1/v2 双路径（共用 `selectAndShrinkEncounters`/`finalizeLayout` 收尾，下游契约字段零变）。默认 V2：先规划有意图的图（主干 spine + 宝藏/商店/精英支线 + 至多 1 条捷径环，三动词保底），再嵌入 24×20 cell 网格（自避行走蛇形推进 + 支线垂直外挂），门开在共享格边重叠中点、走廊恒为 3 宽短直段（`[room-v2:p3]` 锚点）。`?layout=v1` 回退旧 BSP 算法，V2 放不下自动降级 v1（实测 600 布局 0 降级）。测试 `tests/dungeon-topology.test.js`（10 例，24 seed×3 层不变量）；全量 518 + build 全绿；3 seed 大地图 + 走廊实景 + v1 对照实机截图通过。详见本文档末「P3 交付记录」。
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
| **P2 RoomBuilder ✅** | 构建器 API+种子变体+对称/散布工具；5 个示范房（圆厅/放射八向柱阵/参数化柱廊/同心环回廊/渐变污渍大厅）（**已交付 2026-07-06**） | 新旧前端同池，示范房入池验证 + 逐格地板首秀 |
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

## 5. P2 交付记录（2026-07-06）

### 5.1 RoomBuilder API 清单（`generation/rooms/RoomBuilder.js`）

`defineRoom(id, opts, build(R))` → 「模板工厂」descriptor `{ id, tier, weight, floors, w, h, __code:true, meta, build(rng) }`。
- `opts`：`{ tier, floors?, weight?, w, h, floorType?, story? }`——`w/h` 为栅格尺寸（形状在此固定网格上作画，选池尺寸过滤依赖），`size:[w,h]` 亦可。
- `build(rng)`：每次 new 一个 `RoomBuilder`，逐层作画后 `toRoomPlan()` 校验产出 RoomPlan；**注入种子 rng → 每局变体**。
- 定义期 fail-fast：`defineRoom` 用确定性 rng 做一次 dry-run，构建/校验错误在模块加载即抛。

| 工具 | 方法 | 说明 |
|---|---|---|
| `R.shape` | `rect()`/`rect(x,y,w,h)` · `ellipse()`/`ellipse(cx,cy,rx,ry)` · `carve` · `carveEllipse` · `union(fn)` | 操作 mask 层，任意形状；无参 rect=全矩形、无参 ellipse=内切椭圆 |
| `R.floor` | `fill(k)` · `rect(k,x,y,w,h)` · `border(k,thickness)` · `checker(a,b)` · `scatter(k,{count\|density})` | 逐格地板层，参数为 FLOOR_TYPES 键名（内部转数值 id）；仅作用 mask 内 tile |
| `R.objects` | `place(type,x,y)` · `cover/decor(x,y)` · `row(type,{from,to,count})` · `ring(type,{radius,count,skip,cx,cy})` · `scatter(type,{count})` | prop 确定件产 `kind:'prop',type`；`cover/decor` 产抽象件 |
| `R.spawns` | `wave(1\|2).at(role,x,y)` · `.ring(role,{...})` · `.cluster(role,{count,near:'edges'\|'center'})` | **波次口径强制 1\|2**（`wave(其它)` 抛错） |
| `R.pits` | `rect(x,y,w,h)` · `ring({radius,count})` | 危险层 |
| 对称 | `R.mirrorX()` · `R.mirrorY()` · `R.rot4()` | 已产内容（mask/floor/objects/spawns/pits）镜像/四向旋转复制（去重）；`rot4` 需方形栅格 |
| 其它 | `R.door(side,offset)` | 开门位建议（P3 连接消费） |

坐标：**整数=绝对 tile；非整数小数=归一化**（坐标乘 `w-1`/`h-1`，半径乘「中心到最近边」）。`count` 支持 `[min,max]` 种子区间。

### 5.2 5 示范房（`generation/encounters/v2_showcase.js`）

| id | 形状/手法 | 楼层/档位 | 种子变体 |
|---|---|---|---|
| `v2_circular_hall` 圆形大厅 | `ellipse` 圆厅 + 红毯 `border` 镶边 + `ring` 环形烛台（留缺口）+ 中央血祭石 + `ring/cluster` 放射出怪 | F2 · mid · 15×15 | 烛台缺口位偏移 + 波2 僧侣 5-7 |
| `v2_radial_pillars` 放射八向柱阵 | `rot4` 四向全等辐条 + 参数化八向柱环留对向双缺口 + 中央反应堆芯 | F3 · mid · 13×13 | 柱环缺口位旋转 + 碎石 `scatter` 2-4 |
| `v2_colonnade` 参数化柱廊 | `row` 柱列（列数随种子）+ 骨堆 `scatter` | F1 · shallow · 13×11 | **柱列数 2-4** + 骨堆 2-5 |
| `v2_concentric_ring` 同心环回廊 | 双层 `carveEllipse` 嵌套（挖中盘→加回内盘→挖中心）+ 十字连廊接通内外环 + 环上立柱/烛台/出怪 | F2 · mid · 15×15 | 立柱缺口偏移 + 骨堆 2-4 + 波2 环上 4-6 |
| `v2_stain_hall` 渐变污渍大厅 | **逐格地板首秀**：`checker` 格栅/湿石拼花 + 中央血滩 `rect` + 向外飞溅 `scatter`（渐变污渍） | F1 · mid · 14×11 | 血渍飞溅点 12-24 |

### 5.3 选池接入与逐格地板落地（`EncounterTemplates.js` + `DungeonLayoutGenerator.js`，`[room-v2:p2]` 锚点）

- `ENCOUNTER_TEMPLATES` 保持**纯字符模板池**（黄金测试/encounter-templates 测试逐一遍历 `rows`，口径不变）；新增 `SELECTABLE_TEMPLATES = ENCOUNTER_TEMPLATES + V2_SHOWCASE_ROOMS(5)` 为真正的选池。
- `selectEncounter` 改为消费 `SELECTABLE_TEMPLATES`，尺寸/加权经统一接口 `templateGridSize(t)`（字符走 `rows`、代码走 `w/h`）与 `materializeTemplate(t,rng)`（字符 `encounterToRoomPlan`、代码 `t.build(rng)`）——**代码模板选中时用当局 rng 重新 build，变体确定性生效**。新增 `selectEncounterById(id,rng)`（按 id 物化，供测试/调试）。
- 逐格地板：`placeEncounter` 新增 `floorCells`（`plan.floor` 非 0 tile → `{x,y,floorType}`，数值 id 反查 `FLOOR_ID_TO_KEY`；**字符模板 floor 恒全 0 → floorCells 空 = 零回归**）；`DungeonLayoutGenerator` 把 `floorCells` 转 1×1 `floorOverrides` 推入，**置于整房 `floorType` 覆写之后**（逐格精确色胜出），复用 `WorldSystem` 既有 floorOverride 铺地管线（无需改 WorldSystem）。

### 5.4 改动文件清单

- 新增：`generation/rooms/RoomBuilder.js`、`generation/encounters/v2_showcase.js`、`tests/room-builder.test.js`。
- 改动：`EncounterTemplates.js`（选池聚合 + selectEncounter 统一接口 + selectEncounterById + placeEncounter.floorCells，`[room-v2:p2]` 锚点）、`DungeonLayoutGenerator.js`（floorCells → 1×1 floorOverrides）。
- 文档：本文档 §5 + `TECH_OVERVIEW.md`。

### 5.5 验证

- 全量测试 **508 通过**（P1 后 468 + 新增 40，零回归）；`npm run build` 通过。
- 实机截图（`?map=dungeon_f2&seed=N&peace=1` + 临时 `?enc=<id>` 强制放置钩子，**截图后已撤除干净**，`selectEncounterById` 作为正式 API 保留）：5 房各双种子对比通过——圆厅/同心环截全貌、渐变污渍大厅可见逐格棋盘+血渍、参数化柱廊双种子柱列数可见差异、放射八向柱阵可见 rot4 四向全等。

### 5.6 已知限制 / 交接 P3

- `R.door(side,offset)` 已产 `doorSlots`，但连接算法 V2（P3）尚未消费——示范房暂缺省未主动标注门位，留给 P3 按共享格边中点/doorSlots 落门。
- 代码房尺寸固定（`w/h` 在 defineRoom 定死）：过大的房（如 15×15）只在原始 BSP 房 ≥19 时才被选中；如需在小房出现应控制在 ≤13。
- `rot4` 要求方形栅格；矩形房只能用 `mirrorX/mirrorY`。
- 逐格地板层走 1×1 floorOverrides，单房上百格时会产上百条覆写记录（一次性生成开销，无运行时负担）；若后续大批量代码房上线可考虑批量矩形合并。
- 环形/柱阵类房的「物件成环」不影响 `validateRoomPlan` 的 mask 连通性（物件非 mask），但会形成游戏内障碍——务必用 `skip` 留缺口保证可穿行（示范房已遵循）。

## 6. P3 交付记录（2026-07-06）—— 连接算法 V2

**病根 → 药方**：旧算法 BSP 撒房 → MST + 随机环边 → 事后 BFS 深度贴房型（§0 诊断：拓扑无意图、门位无纪律、环边随机）。V2 反转顺序——**先规划有意图的图，再落空间**。

### 6.1 拓扑规划器（`generation/rooms/FloorTopology.js`）

两步：`planTopologyGraph`（抽象图，不含坐标）→ `embedTopology`（嵌入 cols×rows cell 网格）；`planFloorTopology` 组合入口，放不下返回 null。

**主干 spine**：`start → S 个战斗/动词房 → Boss 前厅 → Boss`。房型（category）在规划期直接指定（不再事后贴标签）；三动词房（survival/hunt/pact）洗牌取前 3 间战斗房轮转保底，**每层各 ≥1**。

**支线 branch**（各垂直外挂于指定深度的主干战斗节点，1 房）：

| 支线 | 锚点深度（占主干战斗段 S） | category |
|---|---|---|
| 宝藏 treasure | ~40%（`round(0.4·S)`） | treasure（安全区，不刷怪） |
| 商店 shop | ~60%（`round(0.6·S)`，严格深于宝藏） | shop（安全区） |
| 精英 elite | 随机 55%~85% | elite（固定精锐编成） |

**环 loop**（至多 1 条，`loopChance=0.75`）：只在主干战斗节点间找**相邻格且 spineIndex 间隔 ≥3** 的一对，取间隔最大者连边——「深处 → 前段」的捷径。**永不含 Boss 前厅 / Boss / 起点**。

**楼层参数表**（`topologyConfigForFloor`）：

| 楼层 | spineCombat（战斗/动词房数） | 总房数 = start+S+前厅+Boss+宝藏/商店/精英 |
|---|---|---|
| F1 | [4, 4] | 10 |
| F2 | [4, 5] | 10~11 |
| F3 | [4, 5] | 10~11 |

### 6.2 宏观网格嵌入与开门纪律

- **cell = 24×20 tile**（`gridCellW/H`）。单元尺寸研究：最大遭遇战模板 16×12 → 房 20×16（+4 通带）→ cell 需 ≥24×20；Boss（≤22）亦落单格，故**本期全节点 1×1**（多格 2×1/2×2 在当前尺寸区间无必要，列为后续）。130×130 地图切出 **4 列 × 5 行**，网格居中。
- **spine 自避行走**：起点靠随机一角，直行偏置 + 前瞻优选开阔落点 → 长可读主干段并给支线留位。窄网格偶会自锁，故 `embedTopology` 内部重试 40 次（每次 rng 前进）→ 实测单层可嵌入率 100%。
- **支线垂直外挂**：落在锚点垂直于主干走向的空邻格（无垂直空位再退任意空位）。
- **房间物化**（`materializeRoomsFromTopology`）：每房居中于其 cell + 有机抖动（`gridJitter=2`），clamp 保证四周 ≥1 tile（相邻房 gap ≥2、门位重叠充足）。战斗房先给 cell 最大再由 `selectAndShrinkEncounters` 收缩到模板尺寸；功能房（start/boss/treasure/shop/elite/pact）固定尺寸。
- **开门纪律**（`straightCorridorTiles`）：门开在共享格边两房投影重叠段中点（`RoomPlan.doorSlots` 有值时优先消费，offset∈[0,1] 归一化——现有模板均未标注，为规范预留口）；走廊 = 门宽 3 × 间隙长的**实心直段**，各走廊独占其相邻格间隙 → **永不斜穿、永不交叉**。重叠不足返回 null 触发重试。

### 6.3 双路径与下游兼容

- `DungeonLayoutGenerator.js` 拆为 `generateDungeonLayoutAttemptV1`（旧 BSP，原样保留）/ `generateDungeonLayoutAttemptV2`（新），**共用** `selectAndShrinkEncounters`（遭遇战定形）与 `finalizeLayout`（走廊质量闸 → 地板/门/墙 → 遭遇战放置/模板墙 → 掩体/装饰/光源/贴花/编成 → 小地图图 → 返回）。收尾函数逐字提取旧尾段，rng 消费顺序不变 → v1 路径行为等价。
- `generateDungeonLayout(w, h, seed, floor, { algorithm })`：默认 v2；`algorithm:'v1'` 或 v2 失败时回退 v1（`console.warn('[room-v2:p3] ... 降级 v1')`）。**返回结构字段口径完全不变**（rooms/corridors/gates/graph/floorOverrides/decals/lightObjects…）。
- 下游适配点（全部无感或注释级）：
  - `WorldSystem.initDungeonMap`：读 `?layout=v1` → 传 `{algorithm}`（`[room-v2:p3]` 锚点）。
  - `DungeonManager` 构造：graph.nodes/edges + corridors 口径不变，V2 的 edges 多含 1 条 loop 边，状态机/封门/波次/小地图折线全部无感消费（`[room-v2:p3]` 注释锚点，**无逻辑改动**）。
  - `Renderer` 小地图折线（`getMinimapData().edges[].path`）、门口预告（`getDoorPreviews`）：消费同一契约，V2 房间格对齐后折线天然更短更直，**零改动**。

### 6.4 不变量测试（`tests/dungeon-topology.test.js`，24 seed × 3 层）

抽象拓扑层：① 每层恰好 1 start/boss/前厅/宝藏/商店/精英；② 主干长度在楼层配置区间、start=spineIndex0、Boss 最深；③ 三动词各 ≥1 且落主干战斗节点（非前厅）；④ 宝藏深度带 < 商店深度带；⑤ 至多 1 环、两端为战斗节点且间隔 ≥loopMinGap（不穿前厅/Boss/起点）；⑥ 嵌入合法（cell 不重叠、每边相邻格、全图连通）。

整层布局：⑦ 走廊为轴对齐实心短直矩形（短边 ≤3）、互不交叉、不穿房间；⑧ 每走廊贴其两端房间（门在共享边）、门 tile 恒为可通行地板；⑨ 房间图 BFS 全连通；⑩ `?layout=v1` 回退仍产健全布局。

### 6.5 改动文件清单

- 新增：`generation/rooms/FloorTopology.js`、`tests/dungeon-topology.test.js`。
- 改动：`DungeonLayoutGenerator.js`（v1/v2 拆分 + 共用收尾 + 网格嵌入 + 直走廊 + 算法选项/降级）、`WorldSystem.js`（`?layout=v1` 接线）、`DungeonManager.js`（`[room-v2:p3]` 兼容注释）、`tests/dungeon-layout.test.js`（房数区间改 9~12，说明见 6.6）。
- 文档：本文档 §6 + `TECH_OVERVIEW.md`。

### 6.6 验证与已知限制

- 全量测试 **518 通过**（P2 后 508 + 新增 10）；`npm run build` 通过。600 布局（seed 1~200 × F1/2/3）实测 **100% 走 V2、0 次降级**，房数分布 10:396 / 11:204。
- `tests/dungeon-layout.test.js` 房数断言由旧 `8~10` 改为 `9~12`：旧区间是 BSP 撒房叶子数的实现副产物；V2 房数是「起点+4~5 战斗+前厅+Boss+宝藏/商店/精英」的**有意图房数**（10~11）。其余断言（1 start/boss、各 1 宝藏/精英/商店、安全区不刷怪、门 tile 可通行、火把/装饰/贴花/Boss 顺序、同种子可复现）**语义不变、全部保留通过** → 证明共用收尾等价。
- **已知限制**：① 本期全节点 1×1，多格 Boss/大战斗房（2×1/2×2）未实现（当前尺寸区间无必要，列为后续）；② `doorSlots` 消费口已实现但现有模板均未标注（恒走重叠中点）；③ 4 列窄网格下主干偶呈中心 hub 状（非纯线性 spine），仍清晰可读；④ v2 失败降级 v1 为保底路径（实测触发率 0，长期共存一版本期）。
