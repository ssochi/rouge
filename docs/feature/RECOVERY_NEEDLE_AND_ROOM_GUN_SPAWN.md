# 房间随机枪支与恢复针机制

## 1. 目标

本次特性新增两条战利品机制：

1. `game` 地图的室内房间中，以较低概率随机刷出枪支（地面掉落）。
2. 新增消耗品 `恢复针`：
   - 击杀敌人有概率掉落。
   - 作为消耗品进入背包/快捷栏，不属于枪械，不可放置。
   - 选中快捷栏后主角会拿在手上。
   - 鼠标左键使用，恢复生命值并消耗 1 个。

## 2. 数值配置

- 房间刷枪概率：`5%`（每个房间独立判定）。
- 恢复针掉落概率：`8%`（所有敌人统一判定）。
- 恢复针单次恢复：`+35 HP`。
- 满血使用行为：仍然消耗恢复针。
- 恢复针堆叠上限：`5`。

## 3. 设计与实现

### 3.1 物品与手持表现

- `InventorySystem` 新增物品类型：`consumable`。
- 新增道具定义：`consumable:recovery_needle`。
- `PlayerSystem.updateEquippedItem()` 新增 `consumable` 分支：
  - 读取 `holdWeaponKey`（当前为 `recovery_needle`）并通过 `HandSystem.setWeapon()` 显示手持。
- `BuildSystem` 仍只在 `placeable` 类型下激活，因此恢复针不会进入放置模式。

### 3.2 左键使用恢复针

- `PlayerSystem.updatePlayerAimAndAction()` 在左键处理里新增 `consumable` 分流：
  - 单击触发 `useSelectedConsumable()`。
  - 使用 `mousePressed` 做去抖，避免按住时一帧多次消耗。
- `useSelectedConsumable()` 行为：
  1. 从当前快捷栏槽位扣减 1 个恢复针。
  2. 按 `healAmount` 恢复生命（封顶 `maxHp`）。
  3. 扣减后刷新手持状态（数量归零会自动回退到空手锤子状态）。

### 3.3 房间随机刷枪

- 生成器 `ConstructionLayoutGenerator` 的 `meta` 新增 `indoorRooms`（房间级别元信息）。
- `WorldSystem.initGameMap()` 在敌人生成前调用 `spawnRoomWeaponDrops()`：
  - 按房间独立概率判定（5%）。
  - 命中的房间从 `indoorSpawnTiles` 中挑合法位置放置 1 把枪。
  - 枪池排除 `hammer`、`boomerang`、`recovery_needle`。
  - 生成时附带武器实例数据（独立弹药状态）。

### 3.4 击杀掉落恢复针

- `WorldSystem.updateEnemies()` 在敌人死亡处理时新增 `_dropEnemyRecoveryNeedle(enemy)`。
- 与原有 `_dropEnemyWeapon(enemy)` 并行执行，互不排斥，可同时掉落。

### 3.5 掉落物显示

- `DroppedItem` 新增 `consumable:` 元数据解析分支。
- 支持恢复针名称与图标渲染。

## 4. 文件变更

- `src/assets/items/RecoveryNeedleSprite.js`：恢复针素材。
- `src/graphics/Assets.js`：注册 `Assets.recovery_needle`。
- `src/assets/weapons/WeaponData.js`：新增手持配置 `recovery_needle`（仅表现用途）。
- `src/core/systems/InventorySystem.js`：新增 `consumable` 类型与恢复针定义。
- `src/core/entities/DroppedItem.js`：支持 `consumable` 掉落解析与渲染。
- `src/core/systems/PlayerSystem.js`：新增恢复针使用逻辑与手持分流。
- `src/core/systems/WorldSystem.js`：新增房间刷枪与敌人掉恢复针。
- `src/core/systems/generation/ConstructionLayoutGenerator.js`：`meta` 新增 `indoorRooms`。

## 5. 验收清单

1. 进入 `game` 地图，多次开局可观察到室内低频刷枪（并非每局都有）。
2. 击杀任意敌人可低概率掉落恢复针。
3. 恢复针可拾取入背包并显示到快捷栏。
4. 选中恢复针时，角色手持恢复针素材。
5. 鼠标左键可使用恢复针并恢复 35 HP。
6. 满血时左键仍会消耗恢复针。
7. 恢复针不可触发建造放置，武器射击与建造功能无回归问题。
