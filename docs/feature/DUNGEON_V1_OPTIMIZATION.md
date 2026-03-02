# 地牢系统 V1 优化实现说明

## 1. 目标

本次优化聚焦 3 个问题：

1. 房间过于简陋、缺少区别度与掩体层次。
2. 房间距离过远、通道过长，战斗节奏拖沓。
3. 小地图不直观，探索信息层级弱。

设计风格偏向《挺进地牢》：中等房间密度、短连通、房内机动与掩体决策。

## 2. 已实现内容

### 2.1 紧凑化地牢生成

文件：`src/core/systems/generation/DungeonLayoutGenerator.js`

1. 新增中心工作区 `bounds`（默认 80x80），不再在全 130x130 空间内稀疏铺开。
2. 房间数量改为 `10~14`，普通房尺寸改为 `10~16`。
3. 图连通从“全局任意 MST”改为“近邻约束 MST + 短环路”：
   - 每房间只保留 K 近邻候选边（默认 4）。
   - 仅优先使用短边阈值（默认 34）构图。
   - 额外环路只加短边（默认 <= 30）。
4. 新增生成质量门限与重试：
   - 单次生成若走廊均长/极值超阈值会自动重试。
   - 默认最多 8 次尝试。

### 2.2 房间分类与模板扩展

文件：
- `src/core/systems/generation/DungeonLayoutGenerator.js`
- `src/core/systems/generation/RoomInteriorTemplates.js`

1. 新增房间分类：
   - `combat_open`
   - `combat_cover`
   - `combat_maze`
   - `challenge_trapline`
   - `reward`
   - `boss_arena`
2. 模板库由 6 类扩展到 12 类，并按“房间分类+房间类型”筛选：
   - 新增 `offset_pillars / checker_blocks / broken_ring / zigzag_walls / gate_channels / boss_spokes`。
3. 掩体数量按分类分层：
   - `combat_open` 更稀疏，保机动。
   - `combat_cover/challenge_trapline` 更密集。
   - `reward` 轻战斗。

### 2.3 地牢装饰对象（少量新增资产）

文件：
- `src/assets/objects/dungeon/DungeonRubbleSprite.js`
- `src/assets/objects/dungeon/DungeonIronCageSprite.js`
- `src/assets/objects/dungeon/DungeonBonePileSprite.js`
- `src/core/entities/objects/DungeonRubbleObject.js`
- `src/core/entities/objects/DungeonIronCageObject.js`
- `src/core/entities/objects/DungeonBonePileObject.js`
- `src/core/entities/objects/ObjectRegistry.js`
- `src/graphics/Assets.js`
- `src/core/systems/WorldSystem.js`

1. 新增 3 类地牢装饰对象：
   - `dungeon_rubble`（碎石堆）
   - `dungeon_iron_cage`（铁笼）
   - `dungeon_bone_pile`（骨堆）
2. 装饰对象通过 `decorObjects` 参与地牢投放。
3. 资产统一放在 `assets`，对象逻辑在 `core/entities/objects`，符合分层规范。

### 2.4 小地图重构（邻接预览 + 动态探索）

文件：
- `src/core/systems/DungeonManager.js`
- `src/core/Renderer.js`

1. `DungeonManager.getMinimapData()` 新增输出：
   - `visibilityState: visited/frontier`
   - `category`
   - `locked`（当前房间门锁状态）
   - `graphNode(gx, gy)`（拓扑节点）
   - `edges`（房间图边）
2. 小地图渲染改为“拓扑节点图”而非真实比例房间缩放：
   - 已探索节点实心。
   - 邻接前沿节点半透明轮廓。
   - 已探索边实线，前沿边虚线。
3. 增强引导信息：
   - 玩家朝向箭头替代圆点。
   - 锁门房间高亮脉冲。
   - 标题显示 `F层数 + 已探索/总房间`。
   - 固定图例（CLR/ACT/BOSS/FR）。

## 3. 生成质量抽样结果（本地）

采样：`200` 次，地图 `130x130`，`floor=1`。

1. 平均房间数：`11.945`
2. 平均走廊 tiles：`20.59`
3. 最长走廊 tiles：`62`
4. 生成失败：`0`

对比旧版本（历史观测）：平均走廊约 120、最长可达 500+，已显著收敛。

## 4. Claude Code 资产协作流程（本项目约定）

当新增复杂像素资产时，推荐流程：

1. 由本代理先给出“资产需求单”：
   - 尺寸、风格、调色板、层级结构、朝向、碰撞占地、是否动画。
2. 由 Claude Code 按需求单生成 `src/assets/...` 下素材代码。
3. 本代理只负责接入与验收：
   - 接入 `Assets.js`
   - 注册 `ObjectRegistry`
   - 调整 `hitbox/hurtbox/drawOffset`
   - 在目标生成器中投放并做可玩性回归
4. 不满足风格/可读性时，仅迭代需求单，不直接并入主线。

## 5. 后续可选增强

1. 增加“首领前置缓冲房（ante-room）”与事件房。
2. 为不同房间分类追加地板细分材质（如裂纹石、污渍石）。
3. 小地图支持自定义缩放与图例开关。
