# 1000 僵尸性能优化方案与实现

## 1. 背景
- 在将僵尸数量提升到 1000 后，帧率约为 18 FPS。
- `I` 键性能面板显示，主要热点集中在世界物体更新链路（旧 `WorldObjects`）。
- 目标：在尽量无损（不降画质、不减特效、不改玩法规则）的前提下，优先从算法层降低复杂度。

## 2. 瓶颈分析
- 敌人分离使用全局两两比较：`O(N^2)`，1000 敌人约 50 万对/帧。
- 阻挡查询（`isRectBlocked`）在高频移动碰撞中反复全量遍历墙体和可破坏物。
- 墙体连接关系每帧全量重建，存在重复计算。
- 破障目标选择在拥挤场景下会遍历大量可破坏物 hitbox。

## 3. 本次改造

### 3.1 静态障碍空间索引
- 新增 `src/core/systems/ObstacleSpatialIndex.js`。
- 统一索引：
  - 墙体（`walls`）
  - 可破坏物 hitbox（`breakableObjects`）
- `WorldSystem.isRectBlocked()` 优先改为“局部候选 + 精确碰撞”，避免全量扫描。

### 3.2 静态世界 Dirty 缓存
- `WorldSystem` 新增：
  - `worldStaticDirty`
  - `wallConnectivityDirty`
  - `markWorldStaticDirty()`
  - `rebuildStaticCachesIfNeeded()`
- 仅在障碍状态变化（地图重载、门开关、物体破坏、建造放置）时重建：
  - 墙体连接掩码
  - 障碍空间索引
  - 流场阻挡缓存

### 3.3 敌人分离算法降复杂度
- 移除旧的全局双重循环分离（`O(N^2)`）。
- 保留敌人 AI 内部基于 `NavigationGrid.getNearbyEnemies()` 的局部分离向量（`O(N*k)`，`k` 为局部邻域密度）。
- 在敌人更新后增加一轮“稳定硬分离”：
  - 基于网格邻域收集重叠对
  - 对每个敌人累计推离向量后一次性应用（带上限/松弛系数）
  - 仅在重叠超过阈值时纠正，避免高密度场景震荡

### 3.4 破障目标查询局部化
- `_pickEnemyBreachTarget()` 改为优先从 `ObstacleSpatialIndex` 取“敌人-玩家路径包围区域”候选 hitbox。
- 仍保持原优先级：
  - `doorOnPath > doorNearby > blockerOnPath > blockerNearby`

### 3.5 性能标签细分
- `Game.js` 将旧 `WorldObjects` 拆分为：
  - `Breakables`
  - `Particles`
  - `EnemyUpdate`
  - `Portals`
  - `DroppedItems`
- 便于定位具体热点来源并追踪优化收益。

## 4. 兼容性与行为约束
- 保持原有玩法语义与视觉效果不变。
- 保持门、障碍、破障、寻路、掉落交互逻辑一致。
- 优化主要来自数据结构与调度时机，不引入质量降级策略。
- `wall` 自适应形态由 `wallMask` 驱动，不参与通用数组动画轮播，避免形态持续抖动。

## 5. 验收建议
- 场景 A：1000 僵尸，记录 30 秒平均 FPS 与各子系统耗时占比。
- 场景 B：狭窄通道高密度拥挤，观察是否有穿墙/抖动/卡死。
- 场景 C：门开关、物体破坏、建造放置后，确认寻路与碰撞立即生效。
- 场景 D：普通敌人数（100 左右）回归，确认手感和行为无退化。

## 6. 变更文件
- `src/core/systems/ObstacleSpatialIndex.js`（新增）
- `src/core/systems/WorldSystem.js`
- `src/core/systems/BuildSystem.js`
- `src/core/systems/PlayerSystem.js`
- `src/core/Game.js`
- `docs/PROFILER_GUIDE.md`
- `docs/TECH_OVERVIEW.md`
