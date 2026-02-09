# 子弹命中稳定性修复方案

## 0. 实施状态（2026-02-09）

- 已实现敌人统一受击框接口：`Enemy.getBulletHurtbox()`。
- 已实现 `CombatSystem` 改造：敌人命中判定统一读取 `getBulletHurtbox()`。
- 已实现 `CollisionUtils.lineIntersectsLine()` 容差闭区间判定，降低边界漏判。
- 已实现调试三态切换：`P` 一次显示碰撞框，`P` 二次显示受击框，`P` 三次关闭。
- 已修正敌人受击框底部对齐（覆盖脚部区域），避免底部漏判。
- 已给玩家新增受击框接口，敌方子弹命中判定与受击框调试显示统一使用该接口。

## 1. 背景与问题定义

玩家反馈：子弹攻击敌人时，存在“明明瞄准了却经常打不中”的现象，尤其在擦边、打下半身、敌人移动时更明显。  
本方案目标是提升“子弹-敌人”命中判定的一致性与可预期性，减少体感漏判。

---

## 2. 现状证据（代码定位）

### 2.1 敌人被子弹命中判定使用的矩形
`src/core/systems/CombatSystem.js:234-241` 当前使用：
- `x = e.x - e.width / 2`
- `y = e.y - e.height`
- `width = e.width`
- `height = e.height`

也就是以 `e.x/e.y` 为底部参考，向上扩展一个“整身高矩形”来判定子弹命中。

### 2.2 敌人实体本身又定义了另一套命中框语义
`src/core/entities/Enemy.js:8-11`：
- `hitboxWidth = 14`
- `hitboxHeight = 8`
- `hitboxOffsetY = 12`

这是一套“脚底区域”的命中框定义。

### 2.3 Debug 可视化画的是 hitbox，而不是 CombatSystem 使用的 eRect
`src/core/Renderer.js:472-481` Debug 橙框绘制使用 `hitboxWidth/hitboxHeight/hitboxOffsetY`。  
因此开发时看到的敌人命中框，与实际子弹判定框并不一致。

### 2.4 线段与边的相交判定为严格开区间
`src/utils/CollisionUtils.js:36`：
- `return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);`

这会漏掉端点命中/边界接触（`lambda` 或 `gamma` 恰好接近 0/1 的情况）。

---

## 3. 根因分析

## 3.1 命中框语义不统一（主因）
- 敌人逻辑中同时存在 `eRect`（CombatSystem 临时矩形）与 `hitbox`（Enemy 定义）两套语义。
- 子弹判定、Debug 显示、实体碰撞并不共用同一来源，造成“视觉与实际命中不一致”。
- 玩家在脚部/边缘瞄准时，最容易体感“漏判”。

## 3.2 线段边界命中被过滤（高概率漏判来源）
- 子弹使用线段 CCD（上一帧点到当前帧点）本身方向正确。
- 但线段-线段判定采用严格开区间，边缘接触被当作未命中。
- 高速子弹、细小目标、整数像素边界上更容易触发。

## 3.3 多模型并存导致调试失真（放大问题）
- 开发者依据 Debug 橙框调参，但 CombatSystem 实际不是该框。
- 导致“看起来命中了但没伤害”的排查成本大、反馈反复。

---

## 4. 修复目标

1. 子弹命中判定与调试显示使用同一套“敌人受击框”定义。
2. 边界/端点接触也可稳定命中，降低擦边漏判。
3. 修复后不引入明显误判（如隔墙命中、过度膨胀命中框）。

---

## 5. 方案设计

## 5.1 统一敌人受击框接口（P0）

在 `Enemy` 基类新增统一接口（建议命名）：
- `getBulletHurtbox() -> { x, y, width, height }`

规则：
- 该接口明确返回“用于子弹命中的唯一矩形”。
- `CombatSystem.updateBullets()` 不再手写 `eRect`，统一调用 `e.getBulletHurtbox()`。
- `Renderer` Debug 增加同源可视化（见 5.3）。

推荐默认实现（与当前视觉更一致）：
- 采用身体主体矩形，避免只打脚底：
  - `x = this.x - this.width / 2`
  - `y = this.y - this.height`
  - `width = this.width`
  - `height = this.height`

说明：
- 当前 `hitboxWidth/hitboxHeight` 仍可继续用于“移动/阻挡碰撞”，不强制与受击框完全一致。
- 但“受击框来源必须唯一”。

## 5.2 放宽线段边界判定（P0）

在 `CollisionUtils.lineIntersectsLine()` 中：
- 将严格开区间改为含边界并引入容差 `epsilon`。
- 判定建议：
  - `lambda >= -eps && lambda <= 1 + eps`
  - `gamma >= -eps && gamma <= 1 + eps`
- `eps` 推荐默认 `1e-6`。

目的：
- 接受端点接触与浮点误差附近的边缘命中。
- 维持原有 CCD 路径，不改判定模型。

## 5.3 Debug 命中框可视化对齐（P1）

在 `Renderer.drawDebug()` 中新增/替换敌人受击框绘制：
- 优先绘制 `e.getBulletHurtbox()`（例如黄色）。
- 保留原碰撞 hitbox（橙色）用于移动碰撞调试（可选）。

这样可以同时观察：
- 移动阻挡框
- 子弹受击框

---

## 6. 实施清单

1. `src/core/entities/Enemy.js`
- 新增 `getBulletHurtbox()`（默认实现）。

2. `src/core/systems/CombatSystem.js`
- 将敌人命中判定的 `eRect` 改为调用 `getBulletHurtbox()`。
- 保持穿透逻辑与伤害流程不变。

3. `src/utils/CollisionUtils.js`
- 更新 `lineIntersectsLine()` 的边界判定为含容差闭区间。

4. `src/core/Renderer.js`
- Debug 模式绘制 bullet hurtbox（与 CombatSystem 同源）。

5. 文档同步
- 更新 `docs/TECH_OVERVIEW.md`（CombatSystem 子弹命中框与调试约定）。

---

## 7. 验收标准

## 7.1 功能验收
1. 固定距离对静止敌人连射 100 发，命中率稳定，无明显“穿模漏判”。
2. 瞄准敌人边缘与下半身时，命中率不再异常偏低。
3. Debug 显示的受击框与实际伤害触发区域一致。

## 7.2 回归验收
1. 墙体阻挡与物体阻挡逻辑无退化。
2. 穿透弹（sniper/crossbow）仍可正常穿透并衰减。
3. rocket/grenade 的爆炸触发逻辑不受影响。
4. 玩家被敌方子弹命中逻辑不受影响。

## 7.3 构建验收
- 完成改造后执行 `npm run build` 必须通过。

---

## 8. 风险与应对

1. **风险：命中率提升导致战斗难度变化**
- 应对：将敌人 HP 或武器伤害微调作为后续平衡项，不在本次功能修复耦合处理。

2. **风险：闭区间判定引发少量误命中**
- 应对：通过 `epsilon` 控制（默认极小值），并在回归用例中关注隔墙误判。

---

## 9. 里程碑建议

1. M1（半天）：完成 P0 代码改造与自测。  
2. M2（半天）：完成 Debug 可视化与回归验证。  
3. M3（半天）：完成参数微调与文档更新。
