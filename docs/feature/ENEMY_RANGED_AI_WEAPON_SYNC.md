# 远程敌人射击行为与武器数值同步

## 背景
可射击敌人（`Hunter` / `Soldier`）原有 3 个问题：
1. 即使枪口到玩家被墙/门阻挡，仍会原地射击。
2. 存在“距离玩家过近就后退”的行为，和期望不符。
3. 射击与换弹没有严格使用武器配置（`fireRate`、`magazineSize`、`maxReserve`、`reloadTime`）。

本次同时补充 UI 要求：敌人换弹时，头顶显示换弹进度条。

## 目标
1. 敌人在 LOS（Line of Sight）被阻挡时优先绕路，不盲射。
2. 移除远程敌人后退逻辑。
3. 敌人与玩家共享同一套武器核心数值语义（射速、弹夹、备弹、换弹）。
4. 敌人头顶显示换弹进度 UI，并与血条可同时展示。

## 方案

### 1. 新增武器控制层
- 新文件：`src/core/systems/EnemyWeaponController.js`
- 职责：
  - 管理敌人当前武器实例弹药状态（`currentAmmo/reserveAmmo`）。
  - 管理换弹状态（`isReloading/reloadStartAt/reloadEndAt`）。
  - 管理射速节流（`nextShotAt`）。
  - 统一处理敌人开火前判定并回写 `enemy.weaponInstanceData.ammo`。

### 2. Hunter 行为调整
- 文件：`src/core/entities/Hunter.js`
- 调整内容：
  - 删除“过近后退”分支。
  - 当 `CombatSystem.canShootFrom(...)` 为 `false` 时，切换为追击绕路，不射击。
  - 开火逻辑改为 `EnemyWeaponController.tryFire(...)`，自动扣弹与触发换弹。
  - 头顶新增换弹进度条绘制。

### 3. Soldier 行为调整（保留点射）
- 文件：`src/core/entities/Soldier.js`
- 调整内容：
  - 保留 burst 点射风格，但每发由 `EnemyWeaponController.tryFire(...)` 决定是否可开火。
  - 移除近距离后退逻辑。
  - LOS 被阻挡时中断点射并转为追击绕路。
  - 头顶新增换弹进度条绘制。

## UI 规则
- 换弹条显示条件：`weaponController.isReloading === true`
- 与血条同时出现时采用“双行叠加”：
  - 上方：换弹进度条
  - 下方：血条
- 样式：复用玩家换弹条的子弹形进度表达（缩放后用于敌人头顶）。

## 数据一致性
- 敌人开火/换弹会实时更新 `enemy.weaponInstanceData.ammo`。
- 击杀敌人后掉落武器会继承该实例真实剩余弹药，而非重置为满弹。

## 影响文件
- `src/core/systems/EnemyWeaponController.js`（新增）
- `src/core/entities/Hunter.js`
- `src/core/entities/Soldier.js`
- `docs/TECH_OVERVIEW.md`

## 验收清单
1. 敌人与玩家间有墙/关闭门时，敌人不盲射，会绕路寻线。
2. 远程敌人不再因距离过近而后退。
3. 敌人射击耗尽弹夹后进入换弹，并按武器 `reloadTime` 完成补弹。
4. 敌人换弹期间头顶出现进度条；血条存在时双行同时可见。
5. 击杀后掉落武器弹药与敌人死亡瞬间状态一致。
