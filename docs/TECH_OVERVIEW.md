# 项目技术概览

本文档旨在帮助 AI 开发者快速理解项目结构与核心架构。

## 目录结构

- `src/`
  - `assets/`: **美术素材数据**。存放字符画模板，严禁包含游戏逻辑。
    - `characters/player/`: 存放玩家的独立动画帧文件（如 `PlayerRun.js`）。
    - `objects/furniture/`: 家具程序化素材（统一使用高品质 5 层绘制标准：有机形状+轮廓线+内部细节+右侧阴影叠加+左上高光，共享 `FurniturePalette.js` 色板）。
    - `objects/WallTexture.js`: 墙体/门框共享纹理工具（`addBlockTexture` 砌体灰缝纹理 + `WALL_COLORS` 混凝土色板），被 `AdaptiveWallSprite.js`、`WallSprite.js`、`DoorSprite.js` 共用。
    - `floors/`: 地板瓦片素材（`FloorPalette.js` 色板 + `FloorSprites.js` 4 种地板 × 4 变体 = 16 个 16×16 程序化精灵）。
    - `weapons/`: 武器程序化素材与武器配置（如 `WeaponData.js`、`ShotgunGenerator.js`、`SniperGenerator.js`、`CrossbowGenerator.js`、`GrenadeLauncherGenerator.js`）。
  - `core/`: **核心游戏逻辑**。
    - `entities/`: 游戏实体类。
      - `Zombie.js`: 男性僵尸敌人逻辑。
      - `ZombieFemale.js`: 女性僵尸敌人逻辑 (HP 35, Speed 1.1, Damage 8)。
      - `ZombieBrute.js`: 健壮僵尸敌人逻辑 (HP 120, Speed 0.7, Damage 18, 击退抗性 0.3x)。
      - `Vehicle.js`: 载具逻辑（驾驶、碰撞、物理）。
      - `BreakableObject.js`: 可破坏物体通用实体（委托到各 object 定义）。
      - `objects/`: 物体类型定义与行为实现（每个 object 一个文件，通过注册表接入）。
      - `DroppedWeapon.js`: 掉落武器逻辑与悬浮效果。
      - `Portal.js`: 传送门逻辑与粒子渲染。
    - `systems/`: 核心子系统。
      - `NavigationGrid.js`: 空间网格、流场导航与邻域查询。
      - `WorldSystem.js`: 多地图管理(Hub/Game/Test/Construction)、地图生成编排、流场更新、敌人调度、统一移动碰撞解析（玩家/怪物）、门/障碍阻挡查询与自动脱困。
      - `PlayerSystem.js`: 玩家移动、拾取与输入驱动的操作逻辑。
      - `CombatSystem.js`: 射击、子弹、粒子与爆炸效果更新。
      - `InventorySystem.js`: 物品数据管理、背包槽位与快捷栏逻辑。
      - `BuildSystem.js`: 蓝图预览、放置判定与物体生成。
      - `generation/`: Build 场景房间生成子模块（建筑外框规划、房间切分、门连通、语义分配、家具摆放、布局校验、布局编译、地板生成）。
    - `Renderer.js`: 负责场景绘制与 UI 刷新。
    - `Game.js`: 游戏主循环、系统编排与状态聚合（注意：必须先初始化 CombatSystem 再初始化 WorldSystem）。
    - `Camera.js`: 摄像机跟随与视口计算。
    - `Input.js`: 统一的键鼠输入处理。
  - `graphics/`: **渲染系统**。
    - `SpriteGenerator.js`: 将字符模板转换为 Canvas/Image 的核心工具。
    - `Assets.js`: 负责调用生成器并缓存生成的游戏资源。
  - `utils/`: **工具库**。常量 (`Constants.js`)，`PixelDraw.js` (程序化像素绘制)，`FloorTypes.js` (地板类型/子格常量) 和通用辅助函数。
  - `main.js`: **入口文件**。负责初始化游戏实例并挂载到 DOM。

## 基础架构

### 渲染流程
1. **字符生成**: 使用 `SpriteGenerator` 将 ASCII 字符数组 + 调色板转换为 Canvas 图像。部分物体（如 BreakableObjects）使用 `PixelDraw` 进行程序化绘制。
2. **绘制循环**: `Renderer.js` 负责每帧清屏并按 Z 排序绘制场景元素。
3. **伪 3D**: 通过简单的 Y 轴排序 (Z-Sorting) 和墙体顶部/前部颜色区分实现 2.5D 视角。

### 游戏循环
- 采用标准的 `requestAnimationFrame` 循环。
- `update()`: 由 `Game.js` 编排各系统更新（玩家、战斗、世界）。
- `draw()`: `Renderer.js` 负责渲染逻辑，依赖 `Camera` 进行坐标转换。

### 武器与弹道机制
- 武器配置统一定义在 `src/assets/weapons/WeaponData.js`，通过 `weaponConfigId` 与背包物品绑定。
- `CombatSystem.tryShoot()` 支持多弹丸散射（`pelletCount` + `spread`），散弹枪弹丸具有速度、位置、生命周期和大小的随机偏差。
- `CombatSystem.updateBullets()` 支持：
  - **穿透**（`piercing` + `hitList`）：用于狙击枪/弩箭，命中后可继续飞行并衰减伤害。
  - **重力弹道**（`gravity`）：用于榴弹类抛物线飞行。
  - **特殊爆炸弹**：`rocket` 与 `grenade` 触发范围爆炸，榴弹可在寿命结束时引爆。
- `Renderer` 子弹渲染支持 `rocket`、`bolt`、`grenade` 与默认圆形子弹分支。
- **激光瞄准**：`Renderer.drawLaserSight()` 为狙击枪绘制激光线，使用 `HandSystem.angle` 确保方向与枪管一致，通过 `laserOffset` 定位发射器起点，射线检测墙壁遮挡。
- **武器发射动画**：`HandSystem` 支持 `fireSprite` 配置，当弹药为空时自动切换精灵（如弩发射后弓臂前弹、弦松弛、无箭矢）。
- 敌人子弹受击框统一由 `Enemy.getBulletHurtbox()` 提供，`CombatSystem` 与 Debug 受击框模式使用同一数据源。
- 玩家受击框统一由 `player.getBulletHurtbox()` 提供，敌方子弹判定与 Debug 受击框模式使用同一数据源。

### 调试视图
- `P` 键使用三态循环：
  - 第一次：显示碰撞框（墙/玩家/敌人/物体/载具/传送门）。
  - 第二次：显示受击框（敌人 bullet hurtbox + 可破坏物 bullet hurtbox）。
  - 第三次：关闭调试框。

### 物品与建造系统
- **Inventory**: `InventorySystem` 管理所有物品（武器+可放置物体）。快捷栏（Hotbar）支持键盘选择。
- **Build Mode**: 选中可放置物体时进入建造模式，`BuildSystem` 处理网格吸附与放置判定。
- **掉落物**: `DroppedWeapon` 类负责管理地面上的武器，包含简单的悬浮动画。
- **交互**: `PlayerSystem.js` 维护 `droppedItems` 列表，处理 E 键拾取与武器交换逻辑。

### Build 场景房间生成
- `construction` 地图通过 `generation/ConstructionLayoutGenerator.js` 进行流程化生成，而非手写固定布局。
- 生成流水线：
  - `BuildingFootprintPlanner`: 规划多栋建筑外框（避免重叠/越界）。
  - `RoomPartitioner`: BSP 切分房间并生成内部墙分割线。
  - `DoorConnector`: 放置内部门与入口门，并将门位从墙集合中扣除。
  - `RoomSemanticAssigner`: 分配房间语义（客厅/卧室/书房/储物等）。
  - `FurniturePlacer`: 按语义模板做家具硬约束摆放（含门前通行带）。
  - `LayoutValidator`: 校验连通性、入口门数量、家具约束。
  - `LayoutCompiler`: 编译为 `BreakableObject` 可实例化的对象列表。
  - `FloorMapGenerator`: 生成 100×100 地板子格地图（草地/木地板/水泥/泥土），含建筑路径连通与泥土过渡带。
- `WorldSystem.initConstructionMap()` 负责：
  - 建立地图边界墙。
  - 调用生成器并实例化对象。
  - 存储地板数据并预渲染 1600×1600 离屏 Canvas（`buildFloorCanvas()`）。
  - 生成失败时使用 fallback 布局，保证场景可进入。

### 地板瓦片系统
- 每个 32×32 网格包含 2×2 = 4 块 16×16 地板子格，支持墙内外不同地面类型。
- 4 种地面类型：GRASS(1)、WOOD(2)、CONCRETE(3)、DIRT(4)，NONE(0) 使用棋盘格 fallback。
- 数据存储：`WorldSystem.floorMap`（Uint8Array 100×100）+ `WorldSystem.floorCanvas`（预渲染离屏 Canvas）。
- 渲染：Renderer 对有 `floorCanvas` 的地图做单次 `drawImage` 裁剪，无 `floorCanvas` 时保留棋盘格。
- 类型边界使用 4px 噪声梯度抖动带（两侧共 8px）实现有机过渡。
- 外围墙体子格按内外分裂：内侧 WOOD、外侧 CONCRETE，确保墙两侧地面不同。
- 详见 `docs/feature/FLOOR_TILE_SYSTEM.md`。

### 规范
- **素材分离**: 所有美术资源定义必须在 `src/assets` 中。
- **像素绘制**: 复杂物体请参考 `docs/PIXEL_ART_GUIDE.md` 使用程序化绘制。
- **逻辑分层**: 渲染代码不应混入业务逻辑，输入处理应通过 `Input` 类解耦。

### 移动碰撞约定
- 玩家和敌人通过 `getMovementHitboxAt(x, y)` 提供统一的“移动碰撞体”（脚底占地）。
- `WorldSystem.resolveEntityMovement()` 负责统一处理移动、贴墙滑动、卡住检测与自动脱困。
- 门关闭时会先做阻挡预检，避免将玩家或敌人夹进门框。
- 自适应墙体 (`wall`) 采用**多段碰撞体**（`getHitboxes()`），不再等价为单个矩形包围盒。
- 墙体判定语义拆分为三类：
  - `collision hitboxes`: 用于玩家/敌人/载具移动阻挡。
  - `hurtboxes` (`getHurtboxes()`): 用于子弹/激光命中检测。
  - `occlusion hitboxes` (`getOcclusionHitboxes()`): 用于渲染遮挡排序，不直接复用碰撞底边。
