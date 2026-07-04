# 地牢重构 P5：生成与视觉 实施计划

> 执行模式：主会话亲写代码（用户指定），vitest + `npm run build` 必跑，分支 feature/dungeon-overhaul。
> 依据：docs/feature/DUNGEON_ROGUELIKE_OVERHAUL.md §4.1 / §4.2。用户指定 P5 先于 P4。

**目标**：观感质变（石牢监狱主题深挖）+ 3 层结构落地。

**关键现状（调研结论）**
- 墙体：`Renderer.js:197-210` 平涂 `WALL_FRONT`/`WALL_TOP`，顶带 [y-16, y+h-16]、前脸露出底部 16px。地牢墙全部为 32×32 单 tile rect；边界墙为大 rect。门 wallRef 也进 `walls` 数组（会被当墙画，需打标跳过）。
- 地板：`FLOOR_TYPES.STONE` + `Assets.floors.stone` 4 变体（16×16），`buildFloorCanvas` 位置哈希混铺；dungeon 不用 chunkCache（可直接在 floorCanvas 上盖印贴花，零帧成本）。
- 光照：每帧全图运行；物体光源自动收集（`LightEmitterRegistry.OBJECT_LIGHTS` 按 obj.type 匹配，支持 `obj.lightColor` 逐实例覆盖色）；环境光 = `config.ambientBrightness`(115) 纯灰填充（`LightBufferRenderer.js:391`），需加 per-map 覆盖实现调暗+色调。
- 装饰：Sprite(src/assets/objects/dungeon/) → Assets.objects 注册 → ObjectRegistry configure。非阻挡先例：GrassTuftObject（零尺寸 hitbox + blocksLight=false）。排序先例：`occlusionSortY` + `getOcclusionHitboxes()=[]`。
- 生成器：纯逻辑无 Canvas 依赖，种子化 → 可 vitest。模板库 12 个（`RoomInteriorTemplates.js`），仅返回 walls。
- 楼层：`initDungeonMap(floor)`，boss F1=mutant_beast、F2=mecha_golem；传送链 F1→dungeon_f2→hub。

---

## 任务分解

### T1 楼层主题配置 + F3 骨架接入
- Create `src/core/dungeon/DungeonThemes.js`：per-floor 主题数据（id、墙体色板、地板色板、环境光 {r,g,b}、火光色、贴花/装饰配比权重）。F1 冷蓝灰 / F2 暗绿苔藓 / F3 暗红炽热。
- `MapProfiles.js` 加 `dungeon_f3`；`WorldSystem.loadMap` 加 case → `initDungeonMap(3)`；floor 推进钩子泛化（`dungeon_f2`→`dungeon_f3` 时 floor=3，用 startsWith 前缀判断代替枚举）。
- `DungeonManager._onBossCleared`：floor<3 → 下一层传送门（F2 出 "FLOOR 3"），floor 3 → hub VICTORY。
- `DungeonLayoutGenerator.computeEnemyConfig` floor 3 临时配置（soldier/hunter/brute 重编成，boss=mecha_golem；P4 FloorConfigs 统一接管）。
- `EconomyConfig`：`SHOP.floorPriceMult[3]=1.8`、`TREASURE_ROOM_CHESTS[3]=['dragon','mithril']`、`BOSS_CHEST_TIER[3]='dragon'`。
- Tests：`tests/dungeon-themes.test.js`（3 主题字段完备）、`tests/dungeon-layout.test.js`（seeded 生成 F1/F2/F3：房间数、start/boss/三特殊房、floor3 enemyConfig 非空）、economy 断言补 F3。

### T2 地牢墙体 sprite + 分层地板
- Create `src/assets/dungeon/DungeonWallSprites.js`：`createDungeonWallSet(theme)` → { tops: 4×(32×32), fronts: 4×(32×16) } 石砖砌体 + 破损/苔藓变体（复用 addBlockTexture 思路，PixelDraw）。
- Create `src/assets/dungeon/DungeonFloorSprites.js`：`createDungeonFloorVariants(theme)` → 4×(16×16) 石板，per-theme 色板。
- `FloorTypes.js`：追加 `DUNGEON_F1/F2/F3` 类型与 keys；Assets.floors 注册对应变体；`initDungeonMap` 按楼层填充对应类型。
- Assets：`Assets.dungeonWalls = { f1: set, f2: set, f3: set }`。
- Renderer 墙绘制：worldSystem.currentMapType startsWith('dungeon') 且 w/h===TILE_SIZE → 位置哈希取变体画 top/front 贴图；其余（边界大 rect）保持平涂。
- 门 wallRef 打标 `isGateBarrier=true`，Renderer 墙循环跳过（屏障本体由 `_drawEnergyBarrier` 负责）。

### T3 火把/火盆光源 + 环境光调暗
- Create `src/assets/dungeon/DungeonLightSprites.js`：火把（16×24，2 帧火焰）+ 火盆（32×32，2 帧）。
- Create `DungeonTorchObject`（零尺寸 hitbox、blocksLight=false、`getOcclusionHitboxes()=[]`、occlusionSortY 使其压在墙前脸上、isLocked 不可破坏）+ `DungeonBrazierObject`（可破坏、阻挡、发光）。ObjectRegistry + Assets 注册。
- `OBJECT_LIGHTS` 加 `dungeon_torch`（暖橙 radius≈120 flicker 0.08、ignoreSelfShadow、光心 offset 下移进房间侧地板避免被墙自遮蔽）与 `dungeon_brazier`（radius≈140）。楼层火光色差用 `obj.lightColor = theme.torchColor` 逐实例覆盖。
- 生成器布光：房间周界墙「南邻为地板」的墙 tile 每 ~6 tile 挂火把（seeded rng）；走廊转角/长段补挂；精英/Boss/宝箱房角落放火盆。输出 `layout.lightObjects`，`initDungeonMap` 实例化。
- 环境光：`WorldSystem` 暴露 `ambientLightOverride`（地牢=theme.ambient，如 F1 {r:52,g:58,b:74}；非地牢=null）；`LightBufferRenderer` 填充时优先用覆盖色。数量受 LightingConfig 预算自然管控。

### T4 装饰库扩容 3 → 12+
- 新固体装饰 sprites（src/assets/objects/dungeon/，PixelDraw 32×32）+ objects + 注册，共 8 种：
  石柱 `dungeon_pillar`（阻挡/不可破坏）、断柱 `dungeon_pillar_broken`、石雕像 `dungeon_statue`、烛台祭坛 `dungeon_altar`（微光，进 OBJECT_LIGHTS）、旗帜架 `dungeon_banner`、牢栏残段 `dungeon_bars`、木刑架 `dungeon_rack`、蘑菇丛 `dungeon_mushrooms`（非阻挡、微弱冷光）。
- `generateRoomDecor` 重写：按房间类别+楼层主题配比抽取（精英房旗帜+火盆、宝箱房祭坛+烛台、Boss 房柱/雕像对称位），密度上调（现 0-3 → 类别驱动 2-6）。

### T5 地板贴花
- Create `src/assets/dungeon/DungeonDecalSprites.js`：血迹×2、裂纹×2、苔藓×2、水洼、蛛网（墙角）、散页、Boss 房大圆环刻纹（程序化）。
- 生成器输出 `layout.decals`（seeded：类型/位置/楼层配比，F1 裂纹蛛网、F2 苔藓水洼、F3 血迹焦痕）；Boss 房中心保底圆环。
- `initDungeonMap` 在 buildFloorCanvas 后将贴花直接盖印到 floorCanvas（一次性，零帧成本）。

### T6 手作房间模板池 ≥24
- `RoomInteriorTemplates.js` 扩容 12 → ≥24：新增普通房模板（斜切角、内凹壁龛、双厅、回字破口、平行五道、蜂窝柱阵、边廊、漏斗喉道等）+ 特殊房专属模板（treasure 祭坛台基×2、shop 货架区×1、elite 竞技场×2、boss 第三款）。
- 非矩形轮廓 = 角部/边缘 wall block 雕刻（现 walls 机制原生支持）。
- 模板可选返回 `decorSpots`/`coverSpots`（T4 装饰摆放优先消费）。
- Tests：`tests/room-templates.test.js`（每模板：最小尺寸下生成、墙不越界、不堵 2 tile 边缘门通带）。

### T7 文档 + 全量验证
- `docs/TECH_OVERVIEW.md`（主题/光照/贴花/模板池段落）、方案文档 P5 打 ✅。
- `npx vitest run` 全绿 + `npm run build` 通过；台账更新。

## 顺序与依赖
T1（主题数据为一切消费方的上游）→ T2 → T3 → T4 → T5 → T6 → T7。每任务一提交。

## 风险
- 火把光源数量 vs maxStaticLights(40)：布光间距保守（≥6 tile），预算超限由 LightSystem 优先级裁剪自然兜底。
- 火把吃子弹：火把挂在墙 tile 内，子弹先撞墙 rect；实现时验证 BulletSystem 碰撞次序，必要时加豁免标记。
- FLOOR_TYPE_KEYS 为索引数组：只允许尾部追加，禁止改动既有顺序。
