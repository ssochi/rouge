# 电脑交互提示文案优化

## 背景
- `computer_desk` 已支持按 `E` 打开 PixelOS，但场景中靠近电脑时缺少明确提示，玩家不易感知可交互性。

## 目标
1. 玩家靠近电脑时显示英文提示：`[E] USE COMPUTER`。
2. 不影响门、传送门等已有对象的提示逻辑。
3. 保持现有电脑交互半径与按键行为不变。

## 实施范围
- `src/core/entities/objects/ComputerDeskObject.js`
- `src/core/entities/BreakableObject.js`
- `docs/TECH_OVERVIEW.md`

## 方案

### 1) 电脑对象增加近距离提示状态
- 在 `ComputerDeskObject.update(obj, player)` 中按距离计算 `obj.showHint`。
- 交互半径与实际交互保持一致：`50` 像素。
- 在 `configure` 中定义提示样式：
  - `hintText = [E] USE COMPUTER`
  - `hintOffsetX = 16`
  - `hintOffsetY = -10`

### 2) 通用可破坏物默认绘制链路支持提示
- 在 `BreakableObject.draw()` 的默认绘制分支末尾新增 `showHint` 渲染：
  - 优先读取对象自定义 `hintText/hintFont/hintColor/hintOffsetX/hintOffsetY`。
  - 无自定义时回退到默认文案 `[E] INTERACT`。
  - 默认样式与现有门/传送门一致：黄色、`bold 7px monospace`、无描边。
- 门对象使用自定义 `draw` 分支，不受该通用逻辑影响。

## 验证点
1. 靠近电脑时显示 `[E] USE COMPUTER`，且样式与门提示一致。
2. 远离电脑后提示消失。
3. 按 `E` 仍可正常打开 PixelOS。
4. 门、传送门等原有提示行为保持不变。
