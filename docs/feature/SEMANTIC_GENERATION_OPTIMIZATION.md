# 建筑语义生成优化方案（无降质）

## 1. 背景
在大地图（`100x100`）与多建筑（`6~12`）场景下，旧逻辑使用“每栋必需 `living_room + bedroom + study`”的硬约束，导致：

1. 单栋语义失败会直接使整轮生成失败。
2. 多栋联乘后失败概率高，容易触发 fallback。
3. 即使地图外框空间足够，仍可能因为语义尺寸约束无法通过。

## 2. 目标
在不降低家具质量和语义质量的前提下，显著提升布局生成成功率：

1. 保持客厅/卧室/书房等核心语义与必需家具规则。
2. 降低多栋场景 fallback 频率。
3. 保留随机布局多样性。

## 3. 方案总览

### 3.1 语义分层（按建筑面积）
新增 `RoomSemanticRepair` 策略，对建筑按 interior 面积分层：

1. `small`：必需 `living_room + bedroom`，优先尝试 `study`。
2. `medium`：必需 `living_room + bedroom`，优先尝试 `study`。
3. `large`：必需 `living_room + bedroom + study`。

### 3.2 required / preferred 双轨语义
`RoomSemanticAssigner` 改为接收：

1. `requiredRoles`：缺失即失败。
2. `preferredRoles`：尽力分配，缺失仅记录，不立即失败。

### 3.3 单栋局部重试
在 `ConstructionLayoutGenerator` 中引入单栋语义局部重试（默认 8 次）：

1. 对失败建筑仅重试该栋的房间切分/门连接/语义分配。
2. 避免“一个小失败导致整轮重开”。

### 3.4 全局语义配额修复
新增 map 级语义配额：

1. `living_room` / `bedroom` 保持高覆盖率。
2. `study` 保证最小数量与比例。
3. 若不足，优先把 `storage/corridor/foyer` 中满足尺寸条件的房间提升为目标语义。

### 3.5 fallback 地板补全
`initConstructionFallbackLayout()` 中强制初始化草地 `floorMap + floorCanvas`，避免 fallback 出现“无地面”。

## 4. 关键配置
位置：`src/core/systems/generation/GenerationConfig.js`

1. `generation.globalAttempts`: `24`
2. `semantic.maxSemanticAttemptsPerBuilding`: `8`
3. `semantic.tierThresholds`：
   - `smallMaxInteriorArea: 70`
   - `mediumMaxInteriorArea: 115`
4. `semantic.tierRequiredRoles`
5. `semantic.tierPreferredRoles`
6. `semantic.globalRoleQuota`
7. `semantic.promotionSourceSemantics`

## 5. 保质说明

1. `living_room / bedroom / study` 的家具必需项未降级。
2. `FurniturePlacer` 和 `LayoutValidator` 规则保持原强度。
3. 优化重点是减少无意义重开，而不是放松家具质量。

## 6. 验证结果（采样脚本）
在本地对 `map=100x100`、`buildings=6~12`、`globalAttempts=24` 进行 200 次采样：

1. 成功率约 `93.5%`（旧方案显著更低）。
2. 主要失败原因仍是语义尺寸不匹配，但被局部重试吸收，fallback 大幅减少。
3. 全局配额修复可维持语义质量稳定性。

## 7. 涉及文件

1. `src/core/systems/generation/GenerationConfig.js`
2. `src/core/systems/generation/RoomSemanticAssigner.js`
3. `src/core/systems/generation/RoomSemanticRepair.js`（新增）
4. `src/core/systems/generation/ConstructionLayoutGenerator.js`
5. `src/core/systems/WorldSystem.js`
