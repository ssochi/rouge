# 项目技术概览

本文档旨在帮助 AI 开发者快速理解项目结构与核心架构。

## 目录结构

- `src/`
  - `assets/`: **美术素材数据**。存放字符画模板，严禁包含游戏逻辑。
    - `characters/player/`: 存放玩家的独立动画帧文件（如 `PlayerRun.js`）。
    - `characters/enemies/`: 敌人程序化帧动画（每种敌人一个目录，含 Generator + Idle/Run/Attack 帧）。攻击动画 (8帧) 通过 `drawAttackArms()` 在 Generator 中根据 `attackPhase` 参数动态绘制手臂位置。
    - `objects/furniture/`: 家具程序化素材（统一使用高品质 5 层绘制标准：有机形状+轮廓线+内部细节+右侧阴影叠加+左上高光，共享 `FurniturePalette.js` 色板；卫浴家具使用独立 `BathroomPalette.js` 瓷器/铬色板）。包含：沙发、电视柜、桌子、书架、床头柜、衣柜、扶手椅、落地灯、盆栽、矮柜、马桶、浴缸、洗手台。
    - `objects/nature/`: 户外植被程序化素材（`NaturePalette.js` 共享色板 + 大树/小树/灌木/草丛精灵，使用 PixelDraw 绘制多层有机形状）。
    - `objects/WallTexture.js`: 墙体/门框共享纹理工具（`addBlockTexture` 砌体灰缝纹理 + `WALL_COLORS` 混凝土色板），被 `AdaptiveWallSprite.js`、`WallSprite.js`、`DoorSprite.js` 共用。
    - `floors/`: 地板瓦片素材（`FloorPalette.js` 色板 + `FloorSprites.js` 4 种地板 × 4 变体 = 16 个 16×16 程序化精灵）。
    - `items/`: 消耗品与通用道具素材（如 `RecoveryNeedleSprite.js`）。
    - `weapons/`: 武器程序化素材与武器配置（如 `WeaponData.js`、`ShotgunGenerator.js`、`SniperGenerator.js`、`CrossbowGenerator.js`、`GrenadeLauncherGenerator.js`、`LaserGunGenerator.js`、`FlamethrowerGenerator.js`、`BlackHoleGunGenerator.js`、`TeleportGunGenerator.js`、`LightningGunGenerator.js`、`FreezeRayGenerator.js`、`RicochetGunGenerator.js`、`BoomerangGenerator.js`、`KatanaGenerator.js`、`DaggerGenerator.js`、`GreatswordGenerator.js`、`SpearGenerator.js`、`BattleAxeGenerator.js`）。
  - `core/`: **核心游戏逻辑**。
    - `entities/`: 游戏实体类。
      - `Zombie.js`: 男性僵尸敌人逻辑。
      - `ZombieFemale.js`: 女性僵尸敌人逻辑 (HP 35, Speed 1.1, Damage 8, 冲刺技能：靠近200px时2倍速冲刺3秒，1分钟冷却，含残影/扬尘/速度线VFX)。
      - `ZombieBrute.js`: 健壮僵尸敌人逻辑 (HP 120, Speed 0.7, Damage 18, 击退抗性 0.3x)。
      - `Soldier.js`: 军人敌人逻辑 (HP 60, Speed 0.9, SMG 3发点射 + 横移战术)。
      - `Vehicle.js`: 载具逻辑（驾驶、碰撞、物理）。
      - `BreakableObject.js`: 可破坏物体通用实体（委托到各 object 定义）。
      - `objects/`: 物体类型定义与行为实现（每个 object 一个文件，通过注册表接入）。
      - `DroppedItem.js`: 掉落物逻辑与悬浮效果（支持 weapon/placeable/consumable）。
      - `Portal.js`: 传送门逻辑与粒子渲染。
    - `systems/`: 核心子系统。
      - `NavigationGrid.js`: 空间网格、流场导航与邻域查询。
      - `WorldSystem.js`: 多地图管理(Hub/Game/Test/Construction)、地图生成编排、流场更新、敌人调度、房间随机枪支掉落、敌人死亡掉落（武器+恢复针）、统一移动碰撞解析（玩家/怪物）、门/障碍阻挡查询与自动脱困，以及路径不可达时的敌人破障（优先门）策略。
      - `PlayerSystem.js`: 玩家移动、拾取与输入驱动的操作逻辑（含快捷栏消耗品左键使用）。
      - `EnemyWeaponController.js`: 远程敌人武器状态控制（弹药、射速节流、换弹进度、实例弹药回写）。
      - `CombatSystem.js`: 战斗协调器，保持对外 API 不变，内部委托给三个子系统，并统一提供“开火路径阻挡判定”给玩家与敌人射击 AI。
      - `BulletSystem.js`: 子弹生命周期管理（移动、尾迹、碰撞检测、敌人命中判定）。
      - `StatusEffectSystem.js`: 状态效果与特殊武器逻辑（爆炸、黑洞、闪电链、传送、冻结、燃烧、流血DOT）。
      - `MeleeSystem.js`: 近战攻击系统——攻击状态机（IDLE→WINDUP→SWING→RECOVERY）、扇形/直线命中检测、刀光/戳刺拖尾VFX。支持暴击(Dagger)、劈斩加成(Greatsword)、流血DOT(Battle Axe)、戳刺(Spear)等数据驱动的武器特殊机制。5把近战武器：Katana/Dagger/Greatsword/Spear/Battle Axe。
      - `ParticleSpawner.js`: 粒子生成（碎片、血液、弹壳、刀光拖尾）与粒子物理更新。
      - `InventorySystem.js`: 物品数据管理、背包槽位与快捷栏逻辑（weapon/placeable/consumable）。
      - `BuildSystem.js`: 蓝图预览、放置判定与物体生成。
      - `generation/`: Build 场景房间生成子模块（建筑外框规划、房间切分、门连通、语义分配、语义修复/全局配额、家具摆放、布局校验、布局编译、地板生成）。
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
- `CombatSystem.canShootFrom()` 在开火前统一做线段阻挡校验：先校验“身体中心 -> 枪口”是否穿过墙体/门（仅墙与门参与该校验），避免手臂或枪口穿墙开火；敌人额外校验“枪口 -> 目标”是否被墙体/门阻挡，阻挡时不发射子弹。
- 玩家武器弹药按**武器实例**存储（`instanceData.weaponInstanceId + ammo`），不再按武器类型共享；同型号两把枪的弹夹/备弹互不影响。
- `Hunter` / `Soldier` 的实际开火由 `EnemyWeaponController` 驱动：严格使用武器 `fireRate/magazineSize/maxReserve/reloadTime`，并在敌人实例上回写弹药状态。
- 远程敌人当 `canShootFrom()` 失败时会转入追击绕路，不再隔墙盲射；同时移除了“距离近时后退”行为。
- 远程敌人换弹时会在头顶显示换弹进度条（与血条可双行叠加显示）。
- `CombatSystem.tryShoot()` 支持：
  - **瞬间光束**（`laser_beam`）：激光枪使用 hitscan 射线检测，瞬间伤害射线上所有敌人，光束视觉效果通过粒子系统渲染。
  - **火焰弹**（`flame`）：喷火枪发射短程火焰粒子，命中后施加燃烧 DOT（`burnDamage` + `burnDuration`）。
  - **闪电弹**（`lightning`）：闪电枪发射快速弹丸，命中后链式跳跃到附近最多 3 个敌人，每跳衰减 60% 伤害。
  - **冰晶弹**（`ice_shard`）：冰冻枪持续发射冰晶锥，命中减速 50%，累计 5 次命中冻结敌人 2 秒（冻结期间受 1.5x 伤害）。
- `CombatSystem.updateBullets()` 支持：
  - **穿透**（`piercing` + `hitList`）：用于狙击枪/弩箭，命中后可继续飞行并衰减伤害。
  - **重力弹道**（`gravity`）：用于榴弹类抛物线飞行。
  - **特殊爆炸弹**：`rocket` 与 `grenade` 触发范围爆炸，榴弹可在寿命结束时引爆。
  - **黑洞弹丸**（`black_hole_projectile`）：命中后创建持续 3 秒的黑洞，吸引并伤害范围内敌人。
  - **传送弹丸**（`teleport`）：命中后将玩家瞬移到弹丸位置，自动防卡墙。
  - **弹跳弹**（`ricochet`）：碰墙反弹最多 3 次，伤害不衰减，反射通过 prevX/prevY 判断碰撞轴。
  - **回旋镖**（`boomerang`）：飞行 200px 后自动归航返回玩家，去回各可命中敌人，阶段切换时重置 hitList。
- `CombatSystem.updateBlackHoles()`：更新黑洞实体（拉力、周期伤害、粒子、到期移除）。
- `CombatSystem.updateBurnEffects()`：更新燃烧 DOT（周期伤害、火焰粒子）。
- `CombatSystem.updateFreezeEffects()`：更新减速/冻结状态（冻结粒子、slowTimer/frozenTimer 递减、freezeStacks 管理）。
- `CombatSystem._chainLightning()`：处理闪电链式跳跃（查找最近未命中敌人、衰减伤害、生成 `lightning_arc` 粒子）。
- **冻结易伤**：所有伤害源（子弹、爆炸、燃烧 DOT、闪电链）对冻结中敌人造成 1.5x 伤害。
- **敌人速度系统**：`Enemy.getEffectiveSpeed()` 统一处理减速/冻结对移动速度的影响，所有敌人子类使用此方法。
- `Renderer` 子弹渲染支持 `rocket`、`bolt`、`grenade`、`flame`、`black_hole_projectile`、`teleport`、`lightning`、`ice_shard`、`ricochet`、`boomerang` 与默认圆形子弹分支。
- **激光瞄准**：`Renderer.drawLaserSight()` 为狙击枪绘制激光线，使用 `HandSystem.angle` 确保方向与枪管一致，通过 `laserOffset` 定位发射器起点，射线检测墙壁遮挡。
- **武器发射动画**：`HandSystem` 支持 `fireSprite` 配置，当弹药为空时自动切换精灵（如弩发射后弓臂前弹、弦松弛、无箭矢）。
- 敌人子弹受击框统一由 `Enemy.getBulletHurtbox()` 提供，`CombatSystem` 与 Debug 受击框模式使用同一数据源。
- 玩家受击框统一由 `player.getBulletHurtbox()` 提供，敌方子弹判定与 Debug 受击框模式使用同一数据源。

### 调试视图
- `P` 键使用三态循环：
  - 第一次：显示碰撞框（墙/玩家/敌人/物体/载具/传送门）。
  - 第二次：显示受击框（敌人 bullet hurtbox + 可破坏物 bullet hurtbox）。
  - 第三次：关闭调试框。
- `I` 键切换性能分析器叠加层（详见下方）。

### 性能分析器
- `ProfilerSystem`（`src/core/systems/ProfilerSystem.js`）使用 `begin(label)` / `end(label)` API 包装各子系统，通过 300 帧环形缓冲区记录历史帧数据。
- `I` 键切换 Canvas 叠加层（屏幕右上角），包含：
  - FPS 计数器（绿色 ≥55 / 黄色 ≥30 / 红色 <30）
  - 帧时间堆叠柱状图（每种颜色 = 一个子系统，带 60fps/30fps 参考线）
  - 子系统耗时分解面板（毫秒 + 百分比 + 比例条）
- 接入新系统只需 2 行代码，详见 `docs/PROFILER_GUIDE.md`。

### 物品与建造系统
- **Inventory**: `InventorySystem` 管理所有物品（武器+可放置物体+消耗品）。快捷栏（Hotbar）支持键盘选择。
- **武器实例化**: 武器入包时自动生成唯一实例数据（含独立弹药状态），`HandSystem` 在开火/换枪/换弹时实时回写到背包对应实例。
- **Build Mode**: 选中可放置物体时进入建造模式，`BuildSystem` 处理网格吸附与放置判定。
- **消耗品**: 选中消耗品（如恢复针）后进入“使用模式”，鼠标左键会触发道具效果并扣除数量，不进入建造逻辑。
- **掉落物**: `DroppedItem` 类负责管理地面掉落（武器/可放置物/消耗品），包含悬浮动画与拾取提示。
- **交互**: `PlayerSystem.js` 维护 `droppedItems` 列表，处理 E 键拾取、快捷栏切换以及左键动作分流（射击/放置/使用消耗品）。
- **快捷生成载具**: `PlayerSystem` 监听 `O` 键并调用 `WorldSystem.spawnVehicleNearPlayer()`，在玩家附近搜索可用空位后生成一辆随机类型载具（SUV/Truck/Police），避免与墙体、可破坏物、敌人、玩家和已有载具重叠。

### 建筑生成场景（construction + game）
- `construction` 与 `game` 地图都通过 `generation/ConstructionLayoutGenerator.js` 进行流程化生成，不再依赖 `game` 旧随机墙逻辑。
- 生成流水线：
  - `BuildingFootprintPlanner`: 规划多栋建筑外框（避免重叠/越界）。
  - `RoomPartitioner`: BSP 切分房间并生成内部墙分割线。
  - `DoorConnector`: 放置内部门与入口门，并将门位从墙集合中扣除。
  - `RoomSemanticAssigner`: 根据输入策略分配 `requiredRoles + preferredRoles` 语义（不再写死每栋三件套）。支持的房间语义：`living_room`、`bedroom`、`study`、`bathroom`、`storage`、`corridor`、`foyer`。
  - `RoomSemanticRepair`: 建筑 tier 语义策略（small/medium/large）+ 全图语义配额修复（优先提升 `storage/corridor/foyer`）。`bathroom` 作为 medium/large 建筑的 preferredRole，不设全局配额。
  - `FurniturePlacer`: 按语义模板做家具硬约束摆放（含门前通行带）。客厅可选：扶手椅(40%) + 落地灯(35%,偏墙) + 盆栽(30%) + 矮柜(30%,靠墙)。卧室可选：落地灯(25%,偏墙)。书房可选：扶手椅(30%) + 盆栽(25%)。门厅可选：盆栽(35%)。走廊可选：矮柜(20%,靠墙)。卫浴：马桶(必需,靠墙) + 浴缸(50%,靠墙) + 洗手台(60%,靠墙)。
  - `LayoutValidator`: 校验连通性、入口门数量、家具约束。
  - `LayoutCompiler`: 编译为 `BreakableObject` 可实例化的对象列表。
  - `FloorMapGenerator`: 生成 100×100 地板子格地图（草地/木地板/水泥/泥土），含建筑路径连通与泥土过渡带。
  - `OutdoorPlacer`: 在建筑外空地概率放置户外植被（大树/小树/灌木/草丛）与少量户外杂物（箱子/木桶/罐子）。植被遵守建筑缓冲区与最小间距，并基于 `floorMap` 仅在 `GRASS`/`DIRT` 子格对应地块生成；杂物仅在建筑外侧近墙环带的草地上低概率生成，避免出现在水泥路、木地板或建筑内部。
- `WorldSystem.initConstructionMap()` 负责：
  - 建立地图边界墙。
  - 调用生成器并实例化对象。
  - 存储地板数据并预渲染离屏 Canvas（当前 100x100 地图下约为 3200×3200，`buildFloorCanvas()`）。
  - 生成失败时使用 fallback 布局，保证场景可进入；fallback 同样会初始化草地地板，避免出现“无地面”。
- `WorldSystem.initGameMap()` 复用同一套生成与地板流程，然后叠加房间随机枪支、敌人与击杀掉落生成。
- 地图全局尺寸已扩展为 `100x100`，并将建筑目标数量提升到 `6~12`，`game` 场景会基于生成器输出的 `meta.indoorSpawnTiles` 与 `meta.indoorRooms` 管理室内刷怪与房间掉落。

### 地板瓦片系统
- 每个 32×32 网格包含 2×2 = 4 块 16×16 地板子格，支持墙内外不同地面类型。
- 4 种地面类型：GRASS(1)、WOOD(2)、CONCRETE(3)、DIRT(4)，NONE(0) 使用棋盘格 fallback。
- 数据存储：`WorldSystem.floorMap`（Uint8Array 100×100）+ `WorldSystem.floorCanvas`（预渲染离屏 Canvas）。
- 渲染：Renderer 对有 `floorCanvas` 的地图做单次 `drawImage` 裁剪，无 `floorCanvas` 时保留棋盘格。
- 类型边界目前无过渡效果，直接拼接。
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
- 当敌人与玩家路径不可达（或持续卡住）时，`WorldSystem` 会触发破障逻辑：优先攻击阻挡路径的门，其次攻击其他阻挡物体，打通后再继续追击。
- 非僵尸远程敌人（Hunter/Soldier）在近门受阻时可优先开门；若仍无法通行，再走破障流程。
- 自适应墙体 (`wall`) 采用**多段碰撞体**（`getHitboxes()`），不再等价为单个矩形包围盒。
- 墙体判定语义拆分为三类：
  - `collision hitboxes`: 用于玩家/敌人/载具移动阻挡。
  - `hurtboxes` (`getHurtboxes()`): 用于子弹/激光命中检测。
  - `occlusion hitboxes` (`getOcclusionHitboxes()`): 用于渲染遮挡排序，不直接复用碰撞底边。
