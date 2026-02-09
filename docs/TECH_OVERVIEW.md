# 项目技术概览

本文档旨在帮助 AI 开发者快速理解项目结构与核心架构。

## 目录结构

- `src/`
  - `assets/`: **美术素材数据**。存放字符画模板，严禁包含游戏逻辑。
    - `characters/player/`: 存放玩家的独立动画帧文件（如 `PlayerRun.js`）。
  - `core/`: **核心游戏逻辑**。
    - `entities/`: 游戏实体类。
      - `Zombie.js`: 敌人逻辑。
      - `Vehicle.js`: 载具逻辑（驾驶、碰撞、物理）。
      - `BreakableObject.js`: 可破坏物体通用实体（委托到各 object 定义）。
      - `objects/`: 物体类型定义与行为实现（每个 object 一个文件，通过注册表接入）。
      - `DroppedWeapon.js`: 掉落武器逻辑与悬浮效果。
      - `Portal.js`: 传送门逻辑与粒子渲染。
    - `systems/`: 核心子系统。
      - `NavigationGrid.js`: 空间网格、流场导航与邻域查询。
      - `WorldSystem.js`: 多地图管理(Hub/Game/Test)、地图生成、流场更新、敌人调度与简单的敌人间碰撞分离。
      - `PlayerSystem.js`: 玩家移动、拾取与输入驱动的操作逻辑。
      - `CombatSystem.js`: 射击、子弹、粒子与爆炸效果更新。
      - `InventorySystem.js`: 物品数据管理、背包槽位与快捷栏逻辑。
      - `BuildSystem.js`: 蓝图预览、放置判定与物体生成。
    - `Renderer.js`: 负责场景绘制与 UI 刷新。
    - `Game.js`: 游戏主循环、系统编排与状态聚合（注意：必须先初始化 CombatSystem 再初始化 WorldSystem）。
    - `Camera.js`: 摄像机跟随与视口计算。
    - `Input.js`: 统一的键鼠输入处理。
  - `graphics/`: **渲染系统**。
    - `SpriteGenerator.js`: 将字符模板转换为 Canvas/Image 的核心工具。
    - `Assets.js`: 负责调用生成器并缓存生成的游戏资源。
  - `utils/`: **工具库**。常量 (`Constants.js`)，`PixelDraw.js` (程序化像素绘制) 和通用辅助函数。
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

### 物品与建造系统
- **Inventory**: `InventorySystem` 管理所有物品（武器+可放置物体）。快捷栏（Hotbar）支持键盘选择。
- **Build Mode**: 选中可放置物体时进入建造模式，`BuildSystem` 处理网格吸附与放置判定。
- **掉落物**: `DroppedWeapon` 类负责管理地面上的武器，包含简单的悬浮动画。
- **交互**: `PlayerSystem.js` 维护 `droppedItems` 列表，处理 E 键拾取与武器交换逻辑。

### 规范
- **素材分离**: 所有美术资源定义必须在 `src/assets` 中。
- **像素绘制**: 复杂物体请参考 `docs/PIXEL_ART_GUIDE.md` 使用程序化绘制。
- **逻辑分层**: 渲染代码不应混入业务逻辑，输入处理应通过 `Input` 类解耦。
