# 光照动态阴影分层优化

## 背景

旧版光照渲染虽然已经做过对象池、空间索引和 LUT 优化，但在“战斗动态光很多”的场景里仍然容易出现卡顿，根因主要有三点：

1. 每个需要阴影的光源都会重新查询挡光体。
2. 每个光源都会单独重建一份 `PixelOcclusionField`。
3. 当光源既受墙体又受物体挡光时，同一盏灯还会重复走两次遮挡场构建和射线追踪。

这在子弹、枪口火光、车灯、警灯和粒子同时出现时，会让 `LightingRender` 出现明显尖峰。

## 目标

- 优先降低战斗场景中的 `LightingRender` CPU 开销。
- 保住“关键光源不穿墙”的核心视觉语义。
- 允许低优先级、短生命周期动态光走更便宜的近似路径。

## 方案

### 1. 光源分为三条渲染路径

- `none`
  - 不查询挡光体，不构建遮挡场。
  - 直接绘制径向发光。
  - 锥形灯仅使用 cheap 扇形裁切。
- `walls`
  - 只受墙体/门影响。
  - 复用本帧统一构建的墙体遮挡场。
- `all`
  - 受墙体、静态物体、动态实体共同影响。
  - 在墙体场基础上复制一份工作场，仅叠加当前光源附近的额外遮挡。

### 2. 光源增加“阴影偏好”元数据

`LightEmitterRegistry` 为发光体补充以下字段：

- `preferredShadowMode`
- `lifetimeClass`
- `allowCheapRender`
- `minQualityForWallsShadow`

用途：

- 静态灯、传送门等关键灯优先保留 `all`。
- 车辆前灯优先走 `walls`。
- 子弹、枪口火光、粒子等瞬时光默认走 `none`，只给极少数高优先级弹体保留在高质量档下的墙体阴影资格。

### 3. `LightSystem` 做预算分配

`LightSystem` 不再只决定“这盏灯是否可见”，还会在进入渲染前决定它的成本档位：

- `hero` -> `shadowMode = all`
- `standard` -> `shadowMode = walls`
- `cheap` -> `shadowMode = none`

每个质量档新增预算：

- `maxAllShadowLights`
- `maxWallShadowLights`
- `maxCheapLights`
- `allowShadowedTransientLights`

这样自动降档时，不仅会降低 `bufferScale/shadowRays`，还会直接减少昂贵阴影光的数量。

### 4. `ShadowCasterBuilder` 改成分层查询

静态遮挡拆成两类：

- 墙/门索引
- 普通物体索引

新增查询接口：

- `queryWallsInRadius()`
- `queryObjectsInRadius()`
- `queryDynamicInRadius()`

渲染器不再每灯拿到全量挡光体后再做二次分类。

### 5. `PixelOcclusionField` 支持快速复制

新增 `copyFrom()`，用于：

1. 先构建“墙体基础场”
2. 对 `all` 光复制成“工作场”
3. 仅叠加当前灯附近的额外遮挡

这样最重的墙体光栅化从“每灯一次”变成了“每帧一次”。

## 实现结果

核心文件变更：

- `src/core/lighting/LightingConfig.js`
- `src/core/lighting/LightEmitterRegistry.js`
- `src/core/lighting/LightSystem.js`
- `src/core/lighting/ShadowCasterBuilder.js`
- `src/core/lighting/PixelOcclusionField.js`
- `src/core/lighting/LightBufferRenderer.js`

文档同步：

- `docs/TECH_OVERVIEW.md`

## 兼容性说明

- 旧的质量档（`high/medium/low`）名称保持不变。
- 旧的发光注册接口不需要外部系统改调用方式。
- 光照系统仍遵守“关键光源不穿墙”的规则。
- 低优先级战斗动态光可能不再精确受家具或角色遮挡，这是本次性能优先策略的有意取舍。

## 回归验证建议

重点观察以下场景：

1. 室内多灯 + 门口切换遮挡。
2. 高并发战斗（子弹、枪口火光、粒子、车灯同屏）。
3. 警车警灯、车辆前灯和传送门等关键光源。
4. 玩家/敌人/车辆靠近复杂家具时的遮挡边缘。

重点关注：

- `LightingRender` 平均耗时与尖峰是否下降。
- 是否出现明显穿墙、漏光或过度裁切。
- 自动质量降档是否更少触发，或同样场景下触发更晚。
