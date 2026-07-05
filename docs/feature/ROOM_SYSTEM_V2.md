# 房间系统 V2 —— 分层代码化房间 + 图优先连接

> 状态：已确认（2026-07-06）——连接采用宏观网格嵌入；分期 P1 IR+适配器 → P2 构建器 → P3 连接重做 → P4 渐进迁移；人潮批次（horde-enemies/cover-templates）落地合并后开工。
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
| **P1 IR+适配器** | RoomPlan 定义 + parseEncounter→RoomPlan + placeEncounter 只吃 RoomPlan | 纯重构零观感变化，现有全部模板测试作回归网 |
| **P2 RoomBuilder** | 构建器 API+种子变体+对称/散布工具；5 个示范房（圆厅/放射对称/参数化柱阵/巨型 2×2/环形回廊 v2） | 新旧前端并存，示范房入池验证 |
| **P3 连接 V2** | 拓扑规划器+宏观网格嵌入+开门纪律；DungeonManager/小地图适配 | 老算法留 `?layout=v1` 调试开关一个版本期 |
| **P4 存量迁移**（渐进） | 字符模板按层逐步改写为代码模板（每层翻新时顺手做） | 无 deadline，双前端长期共存也可接受 |

## 3. 决策点（待确认）

1. **连接嵌入方式**：宏观网格（以撒式，门位/走廊绝对整齐，推荐）vs 保留自由摆放只重做拓扑与门位纪律（房间位置更"有机"，但门位对齐工程量更大）；
2. **分期认可**：P1→P2→P3 顺序（先保真重构、再新能力、最后动连接）；
3. **开工时机**：等人潮批次两个 agent（horde-enemies/cover-templates）交付合并后开工——它们的施工面正是模板文件与布局生成器，并行必然打架。
