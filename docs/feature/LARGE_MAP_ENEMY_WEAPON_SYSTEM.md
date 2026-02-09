# 大地图与敌人武器实例系统

## 目标

本特性将 `game` 场景从小地图扩展到大地图，并同步调整建筑密度、敌人生成行为与武器掉落逻辑：

1. 地图宽高各扩大一倍（`50x50 -> 100x100`）。
2. 建筑数量随地图扩大（`2~4 -> 6~12`）。
3. 非僵尸敌人（Hunter / Soldier）大部分在室内出生（默认 70%）。
4. 非僵尸敌人可开门，也可破坏阻挡物。
5. 士兵随机携带任意枪械（排除 `hammer`、`boomerang`）。
6. 玩家开局仅有一把手枪。
7. 击杀非僵尸有概率掉落其当前持枪（默认 30%）。
8. 弹药按武器实例保存，同型号多把枪弹药互不共享。

---

## 核心改动

## 1. 地图规模与建筑密度

- `src/utils/Constants.js`
  - `MAP_WIDTH = 100`
  - `MAP_HEIGHT = 100`
- `src/core/systems/generation/GenerationConfig.js`
  - `buildings.minCount = 6`
  - `buildings.maxCount = 12`

## 2. 室内出生点元数据

- `src/core/systems/generation/ConstructionLayoutGenerator.js`
  - 新增室内可用格采集逻辑（排除墙、门、家具占用）。
  - 在生成结果中追加 `meta.indoorSpawnTiles`。

## 3. WorldSystem 敌人生成与掉落

- `src/core/systems/WorldSystem.js`
  - 记录 `generatedLayoutMeta`，用于 `game` 场景刷怪分布。
  - `spawnGameEncounters()` 中，Hunter/Soldier 使用室内优先刷怪（70%）。
  - `spawnEnemy()` 支持指定格子/坐标刷怪，并做阻挡校验。
  - 士兵刷怪时随机选枪并初始化其持枪信息。
  - 非僵尸死亡时按概率掉落其当前持枪（含实例弹药数据）。
  - 路径受阻且目标为门时，非僵尸优先开门；否则继续破坏阻挡物。

## 4. 敌人持枪信息

- `src/core/entities/Hunter.js`
  - 增加 `weaponConfigId / weaponItemId / weaponInstanceData`。
  - 提供 `setCombatWeapon()`，射击参数随武器配置更新。
  - 标记为非僵尸并启用开门能力。
- `src/core/entities/Soldier.js`
  - 增加同类持枪信息与 `setCombatWeapon()`。
  - 刷怪后可配置随机武器并同步点射参数。

## 5. 武器实例化弹药系统

- 新增：`src/core/systems/WeaponInstanceUtils.js`
  - `weaponConfigIdFromItemId()`
  - `weaponItemIdFromConfigId()`
  - `createWeaponAmmoState()`
  - `createWeaponInstanceData()`
  - `cloneWeaponInstanceData()`

- `src/core/systems/InventorySystem.js`
  - 武器入包自动生成唯一实例（`weaponInstanceId` + `ammo`）。
  - 提供 `ensureWeaponInstanceForSlot()`。
  - 提供 `updateWeaponInstanceState()` 用于实时回写弹药。
  - 掉落时深拷贝实例数据，避免引用污染。

- `src/core/HandSystem.js`
  - 改为维护当前装备武器实例弹药状态。
  - 开火/换弹/切枪时回写到 Inventory 对应实例。

- `src/core/systems/PlayerSystem.js`
  - 绑定 `HandSystem` 与 `InventorySystem` 的实例状态同步。
  - 装备武器时从选中槽加载实例弹药。
  - 空手槽位时切换为 `hammer`（不再赠送隐式手枪弹药）。

- `src/core/entities/DroppedItem.js`
  - 改用统一映射工具解析 `itemId -> weaponConfigId`。

## 6. 开局武器

- `src/core/Game.js`
  - 删除多武器开局注入，改为仅 `weapon:pistol`。
  - 游戏启动时立即同步一次选中武器到 HandSystem。

---

## 验收要点

1. 进入 `game` 地图，边界与可探索面积明显扩大到原来的 4 倍面积。
2. 单局建筑数量落在 `6~12`。
3. Hunter/Soldier 多数生成在建筑内（约 70%）。
4. 非僵尸遇门受阻时能开门，不会长期堵门发呆。
5. 不同 Soldier 持枪外观/射击参数不同。
6. 非僵尸死亡约 30% 掉落其持枪。
7. 背包中两把同型号枪切换射击后，弹药值彼此独立。
