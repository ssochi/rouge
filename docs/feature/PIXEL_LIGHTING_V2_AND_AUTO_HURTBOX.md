# 像素光照 V2 与自动 Hurtbox 方案

## 1. 背景

本次迭代聚焦三个问题：

1. 光线可被物体遮挡，但遮挡物自身几乎不受光。
2. 阴影计算基于矩形 AABB，和大量不规则素材不匹配。
3. 子弹碰撞盒长期依赖各 object 手工维护，成本高且容易漂移。

## 2. 目标

1. 光照遮挡升级为像素级，贴合素材 alpha 形状。
2. 遮挡物在朝光轮廓上能看到稳定受光。
3. 除门 (`door_h/door_v`) 外，可破坏物 hurtbox 自动生成，不再手调。

## 3. 方案

### 3.1 光照系统

- 新增 `PixelOcclusionField`：
  - 将候选遮挡体光栅化到光照缓冲分辨率网格。
  - 射线采用像素步进（ray march）而非 AABB 求交。
- `ShadowCasterBuilder` 输出改为混合遮挡源：
  - 墙体矩形遮挡。
  - 物体精灵 alpha 遮挡（当前显示帧形状，非动画并集）。
- `LightBufferRenderer`：
  - 射线进入遮挡像素后继续步进，离开连续遮挡区时停在最后一个遮挡像素，确保遮挡像素自身受光且不向背后非像素区域传播。
  - 对射线命中的轮廓点支持可选补光；当前默认关闭以避免背光面不规则光晕。

### 3.2 自动 Hurtbox

- 新增共享缓存 `SpriteMaskCache`（`src/core/shared/`）：
  - 提供每帧 alpha mask、轮廓采样、动画并集最小包围盒。
- `BreakableObject.getHurtboxes()` 规则：
  - `door_h/door_v`：继续使用手工规则（开关门多碰撞盒）。
  - 其他类型：优先使用素材 alpha 的当前帧最小包围盒；缺失时回退动画并集最小包围盒。
- `BulletSystem` 候选筛选补强：
  - 对索引中缺失（如移动 hitbox 为 0）的物体，追加 hurtbox AABB 兜底候选，确保不会漏判。

## 4. 关键改动文件

- `src/core/shared/SpriteMaskCache.js`（新增）
- `src/core/lighting/PixelOcclusionField.js`（新增）
- `src/core/lighting/ShadowCasterBuilder.js`
- `src/core/lighting/LightBufferRenderer.js`
- `src/core/entities/BreakableObject.js`
- `src/core/systems/BulletSystem.js`
- `src/core/Game.js`（光照默认质量改为 `high`）

## 5. 验收点

1. 非规则物体（树、家具、复杂轮廓）投影不再是单一矩形阴影。
2. 遮挡物靠光一侧可见受光，不再“黑块挡光”。
3. Debug hurtbox 与子弹判定一致，除门外无需手工 `getHurtbox/getHurtboxes`。
4. `npm run build` 通过。

## 6. 风险与边界

1. 逐像素遮挡计算开销高于 AABB；当前默认 `high` 画质并启用自适应调档兜底。
2. 自动 hurtbox 会改变历史手感（尤其植被/装饰物）；本次按“统一自动化”优先，不做旧配置兼容分支。
