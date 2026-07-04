# 项目技术概览

本文档旨在帮助 AI 开发者快速理解项目结构与核心架构。

## 目录结构

- `src/`
  - `assets/`: **美术素材数据**。存放字符画模板，严禁包含游戏逻辑。
    - `characters/player/`: 存放玩家的独立动画帧文件（如 `PlayerRun.js`）。
    - `characters/enemies/`: 敌人程序化帧动画（每种敌人一个目录，含 Generator + Idle/Run/Attack 帧）。攻击动画 (8帧) 通过 `drawAttackArms()` 在 Generator 中根据 `attackPhase` 参数动态绘制手臂位置。`mutant_beast/` 为 80×80 BOSS 级精灵，含 3 阶段颜色方案（绿→红→紫）× Idle 16帧 + Run 12帧 + 6 种攻击各 8帧。`snake_boss/` 为机械巨蛇 BOSS 精灵，含 SnakeBossGenerator（头48×48/身36×36/尾28×28）、Head Idle 16帧 + Run 12帧 + Attack 8帧、Body 8帧 + Tail 8帧，3 阶段配色（钢蓝灰→琥珀金→过热橙红）。
    - `characters/pets/dog/`: 宠物狗程序化帧动画（DogGenerator + DogIdle 16帧 + DogRun 8帧，Q版柴犬风格）。
    - `characters/pets/cat/`: 宠物猫程序化帧动画（CatGenerator + CatIdle 16帧 + CatRun 8帧，灰白虎斑风格，尖耳/长尾/胡须）。
    - `characters/pets/nier2b/`: 尼尔机械纪元 2B 程序化帧动画（Nier2bGenerator + Nier2bIdle 16帧 + Nier2bRun 8帧，Q版人形角色：银白短发/黑色眼罩/哥特连衣裙/过膝长靴/背刀，含裙摆飘动和发丝动画）。
    - objects/furniture/: 家具程序化素材（统一使用高品质 5 层绘制标准：有机形状+轮廓线+内部细节+右侧阴影叠加+左上高光，共享 `FurniturePalette.js` 色板；卫浴家具使用独立 `BathroomPalette.js` 瓷器/铬色板）。包含：沙发、电视柜、桌子、书架、床头柜、衣柜、扶手椅、落地灯、盆栽、矮柜、马桶、浴缸、洗手台、书桌、椅子、梳妆台、洗衣机、落地钟、钢琴、酒架、衣帽架、鱼缸(程序化动画)、工作台。
    - `objects/nature/`: 户外植被程序化素材（`NaturePalette.js` 共享色板 + 大树/小树/灌木/草丛精灵，使用 PixelDraw 绘制多层有机形状）。
    - `objects/WallTexture.js`: 墙体/门框共享纹理工具（`addBlockTexture` 砌体灰缝纹理 + `WALL_COLORS` 混凝土色板），被 `AdaptiveWallSprite.js`、`WallSprite.js`、`DoorSprite.js` 共用。
    - `floors/`: 地板瓦片素材（`FloorPalette.js` 色板 + `FloorSprites.js` 4 种地板 × 4 变体 = 16 个 16×16 程序化精灵）。
    - `items/`: 消耗品与通用道具素材（如 `RecoveryNeedleSprite.js`、`PetDogItemSprite.js`、`PetCatItemSprite.js`、`Pet2BItemSprite.js`）。
    - `weapons/`: 武器程序化素材与武器配置（如 `WeaponData.js`、`ShotgunGenerator.js`、`SniperGenerator.js`、`CrossbowGenerator.js`、`GrenadeLauncherGenerator.js`、`LaserGunGenerator.js`、`FlamethrowerGenerator.js`、`BlackHoleGunGenerator.js`、`TeleportGunGenerator.js`、`LightningGunGenerator.js`、`FreezeRayGenerator.js`、`RicochetGunGenerator.js`、`BoomerangGenerator.js`、`KatanaGenerator.js`、`DaggerGenerator.js`、`GreatswordGenerator.js`、`SpearGenerator.js`、`BattleAxeGenerator.js`、`PlasmaRifleGenerator.js`、`HomingLauncherGenerator.js`、`AcidGunGenerator.js`、`ClusterGunGenerator.js`、`ForceGunGenerator.js`、`VampyreGunGenerator.js`、`NeedleGunGenerator.js`、`RailgunGenerator.js`、`TurretDeployerGenerator.js`、`LaserRifleGenerator.js`、`LaserShotgunGenerator.js`）。
  - `core/`: **核心游戏逻辑**。
    - `entities/`: 游戏实体类。
      - `Zombie.js`: 男性僵尸敌人逻辑。
      - `ZombieFemale.js`: 女性僵尸敌人逻辑 (HP 35, Speed 1.1, Damage 8, 冲刺技能：靠近200px时2倍速冲刺3秒，1分钟冷却，含残影/扬尘/速度线VFX)。
      - `ZombieBrute.js`: 健壮僵尸敌人逻辑 (HP 120, Speed 0.7, Damage 18, 击退抗性 0.3x)。
      - `Soldier.js`: 军人敌人逻辑 (HP 60, Speed 0.9, SMG 3发点射 + 横移战术)。
      - `MutantBeast.js`: 变异巨兽 BOSS (HP 800, 80×80, 90%击退抗性, 3阶段战斗)。阶段1(100%-60%HP): 重拳砸击/横扫/震地波；阶段2(60%-25%HP): 新增冲锋+跳砸，速度加快；阶段3(25%-0%HP): 新增召唤僵尸，身体变紫。跳砸空中期间无敌（`getBulletHurtbox()` 返回 null）。`isBoss=true` 标记用于 Renderer 绘制屏幕顶部 BOSS 血条。死亡掉落 2-3 把随机武器。
      - `MechaGolem.js`: 机械魔偶 BOSS (HP 600, 64×64, 80%击退抗性, 2阶段弹幕战斗)。参考《挺进地牢》设计的弹幕型BOSS。阶段1(100%-40%HP): 加特林扫射/环形爆发/三连瞄准/火箭齐射 4种弹幕模式；阶段2(40%-0%HP): 新增螺旋风暴/十字交火/绝望弹幕 3种弹幕，速度加快+偶尔冲刺。弹幕使用不同颜色区分（橙/蓝/红/灰/品红/紫）。加权随机攻击选择，环绕式移动AI。`isBoss=true` 标记用于 Renderer BOSS 血条。死亡掉落 2-3 把随机武器。
      - `SnakeBoss.js` + `SnakeSegment.js`: 机械巨蛇 BOSS (HP 1000, 头部30×30, 90%击退抗性, 3阶段)。多节体伪3D蛇形Boss，由1个蛇头(`SnakeBoss`, `isBoss=true`) + 8节蛇身 + 1节蛇尾(`SnakeSegment`)组成。每节为独立实体加入`enemies[]`实现自动Y-Sort和子弹碰撞。蛇头存储位置历史，各节从历史中读取位置实现跟随效果。通过正弦波计算每节`heightZ`，正值=地上（抬升绘制+地面阴影），负值=地下（画地洞效果，`getBulletHurtbox()`返回null实现无敌）。段伤害按比例路由到蛇头（身体60%/尾部40%）。阶段1(100%-65%HP): 毒液喷射/冲锋；阶段2(65%-30%HP): 新增缠绕/尾鞭，速度加快，琥珀金配色；阶段3(<30%HP): 新增钻地突袭/节段弹幕，速度再加快，过热红配色+裂纹火花特效。HP条3色（钢蓝→琥珀→红）+2条标记线。**多层程序化伪3D渲染**：借鉴Vehicle `_drawLayer(ctx, baseDrawY, layerOffset, drawFn)` 多层叠加技术，每个节点在旋转上下文内分多层绘制俯视椭圆。蛇身3层（腹部+3px → 装甲0px → 甲盖-3px），蛇尾3层（±2px），蛇头4层（颈基+5 → 下颚+1 → 上颅-4 → 冠脊-8）。底层椭圆略大、顶层略小，层间Y间距产生真实深度错觉。蛇头含下颚张合动画（attackTimer驱动jawOpen钟形曲线）、眼睛/能量核心脉冲、Phase3裂纹+火花特效。地面阴影/地洞效果/延伸柱保持世界坐标不旋转。不再依赖预生成精灵帧，全部在draw()中程序化完成。
      - `Vehicle.js`: 载具逻辑（驾驶、碰撞、物理）。支持坦克类型（`isTank`），具有独立旋转炮塔、导弹发射（复用 rocket bulletType）、履带渲染等坦克专用逻辑。支持蜘蛛类型（`isSpider`），6脚机械蜘蛛使用程序化腿部动画（三足步态 ctx.rotate/translate 实时渲染），配备独立旋转激光炮塔（hitscan laser_beam）。
      - `BreakableObject.js`: 可破坏物体通用实体（委托到各 object 定义）。
      - objects/: 物体类型定义与行为实现（每个 object 一个文件，通过注册表接入）。其中 `FishTankObject.js` 包含复杂的程序化动画逻辑（鱼群游动、水草摇曳、气泡上升）。
      - `DroppedItem.js`: 掉落物逻辑与悬浮效果（支持 weapon/placeable/consumable）。
      - `DungeonPickup.js`: 地牢金币/钥匙拾取物实体。散开（初速+摩擦≈0.4s）→悬浮 bob→玩家<64px 磁吸→<14px 收集入账（coin→`runState.addCoins(value)`，key→`runState.addKeys(1)`）。不参与碰撞解析，美术取自 `assets/dungeon/PickupSprites.js`（`Assets.dungeonCoin` 两帧微闪 / `Assets.dungeonKey`）。
      - `Portal.js`: 传送门逻辑与粒子渲染。
      - `PetDog.js`: 宠物狗实体（跟随玩家、流场寻路、避障，独立于 enemies 数组，不参与战斗，远距离自动传送）。
      - `PetCat.js`: 宠物猫实体（与 PetDog 同架构，速度更快，体型更小，灰白虎斑外观）。
      - `Pet2B.js`: 尼尔机械纪元 2B 宠物实体（人形角色，scale 0.65，白蓝科技风传送特效）。
      - `Turret.js`: 炮塔实体（静态防御设施，HP 80，自动攻击范围内敌人，具有部署动画和破坏效果）。
    - `systems/`: 核心子系统。
      - `NavigationGrid.js`: 空间网格、流场导航与邻域查询。现支持 `resize()` 动态重建网格，以及 `updateLocalFlowField()` 仅对玩家附近窗口做局部流场更新，避免大地图整图 BFS。
      - `WorldSystem.js`: 多地图管理(Hub/Game/Test/Construction/Dungeon)、地图生成编排、流场更新、敌人调度、宠物更新（`updatePets()`）、房间随机枪支掉落、敌人死亡掉落（武器+恢复针）、统一移动碰撞解析（玩家/怪物/宠物）、门/障碍阻挡查询与自动脱困，以及路径不可达时的敌人破障（优先门）策略。现通过 `MapProfiles` 按地图类型切换世界尺寸/导航网格/地板缓存策略；`construction/game` 会切换到 420×420 的大镇 profile，并同步更新 Camera、ObstacleSpatialIndex 与 NavigationGrid。内部继续使用静态世界 dirty 标记，仅在障碍状态变更时重建缓存。地牢模式（`initDungeonMap()`）采用紧凑化地牢生成（中心工作区 + 短走廊约束），并接入 `decorObjects`（碎石堆/铁笼/骨堆）投放。地牢经济：维护 `pickups` 数组（loadMap 清空、上限 200 超限最旧直接入账移除），`updatePickups()` 随 `updateDungeon()` 计入 Profiler `Dungeon` 分段，`spawnCoinBurst(x,y,totalValue)`（拆 ≤8 枚均分余数、随机方向 1.5~3px/f 初速）与 `spawnKeyDrop(x,y)` 供掉落链调用。
      - `DungeonManager.js`: 地牢运行时管理器。房间状态机（idle→active→cleared）、O(1) 玩家位置检测（roomGrid 数组）、能量屏障门（gates）动态墙体添加/移除、敌人跟踪与房间清除奖励掉落、楼层系统（F1→F2）、Boss 清除后传送门生成、小地图数据提供（visited/frontier 可见性、锁门态、拓扑节点与边）。
      - `ObstacleSpatialIndex.js`: 静态障碍空间索引（墙体 + 可破坏物 hitbox），用于加速矩形阻挡查询与局部障碍检索。
      - `FloorChunkCache.js`: 超大地图地板分块缓存。对 420×420 小镇地图不再构建单张超大离屏地板，而是按 chunk 懒渲染并做 LRU 缓存。
      - `PlayerSystem.js`: 玩家移动、拾取与输入驱动的操作逻辑（含快捷栏消耗品左键使用、宠物召唤）。
      - `EnemyWeaponController.js`: 远程敌人武器状态控制（弹药、射速节流、换弹进度、实例弹药回写）。
      - `CombatSystem.js`: 战斗协调器，保持对外 API 不变，内部委托给三个子系统，并统一提供“开火路径阻挡判定”给玩家与敌人射击 AI。
      - `BulletSystem.js`: 子弹生命周期管理（移动、尾迹、碰撞检测、敌人命中判定）。
      - `StatusEffectSystem.js`: 状态效果与特殊武器逻辑（爆炸、黑洞、闪电链、传送、冻结、燃烧、流血DOT、中毒DOT、酸液地面、力场撞墙、钉刺嵌入DOT）。
      - `MeleeSystem.js`: 近战攻击系统——攻击状态机（IDLE→WINDUP→SWING→RECOVERY）、扇形/直线命中检测、刀光/戳刺拖尾VFX。支持暴击(Dagger)、劈斩加成(Greatsword)、流血DOT(Battle Axe)、戳刺(Spear)等数据驱动的武器特殊机制。5把近战武器：Katana/Dagger/Greatsword/Spear/Battle Axe。
      - `ParticleSpawner.js`: 粒子生成（碎片、血液、弹壳、刀光拖尾）与粒子物理更新。
      - `InventorySystem.js`: 物品数据管理、背包槽位与快捷栏逻辑（weapon/placeable/consumable/costume）。
      - `CostumeSystem.js`: 服装系统——管理玩家换装状态（发型/帽子/衣服/眼镜 4个部位）、帧缓存与按需生成。详见 `docs/feature/COSTUME_SYSTEM.md`。
      - `BuildSystem.js`: 蓝图预览、放置判定与物体生成。
      - `generation/`: 场景生成子模块。Build/Game 场景现拆分为两条管线：旧 `ConstructionLayoutGenerator.js`（随机建筑外框 + BSP 切房，保留兼容）和新 `TownLayoutGenerator.js`（中心广场型聚落骨架 + 建筑模板装配）。新增 `TownDistrictPlanner.js`（广场/主街/街区规划）、`TownBlockAllocator.js`（按 block/density/strategy 分配建筑簇）、`BuildingTemplateLibrary.js`（建筑级模板库）、`RoomTemplateLibrary.js`（房间模板语义库）、`BuildingTemplateAssembler.js`（模板旋转、门位/墙体/家具装配）。地牢场景仍由 `DungeonLayoutGenerator.js` 负责：中心工作区 BSP 切分→紧凑房间筛选→近邻约束 MST + 短环路→房间分类（open/cover/maze/trapline/reward/boss）→内部模板→gate 放置→掩体与装饰生成→楼层敌人配置；`RoomInteriorTemplates.js` 提供 12 种房间内部布局模板与按分类加权选择。
    - `lighting/`: 像素光影子系统。
      - `LightSystem.js`: 光照主协调器（静态/动态发光体收集、可见性裁剪、预算与质量自适应）。动态光收集包含玩家/敌人枪口火光、子弹、粒子、黑洞、酸液地面与车辆灯光（前灯光锥 + 警车警灯）。同时每帧收集玩家/敌人/车辆的挡光体并注入阴影构建，并在进入渲染前为每盏灯分配 `none / walls / all` 三档阴影模式：高优先级关键灯保留完整阴影，中档灯仅做墙体遮挡，低优先级瞬时战斗光走 cheap 无阴影路径。支持运行时参数覆盖（当前已开放 `ambientBrightness` 背景亮度调节，0~255）。
      - `LightEmitterRegistry.js`: 发光规则注册（按 object / bullet / particle / portal / vehicle 类型映射光源参数）。静态物体内置 `floor_lamp/fish_tank/explosive_barrel/stove/tv_stand/computer_desk` 光源配置；`floor_lamp` 支持多色预设（warm/cool/mint/rose），实例按颜色发出对应光色。注册表现在同时声明发光体的阴影偏好（`preferredShadowMode`）、生命周期类别（`persistent/transient`）和 cheap 渲染意图，用于战斗场景下的预算裁剪。车辆发光体支持多车型参数化分层前灯光束（核心锥 + 柔光锥 + 近场泛光，含 spider）与警车车顶红蓝交替警灯；警灯继续保留 70% 墙体环境层 + 30% 全遮挡点光层。
      - `ShadowCasterBuilder.js`: 遮挡体构建（墙体矩形 + 物体精灵 alpha 遮挡源 + 动态实体遮挡源）与增量缓存；静态墙体/物体按哈希增量更新，并同步重建 `OccluderSpatialIndex` 进行半径查询。静态遮挡现拆分为“墙/门索引”和“普通物体索引”，渲染器可按需查询 `queryWallsInRadius()`、`queryObjectsInRadius()`、`queryDynamicInRadius()`，避免每灯重复分类筛选。动态实体（玩家/敌人/车辆）使用条目对象池复用，支持 `maskVersion` 门控 `forceMaskRefresh`，在保证语义不变前提下减少重复像素分析。物体与实体遮挡优先使用当前显示帧的像素 mask（支持翻转/旋转）。
      - `PixelOcclusionField.js`: 光照缓冲分辨率下的像素遮挡场（遮挡光栅化 + 连续遮挡区射线步进求交）。新增 `copyFrom()` 能力，用于“墙体基础场 -> 全遮挡工作场”的快速拷贝，避免每个关键光源都重复栅格化整张墙体场。
      - `LightBufferRenderer.js`: 低分辨率离屏光照缓冲渲染与合成（`multiply + lighter`），使用逐像素射线；轮廓补光为可选项（默认关闭）。渲染器已改为三条路径：`none` 直接绘制发光（锥形灯使用 cheap 扇形裁切）、`walls` 复用每帧一次构建的墙体遮挡场、`all` 在墙体场基础上叠加附近物体/动态遮挡。渲染过程继续复用帧级 scratch 池，并对全向光使用射线方向 LUT（减少每射线三角函数计算）。全局规则：关键光源至少受墙/门遮挡，不允许穿墙。
      - `LightingConfig.js`: 质量档配置（high/medium/low，含射线数、光源预算、缓冲缩放与 `enableContourGlow` 开关）。除 `maxTotalLights/maxDynamicLights/maxStaticLights` 外，现额外限制 `maxAllShadowLights/maxWallShadowLights/maxCheapLights` 与 `allowShadowedTransientLights`，使自动降档不仅降低射线和分辨率，也直接减少高成本阴影光数量。
      - `EntityLightOccluderResolver.js`: 动态实体遮挡解析器，负责将玩家/敌人/车辆的当前渲染帧转换为光照遮挡描述（像素级 mask + 旋转/翻转信息）。
      - `FrameScratchPool.js`: 光照帧级临时数组池，供 `LightSystem` 与 `LightBufferRenderer` 复用，降低高频 GC。
      - `OccluderSpatialIndex.js`: 光照遮挡空间索引，按固定网格存储静态遮挡体并提供半径查询。
    - `shared/`: 跨系统共享缓存。
      - `SpriteMaskCache.js`: 精灵 alpha 分析缓存（帧遮挡 mask、轮廓采样、动画并集最小包围盒）。新增 Canvas 级弱引用缓存，用于动态实体遮挡复用 mask 分析结果。
    - `Renderer.js`: 负责场景绘制、像素光照合成与 UI 刷新。含 `drawBossHpBar()` BOSS 血条、`drawDungeonMinimap()` 地牢小地图（右上角拓扑节点图，visited/frontier 分层、实线/虚线连通、玩家朝向箭头、锁门脉冲高亮、F层+探索进度标签）、`_drawEnergyBarrier()` 能量屏障渲染（蓝紫色脉冲条纹+角落光点）。地板渲染现优先走 `floorChunkCache`，没有 chunk cache 时再回退到整张 `floorCanvas`。
    - `Game.js`: 游戏主循环、系统编排与状态聚合（注意：必须先初始化 CombatSystem 再初始化 WorldSystem）。启动时按 `MapProfiles` 初始化默认导航网格，并在地图切换后把世界边界同步给 Camera。
    - `Camera.js`: 摄像机跟随与视口计算。新增 `setWorldBounds()`，不再固定依赖全局 `MAP_WIDTH/MAP_HEIGHT`。
    - `Input.js`: 统一的键鼠输入处理。
    - `maps/MapProfiles.js`: 各地图 profile 配置。定义 tile 尺寸、导航网格粒度、局部流场半径、是否启用地板 chunk cache，以及采用哪条生成 preset。
  - `graphics/`: **渲染系统**。
    - `SpriteGenerator.js`: 将字符模板转换为 Canvas/Image 的核心工具。
    - `Assets.js`: 负责调用生成器并缓存生成的游戏资源。
  - `ui/`: **UI 组件**。
    - `UIManager.js`: HUD、背包 UI 与快捷菜单管理（M 键呼出，含功能快捷入口和按键说明子面板）。
    - `TestPanel.js`: 调试测试面板（按 L 键打开），可快速生成武器、道具、车辆、敌人、物体。自包含 DOM 组件，自动发现数据源。
    - `TestPanel.css`: 测试面板样式，复用项目 CSS 变量。
    - `HUD.css`: 游戏化拟物风格 HUD 样式。
  - `utils/`: **工具库**。常量 (`Constants.js`)，`PixelDraw.js` (程序化像素绘制)，`FloorTypes.js` (地板类型/子格常量) 和通用辅助函数。
  - `pixelOS/`: **PixelOS 电脑交互系统**。独立的像素 macOS 模拟（384×256 Canvas），含桌面/窗口管理/Dock/菜单栏、4 个内置应用（Finder/Terminal/Calculator/Notes）、虚拟文件系统、补间动画引擎。
  - `main.js`: **入口文件**。负责初始化游戏实例并挂载到 DOM。

## 基础架构

### 渲染流程
1. **字符生成**: 使用 `SpriteGenerator` 将 ASCII 字符数组 + 调色板转换为 Canvas 图像。部分物体（如 BreakableObjects）使用 `PixelDraw` 进行程序化绘制。
2. **绘制循环**: `Renderer.js` 负责每帧清屏并按 Z 排序绘制场景元素。
3. **像素光照**: `LightSystem` 生成低分辨率光照缓冲并在 `Renderer` 中合成。包含环境暗层、动态光源、遮挡射线与彩色光晕。
4. **伪 3D**: 通过简单的 Y 轴排序 (Z-Sorting) 和墙体顶部/前部颜色区分实现 2.5D 视角。

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
  - **瞬间光束**（`laser_beam`）：激光枪使用 hitscan 射线检测，瞬间伤害射线上所有敌人，光束视觉效果通过粒子系统渲染。支持 `pelletCount` + `spread` 多束散射（霰弹激光枪）和 `continuous` 持续光束模式（激光步枪）。
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
  - **等离子弹**（`plasma`）：等离子步枪三连发弹丸，绿色发光拖尾。`burstCount` + `burstInterval` 驱动连发状态机。
  - **追踪导弹**（`homing`）：追踪导弹发射器弹丸，每帧向最近敌人转向（`homingTurnRate` 限制转弯速率），命中后爆炸（`blastRadius: 48`）。
  - **酸液弹**（`acid`）：毒液枪弹丸，命中施加中毒DOT（`poisonDamage` + `poisonDuration`），同时在落点生成酸液地面区域（`puddleRadius/Duration/Damage`）。
  - **集束弹**（`cluster`）：分裂炮弹丸，命中或寿命到期后分裂成 8 颗 standard 碎片子弹（`fragmentCount/Damage/Speed/Life`），放射状扩散。
  - **力场弹**（`force`）：力场枪 3 弹丸散射，超低伤害但超高击退（`knockback: 18`），敌人被击退撞墙时造成额外伤害（`wallSlamDamage: 15`）。
  - **吸血弹**（`vampyre`）：吸血枪弹丸，命中回复伤害 25% 为玩家生命值（单次上限 10），红色血液拖尾+绿色治愈粒子。
  - **钉刺弹**（`needle`）：钉刺枪高速小伤害弹丸，命中嵌入敌人体内叠加钉刺层数（最多 6 层），持续 DOT = 单层伤害 × 层数，银灰金属拖尾。
  - **磁轨弹**（`railgun`）：磁轨炮弹丸，每帧加速（`railAccel: 0.6`），速度动态影响伤害（`currentDamage = baseDmg + speed × 0.2 × baseDmg`），速度 ≥ 14 时启用穿透（3 次），青色电磁拖尾强度随速度增长。基础伤害 20，初速 6，最高速度 32。
- `CombatSystem.updateBurst()`：更新三连发状态机（检查间隔、发射后续子弹、消耗弹药）。
- `CombatSystem.updateBlackHoles()`：更新黑洞实体（拉力、周期伤害、粒子、到期移除）。
- `CombatSystem.updateBurnEffects()`：更新燃烧 DOT（周期伤害、火焰粒子）。
- `CombatSystem.updateFreezeEffects()`：更新减速/冻结状态（冻结粒子、slowTimer/frozenTimer 递减、freezeStacks 管理）。
- `CombatSystem.updatePoisonEffects()`：更新中毒 DOT（周期伤害、绿色粒子，支持冻结易伤 1.5x）。
- `CombatSystem.updateAcidPuddles()`：更新酸液地面区域（周期范围伤害、气泡粒子、到期移除）。
- `CombatSystem.updateForceEffects()`：检测被力场枪击退的敌人是否撞墙，撞墙造成额外伤害并生成冲击粒子。
- `CombatSystem.updateNeedleEffects()`：更新钉刺嵌入 DOT（按层数倍增伤害、银灰火花粒子，支持冻结易伤 1.5x）。
- `CombatSystem._chainLightning()`：处理闪电链式跳跃（查找最近未命中敌人、衰减伤害、生成 `lightning_arc` 粒子）。
- **冻结易伤**：所有伤害源（子弹、爆炸、燃烧 DOT、闪电链）对冻结中敌人造成 1.5x 伤害。
- **敌人速度系统**：`Enemy.getEffectiveSpeed()` 统一处理减速/冻结对移动速度的影响，所有敌人子类使用此方法。
- `Renderer` 子弹渲染支持 `rocket`、`bolt`、`laser_bolt`、`grenade`、`flame`、`black_hole_projectile`、`teleport`、`lightning`、`ice_shard`、`ricochet`、`boomerang`、`plasma`、`homing`、`acid`、`cluster`、`force`、`vampyre`、`needle`、`railgun` 与默认圆形子弹分支。
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
- `WorldObjects` 已细分为 `Breakables` / `Particles` / `EnemyUpdate` / `Portals` / `DroppedItems`，便于定位高并发场景下的真实热点。
- 光影系统新增两个热点标签：
  - `LightingUpdate`: 光源扫描、遮挡缓存与可见性裁剪。
  - `LightingRender`: 离屏光照缓冲绘制与主画布合成。

### 物品与建造系统
- **Inventory**: `InventorySystem` 管理所有物品（武器+可放置物体+消耗品+服装）。快捷栏（Hotbar）支持键盘选择。服装物品拾取后可在背包界面左侧的装备槽中装备。
- **武器实例化**: 武器入包时自动生成唯一实例数据（含独立弹药状态），`HandSystem` 在开火/换枪/换弹时实时回写到背包对应实例。
- **Build Mode**: 选中可放置物体时进入建造模式，`BuildSystem` 处理网格吸附与放置判定。
- **消耗品**: 选中消耗品（如恢复针）后进入“使用模式”，鼠标左键会触发道具效果并扣除数量，不进入建造逻辑。
- **掉落物**: `DroppedItem` 类负责管理地面掉落（武器/可放置物/消耗品），包含悬浮动画与拾取提示。
- **交互**: `PlayerSystem.js` 维护 `droppedItems` 列表，处理 E 键拾取、快捷栏切换以及左键动作分流（射击/放置/使用消耗品）。
- **快捷生成载具**: `PlayerSystem` 监听 `O` 键并调用 `WorldSystem.spawnVehicleNearPlayer()`，在玩家附近搜索可用空位后生成一辆随机类型载具（SUV/Truck/Police/Tank/Spider），避免与墙体、可破坏物、敌人、玩家和已有载具重叠。Tank 为坦克载具，进入后鼠标控制炮塔方向、点击发射导弹（rocket 弹丸），炮塔独立于车身旋转。Spider 为6脚机械蜘蛛载具，使用程序化三足步态动画（`SPIDER_LEG_CONFIG` 定义6条腿的关节参数，交替 Group A/B 实现三足步态），炮塔发射 hitscan 激光束（`bulletSystem.fireLaserBeam()`），2.5D 渲染按远/近腿分层绘制实现正确遮挡。
- **快捷菜单**: 按 M 键呼出，展示可用功能的快捷入口（背包、Debug、按键说明）。`Debug` 子菜单包含：参数调试、性能面板、调试面板、碰撞显示。参数调试当前提供“背景亮度”设置（控制未受光照区域亮度，0~255）。点击功能项执行对应操作并自动关闭菜单；子菜单支持返回主菜单。"按键说明"子面板列出所有快捷键绑定。DOM 覆盖层模式与背包一致，打开时暂停游戏逻辑。
- **宠物系统**: 宠物存储在独立的 `pets` 数组（不在 `enemies` 中），不参与战斗碰撞。宠物作为消耗品道具注册（`consumable:pet_dog`/`consumable:pet_cat`），从快捷栏左键使用后召唤。`WorldSystem.updatePets()` 复用流场寻路实现跟随。宠物超过 600px 距离时自动传送到玩家身边（带消散/出现粒子特效）。猫（`PetCat`）比狗（`PetDog`）速度更快、体型更小。

### 建筑生成场景（construction + game）
- `construction` 与 `game` 现优先使用 `generation/TownLayoutGenerator.js` 生成大规模聚落型小镇；旧 `ConstructionLayoutGenerator.js` 保留兼容与回退用途。
- 地图 profile：
  - `hub/test/dungeon/dungeon_f2` 继续使用 130×130 tile 世界。
  - `construction/game` 切换到 420×420 tile 世界，约为旧世界面积的 10 倍，并启用更粗粒度导航网格（32px cell）+ 局部流场 + 地板 chunk cache。
- 新 town 生成流水线：
  - `MapProfiles`: 选择 `town_large` preset，并把世界尺寸、导航网格和地板缓存模式传给 `WorldSystem`。
  - `TownDistrictPlanner`: 规划中心广场、十字主街、次级道路与 4 类 block（商业、混合住宅、外圈住宅、服务边缘）。
  - `TownBlockAllocator`: 按 `street_row / mixed_row / paired_houses / courtyard_cluster` 四种策略把 block 转成建筑簇位。
  - `BuildingTemplateLibrary`: 提供 24 套建筑模板（住宅 10、商业 8、服务 6），每套模板由多个房间模板组合而成。
  - `RoomTemplateLibrary`: 提供房间语义模板（`foyer/living_room/bedroom/kitchen/bathroom/study/office/retail/workshop/clinic/storage/corridor`），建筑模板只需声明房间槽位大小和引用的房间模板。
  - `BuildingTemplateAssembler`: 负责模板旋转（支持四向朝向）、房间/门/墙 tile 转换、家具摆放与布局校验。
  - `LayoutCompiler`: 编译为 `BreakableObject` 定义列表。
  - `FloorMapGenerator`: 生成 420×420 对应的地板子格地图，并额外绘制广场、主街/次街硬质地面，以及建筑入口到道路的连通步道。
  - `OutdoorPlacer`: 在未被道路/广场/建筑占用的自然地表上补植被与杂物，保证边缘区仍有留白和自然感。
- 家具语义模板在原有 `living_room/bedroom/study/bathroom/storage/corridor/foyer/kitchen` 基础上新增 `office/retail/workshop/clinic`，用于商业和服务建筑内部。
- `WorldSystem.initConstructionMap()` 负责：
  - 建立地图边界墙。
  - 调用生成器并实例化对象。
  - 根据 profile 决定使用整张 `floorCanvas` 还是 `FloorChunkCache`。420×420 小镇地图默认走分块懒渲染，不再创建单张超大离屏地板。
  - 依据生成元数据把 Hub 返回传送门放到广场南侧主路，而不是固定左上角。
  - 生成失败时使用 fallback 布局，保证场景可进入；fallback 同样会初始化草地地板，避免出现“无地面”。
- `WorldSystem.initGameMap()` 复用同一套大镇生成与地板流程，然后叠加房间随机枪支、敌人与击杀掉落生成。
- 性能策略：
  - `NavigationGrid.updateLocalFlowField()` 只维护玩家附近窗口，避免 420×420 世界整图流场。
  - `ObstacleSpatialIndex` 与 Camera 边界按当前地图 profile 动态重建。
  - `FloorChunkCache` 只缓存可见区域附近的地板 chunk，Renderer 直接裁剪绘制可见块。
  - 建筑模板总数控制在约 33~36 栋量级，兼顾大地图密度和运行时对象数量。
  - `OutdoorPlacer` 对大镇启用稀疏植被与数量上限，避免按全图概率铺出数万 `breakableObjects`。
  - `Game.update()` 与 `Renderer.draw()` 现在都会先做视口附近裁剪，`breakableObjects`/墙体/敌人/载具/传送门不再默认全量进入逐帧更新和排序。
  - 树/灌木/草丛类户外装饰不再参与光照遮挡，减少 `LightSystem -> ShadowCasterBuilder` 的静态 hash 与遮挡构建成本。
- `game` 场景仍基于生成器输出的 `meta.indoorSpawnTiles` 与 `meta.indoorRooms` 管理室内刷怪与房间掉落。

### 地牢模式（dungeon / dungeon_f2）
- 通过 Hub 紫色传送门进入，类似《挺进地牢》的闯关玩法，支持 2 层楼层。
- 生成流水线（`DungeonLayoutGenerator.js`）：中心 `80x80` 工作区 BSP 切分（minRegion 14）→ 紧凑房间筛选（10~14 间，普通房 10~16 tiles）→ 近邻约束 MST（K近邻 + 短边阈值）+ 1~2 条短环路 → 房间分类（`combat_open/combat_cover/combat_maze/challenge_trapline/reward/boss_arena`）→ 房间内部模板生成 → 能量屏障 gate 放置在房间-走廊交界处 → 房间掩体（box/barrel/explosive_barrel）与装饰（`dungeon_rubble/dungeon_iron_cage/dungeon_bone_pile`）生成 → BFS 深度计算 → 按深度/分类/楼层分配敌人配置。生成带质量门限与自动重试，约束走廊均长与极值。
- 房间内部布局模板（`RoomInteriorTemplates.js`）：为非起始房间按“类型+分类”选择布局模板，生成永久墙体结构作为掩体。当前 12 种模板：`pillars`、`center_divide`、`l_alcoves`、`cross`、`corridors`、`offset_pillars`、`checker_blocks`、`broken_ring`、`zigzag_walls`、`gate_channels`、`arena`、`boss_spokes`。模板选择采用加权随机，已使用模板权重减半以促进多样性。内部墙体 tiles 合并到 wallTiles，自动获得碰撞和渲染。
- 房间类型：`start`（起始安全区+返回传送门）、`normal`（战斗房+内部墙体结构+掩体物品）、`boss`（距起始房最远的房间，Boss + 小怪+竞技场布局+掩体）。
- 运行时管理（`DungeonManager.js`）：玩家进入 idle 房间 → 状态变 active → 激活能量屏障（动态添加墙体 rect）→ 按 enemyConfig 生成敌人 → 全灭后状态变 cleared → 关闭屏障（移除墙体 rect）→ 30% 概率掉武器 + 50% 概率掉消耗品。新增小地图可见性模型：`visited + frontier`。
- 能量屏障门系统：不使用 BreakableObject，而是在 `DungeonManager.gates[]` 中管理。激活时动态往 `worldSystem.walls[]` 添加墙体 rect 阻挡通行，清除时移除。`Renderer._drawEnergyBarrier()` 绘制蓝紫色半透明屏障（竖条纹脉冲+水平能量带+角落光点）。
- 楼层系统：F1 Boss 清除后在房间中心生成绿色"FLOOR 2"传送门 → 进入 `dungeon_f2` 地图 → F2 Boss 清除后生成金色"VICTORY"传送门回 Hub。
- F1 敌人：depth 1-2 僵尸系、depth 3-4 混合（+brute/hunter）、depth 5+ 精英（brute/hunter/soldier），Boss = mutant_beast。
- F2 敌人（更强）：depth 1-2 zombie_female/brute/hunter、depth 3-4 brute/hunter/soldier、depth 5+ hunter/soldier 多数，Boss = mecha_golem + 3 soldier + 1 hunter。
- 小地图：`Renderer.drawDungeonMinimap()` 在右上角绘制拓扑节点图（约 158×158 区域），采用“邻接预览 + 动态探索”：已探索房间实心、前沿房间半透明轮廓、已探索连线实线、前沿连线虚线；当前房间高亮，锁门状态脉冲描边，玩家标记为朝向箭头，标题显示 `F层 + 已探索/总房间`，底部附状态图例（CLR/ACT/BOSS/FR）。
- 地板使用 STONE(5) 石砖瓦片，石砖纹理通过 `FloorSprites.js` 的 `createStoneVariant()` 程序化生成。

### 地板瓦片系统
- 每个 32×32 网格包含 2×2 = 4 块 16×16 地板子格，支持墙内外不同地面类型。
- 5 种地面类型：GRASS(1)、WOOD(2)、CONCRETE(3)、DIRT(4)、STONE(5，地牢石砖)，NONE(0) 使用棋盘格 fallback。
- 数据存储：`WorldSystem.floorMap`（Uint8Array，尺寸由当前 map profile 决定）+ `floorCanvas` 或 `floorChunkCache`。
- 渲染：小地图或中小型地图继续使用整张 `floorCanvas`；420×420 小镇地图使用 `FloorChunkCache` 按 chunk 懒渲染并裁剪绘制，无地板缓存时才回退棋盘格。
- 类型边界目前无过渡效果，直接拼接。
- 外围墙体子格按内外分裂：内侧 WOOD、外侧 CONCRETE，确保墙两侧地面不同。
- 大镇模式下，`FloorMapGenerator` 会额外绘制广场、道路和建筑入口连通步道，形成明确的聚落骨架。
- 详见 `docs/feature/FLOOR_TILE_SYSTEM.md`。

### 规范
- **素材分离**: 所有美术资源定义必须在 `src/assets` 中。
- **像素绘制**: 复杂物体请参考 `docs/PIXEL_ART_GUIDE.md` 使用程序化绘制。
- **逻辑分层**: 渲染代码不应混入业务逻辑，输入处理应通过 `Input` 类解耦。

### 移动碰撞约定
- 玩家和敌人通过 `getMovementHitboxAt(x, y)` 提供统一的“移动碰撞体”（脚底占地）。
- `WorldSystem.resolveEntityMovement()` 负责统一处理移动、贴墙滑动、卡住检测与自动脱困。
- `WorldSystem.isRectBlocked()` 优先走 `ObstacleSpatialIndex` 的局部候选查询，避免每次碰撞检测全量扫描墙体/可破坏物。
- 门关闭时会先做阻挡预检，避免将玩家或敌人夹进门框。
- 当敌人与玩家路径不可达（或持续卡住）时，`WorldSystem` 会触发破障逻辑：优先攻击阻挡路径的门，其次攻击其他阻挡物体，打通后再继续追击。
- 非僵尸远程敌人（Hunter/Soldier）在近门受阻时可优先开门；若仍无法通行，再走破障流程。
- 自适应墙体 (`wall`) 采用**多段碰撞体**（`getHitboxes()`），不再等价为单个矩形包围盒。
- 敌人分离采用两层策略：AI 内部 `getNearbyEnemies()` 软分离 + `WorldSystem` 末尾基于网格邻域的稳定硬分离（累计位移后单次应用），避免全局 `O(N^2)` 同时抑制重叠与震荡。
- 墙体判定语义拆分为三类：
  - `collision hitboxes`: 用于玩家/敌人/载具移动阻挡。
  - `hurtboxes` (`getHurtboxes()`): 用于子弹/激光命中检测。
  - `occlusion hitboxes` (`getOcclusionHitboxes()`): 用于渲染遮挡排序，不直接复用碰撞底边。
- 可破坏物 `hurtboxes` 已改为自动生成：除 `door_h/door_v` 外，优先使用物体素材 alpha 的当前帧最小包围盒（缺失时回退并集包围盒），不再依赖每个 object 文件手工维护。

### PixelOS 交互式电脑系统
- **入口**：玩家靠近 `computer_desk` 物体按 E 键触发，通过 `PlayerSystem.onInteract` 回调打开。
- **交互提示**：靠近电脑时显示英文提示“[E] USE COMPUTER”，采用与现有门/传送门一致的提示风格（`bold 7px monospace`，黄色），提示半径与实际交互半径保持一致（50px）。
- **生成接入**：`computer_desk` 已接入建筑 `study` 语义房间模板，可在 `construction/game` 流程化地图中刷出。
- **架构**：`src/pixelOS/` 独立目录，包含完整的像素 macOS 模拟系统。
  - `PixelOS.js`: 主控制器，状态机 (off→booting→desktop)，独立 `requestAnimationFrame` 渲染循环。
  - `PixelOSOverlay.js`: DOM 遮罩层 + Canvas 创建（384×256 分辨率，CSS `image-rendering: pixelated`），支持点击遮罩外区域关闭 OS。
  - `PixelOSRenderer.js`: 渲染工具（内置 4×5 像素位图字体、圆角矩形、渐变、Apple Logo 等）。
  - `AnimationSystem.js`: 通用补间动画引擎（easeOutCubic/easeInCubic/linear）。
  - `InputManager.js`: 鼠标/键盘事件捕获，坐标映射到 OS 画布，键盘事件 `stopPropagation()` 隔离游戏输入。
  - `Desktop.js` / `MenuBar.js` / `Dock.js`: 桌面壁纸（支持多壁纸切换：蓝色渐变 + 像素画山脉日落）、顶部菜单栏（Apple Logo + 时钟）、底部 Dock（9 个应用图标，悬停放大效果）。
  - `Wallpaper.js`: 像素风山脉日落壁纸（程序化绘制：渐变天空、太阳、星星、三层山脉剪影、水面倒影、树木剪影）。
  - `WindowManager.js` / `Window.js`: 窗口 Z 序管理、拖拽、关闭/最小化/最大化、交通灯按钮、开关动画。
  - `VirtualFS.js`: 虚拟文件系统（目录树 + 文件内容）。
- **内置应用** (`src/pixelOS/apps/`):
  - `CalculatorApp.js`: 4×5 按钮网格计算器，支持鼠标和键盘输入。
  - `TerminalApp.js`: 黑底终端，支持 `help/ls/cd/cat/pwd/clear/echo/date/whoami/uname` 命令。
  - `FinderApp.js`: 文件浏览器，左侧边栏 + 右侧图标网格。
  - `NotesApp.js`: 黄色便签，文本输入 + 闪烁光标。
  - `SettingsApp.js`: 系统设置，三栏分类（通用/显示/关于），支持壁纸切换。
  - `MailApp.js`: 邮件客户端，三文件夹（收件箱/已发送/草稿），预置趣味邮件，支持列表+详情视图。
  - `Game2048App.js`: 2048 数字滑动游戏，4×4 网格，方向键操作，数字颜色区分，Game Over/Win 检测。
  - `TetrisApp.js`: 俄罗斯方块，10×20 格游戏区，7 种标准方块（I/O/T/S/Z/J/L），行消除计分，下一块预览。
  - `MarioApp.js`: 超级马里奥平台跳跃游戏，完整一关（50 列关卡）。8×8 瓦片、水平滚动摄像机、物理引擎（重力/可变跳高/摩擦）、Goomba 敌人（踩杀）、?块出币/砖块破碎、水管/阶梯/旗杆终点、分数/金币/倒计时 HUD。支持 Arrow + WASD 双键位与移动/跳跃并行输入，含跳跃缓冲与离台容错（coyote time）。
- **持久化**：PixelOS 实例在 `Game` 构造函数中创建一次，窗口位置、便签内容、终端历史在关闭/重开间保持。
- **游戏集成**：`Game.js` 中 `isComputerOpen` 为 true 时 `update()` early return，ESC 键或点击遮罩外区域关闭 PixelOS。
