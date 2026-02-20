# 像素光影系统（Pixel Lighting）

## 目标

为游戏提供“电影沉浸感”光照效果，并保持中端设备 60FPS 可运行：

- 不是简单全屏明暗，而是局部光源 + 遮挡阴影 + 像素化光线终点。
- 自动扫描可发光对象与战斗特效，减少手动维护成本。
- 具备预算与质量自适应能力，避免高并发战斗下掉帧失控。

## 代码结构

新增目录：`src/core/lighting/`

- `LightSystem.js`
  - 光照主协调器。
  - 负责静态/动态发光体收集、优先级裁剪、可见性裁剪、质量自适应。
- `LightEmitterRegistry.js`
  - 发光规则注册中心。
  - 根据 object / bullet / particle / portal 类型映射光源参数。
- `ShadowCasterBuilder.js`
  - 从 `walls + breakableObjects.getHurtboxes()` 构建遮挡体缓存（与子弹命中判定一致）。
  - 仅在哈希变化时重建，减少重复计算。
- `LightBufferRenderer.js`
  - 离屏低分辨率光照缓冲渲染。
  - 使用 `multiply + lighter` 合成到主画布。
- `LightingConfig.js`
  - 质量档配置（high / medium / low）。

## 集成点

- `src/core/Game.js`
  - 构造时创建 `LightSystem`。
  - 在 `update()` 中增加 `LightingUpdate` 采样：
    - 发光体扫描
    - 遮挡缓存检查
    - 预算裁剪
- `src/core/Renderer.js`
  - 在世界绘制完成后、Debug/UI 之前执行 `LightingRender`：
    - 绘制离屏光照缓冲
    - 合成到世界画面

## 光源扫描策略

### 静态光源（低频更新）

- `floor_lamp`: 主暖光源，支持阴影。
- `fish_tank`: 冷色弱光，支持阴影。
- `explosive_barrel`: 低亮红色警示光。
- `portal`: 中心 + 外圈双层光。

### 动态光源（每帧更新）

- 玩家/敌人枪口火光（`HandSystem.showFlash` / `EnemyHandSystem.showFlash`）。
- 子弹类型映射（`rocket/flame/laser_beam/lightning/plasma/acid/railgun/...`）。
- 粒子类型映射（`flash/fire/laser_beam/lightning_arc`）。
- 持续区域（`blackHoles`、`acidPuddles`）。
- 玩家弱环境补光（保证暗场可读性）。

## 阴影与像素光线

- 每个可投影光源按离散角度发射射线。
- 射线与遮挡矩形（AABB）求交，取最近命中点。
- 由命中点构建可见多边形并裁剪光照绘制区域。
- 光照缓冲按低分辨率渲染并放大回贴，保持像素风格。

## 性能策略

### 预算控制

`medium` 默认配置（当前）

- `bufferScale = 0.35`
- `shadowRays = 80`
- `maxTotalLights = 56`
- `maxDynamicLights = 24`
- `maxStaticLights = 40`
- `maxParticleLights = 12`
- `maxBlockersPerLight = 64`

### 静态缓存

- 遮挡体通过哈希检测变化后才重建。
- 静态光源按 `staticUpdateInterval` 分帧更新。

### 自适应降级

- 根据 `LightingRender` 耗时自动调档（high/medium/low）。
- 超预算持续若干帧后降档，低预算持续若干帧后升档。

## Profiler 标签

新增两个标签：

- `LightingUpdate`
- `LightingRender`

可用于区分“逻辑扫描开销”和“绘制合成开销”。

## 当前默认视觉方向

- 风格：电影沉浸
- 设备目标：中端机 60FPS
- 范围：第一版不包含昼夜循环

## 后续可扩展

- 室内/室外环境光分区。
- 时间系统驱动的昼夜色温曲线。
- 可编辑光照调试面板（运行时调半径、射线数、预算）。
