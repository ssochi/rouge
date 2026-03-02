# 光照系统性能优化方案与落地记录

## 目标
- 在不降低光照表现（肉眼一致）的前提下，降低 `LightingUpdate` 与 `LightingRender` 的 CPU 开销和 GC 抖动。
- 优先改善低端笔记本在高并发场景（多灯 + 多动态实体遮挡）下的稳定性。

## 已落地优化

### 1. 帧级临时内存复用（零分配路径）
- 新增 `src/core/lighting/FrameScratchPool.js`。
- `LightSystem` 与 `LightBufferRenderer` 改为复用帧内临时数组，替代高频 `filter/concat/slice` 产生的短生命周期数组。
- 光照更新阶段的 `shadowObjects` 构建改为写入复用数组，减少每帧分配。

### 2. 静态遮挡空间索引
- 新增 `src/core/lighting/OccluderSpatialIndex.js`。
- `ShadowCasterBuilder` 在静态遮挡重建后同步构建索引，查询时先走半径网格检索，再做边界过滤。
- `query` 支持输出写入外部数组（`out`），避免每个光源都创建新结果数组。
- 新增 `queryStaticBlockersInRadius()` 作为静态查询接口。

### 3. 动态遮挡条目对象池
- `ShadowCasterBuilder` 新增动态遮挡 entry 对象池，动态重建阶段复用 entry 对象。
- 动态遮挡 mask 刷新逻辑增加 `maskVersion` 门控：  
  - 当 `forceMaskRefresh=true` 且提供 `maskVersion` 时，仅版本变化才强制重分析。  
  - 未提供 `maskVersion` 时保持原语义（每次强制刷新）。
- `EntityLightOccluderResolver` 透传 `maskVersion` 字段。

### 4. 全向光射线方向 LUT
- `LightBufferRenderer` 对全向光增加射线方向 LUT（`cos/sin` 预计算）。
- 每光源仅计算一次起始角旋转，避免每条射线重复 `Math.cos/Math.sin`。
- 锥形光仍按原逻辑计算，保障行为一致性。

## 兼容性与行为约束
- 不改 `LightingConfig` 质量参数（射线数、bufferScale、光源预算等默认值保持不变）。
- 不改光照叠加规则（ambient/point 双通道逻辑保持不变）。
- 不改遮挡判定语义（墙体、门、实体遮挡规则保持不变）。

## 回归验证建议
- 重点观察场景：
  - 多个 `floor_lamp` + 车辆车灯 + 子弹/粒子密集。
  - 玩家、敌人、车辆同屏，且靠近复杂家具遮挡。
  - 地牢/室内门附近的光照切换。
- 对比项：
  - 视觉：遮挡边缘、墙后漏光、角色自遮挡是否异常。
  - 性能：`LightingUpdate` / `LightingRender` 的平均耗时与 P95。

## 相关文件
- `src/core/lighting/FrameScratchPool.js`
- `src/core/lighting/OccluderSpatialIndex.js`
- `src/core/lighting/LightSystem.js`
- `src/core/lighting/LightBufferRenderer.js`
- `src/core/lighting/ShadowCasterBuilder.js`
- `src/core/lighting/EntityLightOccluderResolver.js`
