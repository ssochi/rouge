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
      - `MutantBeast.js`: 变异巨兽 BOSS (HP 900 / dpsCap 26, 80×80, 90%击退抗性, 三阶段弹幕化战斗)。阶段1(>60%HP): 近战(重拳/横扫/震地波) + 「怒吼环形弹幕」(前摇0.6s→10-12发放射弹, 冷却~4s, 逼玩家走位不能站桩)；阶段2(60%-25%): 新增「横扫弹幕波」(扇形三连发, 每波5发55°/间隔0.25s) + 冲锋撞墙震落「落石预警圈」(红圈0.8s后落石AoE 半径40/伤12)；阶段3(<25%狂暴): summon 改持续唤潮(每5s从房间边缘唤起2只 wraith/plague_rat, 房内上限6) + 跳劈落地追加16发环形弹 + 提速0.6→0.75 + 全身泛红。弹幕经 `computeRingAngles`/`computeFanAngles`(复用 RangedPatternBehavior 角度数学)算角 → `CombatSystem.spawnEnemyBullet` 发射(单发伤≤12红线, 速2.8)；落石延迟AoE走自持 `rockfalls[]` + 每帧 `updateRockfalls()` 到点调 `spawnGroundSlam`。转阶段0.5s停顿+吼叫音效+屏幕震动(SfxData `boss_roar`/`boss_enrage`/`boss_rockfall_warn` [horde:boss])。跳砸/召唤空中期间无敌（`getBulletHurtbox()` 返回 null）。`isBoss=true` 标记用于 Renderer 绘制屏幕顶部 BOSS 血条(相位色 绿→红→紫)。死亡掉落 2-3 把随机武器。
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
      - `DungeonManager.js`: 地牢运行时管理器。房间状态机（idle→active→cleared）、O(1) 玩家位置检测（roomGrid 数组）、能量屏障门（gates）动态墙体添加/移除、敌人跟踪与房间清除奖励掉落、楼层系统（F1→F2→F3，`FINAL_FLOOR` 泛化）、Boss 清除后传送门生成、小地图数据提供（visited/frontier 可见性、锁门态、拓扑节点与边）。
      - `ObstacleSpatialIndex.js`: 静态障碍空间索引（墙体 + 可破坏物 hitbox），用于加速矩形阻挡查询与局部障碍检索。
      - `FloorChunkCache.js`: 超大地图地板分块缓存。对 420×420 小镇地图不再构建单张超大离屏地板，而是按 chunk 懒渲染并做 LRU 缓存。
      - `PlayerSystem.js`: 玩家移动、拾取与输入驱动的操作逻辑（含快捷栏消耗品左键使用、宠物召唤）。**血包/宠物类消耗品拾取即用**：`isInstantUseConsumable()` 判定（消耗品且带 healAmount/maxHpBoostPercent/petType），`tryPickupWeapon()` 命中时直接调 `applyConsumableEffect()` 当场回血/召唤，不入背包；纯回血道具满血时不拾取（留地上避免浪费），恢复针(加最大血)与宠物始终生效。`applyConsumableEffect()` 为背包使用与拾取即用共用的效果内核。
      - `EnemyWeaponController.js`: 远程敌人武器状态控制（弹药、射速节流、换弹进度、实例弹药回写）。
      - `CombatSystem.js`: 战斗协调器，保持对外 API 不变，内部委托给三个子系统，并统一提供“开火路径阻挡判定”给玩家与敌人射击 AI。
      - `BulletSystem.js`: 子弹生命周期管理（移动、尾迹、碰撞检测、敌人命中判定）。
      - `StatusEffectSystem.js`: 状态效果与特殊武器逻辑（爆炸、黑洞、闪电链、传送、冻结、燃烧、流血DOT、中毒DOT、酸液地面、力场撞墙、钉刺嵌入DOT）。
      - `MeleeSystem.js`: 近战攻击系统——攻击状态机（IDLE→WINDUP→SWING→RECOVERY）、扇形/直线命中检测、刀光/戳刺拖尾VFX。支持暴击(Dagger)、劈斩加成(Greatsword)、流血DOT(Battle Axe)、戳刺(Spear)等数据驱动的武器特殊机制。5把近战武器：Katana/Dagger/Greatsword/Spear/Battle Axe。
      - `ParticleSpawner.js`: 粒子生成（碎片、血液、弹壳、刀光拖尾）与粒子物理更新。
      - `InventorySystem.js`: 物品数据管理、背包槽位与快捷栏逻辑（weapon/placeable/consumable/costume）。
      - `CostumeSystem.js`: 服装系统——管理玩家换装状态（发型/帽子/衣服/眼镜 4个部位）、帧缓存与按需生成。详见 `docs/feature/COSTUME_SYSTEM.md`。
      - `BuildSystem.js`: 蓝图预览、放置判定与物体生成。
      - `generation/`: 场景生成子模块。Build/Game 场景现拆分为两条管线：旧 `ConstructionLayoutGenerator.js`（随机建筑外框 + BSP 切房，保留兼容）和新 `TownLayoutGenerator.js`（中心广场型聚落骨架 + 建筑模板装配）。新增 `TownDistrictPlanner.js`（广场/主街/街区规划）、`TownBlockAllocator.js`（按 block/density/strategy 分配建筑簇）、`BuildingTemplateLibrary.js`（建筑级模板库）、`RoomTemplateLibrary.js`（房间模板语义库）、`BuildingTemplateAssembler.js`（模板旋转、门位/墙体/家具装配）。地牢场景仍由 `DungeonLayoutGenerator.js` 负责：中心工作区 BSP 切分→紧凑房间筛选→近邻约束 MST + 短环路→房间分类（open/cover/maze/trapline + treasure/elite/shop/boss）→内部模板→gate 放置→掩体/装饰/火盆/壁挂火把/地板贴花生成（楼层主题配比）→楼层敌人配置；`RoomInteriorTemplates.js` 提供 26 种房间内部布局模板（含特殊房专属与 Boss 三款）与按分类加权选择、`coverSpots` 建议掩体位。
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
    - `Renderer.js`: 负责场景绘制、像素光照合成与 UI 刷新。含 `drawBossHpBar()` BOSS 血条、`drawDungeonMinimap()` 地牢小地图（右上角面板，走廊正交折线、房型像素微图标、当前房呼吸脉冲、锁门橙脉冲、底部楼层名+探索度信息条）、`_drawDungeonBigMap()` 全屏大地图覆盖层（Tab / 移动端点小地图开关，`input.bigMapOpen` 驱动，游戏不暂停）、`_drawEnergyBarrier()` 能量屏障渲染（蓝紫色脉冲条纹+角落光点）。小/大地图共用 `_renderDungeonMap()` 绘制内核 + `_drawRoomIcon()` 手绘骷髅/宝箱/金币/星像素图标。**Boss 房邻接即揭示**：`_renderDungeonMap()` 的 frontier 分支对 `type==='boss'` 的未探索房绘暗红底+骷髅+红色脉冲虚框（而非通用灰 `?`），让玩家在门口就能判断、决定是否此刻进 Boss。地板渲染现优先走 `floorChunkCache`，没有 chunk cache 时再回退到整张 `floorCanvas`。
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
  - `hub/test/dungeon/dungeon_f2/dungeon_f3` 继续使用 130×130 tile 世界。
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

### 地牢模式（dungeon / dungeon_f2 / dungeon_f3）
- 通过 Hub 紫色传送门进入，类似《挺进地牢》的闯关玩法，支持 3 层楼层（`FINAL_FLOOR=3`）。
- **楼层主题（P5，`src/core/dungeon/DungeonThemes.js`）**：F1 冷狱（冷蓝灰）→ F2 苔窟（暗绿）→ F3 燔狱（暗红）。每主题定义墙体/地板色板、环境光 `{r,g,b}`、火把/火盆火光色、装饰与贴花配比权重。`WorldSystem.dungeonTheme` 为当层主题，驱动 Renderer 墙体贴图选集、`LightBufferRenderer.ambientOverride` 环境光染色（非地牢为默认灰度 115）与生成器配比。
- 生成流水线（`DungeonLayoutGenerator.js`）：中心 `80x80` 工作区 BSP 切分（minRegion 14）→ 紧凑房间筛选（10~14 间，普通房 10~16 tiles）→ 近邻约束 MST（K近邻 + 短边阈值）+ 1~2 条短环路 → 房间分类（`combat_open/combat_cover/combat_maze/challenge_trapline/boss_arena` + 特殊房 `treasure/elite/shop` 每层各 1：最深普通房=宝箱房、次深=精英房、深度约 50% 处=商店房）→ 房间内部模板生成 → 能量屏障 gate 放置在房间-走廊交界处 → 房间掩体（box/barrel/explosive_barrel，模板 `coverSpots` 建议位优先）与装饰（主题 `decorWeights` 加权 + 特殊房固定件：Boss 对称雕像/精英旗帜/宝箱房祭坛）+ 火盆布点（Boss 四角/精英对角/宝箱商店中轴侧）→ 壁挂火把布点（「南邻为地板」的墙面连续段等距，间距 6）→ 地板贴花列表（房间散布 + 角落蛛网 + Boss 圆环 + 走廊稀疏）→ BFS 深度计算 → 按深度/分类/楼层分配敌人配置。产物含 `lightObjects`/`decals`。生成带质量门限与自动重试，约束走廊均长与极值。
- 房间内部布局模板（`RoomInteriorTemplates.js`）：为非起始房间按“类型+分类”选择布局模板，生成永久墙体结构作为掩体。当前 26 种：普通房 18（`pillars/center_divide/l_alcoves/cross/corridors/offset_pillars/checker_blocks/broken_ring/zigzag_walls/gate_channels` + P5 新增 `corner_cuts/alcove_niches/twin_chambers/funnel_throat/hex_pillars/side_gallery/diamond_core/parallel_fins`）、特殊房专属 5（`treasure_vault/treasure_pockets/shop_stalls/elite_pit/elite_gauntlet`）、Boss 3（`arena/boss_spokes/boss_quadrants`）。模板可返回 `coverSpots` 建议掩体位；选择加权随机、已使用模板权重减半。内部墙体 tiles 合并到 wallTiles，自动获得碰撞和渲染。健全性由 `tests/room-templates.test.js` 保证（墙不越界、边缘 2 tile 通带干净、BFS 无封死区域）。
- 房间类型：`start`（起始安全区+返回传送门）、`normal`（战斗房+内部墙体结构+掩体物品）、`boss`（距起始房最远的房间，Boss + 小怪+竞技场布局+掩体）。特殊房：**宝箱房**（不锁门不刷怪，初始化投放分级宝箱 `TREASURE_ROOM_CHESTS`，F1 铁+木/F2 秘银+铁）、**精英房**（精锐小队，清除保底钥匙+铁箱+金币×1.5，`ELITE_CLEAR`；P4 词缀接入后叠加强化）、**商店房**（安全区，商人 NPC + 5 件货品：1 稀有度加权武器+2 遗物+钥匙+medkit，价格 `SHOP` 配置、F2 ×1.4；`DungeonShop.generateShopInventory` 生成，`ShopItem` 实体 E 键购买，武器/medkit 落地拾取、遗物即时生效、钥匙入账，余额不足红字 NEED GOLD）。
- 运行时管理（`DungeonManager.js`）：玩家进入 idle 房间 → 状态变 active → 激活能量屏障（动态添加墙体 rect）→ 按 enemyConfig 生成敌人 → 全灭后状态变 cleared → 关闭屏障（移除墙体 rect）→ 清房奖励（金币必掉 + 15% 钥匙 + 15% 稀有度加权武器 + 8% 过渡木箱 + 50% 消耗品，数值见 `EconomyConfig.ROOM_CLEAR`）。Boss 清除额外生成保底宝箱（F1 秘银 / F2 龙纹，`BOSS_CHEST_TIER`）。小地图可见性模型：`visited + frontier`。
- 能量屏障门系统：不使用 BreakableObject，而是在 `DungeonManager.gates[]` 中管理。激活时动态往 `worldSystem.walls[]` 添加墙体 rect 阻挡通行，清除时移除。`Renderer._drawEnergyBarrier()` 绘制蓝紫色半透明屏障（竖条纹脉冲+水平能量带+角落光点）。
- 楼层系统：F1 Boss 清除 → 绿色"FLOOR 2"传送门 → `dungeon_f2` → F2 Boss 清除 → 橙色"FLOOR 3"传送门 → `dungeon_f3` → F3 Boss 清除 → 金色"VICTORY"传送门回 Hub（`DungeonManager._onBossCleared` 按 `FINAL_FLOOR` 泛化）。层间推进钩子 `WorldSystem._dungeonFloorFromMapType` 从地图类型解析楼层并更新 `runState.floor`，种子保持不变（每层种子 = seed + floor）。
- **敌人配置（P4，`src/core/dungeon/FloorConfigs.js` 数据驱动）**：每层定义深度分档敌人池（shallow ≤2/mid ≤4/deep 5+，权重比例分配数量）、精英预算（eliteChance/eliteAffixCount）、精英小队、Boss 编成与数值缩放（hpMult/dmgMult：F1 ×1.0/F2 ×1.3/F3 ×1.6）。缩放在 `DungeonManager._applyFloorScaling` 应用：HP/接触伤害直接乘算，弹幕与武器伤害经 `enemy.damageMult` 乘区（`spawnEnemyBullet`/`_pushWeaponProjectiles` 按 owner 消费）。
- Boss 楼层顺序：F1 变异巨兽（近战+弹幕三阶段：怒吼环/横扫波/落石余震/狂暴唤潮）→ F2 机械巨蛇（机动压迫，P4 正式接入）→ F3 机械魔偶（弹幕终战）。
- **行为组件层（P4，`src/core/entities/behaviors/`）**：`ChaseBehavior`/`KiteBehavior`（距离带三态+带内漂移）/`StrafeBehavior`/`RangedPatternBehavior`（fan/ring/aimed_burst/spiral/wave_volley/split_shot/wall 弹幕库，数据配置驱动 `spawnEnemyBullet`）/`SummonBehavior`（前摇+批量+上限，onSummon 回调）/`TelegraphedChargeBehavior`（预警线→冲锋→硬直）/`PounceChargeBehavior`（冲刺扑击：距离带 100-200px 概率触发→蓄力预警 0.5s→1.5x 直线扑击 0.6s→硬直，`getTelegraphLine`/`getPhase` 供实体渲染预警、`tryConsumeHit` 一次性接触伤害闸门）/`FlankingBias`（包抄偏置：`setFlankGroupCount` 每帧注入存活近战数，≥3 时按构造顺序奇偶分左右翼 ±25° 旋转寻路向量，cos/sin 预算、运行期零三角函数零分配）。组件经 ctx 注入实体 update 依赖，新敌人 = 数值 + 组件组合；现有敌人不强制迁移。
  - **危机感行为装配（tension-batch）**：`PounceChargeBehavior` 装配 ZombieFemale/Revenant（Hellhound 沿用等价的 `TelegraphedChargeBehavior`）；`FlankingBias` 装配 Zombie/ZombieFemale/ZombieBrute 群体近战（在各实体 `getNavDirection` 前旋转，仍会绕墙）；远程走位 Archer/Cultist 距离带 150-250、Soldier 新增 `retreatMove`（<150px 后撤维持间距，射击节奏不变）。配套数值：清房消耗品掉率 50%→15%、medkit 15→25 金、eliteChance F1/F2/F3 0.10/0.15/0.20、增援波预警 50→32 帧。
  - **弹幕模式扩展（参考挺进地牢）**：`spiral` 螺旋连发（起始朝玩家、逐发角度 +stepRad）、`wave_volley` 波浪齐射（带 wave 字段的蛇形弹）、`split_shot` 分裂大弹（飞行 splitAfter 帧后环形裂弹）、`wall` 弹墙（垂直瞄准方向一字排开平行弹、随机留缺口）。配套 `CombatSystem.spawnEnemyBullet` 新增可选运动字段并透传，`BulletSystem` 在子弹位移处实现：**wave 波浪弹**（`waveAmplitude/waveFrequency/waveAge` + 单位基向量 `waveBaseVX/VY`，沿垂直方向逐帧叠加正弦增量）、**split 分裂弹**（`splitAfter/splitCount/splitDamage/splitSpeed`，计时到点消失并环形迸发继承 owner 的普通敌弹）。两者仅对携带字段的子弹生效，对普通弹零开销；与玩家武器既有 M4/M5 字段以独立字段名隔离。
- **6 种地牢专属新敌人（P4）**：弹幕法师 Warlock（Kite+环形/扇形弹幕+受击积伤闪现）、自爆蜂 Boomer（高速逼近+引信红闪自爆，可提前引爆殉爆减半，可链爆）、召唤师 Summoner（Kite+周期召唤上限 4，召唤物入房间清除判定）、盾卫 Shieldbearer（慢速推进+正面 ±60° 塔盾减伤 90%，判定基于子弹击退向量夹角）、哨戒炮 Sentry（固定点蓄力→持续弹流→冷却，免疫击退）、投弹手 Lobber（Kite+抛物线榴弹落点红圈预警，越掩体）。美术全部走 Generator→Idle16/Run12/Attack8 管线（Sentry 机械体免 Run）。
- **3 种弹幕妖新敌人**：焰旋妖 Spinner（HP24/速0.8，悬浮火焰陀螺，Kite150-260 + `spiral` 螺旋扫射弹幕，径向对称无翻转、开火高速旋转，金币5）、怨眼 Weeper（HP18/速0.7，漂浮哭泣巨眼，Kite180-300 + `wave_volley` 幽蓝波浪泪弹，眼睑开合+泪痕+触须帘，金币5）、裂弹僧 Splitter（HP26/速0.85，抱爆裂法典的僧侣，Kite190-300 + `split_shot` 大弹裂成 8 颗小弹，书页翻飞+裂弹球自法典升起，金币6）。均走 Generator→Idle16/Run12/Attack8 管线，接入 `WorldSystem._createEnemyByType`、`Assets`、`EconomyConfig.ENEMY_COIN_VALUES` 与 `FloorConfigs`（F1 deep/roleMap.r 加 spinner；F2 mid/deep 与 F3 各档位加三妖权重 1.5~2，roleMap.r 按层加入）。
- **4 种机制型新敌人（[depth-batch:enemies]，详见 `docs/feature/DUNGEON_GAMEPLAY_DEPTH_BATCH.md`）**：盗宝地精 `LootGoblin`（HP30/速2.4，绿皮背麻袋小贼，追身偷 3-6 金币[`worldSystem.dungeonRunState.coins`，1s 冷却]，偷满 10 或存活 15s 原地钻地遁走[置 `escaped`，WorldSystem 死亡清扫无掉落移除]，被杀掉落=所偷×2+5[实体 `getDungeonCoinValue()` 覆盖金币]）；掘地虫 `Burrower`（HP45，循环状态机 潜地无敌追踪 2.5s[`getBulletHurtbox()`→null + `takeDamage` 吞伤 + 潜地清空控制/DOT，地表隆起土痕]→破土预警 0.6s→出土 AoE[`combatSystem.spawnGroundSlam` 半径50/12伤]+露头 2s 可打窗口→再潜地）；电弧双子 `ArcTwin`（HP28×2，`WorldSystem._spawnArcTwinPartner` 强制成对[蓝 index0/紫 index1 镜像并互链]，双子连线电弧每0.5s判8伤[线段vs玩家 hurtbox]、绕玩家两侧封走位、间距>12tiles 断弧，一只死另一只狂暴[速×1.4/接触CD×0.7/红化]）；复生亡灵 `Revenant`（HP40 近战，首次致死转尸体 3s[hp 保持 1 跳过死亡清扫/onKill；尸体 HP15，补刀打碎则真死]，未补刀半血复活+加速20%[黑雾粒子，仅一次，眼火转红]）。均走 Generator→Idle16/Run12/Attack8 管线（arc_twin 蓝/紫双色帧集、revenant 常态/复活眼红双色帧集），接入 `_createEnemyByType`/`Assets`/`ENEMY_COIN_VALUES`/`FloorConfigs`（loot_goblin 三层低权重0.5惊喜怪；burrower/arc_twin F2/F3 mid+deep[arc_twin 每计数=一对]；revenant F1 deep + F2 全档；burrower/revenant 入 roleMap.m，arc_twin 因成对逻辑不进模板池）。
- **3 种人潮基调新敌人（[horde:enemies]，替代撤池枪兵生态位，详见 `docs/feature/DUNGEON_HORDE_REBALANCE.md`）**：尸群蹒跚者 `Shambler`（HP10/速0.8/接触伤6，干瘪佝偻小腐尸炮灰，纯 `ChaseBehavior` 追击+接触撕咬无技能，成群提供割草人潮，spriteScale 0.9 比僵尸矮瘦一号，金币1）；骨笛吹手 `BonePiper`（HP30/速0.7 不直接攻击，Kite140-240 保持距离，技能①加速光环 120px 内敌人移速 ×1.25[固定倍率覆写 `enemy.speedAuraTimer/speedAuraMult`，`Enemy.getEffectiveSpeed` 消费，多 piper 不叠乘、死后随 timer 消退，脚下金色脉冲环]；技能②唤潮 `SummonBehavior` 每6s 吹笛前摇1s→破土唤起 2 只 shambler[土屑演出，`DungeonManager.scaleUncountedSpawn` 仅楼层缩放不计房间配额，自身唤起上限 6]，制造"先杀奶妈"优先级决策，金币5）；雨幕射手 `RainArcher`（HP26/速0.85，Kite160-280，不打直线弹→举弓朝天抛射[前摇0.75s]，撒放以玩家当时位置及周边登记 3 个错开延迟 AoE：`WorldSystem.spawnDelayedAoe`[滞空2s 不可见→末0.8s 显示红色收缩预警圈(Renderer `groundHazards` 绘制)→落点半径36/伤10、三圈错0.3s]，独立于射手结算[中途死亡箭雨照落]，间接弹幕+地形压力，金币4）。均走 Generator→Idle16/Run12/Attack8 管线（bone_piper 兜帽骷髅持金纹骨笛、rain_archer 斗笠骷髅背箭筒弯弓朝天），接入 `_createEnemyByType`/`Assets`/`ENEMY_COIN_VALUES`/`FloorConfigs`（shambler 三层 shallow/mid 权重 3-3.5；bone_piper 三层 mid/deep 权重1；rain_archer 三层 mid/deep 权重1.5）；机制见 `tests/horde-enemies.test.js`（光环范围/不叠乘、唤潮上限6、延迟落点结算）。
- **枪兵重定位（用户反馈：手枪猎人/随机武器士兵偏强）**：`FloorConfigs` 中 F1 `roleMap.r` 移除 hunter（改由 archer/cultist/spinner 顶位）、hunter 下放至 `roleMap.e` 精英位；F2 `roleMap.r` 移除 hunter、深度池 hunter/soldier 权重减半；F3 深度池 soldier 权重减半；精英房 `eliteSquad` 编成保持不变。`DungeonManager._spawnEncounterWave` 新增每房枪兵限额（`capGunUsers` 工具函数）：同房 hunter+soldier 合计生成 ≤2 只，超额时从同角色池改抽非枪兵类型（`room._gunUserCount` 跨波累计）。
- **内容扩充（三 agent 并行批次）**：新敌人 +5（狱火犬=预警线冲锋、链枷狱卒=360° 横扫重装、瘟疫鼠=游走+死亡中毒、炼狱僧侣=慢速大幽焰三连、石像鬼=雕像伪装伏击怪含 dormant 帧）；遗物 +8 至 26 个（血牙冠冕暴击回血/巨人腰带击退+8/荆棘胸甲受击反刺/金羊羔毛金币+25%/冷血怀表波刷新减速/深渊之眼满血敌+50%/迅捷箭袋弹速+30%/白骨护符击杀掉币，新增挂载点 onCritHit/onWaveSpawned/coinValueMult/thornBurst）；遭遇战模板 +8 至 27 个（锅炉房/酒窖/淋浴间/军犬舍/雕像长廊/军官休息室/断桥深渊/处刑场）。
- **精英词缀系统（P4，`src/core/dungeon/EnemyAffixSystem.js`）**：迅捷（移速×1.4）/坚韧（50% maxHp 护盾+破盾前减伤半）/灼热（近身灼烧+死亡爆燃）/裂魂（死亡 8 向弹幕）/再生（脱战 3s 每秒回 2%）。实例级包装 takeDamage/update，零基类侵入。精英房全员保底 1 词缀，普通房按层 eliteChance；视觉 = 体型 1.15×+词缀色光环+头顶词缀名（Renderer）；掉落金币 ×3 + 30% 钥匙。
- **BossPhaseController（P4，`src/core/entities/bosses/`）**：相位阈值（单向推进+onEnter）+ 招式池（动态权重/条件/优先级分层）+ per-招式冷却。三 Boss 已迁移（招式执行函数与数值不变）。
- **遭遇战房间系统（R3，`generation/EncounterTemplates.js`，详见 `docs/feature/DUNGEON_ROOM_REDESIGN.md`）**：普通战斗房不再随机撒怪撒掩体，改为字符画手作模板（`#` 墙/`c` 掩体/`d` 装饰/`m r h e` 出怪角色一张图一体设计，通用池 27 + f1/f2/f3 主题池按层拆分），尺寸适配降档回退、居中放置保 2 tile 通带。角色 → 敌人由 `FloorConfigs.roleMap` 按楼层映射；`DungeonManager` 逐波出怪（波1 全灭后预警刷波2，`enemyConfig.count = spawns.length`），`e` 角色保底词缀精英。设计约束（BFS 无封死/放置不越界）由 `tests/encounter-templates.test.js` 强制。特殊房与放不下模板的小房走原池化路径。
- **人潮基调掩体+波次翻新（[horde:templates]，详见 `docs/feature/DUNGEON_HORDE_REBALANCE.md`）**：用户实测转向"多单位人潮+混杂弹幕+地形博弈"。全模板波1/波2 各加密 2~3 近战字符（波1 3-8、波2≥波1、单房≤18，波次顺序刷新故同屏峰值≈单波量）；**含 r/R 弹幕位的模板掩体提标至 c≥4 且分散**（不全挤一行/一列，房间两侧都有依托），测试断言同步提标。F1 逐模板翻新并新增 2 个弹幕主题异形房（乱箭刑场雉堞墙 / 狱火炮廊柱廊，r/R 为主角 + 密集掩体阵 + 尖刺机关）。
- **战斗平衡（R4）**：Hunter fireIntervalMultiplier 2→3.2；Soldier 点射更短（4/3/2→3/2）且爆发间冷却 ×1.8→×3.2；敌人武器子弹速度 ×0.75（寿命 ×1.33 保射程）；地牢出怪统一 45 帧首发延迟（`holdFireTimer`，EnemyWeaponController 消费）；掩体 HP 上调（box 30→48/barrel 40→60）。
- **视觉基调（R1/R2）**：素材走「干净大色块」（近纯色+强明暗轮廓+稀疏大缝，变体差异克制）；环境光为默认 87%~93% 并按层染色，火把/火盆是氛围主光（普通战斗房角落保底火盆）；能量屏障为冷青蓝光栅柱+端点石墩（与火光冷暖对比）；小地图为真实房间形状图。调试直达参数 `?map=dungeon&seed=N&gates=1&room=N` + `tools/screenshot_game.mjs` 截图自查管线。
- **地牢视觉（P5）**：
  - 墙体贴图：`assets/dungeon/DungeonWallSprites.js` 按主题生成墙顶（32×32）+ 前脸（32×16）各 4 变体（完好/裂纹/苔痕/破损），Renderer 按 tile 位置哈希混铺；边界大墙与非地牢地图保持平涂。能量屏障占位墙 `isGateBarrier` 不绘制墙体（保留碰撞/光照遮挡）。
  - 地板：`FLOOR_TYPES.DUNGEON_F1/F2/F3`（6/7/8）主题石板 4 变体（`DungeonFloorSprites.js`），替代原共享 STONE。
  - 贴花：`DungeonDecalSprites.js` 7 类（裂纹/苔藓/血迹/水洼/角落蛛网/散页/Boss 160×160 圆环刻纹），`WorldSystem._stampDungeonDecals` 在 buildFloorCanvas 后一次性盖印，零每帧成本。配比随主题（F1 裂纹蛛网/F2 苔藓水洼/F3 血迹）。
  - 光源：壁挂火把（`dungeon_torch`，不阻挡/不吃子弹 `noBulletCollision`/不可破坏，光心下移至墙南侧地板防自遮蔽）+ 落地火盆（`dungeon_brazier`，可破坏）。`OBJECT_LIGHTS` 注册，火光色按主题经实例 `lightColor` 覆盖，2 帧火焰动画走 BreakableObject 数组帧。
  - 装饰库 13 种：碎石/骨堆/铁笼 + P5 新增石柱/断柱/石雕像/烛台祭坛（暖微光）/旗帜架/牢栏残段/木刑架/荧光蘑菇（冷微光，不阻挡）。柱/雕像为 `isLocked` 永久结构。
- **楼层主题故事房间（「深渊监狱」主线，三 agent 并行批次，详见 `docs/feature/DUNGEON_ROOM_STORY_OVERHAUL.md`）**：模板系统新增 `floors` 楼层亲和（selectEncounter 按层过滤）与 `floorType` 每房间地板覆写（layout.floorOverrides → WorldSystem 铺地应用，坑优先）；模板文件按层拆分至 `generation/encounters/`（f1_prison 9 个/f2_temple 10 个/f3_depths 10 个，共 16 个异形房：`#` 雕刻 L 型/十字/环形/凹龛/阶梯坛 + `p` 坑塑形献祭井/深渊裂口）。新地板 9 种（ID 10-18：监狱铆接钢板/湿石板/血渍石板、青石菱纹/仪式红毯/祭阵黑石、金属格栅/无菌瓷砖/做旧警示纹）；新叙事物件 23 个（F1 牢门/档案柜/探视台等 7，F2 长椅/讲坛/坩埚/圣物展柜等 8，F3 培养槽/手术台/反应堆芯/魔像躯干等 8）。调试直达 `?map=dungeon_f2`/`dungeon_f3`（种子+楼层正确开局）。
- **房间机关与异形模板（玩法深度批次 [depth-batch:rooms]，详见 `docs/feature/DUNGEON_GAMEPLAY_DEPTH_BATCH.md`）**：新增 4 种机关物件走 `BreakableObject` 管线（逻辑集中于 `entities/objects/DungeonTrapObjects.js`，美术 `assets/objects/dungeon/Dungeon{SpikeTrap,RewardCage,CageLever,DecoyStatue}Sprite.js`，均 `OBJECT_DEFS.set` 注册）：
  - `spike_trap` 尖刺陷阱：收回(2s)→预警(0.5s)→弹出(1s) 周期状态机（`spikePhase`，相位按 x/y 哈希错开），弹出态对压在中央刺区的玩家/敌人各扣 8 血（本轮一次，翻滚/驾驶免疫）并轻击退；`hitbox` 置 0（不挡移动）、`getHurtboxes()` 置空（子弹穿过）、`isLocked`（不可破坏）。三态由 `Assets.objects.spike_trap` 帧数组 + `frameIndex` 切换（`noAnimation` 关闭自动播放）。
  - `reward_cage` + `cage_lever` 奖励笼：铁笼锁 `iron` 宝箱；`cage_lever.interact` 读 `worldSystem.dungeonManager.getRoomAt(...).state === 'cleared'`，清怪前返回 false（拉杆无效，提示“先清怪”），清怪后 `openCage` 撤笼碰撞/受击框、生成真实 `Chest` 实体并掷保底金币。机关物件在 `WorldSystem.initDungeonMap` 建对象时注入 `obj.worldSystem` 引用（decor 循环）。
  - `decoy_statue` 诱饵雕像：可击破，破碎钩子 `WorldSystem._onBreakableBroken` 70% 掷金币 / 30% 小爆炸。
  - 每层 4 个异形模板追加至 `generation/encounters/f{1,2,3}_*.js`（共 12，新增轮廓：S 型蛇道 / 哑铃双厅 / 环形回廊 / T 形 / 对角大三角 / 回字嵌套），≥6 个用上机关（legend 引入 `K/G/L/D`）。机关状态机与清房门控单测见 `tests/dungeon-trap-objects.test.js`，模板健全性沿用 `encounter-templates.test.js`。
- 小地图（[depth-batch:minimap]）：`Renderer.drawDungeonMinimap()` 在右上角 168px 面板绘制真实房间形状图，采用“邻接预览 + 动态探索”：已探索房间实心、前沿房间半透明虚线轮廓；当前房间白色呼吸脉冲边框（与锁门橙脉冲区分）；玩家标记为朝向箭头；面板底部信息条显示楼层名（F1 监狱层 / F2 圣殿层 / F3 实验室层）+ 探索度 `visited/total`。
  - 走廊为**正交折线（L 形肘线）**，落在真实门位：`DungeonManager.getMinimapData()` 为每条图边附 `path`（`_closestEdgePoints` 复刻生成器门位算法 + `layout.corridors` tile 判定拐弯朝向，每层缓存一次），Renderer 缺 `path` 时回退房心正交肘线；前沿连线虚线。
  - 房型改用手绘像素微图标：Boss 骷髅、宝藏宝箱、商店金币、精英四角星（`_drawRoomIcon()`，尺寸随房块自适应，房块过小回退字符 `B/+/$/!`）。
- 全屏大地图（[depth-batch:minimap]）：`Tab` 键（`Input.keys.tab` + `Game.update` 边沿检测翻转 `input.bigMapOpen`，`keydown` 里 `preventDefault` 防焦点切换）或移动端点小地图区（`MobileControls._bindMinimapTap`）开关。半透明暗底覆盖层，游戏不暂停、玩家仍可移动/射击；居中大比例整层布局（复用 `_renderDungeonMap` big 模式）、标题（第 N 层·楼层名）、探索度、可选种子、左下图例（Boss/宝藏/商店/精英/未探索）、关闭提示。移动端开图后点非操作控件区亦关闭。
  - `peace=1` 布景模式下进入房间也标记 `visited`（`DungeonManager.update`），便于走图审视与截图自查。
- 地板使用主题石板瓦片 `DUNGEON_F1/F2/F3`（`DungeonFloorSprites.js` 按主题色板程序化生成，4 变体位置哈希混铺）。
- **地牢经济系统（P1，详见 `docs/feature/DUNGEON_ROGUELIKE_OVERHAUL.md`）**：
  - `src/core/dungeon/` 子系统：`RarityConfig.js`（五档稀有度+颜色）、`EconomyConfig.js`（全部经济数值单一来源：敌人金币值/可破坏物掉落/清房奖励/宝箱档位/掉落黑名单）、`LootTable.js`（`pickRarity` 加权抽档 + `pickWeaponByRarity` 档内均匀空档降级 + `rollChest` 开箱模拟）、`DungeonRunState.js`（单局金币/钥匙/遗物/楼层/种子；进地牢 `start(seed)`、回 Hub `end()` 清零；种子驱动生成可复现）。
  - 全部 37 把战斗武器在 `WeaponData.js` 带 `rarity` 字段（common 6 / uncommon 9 / rare 10 / epic 8 / legendary 4）。
  - 掉落链（仅地牢生效，`_isDungeonMapType` 以 `startsWith('dungeon')` 门控）：敌人死亡按类型掉金币（Boss 50，地牢内 Boss 不再直掉武器）；可破坏物破碎瞬间 30% 掉金币（墙/门排除，钩子在 `_refreshStaticDirtyFlags` 状态戳翻转处）；清房奖励见 DungeonManager 行。
  - 拾取物：`DungeonPickup`（金币两帧微闪/古铜钥匙），散开→悬浮→磁吸（64px）→收集入账，上限 200 超限最旧直接入账。
  - 宝箱：`Chest` 实体（`assets/dungeon/ChestSprites.js` 四档×开关 8 精灵，26×22），E 交互开启（交互链：载具>门>宝箱>拾取>物体），蓝档以上耗钥匙（缺钥匙红字 NEED KEY），产出 = `rollChest`（稀有度加权武器 + 金币），不参与移动碰撞与子弹判定。
  - 老虎机（[depth-batch:gamble]）：`SlotMachine` 实体（`assets/objects/dungeon/SlotMachineSprite.js` 24×32 多帧：待机灯闪/转轮/中奖闪光/爆机冒烟/废机 + 滚轮图案 glyph 字典，`Assets.slotMachine`）。E 交互（交互链插入宝箱之后，50px 半径）投币 8 金币开抽，状态机 idle→spinning(≈1s)→result(≈1.6s)→idle，耐久 3~8 次耗尽后 busting→dead（最后一次保底中奖及以上）。纯赌博逻辑在 `dungeon/GambleTable.js`（`SlotMachineCore` + `pickGambleOutcome`/`resolveGambleReward`，无 Canvas 可单测），加权结果表 `EconomyConfig.GAMBLE`（空奖/小额/大奖/medkit/钥匙/武器/遗物 777/爆炸惩罚）。掉落走既有管线（`spawnCoinBurst`/`spawnKeyDrop`/`DroppedItem`/`combatSystem.spawnExplosion`），机上冒结果横幅 + 金币粒子反馈。放置：商店房固定 1 台（`WorldSystem._populateDungeonSpecialRooms`），普通战斗房清房 20% 概率角落刷（`DungeonManager._dropRoomRewards`，每层 ≤2 台）。金币不足红字 NEED GOLD，废机 BUSTED。
  - HUD：`UIManager.initDungeonHud()` 右侧金币/钥匙计数（小地图下方），仅 `runState.active` 时显示，Renderer 每帧 `updateDungeonStatus()`。
  - 带出规则：金币/钥匙/遗物单局有效（退出/通关清零），武器可带回主世界。
- **遗物系统（P2）**：
  - 定义：`src/assets/relics/RelicData.js`（46 个：属性 10 / 弹道 10 / 触发 26，effect 纯数据；P7/P8/P9 扩展 28 个均带 `rarity`）+ `RelicIcons.js`（12×12 程序化图标，注册为 `Assets.relicIcons`）。
  - 运行时：`src/core/dungeon/RelicSystem.js`，以 `runState.relicIds` 为唯一事实源。三挂载点：①属性乘区（移速/开火间隔/伤害/磁吸/暴击/金币价值 `coinValueMult`，`PlayerSystem.getEffectivePlayerSpeed`、`CombatSystem.tryShoot`、`WorldSystem.updatePickups` 查询；金币价值经 `DungeonPickup.collect` 向上取整乘算）②玩家子弹改造（`_pushWeaponProjectiles` push 前 `modifyPlayerBullet`：燃烧/冰冻/穿透/弹射/体积/暴击/split 补偿/击退 `relicKnockback`/弹速 `bulletSpeedMult`/满血首击 `firstStrikeMult`；`BulletSystem` 命中块已泛化 `burnDamage`/`applyFreezeStack`/`relicBounce`，并消费 `relicKnockback`/`firstStrikeMult` 与暴击回血钩子 `onCritHit`）③事件触发（击杀爆炸+吸血+白骨护符额外金币 `WorldSystem` 死亡清扫、受击冲击波+荆棘反射 `player.takeDamage`、出怪波减速 `onWaveSpawned`（`DungeonManager._spawnEncounterWave`）、清房金币乘数、开箱双倍）。
  - 狂战图腾为条件乘区（HP<30% 实时判断）；vital_heart 的 maxHp 增量记账，退局 `clear()` 回退。
  - 获取：宝箱按档位 `relicChance`（木 10%/铁 25%/秘银 45%/龙纹 55%）抽遗物，排除已持有、全收集回退武器；Boss 保底箱 `guaranteedRelic` 必出遗物。掉落为 `relic:<id>` 类型 `DroppedItem`，E 拾取直接生效不入背包。
  - UI：HUD 遗物图标栏（悬停显示名称+效果）+ 拾取 toast（`UIManager.showRelicToast`）。
  - **P8 扩展 8 个（系统联动）**：贪狼之戒（每 25 金币 +2% 伤害上限 30%，`damageMult` 读 `runState.coins`）/石肤护符（受伤 -15%，新钩子 `mitigateDamage`，`player.takeDamage` 接入）/疾风斗篷（翻滚结束 1.5s 移速 +25%，`tick()` 读 `player.state` 检测翻滚下降沿）/深渊回响（敌人坠坑坠杀回血 4，新钩子 `onPitKill`，`WorldSystem` 坠坑判定接入）/战意图腾（连续击杀叠伤每层 +4% 上限 6 层、2.5s 无杀清空，`onKill` 叠层 + `tick` 衰减）/战鼓号角（波次刷新后 2.5s 开火间隔 -25%，`onWaveSpawned` 启动 `fireIntervalMult` 动态项）/收藏家之瞳（每持有一件遗物暴击 +1.5% 上限 20%，`critChance` 读 `relicIds.length`）/能量护罩（每 8s 充能一层护罩抵挡下一次伤害，复用 `mitigateDamage` + `setBarrierBlockHandler` 闪光）。新增挂载点 `mitigateDamage`/`onPitKill`，以及 `tick()` 内维护的翻滚移速/波次开火/战意/护罩充能计时器（`clear()` 一并归零）。
  - **P9 扩展 12 个（机制型，禁纯数值乘区，[depth-batch:relics]）**：幽灵弹头（每第 7 发子弹复用 `phaseThrough` 穿墙穿敌+伤害 ×2+蓝光，`modifyPlayerBullet` 计数）/金币护盾（受击持币 ≥5 时散落 5 金护体免伤、CD 3s，`mitigateDamage` + `setCoinDropHandler`→`spawnCoinBurst`）/血肉契约（商店金币不足以 HP 补差额 1 金=2HP 不致死，新方法 `tryBloodPactPurchase`，`ShopItem.tryBuy` 接入）/命运骰子（每进新房随机掷伤害/移速/暴击/护盾增益离房失效，新挂载点 `onRoomEnter`，`DungeonManager` 房间切换接入）/磁暴线圈（静止 1s 蓄能每 0.8s 对最近敌人放电 12，`tick` 读 `player.x/y` 判定静止 + `setTeslaHandler` 电弧）/环绕护刃（利刃绕身旋转碰敌 10 伤同敌 0.5s 不重复，`tick` 推进 `_bladeAngle` + `orbitBladeCanHit` 命中冷却，`Game._updateOrbitBlade` 结算 + `Renderer` 绘制）/收割回响（击杀 12% 尸体迸发 3 道追魂弹，`onKill` + `setSoulBurstHandler`）/时间沙漏（出怪时冻结新敌 2s，复用 `frozenTimer`，`onWaveSpawned`）/保险柜（每局一次死亡 50% 血复活保金币图标灰化，新方法 `tryRevive`，`Game.update` 死亡路径接入 + `UIManager` 灰化）/弹壳回收（击杀 20% 返还当前弹匣 1 发，`onKill` + `setAmmoRefundHandler`→`HandSystem.currentWeaponState`）/末日怀表（每 8s 下一发必定暴击，`tick` 备暴击 + `modifyPlayerBullet` 消费）/深渊之契（拾取随机献祭另一遗物换全能强化伤害+45%/移速+45%/开火-40%/暴击+30%，`addRelic` 内 `_abyssPactSacrifice`）。新增挂载点 `onRoomEnter`/`tryRevive`/`tryBloodPactPurchase`/`orbitBladeCanHit`，新增副作用回调 `setCoinDropHandler`/`setTeslaHandler`/`setSoulBurstHandler`/`setAmmoRefundHandler`/`setReviveHandler`/`setBloodPactHandler`/`setFateHandler`/`setSacrificeHandler`（均 `clear()` 归零内部状态）。

- **成长曲线（[tension-batch:power]）**：
  - **遗物三选一祭坛 `RelicAltar`**：`assets/objects/dungeon/RelicAltarSprite.js`（单座石底座 20×24，lit 两帧脉动 + broken 碎裂，`Assets.relicAltar`），实体 `entities/RelicAltar.js` 横排三座 + 顶盘上方悬浮遗物图标（2× 放大 + 呼吸底光 + 稀有度色光柱）。纯逻辑「选一灭二」在 `dungeon/RelicAltarCore.js`（无 Canvas 可单测）。候选经 `LootTable.pickRelicChoices`（排除已持有、互不重复）。宝藏房固定 1 座（`WorldSystem._populateDungeonSpecialRooms`，宝箱上移让焦点），E 交互（交互链插入老虎机之后 `PlayerSystem.tryUseRelicAltar`，靠近底座半径 42px）选定 → 走 `RelicSystem.addRelic` 授予 + 拾取 toast，其余两座熄灭碎裂。渲染 Y 轴 Z-Sort（`Renderer`）。
  - **武器掉落分层 + 每层保底**：清房武器稀有度按层上移（`ROOM_CLEAR.weaponRarityWeightsByFloor`，F1 common/uncommon→F2 uncommon/rare/epic→F3 rare/epic/legendary，对齐 COMBAT_BALANCE_METHODOLOGY §4.3），经 `LootTable.weaponRarityWeightsForFloor` 取当层权重（`DungeonManager._dropFloorWeapon`）。每层保底：已清 ≥`ROOM_CLEAR.weaponGuaranteeRooms`(4) 房仍未掉武器 → 下次清房必掉当层带宽武器（`LootTable.shouldForceWeaponDrop` + `DungeonManager._floorRoomsCleared/_floorWeaponDropped` 计数器，每层重建归零；猎杀房产出武器亦计入）。
  - **经济调参**：`CHEST_TIERS.relicChance` 下调（木 8%/铁 12%/秘银 24%/龙纹 32%）以抵消祭坛（+3 保底）与 Boss 箱（+3 保底）带来的期望上浮，全来源遗物期望获取 ≈7.6 个/局（目标带 6–8，商店 2/层为金币约束下的可选加成）。每层金币收入（清房+击杀+宝箱+Boss）约 ≥150，覆盖商店 1–2 件（武器 15–90/遗物 45/钥匙 20/medkit 25，`SHOP.floorPriceMult` F1/F2/F3 = 1/1.4/1.8），价格/金币区间未变。
- **房间玩法动词（[tension-batch:verbs]，`src/core/systems/dungeon/RoomVerbs.js`）**：普通战斗房约 35%（下限 3，`DungeonLayoutGenerator.assignVerbRooms` 洗牌后前三间轮转赋值，保底同层三型各现 ≥1 次）替换为三种新房型。纯状态机逻辑（`activate*/update*/startPact`，帧计时，副作用经 ctx 回调注入，无 Canvas 可单测 `tests/room-verbs.test.js`）挂在 `DungeonManager`（`_buildVerbCtx` 提供出怪/封门/开门/掉落/遁走真实实现）：
  - **生存房 survival**：进房封门起 30s 计时，每 4-6s 涌入 2-3 只（深度池 `_spawnPooledBatch`，剔除盗宝地精/电弧双子）；撑满 30s → 全灭现存 + 金币 ×2 + 保底铁箱。
  - **猎杀房 hunt**：刷 1 只目标怪（该层近战池 + 精英词缀 + 1.5 倍速 + 血 ×2.5 + `isHuntTarget` 金色地面光环，`Renderer._drawHuntTargetMark`）+ 2-3 护卫，45s 内击杀 → 金币大堆 + 高稀有度武器（rare+）；超时目标遁地逃走（`escaped` 无掉落移除 + 尘土粒子）、门开无奖励。
  - **契约房 pact**：进房不封门、无敌人，中央 `pact_lever` 拉杆（`entities/objects/DungeonPactObjects.js` 走 BreakableObject 管线，`WorldSystem._populateDungeonSpecialRooms` 置于房心，`interact` 委托 `DungeonManager.startPactFight`）；拉下 → 封门开战：敌人 ×1.5 全精英，清完奖励翻倍 + 保底遗物（`chest.guaranteedRelic`）。不拉可自由通行。契约房不套遭遇战模板（`isCombatRoom` 排除）以留出空旷布景。
  - **HUD 倒计时**：生存/猎杀顶部居中进度条（`DungeonManager.getVerbTimer` → `Renderer.drawVerbTimerHud`，复用 Boss 条视觉语言）。
  - **门口预告图标**：`DungeonManager.getDoorPreviews` 为每扇通向可预告房间（生存/猎杀/契约/精英/宝藏/商店/Boss，已清房与当前房不预告）的门产出世界坐标 + kind；`Renderer._drawDoorPreviews` 绘于光照之上（暗雾中也可见），16×16 漂浮小图标（`assets/objects/dungeon/DoorPreviewIconSprites.js`，`Assets.doorPreviewIcons`）+ 底部指门三角 + 上下浮动。小地图/大地图图标与图例同步（`_roomIconKind/_drawRoomIcon/_roomFillColor/_drawBigMapLegend` 补生存沙漏/猎杀靶心/契约手掌）。

### 地板瓦片系统
- 每个 32×32 网格包含 2×2 = 4 块 16×16 地板子格，支持墙内外不同地面类型。
- 8 种地面类型：GRASS(1)、WOOD(2)、CONCRETE(3)、DIRT(4)、STONE(5)、DUNGEON_F1/F2/F3(6/7/8，地牢楼层主题石板)，NONE(0) 使用棋盘格 fallback。`FLOOR_TYPE_KEYS` 为索引数组，只允许尾部追加。
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

## 移动端触摸适配 (MobileControls)

- **模块**：`src/ui/MobileControls.js`。仅在移动模式（`isMobileMode()`：真实触摸设备或 URL 参数 `?mobile=1`）由 `Game` 构造函数实例化，桌面路径零改动零开销；样式在构造时注入 `<style>`。
- **双虚拟摇杆**（DOM overlay，浮动、半透明像素风，多点触控按 `touch.identifier` 追踪）：
  - 左摇杆（屏幕左下 42vw 区域任意落指浮现）：输出归一化移动向量到 `InputHandler.moveVector`。
  - 右摇杆（右下 42vw 区域）：方向合成 `mouse.worldX/worldY`（玩家坐标 + 方向×200），拉杆过死区置 `mouse.down=true` 开火；松手保持最近朝向。
- **注入点**（三处最小侵入）：
  - `Input.js`：新增 `this.moveVector = null`。
  - `PlayerSystem.updatePlayerMovement`：移动方向源处，`input.moveVector` 存在时替代 WASD。
  - `Game.js`：构造尾部实例化 `mobileControls`；`update()` 相机换算之后、`HandSystem` 消费之前调 `mobileControls.update(player)` 覆写移动/瞄准/开火。
- **动作按钮组**：右下摇杆上方一排圆形按钮，映射 `input.keys` 布尔按下/抬起 —— 翻滚(space)/交互(e)/换弹(r)/背包(b)。
- **强制横屏**：竖屏全屏遮罩（`@media (orientation: portrait)` + JS `resize/orientationchange` 双保险），遮罩挂 `document.body`（z-index 9999）覆盖 HUD/快捷栏/背包。
- **触屏→鼠标事件桥**：`document` 上 `touchstart/move/end` 合成 `MouseEvent`，让背包/衣装等纯 DOM UI（`onmousedown/onmousemove`）在触屏可用；跳过 canvas 与摇杆层，`preventDefault` 抑制浏览器 300ms 合成事件避免双触发。
- **画面适配**：移动模式 `Game.scale` 用 2（桌面 2.5）扩大视野；`html/body { touch-action:none }` + viewport `maximum-scale=1,user-scalable=no` 阻止页面滚动/缩放。
- **调试**：`tools/screenshot_mobile.mjs`（puppeteer 移动视口 + 触摸仿真截图，横屏会注入按住触摸以显形浮动摇杆）。

## 音频系统 (SoundSystem / SynthEngine)

全部声音由 Web Audio API 数学合成，**零外部音频文件、零 npm 音频依赖**，与"美术全程序化生成"哲学同构（引擎手写 + 音色数据化，类比 PixelDraw + 绘制参数）。方案文档 `docs/feature/AUDIO_SYSTEM_PLAN.md`（P1 已完成）。

- **合成核心** `src/core/audio/SynthEngine.js`：参数 spec → mono `Float32Array` 采样缓冲，逐采样数学运算（不建 Web Audio 节点图），因此可在 Node/vitest 离线渲染并断言峰值/时长。五原语：振荡器（sine/square/saw/triangle + 频率包络滑音）、噪声源（确定性 mulberry32 PRNG，缓存可复现）、ADSR 增益包络、状态变量滤波器 SVF（lowpass/highpass/bandpass 逐采样扫频）、tanh WaveShaper 失真。多 layer 叠加出厚度（枪声=低频冲击+中频噪声瞬态+高频啪）。渲染后按 `spec.gain` 做峰值归一化（保证无静音条/无爆音条，跨音效音量由各自 gain 掌控）。首次渲染后按 `id@sampleRate` 缓存 `Float32`。
- **音色数据** `src/assets/audio/SfxData.js`：33 条纯参数音效（禁逻辑），含 10 个枪械音色族 + 近战 + 换弹/命中/死亡（肉/机械/幽体三类）/爆炸/受击/翻滚/拾取/开箱/门/UI/老虎机/尖刺/传送门。爆炸 5 层含 <100Hz 低频体。`ENEMY_DEATH_SFX` 把敌人 `spawnType` 粗分三类死亡音。
- **武器映射** `src/assets/audio/WeaponSfxMap.js`：36 把武器 id → 音色族 + `pitch`/`decay` 个性偏移（纯数据，`resolveWeaponSfx` 永不落空，单测断言全覆盖）。
- **运行时** `src/core/audio/SoundSystem.js`：
  - **生命周期**：`AudioContext` 懒创建 + 手势解锁（桌面 keydown/mousedown、移动 touchend），解锁前丢弃播放请求；`visibilitychange` suspend/resume。
  - **总线**：sfx 子总线 → master（含静音）→ `DynamicsCompressor`（防叠加爆音）→ destination。
  - **节流三件套**（纯逻辑 `VoiceThrottle`/`VoicePool`，导出供单测）：同音效最小重触发间隔 30ms（天然吞同帧重复）、全局 16 voices 上限带优先级抢占（最低优先级+最老者被挤掉）、连发音量递减 + ±5% 音高抖动（金币连拾则改为逐级升调）。
  - **空间**：`StereoPanner` 按声源相对玩家 x 定位 + 距离线性衰减（超 760px 丢弃不占 voice）；音高抖动/武器 pitch 用 `playbackRate`（不破坏缓存），武器 decay 用增益提前淡出。
  - **持久化**：master/sfx/music 音量存 `localStorage`；`N` 键静音切换（`M` 已占用为快捷菜单）。
  - **传送门嗡鸣**：单条循环 voice，按最近传送门距离渐入音量（整数 Hz + 恒定包络保证 1s 缓冲无缝循环）。
- **接线**（15+ 处单行调用，锚点 `[audio-p1]`）：CombatSystem 开火、HandSystem 换弹、BulletSystem 命中/暴击、WorldSystem 敌人死亡/金币拾取/传送门、StatusEffectSystem 爆炸、Game 受击、PlayerSystem 翻滚/遗物/武器拾取、MeleeSystem 挥砍、Chest 开箱、DungeonManager 封门/开门、UIManager 按钮、SlotMachine 投币/中奖、DungeonTrapObjects 尖刺。实体经 `worldSystem.soundSystem` 访问，子系统由 `Game` 构造尾部依赖注入。
- **测试**：`tests/audio-system.test.js`（18 例：SfxData 结构+离线峰值、WeaponSfxMap 覆盖、节流/抢占/衰减纯逻辑）；浏览器实测走 `OfflineAudioContext` 逐条渲染 + 实开一局 instrument `play` 断言事件触发（`window.game` 暴露实例供自动化访问）。

## 战斗数值方法论与审计工具

- **方法论**：`docs/feature/COMBAT_BALANCE_METHODOLOGY.md` —— 锚点体系（初始手枪有效 DPS 38 / 玩家 100 HP）、敌人角色档位（炮灰 1 枪 / 标准 2-3 枪 / 重装 4-6 枪 / Boss 按 TTK 反推）、武器稀有度→等效 DPS 带宽（成本曲线）、特效折算（AOE×2.2 / DoT / 控制加值 / 近战风险折扣）、楼层 hpMult 与掉落稀有度同步防"海绵感"。
- **审计工具**：`node tools/balance_report.mjs`（只读）——自动产出武器等效 DPS 表（含折算）、敌人 TTK 矩阵（含各层 hpMult）、稀有度带宽越界与 Boss 血量单调性告警。目标参数（带宽/档位/折算系数）集中在文件头常量区，是平衡目标的单一事实源。改动任何武器/敌人数值后必跑。
