# 电脑光效与房间生成接入方案

## 背景
- 当前 `computer_desk` 已可交互打开 PixelOS，但缺少像素光影系统中的屏幕发光效果。
- 建筑房间家具生成链路未包含 `computer_desk`，导致流程化场景里无法自然刷出电脑桌。

## 目标
1. 为 `computer_desk` 增加稳定、可遮挡的屏幕光效。
2. 让 `computer_desk` 能通过房间家具生成流程出现在建筑房间中。
3. 保持现有交互链路（E 键交互打开 PixelOS）不变。

## 实施范围
- 光源注册：`src/core/lighting/LightEmitterRegistry.js`
- 家具生成配置：`src/core/systems/generation/GenerationConfig.js`
- 技术总览同步：`docs/TECH_OVERVIEW.md`

## 具体方案

### 1) 电脑桌光效
- 在 `OBJECT_LIGHTS` 中新增 `computer_desk` 发光配置：
  - 冷色屏幕光：`#7ec8ff`
  - 半径：`88`
  - 强度：`0.58`
  - 轻微闪烁：`0.025`
  - 开启遮挡：`castsShadows: true`
  - 忽略自遮挡：`ignoreSelfShadow: true`
- 光源中心偏移定位在显示器区域，保证视觉上来自屏幕而非桌脚。

### 2) 房间内生成电脑桌
- 在 `FURNITURE_CATALOG` 增加：
  - `computer_desk -> [{ type: 'computer_desk', w: 1, h: 1 }]`
- 在 `study` 语义模板中，将必需家具由 `desk` 调整为 `computer_desk`：
  - 保留 `tag: 'desk'`，兼容原有“椅子/盆栽靠近书桌”规则，不影响可选家具逻辑。
- 由于 `construction` 与 `game` 地图共享同一套生成流水线，该改动会同时生效于两类地图。

## 验证点
1. 进入 `construction` / `game` 地图后，书房可生成 `computer_desk`。
2. 电脑桌附近存在蓝色屏幕光晕，且受墙体/物体遮挡影响。
3. 靠近电脑桌按 `E` 仍可打开 PixelOS。

## 兼容性与风险
- 仅新增光源配置与模板项，不改动碰撞、交互或渲染主流程。
- 书房必需家具从普通书桌切换为电脑桌后，视觉主题更统一，但会减少普通 `desk` 在书房中的出现频率。
