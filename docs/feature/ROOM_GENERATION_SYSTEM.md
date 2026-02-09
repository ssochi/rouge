# 建筑生成系统方案（construction + game）

## 1. 背景与目标
当前 `construction` 与 `game` 场景都使用同一套建筑生成流水线。该系统用于替代旧的固定/随机墙布局，提升结构多样性与可扩展性，实现：

1. 多栋建筑群自动生成（当前默认 6-12 栋，随大地图配置扩展）。
2. 单栋内部多房间分区，门连接后保持内部可达。
3. 房间按语义进行家具硬约束摆放（客厅/卧室/书房等），不降低家具质量。
4. 保留失败回退机制，保证场景稳定可进入。

## 2. 范围

### 2.1 In Scope
1. 接入 `WorldSystem.initConstructionMap()` 与 `WorldSystem.initGameMap()`。
2. 自动生成 `wall / door_h / door_v` 与现有家具对象。
3. 纯随机（不保留 seed）。
4. 新增生成模块目录：`src/core/systems/generation/`。
5. 户外生成包含自然植被与低密度环境杂物（箱子/木桶/罐子）。

### 2.2 Out of Scope
1. 不改 `hub/test` 场景生成逻辑。
2. 不新增美术资产，仅使用现有家具类型。
3. 不改战斗、输入、背包系统行为。

## 3. 模块设计

### 3.1 `GenerationConfig.js`
统一定义生成参数、房间模板与家具 footprint：
1. 建筑数量/尺寸范围、边距、间隔。
2. 房间最小尺寸、目标房间数量。
3. 门边界留白与额外门数量。
4. 家具模板与硬约束。

### 3.2 `BuildingFootprintPlanner.js`
在地图可用区域内放置多栋建筑外框：
1. 约束建筑不重叠。
2. 保留建筑间 gap。
3. 避让 Build 返回传送门区域（预留矩形）。

### 3.3 `RoomPartitioner.js`
对单栋建筑内部使用 BSP 切分：
1. 递归分割成多个房间。
2. 每次分割都会生成一条内部墙分割线。
3. 控制最小房间尺寸。

### 3.4 `DoorConnector.js`
门生成与墙门冲突处理：
1. 先生成外墙 + 内墙 tile 集。
2. 每条分割线至少放置一个“强制内部门”。
3. 同一房间对默认最多 1 扇连接门；仅当任一房间面积达到“大房间阈值”时允许额外门（上限 2）。
4. 每栋至少放置一个外部门（入口门）。
5. 门 tile 从墙集合中剔除，避免重叠。

### 3.5 `RoomSemanticAssigner.js`
按房间尺寸和入口关系分配语义：
1. 接收 `requiredRoles + preferredRoles` 输入。
2. `requiredRoles` 缺失时本栋失败；`preferredRoles` 缺失仅记为非致命缺口。
3. 剩余分配：`storage / corridor / foyer`。

### 3.6 `RoomSemanticRepair.js`
语义修复与地图级质量约束：
1. 根据建筑 interior 面积分层（`small / medium / large`）。
2. small/medium 默认必需 `living_room + bedroom`，`study` 作为优先可选；large 保持三件套必需。
3. 提供地图级语义配额（如 `study` 最少数量/占比）。
4. 配额不足时优先把 `storage/corridor/foyer` 提升为目标语义（前提是尺寸达标）。

### 3.7 `FurniturePlacer.js`
按语义模板执行家具摆放：
1. 客厅硬约束：`sofa + tv_stand`。
2. 卧室硬约束：`bed/bed_h + nightstand`。
3. 书房硬约束：`table + bookshelf`。
4. 门前保留通行带（clearance）。
5. 强制无重叠、不过界。
6. 房间内执行可行走性校验（BFS）。

### 3.8 `LayoutValidator.js`
生成结果统一校验：
1. 单栋内部房间图连通。
2. 入口门数量合法。
3. 家具无重叠且满足语义必选项。

### 3.9 `LayoutCompiler.js`
把 tile 计划转换为可实例化对象列表：
1. 墙、门、家具统一编译为 `{x, y, type}`。
2. 坐标转换为像素坐标（乘 `TILE_SIZE`）。

### 3.10 `ConstructionLayoutGenerator.js`
总编排器：
1. 组织各阶段执行。
2. 单栋语义局部重试（避免整轮重开）。
3. 全局重试（保底）。
4. 产出 breakable 列表、玩家出生点与生成元数据（如室内出生候选点）。

## 4. 生成流程
1. `WorldSystem.initConstructionMap()` / `WorldSystem.initGameMap()` 先建立地图边界墙。
2. 调用 `generateConstructionLayout()`。
3. 生成器执行：建筑外框 -> 房间切分/门连接/语义（单栋局部重试）-> 全局语义配额修复 -> 家具摆放 -> 校验 -> 编译。
4. 成功后实例化 `BreakableObject`。
5. 设置玩家出生点为主建筑入口外。
6. 失败则使用 fallback 布局保证可进入。

## 5. 数据与接口

### 5.1 关键内部结构
1. `Footprint`: `{id, x, y, w, h}`（tile）
2. `Room`: `{id, buildingId, x, y, w, h, area, semantic}`
3. `Door`: `{x, y, type, kind, connects, outside?}`
4. `FurniturePlacement`: `{roomId, type, x, y, w, h, item}`
5. `SemanticProfile`: `{tier, interiorArea, requiredRoles, preferredRoles}`

### 5.2 WorldSystem 接入点
`initConstructionMap()` 与 `initGameMap()`：
1. 调用生成器获取 `breakables + spawn + floorMap + meta`。
2. 动态创建 `BreakableObject` 并构建地板离屏缓存。
3. 失败走 `initConstructionFallbackLayout()`。
4. `initGameMap()` 在布局完成后额外叠加敌人与掉落物生成，并可使用 `meta.indoorSpawnTiles` 控制非僵尸室内优先刷怪。

## 6. 失败回退策略
1. 单栋语义阶段优先局部重试（默认最多 8 次），减少“单栋失败导致整轮失败”概率。
2. 全图完成后执行一次语义配额修复；若无法满足配额则该次全局尝试失败。
3. 全局最多重试 N 次（默认 24）。
4. 全部失败后使用 `fallback` 静态小屋布局；fallback 同样初始化草地地板。

## 7. 验收标准
1. 连续进入 `construction/game` 场景 30 次无崩溃、无空布局。
2. 每栋建筑内部任意房间可达。
3. 每栋有且仅有 1 个入口门。
4. 普通房间对门数量不超过 1；大房间对最多 2。
5. 家具无重叠、不过界、不过门。
6. 玩家出生点不在阻挡体内。
7. `6~12` 栋、`globalAttempts=24` 条件下，生成成功率显著高于旧方案（以自动采样统计验证）。

## 8. 未来扩展
1. 可选 seed 模式（可复现布局）。
2. 栋间道路与外部区域语义生成。
3. 新家具接入：仅需在 `GenerationConfig` 增补 catalog/template。
4. 将房间模板参数化为可热更新配置。
