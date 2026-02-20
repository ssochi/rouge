# 像素光影系统（Pixel Lighting）

## 目标

为游戏提供具备遮挡关系的像素风光照，并保证在高并发战斗中仍可用：

- 局部光源 + 阴影遮挡 + 彩色光晕。
- 遮挡几何与物体素材形状一致（基于 alpha 像素）。
- 避免“物体只能挡光但自身不受光”的视觉断层。

## 当前实现结构

目录：`src/core/lighting/`

- `LightSystem.js`
  - 光照主协调器。
  - 负责静态/动态发光体收集、可见性裁剪、预算与质量自适应。
- `LightEmitterRegistry.js`
  - 发光规则注册中心。
  - 根据 object / bullet / particle / portal 类型映射光源参数。
- `ShadowCasterBuilder.js`
  - 构建遮挡源缓存（墙体矩形 + 物体精灵 alpha 遮挡数据）。
  - 物体遮挡默认使用**当前显示帧**的 alpha mask（非动画并集）。
  - 仅在障碍状态哈希变化时重建。
- `PixelOcclusionField.js`
  - 低分辨率光照缓冲上的像素遮挡场。
  - 提供遮挡光栅化与射线步进求交。
- `LightBufferRenderer.js`
  - 离屏低分辨率渲染与合成（`multiply + lighter`）。
  - 负责逐像素射线可见域、主光/辉光叠加；轮廓补光为可选项（当前默认关闭）。
- `LightingConfig.js`
  - high / medium / low 质量档参数（含 `enableContourGlow` 开关）。

共享缓存：`src/core/shared/SpriteMaskCache.js`

- 提供物体精灵 alpha 分析结果：帧 mask、轮廓采样、动画并集最小包围盒。
- 被光照遮挡构建和可破坏物自动 hurtbox 共用。

## 集成点

- `src/core/Game.js`
  - 构造时创建 `LightSystem`（当前默认画质：`high`）。
  - 在 `update()` 中执行 `LightingUpdate`。
- `src/core/Renderer.js`
  - 世界绘制结束、Debug/UI 之前执行 `LightingRender`。

## 阴影算法（当前）

1. 按光源半径查询遮挡候选（墙体 + 物体）。
2. 将候选遮挡体光栅化到 `PixelOcclusionField`。
3. 以离散角度发射射线，在遮挡场中逐像素步进：
   - 命中第一个遮挡像素即停止（首命中），避免背光侧漏光缝与重叠体 owner 切换伪影。
4. 用所有终点构造可见多边形，裁剪主光与辉光绘制。
5. 可选：对命中轮廓点补光（当前默认关闭，用于避免背光面不规则光晕）。

该流程解决了：

- 非规则物体阴影仍是矩形的问题（现为像素轮廓级）。
- 遮挡物只挡光不受光的问题（可通过开启轮廓补光增强；当前为关闭状态以优先稳定画面）。

## 光源扫描策略

### 静态光源（低频更新）

- `floor_lamp`: 主暖光源，支持阴影。
- `fish_tank`: 冷色弱光，支持阴影。
- `explosive_barrel`: 红色警示光。
- `portal`: 中心 + 外圈双层光。

### 动态光源（每帧更新）

- 玩家/敌人枪口火光。
- 子弹发光映射（`rocket/flame/lightning/plasma/acid/railgun/...`）。
- 粒子发光映射（`flash/fire/laser_beam/lightning_arc`）。
- 持续区域（`blackHoles`、`acidPuddles`）。
- 玩家补光（暗场可读性保障）。

## 性能策略

### 预算控制

默认参数（`high`）：

- `bufferScale = 0.45`
- `shadowRays = 112`
- `maxTotalLights = 72`
- `maxDynamicLights = 32`
- `maxStaticLights = 56`
- `maxParticleLights = 20`
- `maxBlockersPerLight = 320`

### 缓存策略

- 遮挡源哈希变化时才重建缓存。
- 精灵 alpha 分析结果按类型缓存，避免重复 `getImageData`。
- 静态光源按 `staticUpdateInterval` 分帧刷新。

### 自适应调档

- 按 `LightingRender` 开销在 high/medium/low 之间自动升降档。
- 当候选遮挡体超过 `maxBlockersPerLight` 时，按“距光源中心最近”优先裁剪，减少大场景截断伪影。

## Profiler 标签

- `LightingUpdate`
- `LightingRender`

## 后续可扩展

- 室内/室外环境光分区。
- 时间系统驱动的昼夜色温曲线。
- 运行时光照调试面板（射线数、缓冲比例、预算上限）。
