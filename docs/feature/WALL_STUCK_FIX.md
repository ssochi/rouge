# 角色卡墙/卡边问题修复方案

## 0.1 实施状态（2026-02-09）

- 已实现玩家与怪物统一移动碰撞接口：`getMovementHitboxAt(x, y)`。
- 已在 `WorldSystem` 增加统一阻挡查询与移动解析：
  - `getEntityMovementRect`
  - `isRectBlocked`
  - `isEntityBlockedAt`
  - `resolveEntityMovement`
  - `unstuckEntity`
- 已将玩家移动接入统一移动解析，启用滑动 + stuck 检测 + 自动脱困。
- 已将怪物导航尺寸改为脚底碰撞体尺寸，并将怪物移动接入统一移动解析。
- 已将怪物互相分离改为“候选位 + 阻挡校验”，避免被推入墙内。
- 已实现门关闭预检（阻挡时拒绝关闭）与关门后统一脱困，失败自动回滚开门。

## 0. 文档目标

本方案聚焦修复以下问题：
- 玩家与怪物在墙体/门框/墙角附近卡住。
- 怪物被挤进墙内或卡在障碍边缘抖动。
- 门开关后实体被夹住，无法恢复移动。

### 非目标（明确排除）
- **不处理随机出生点可行性校验**（按需求排除）。

---

## 1. 现状与问题证据

## 1.1 玩家与怪物移动碰撞体不一致

- 玩家移动由 `WorldSystem.resolveWallCollision()` 处理，使用 `hitboxWidth/hitboxHeight/hitboxOffsetY`（脚底碰撞体）。
  - 参考：`src/core/systems/WorldSystem.js`
- 怪物移动在 `Enemy.resolveWallCollision()` 内部处理，使用 `width/height`（整身矩形）。
  - 参考：`src/core/entities/Enemy.js`
- 导致同类实体（玩家/怪物）在同一地形上的“可通行行为”不一致，靠墙或门框时容易出现不同步卡顿。

## 1.2 导航试探尺寸与怪物真实移动碰撞尺寸不一致

- 怪物导航方向筛选来自 `NavigationGrid.findNavigableDirection(x, y, width, height, ...)`。
- 当前调用传入 `enemy.width/enemy.height`，而非脚底碰撞体。
  - 参考：`src/core/systems/WorldSystem.js` 中 `getNavDirection` 调用。
- 导致“导航认为可走，但真实碰撞被挡住”，出现贴墙振荡、原地踏步。

## 1.3 怪物分离逻辑直接改坐标，未做可行性校验

- 敌人互相分离时直接修改 `e1.x/y`、`e2.x/y`，没有做墙体/障碍二次碰撞检查。
  - 参考：`src/core/systems/WorldSystem.js` 敌人分离段。
- 高密度怪群靠墙时会被推入障碍内部，再触发后续卡住。

## 1.4 怪物碰撞查询未优先使用多碰撞体

- `updateEnemies()` 的 `wallQuery` 对 breakable 对象只读取 `obj.getHitbox()`，没有优先 `getHitboxes()`。
  - 参考：`src/core/systems/WorldSystem.js`
- 对于门开启态、墙体自适应形状等多段碰撞体，查询与真实阻挡形状可能不一致，放大边缘卡顿。

## 1.5 门交互脱困逻辑缺少目标合法性验证

- `PlayerSystem.resolveDoorStuck()` 在推离实体时直接设坐标，未验证目标点是否仍与其他阻挡重叠。
  - 参考：`src/core/systems/PlayerSystem.js`
- 会出现“从门框卡住 -> 被推到另一堵墙里 -> 继续卡住”的连锁问题。

## 1.6 缺少统一“卡住检测 + 自动脱困”流程

- 当前系统仅有“碰撞则阻止移动”，缺少 stuck 状态识别与恢复路径（最近安全点/附近可行点搜索）。
- 一旦进入几何死角，可能长期无法恢复移动。

---

## 2. 修复目标

1. 统一玩家/怪物移动碰撞语义，保证同类逻辑一致。
2. 导航试探与实际碰撞一致，减少贴墙抖动。
3. 提供稳定的自动脱困机制，避免永久卡死。
4. 门交互前后保证实体不会被夹进阻挡体。

---

## 3. 方案设计

## 3.1 统一移动碰撞体接口（核心）

新增统一接口（玩家/怪物均实现）：

```js
getMovementHitboxAt(x, y) => { x, y, width, height }
```

规则：
- 该接口返回“移动/物理碰撞体”（脚底占地）。
- 玩家与怪物移动、导航试探、脱困检测全部使用此接口。

实现建议：
- 玩家：基于 `hitboxWidth/hitboxHeight/hitboxOffsetY` 计算。
- 怪物：同样改为脚底碰撞体（与玩家同语义），不再用 `width/height` 做移动碰撞。

---

## 3.2 WorldSystem 收敛为唯一碰撞查询入口

新增统一查询方法：

1. `getEntityMovementRect(entity, x, y)`
2. `isRectBlocked(rect, options)`
3. `isEntityBlockedAt(entity, x, y, options)`

`isRectBlocked` 内部统一处理：
- 地图墙体：`navGrid.isWallRectCollision(rect)`
- breakable 对象：优先 `obj.getHitboxes()`，回退 `obj.getHitbox()`
- 可选排除参数（例如门交互预测时忽略目标门自身）

效果：
- 玩家、怪物、门交互、脱困逻辑不再各自实现一套判定。

---

## 3.3 统一移动解析（替换现有分散 resolve）

新增 `resolveEntityMovement(entity, targetX, targetY, intentX, intentY)`：

流程：
1. 尝试整步移动到 `(targetX, targetY)`。
2. 若失败，按“主轴优先”尝试滑动：
   - 若 `|intentX| >= |intentY|`：先 X 后 Y；
   - 否则先 Y 后 X。
3. 若仍失败，尝试小步降级（例如 50% 步长）。
4. 若连续多帧失败触发 stuck 检测，调用 `unstuckEntity()`。

玩家与怪物都通过此流程移动，避免行为分叉。

---

## 3.4 卡住检测与自动脱困

为可移动实体增加运行态字段：
- `stuckFrames`
- `lastSafePos`

判定条件（默认）：
- 有移动意图且连续 8 帧位移不足 `0.1` 像素 => 视为卡住。

脱困策略：
1. 以当前点为中心，8 向环形搜索可行点（半径 2 到 48，步长 2）。
2. 选最短位移且可通行的位置。
3. 若搜索失败，回退到 `lastSafePos`。

---

## 3.5 门交互防夹与恢复

在门从开到关时，增加“关闭预检”：
- 计算门关闭后的碰撞体；
- 检查玩家+附近怪物是否会与之重叠；
- 若会重叠，拒绝关闭（保持开门），并提示阻挡中。

对已发生的夹住场景：
- `resolveDoorStuck()` 改为调用 `WorldSystem.unstuckEntity()`；
- 推离结果必须通过 `isEntityBlockedAt` 验证才可落点。

---

## 3.6 敌人分离改造

当前分离直接改坐标，改为：
1. 先计算候选分离位；
2. 分别校验候选位是否可通行；
3. 只应用可通行位，若都不可行则缩小 push 或跳过本帧分离。

这样不会把怪物推入墙体或门内。

---

## 4. 文件改造清单

1. `src/core/entities/Enemy.js`
- 新增 `getMovementHitboxAt(x, y)`。
- 废弃或代理现有 `resolveWallCollision()` 到 WorldSystem 统一移动流程。

2. `src/core/Game.js`
- 为玩家挂载 `getMovementHitboxAt(x, y)`（与玩家现有 hitbox 参数一致）。

3. `src/core/systems/WorldSystem.js`
- 新增 `getEntityMovementRect/isRectBlocked/isEntityBlockedAt/resolveEntityMovement/unstuckEntity`。
- `updateEnemies()` 的 `wallQuery` 改为使用统一查询并支持 `getHitboxes()`。
- 敌人分离改为“候选位 + 校验”流程。

4. `src/core/systems/PlayerSystem.js`
- `resolveMove()` 切换到 `WorldSystem.resolveEntityMovement()`。
- `resolveDoorStuck()` 改为调用统一脱困接口。
- 门交互增加“关闭预检”。

5. `src/core/systems/NavigationGrid.js`（或其调用侧）
- 导航试探使用移动碰撞体尺寸，而不是 `width/height`。

6. 文档
- 更新 `docs/COLLISION_GUIDE.md`：补充“移动碰撞统一接口”和“调试模式含脱困语义”。
- 更新 `docs/TECH_OVERVIEW.md`：同步 WorldSystem 新职责。

---

## 5. 验收标准与测试矩阵

## 5.1 玩家场景
1. 玩家贴墙斜向移动：可稳定沿墙滑动，不原地抖动。
2. 玩家冲向墙角：不会卡死，方向调整后可脱离。
3. 玩家在门边开关门：不会被夹进门框；阻挡时关门被拒绝。

## 5.2 怪物场景
1. 多怪靠墙追击：不会因互推进入墙内。
2. 怪物经过门框/窄口：偶发卡顿可在短帧内自动恢复。
3. 怪物在墙角聚集：无持续抖动和“贴边锁死”。

## 5.3 回归场景
1. 玩家/怪物正常移动速度与手感不明显退化。
2. 现有战斗判定逻辑不受影响。
3. 地图边界碰撞正常，门/墙/家具阻挡符合预期。

## 5.4 构建验收
- 完成开发后执行 `npm run build` 必须通过。

---

## 6. 风险与缓解

1. 风险：碰撞体统一后可能改变通道通过性。
- 缓解：保持玩家与怪物脚底碰撞尺寸一致且可配置，必要时小幅调参。

2. 风险：自动脱困可能带来“瞬移感”。
- 缓解：优先小半径、短位移搜索；仅在 stuck 条件成立后触发。

3. 风险：门关闭预检可能导致“总是关不上”的体验。
- 缓解：只检测门附近实体，且给出明确提示文本。

---

## 7. 里程碑

1. P0（必做）：统一移动碰撞接口 + 统一阻挡查询 + 导航一致性 + 门防夹 + 基础脱困。  
2. P1（增强）：敌人分离安全化 + 调试信息增强（stuck 状态可视化）。  
3. P2（优化）：参数调优与性能压测。
