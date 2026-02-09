# Game 场景建筑生成接入方案

## 1. 目标
1. 将 `game` 场景接入与 `construction` 相同的建筑生成流水线。
2. 移除 `game` 场景旧的随机墙块生成路径。
3. 在生成算法中于建筑外侧草地低密度生成 `box / barrel / vase`。

## 2. 接入设计

### 2.1 WorldSystem
1. 新增公共流程：
   - `addBoundaryWalls()`：统一创建地图四周边界墙。
   - `applyGeneratedLayout(configOverrides)`：调用 `generateConstructionLayout()`，实例化 `breakables`，设置 `spawn`，缓存 `floorMap`。
2. `initConstructionMap()` 复用 `applyGeneratedLayout()`，并保留返回 Hub 传送门。
3. `initGameMap()` 改为：
   - 调用 `applyGeneratedLayout({ reservedRects: [] })`。
   - 叠加敌人批量生成与初始武器掉落。
4. 旧 `initMap()` 已删除，`game` 仅保留生成式入口，避免误回退到随机墙方案。

### 2.2 OutdoorPlacer
1. 将占用区拆分为两层：
   - `occupiedVegetation`：建筑 footprint + 建筑缓冲区 + 保留区（用于树/灌木/草丛）。
   - `occupiedBase`：建筑 footprint + 保留区（用于箱桶罐）。
2. 植被规则保持：
   - 仅 `GRASS / DIRT`。
   - 满足最小间距。
3. 新增杂物规则：
   - 仅 `GRASS`。
   - 优先使用与最近建筑切比雪夫距离 `4~8` 格（近建筑草地区域），候选不足时自动向外扩到 `14` 格。
   - 概率低（默认 `0.025`），并满足最小间距。
   - 类型按权重抽样（`box 0.4 / barrel 0.35 / vase 0.25`）。
   - 增加最小数量保底，避免极端随机导致整图为 0。

## 3. 配置项

`src/core/systems/generation/GenerationConfig.js` 新增：
1. `outdoor.clutterEnabled`
2. `outdoor.clutterChanceNearBuilding`
3. `outdoor.clutterNearBuildingMinDist`
4. `outdoor.clutterNearBuildingMaxDist`
5. `outdoor.clutterMinSpacing`
6. `outdoor.clutterTypes`
7. `outdoor.clutterWeights`

## 4. 验收标准
1. `hub -> game` 后不再出现旧随机 2x2 墙块。
2. `game` 与 `construction` 均可看到流程化建筑布局与地板。
3. 箱子/木桶/罐子主要出现在建筑外侧草地，数量明显少于植被。
4. 树/灌木/草丛不在路面或木地板上生成。
5. 执行 `npm run build` 成功。
