# 背包 + 快捷工具栏 + 蓝图放置系统方案（面向所有 Object）

## 目标与范围

### 目标
- 设计一个背包系统：**所有 object 都可以作为物品放入背包**，**武器（Weapon）也作为一种物品放入背包**。
- 新增**下方快捷工具栏（Hotbar）**：把背包中的物品放入快捷栏后可快速选择。
- **视觉反馈**：
  - 当选择**武器**时：玩家手持该武器（原有逻辑）。
  - 当选择**可放置物体（Placeable）**时：玩家手持一把**锤子（Hammer）**，并进入蓝图模式。
- 选择快捷栏的可放置物品后，在世界中出现**放置蓝图**：
  - 绿色矩形：可放置
  - 红色矩形：不可放置
- 进入 **Test 场景**后，自动把**所有 object**加入背包（用于快速验证放置/显示/判定）。

### 非目标（本方案暂不覆盖）
- 重量、稀有度、耐久等 RPG 属性（可后续扩展）。
- 存档/读档（可后续扩展）。
- 复杂旋转与多朝向摆放（本方案先给出接口与最小实现）。

## 现状调研（与本方案强相关）

### 输入
- 当前输入由 [Input.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/core/Input.js) 统一管理，已注册按键：WASD / Q / E / R / P / Space。
- 鼠标世界坐标在 [Game.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/core/Game.js#L205-L209) 中按 `scale` 转换后写入 `input.mouse.worldX/worldY`，可直接用于蓝图定位。

### UI（DOM 层）
- HUD 是 DOM 结构（见 [index.html](file:///Users/wanqilin/WorkSpace/ai/rougelike/index.html) 与 [HUD.css](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/ui/HUD.css)），由 [UIManager.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/ui/UIManager.js) 更新。
- UI 当前没有背包/快捷栏的 DOM 容器，需要新增。

### 世界物体与类型来源
- 可破坏/可交互物体统一由 [BreakableObject.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/core/entities/BreakableObject.js) 表达（包含 wall / door / furniture 等）。
- 所有 object 资源（Sprite）集中在 [Assets.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/graphics/Assets.js#L79-L116) 的 `Assets.objects`。
  - 注意：其中包含 `*_flash`、以及 door 的 `door_*_frame/panel`，这些是渲染资源，不等价于可放置物体类型。
- 武器配置在 `docs/WEAPON_GUIDE.md` 中有描述，且代码中可能有 `Weapon` 类或配置表（需确认 `src/core/entities/Weapon.js` 或类似）。

### 渲染与遮挡
- 2.5D 遮挡排序发生在 [Renderer.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/core/Renderer.js) 的 `renderList.sort((a,b)=>a.y-b.y)`。
- 当前 `breakableObjects` 的排序已支持 `getHitboxes()`，并使用 hitbox 底边作为排序基准（对墙、门框、多段碰撞体等有效）。

### 碰撞与寻路
- 移动碰撞：`WorldSystem.resolveWallCollision()` 会对 `breakableObjects` 使用 `getHitboxes()`（见 [WorldSystem.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/core/systems/WorldSystem.js#L434-L497)）。
- 寻路网格：`WorldSystem.updateFlowField()` 会把 `breakableObjects` 写入 `navGrid.wallBlocked`（见 [WorldSystem.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/core/systems/WorldSystem.js#L429-L460)）。放置系统需要在落地后触发/等待这套逻辑更新。

## 核心概念与术语

- **Item Definition**：物品的元数据定义。
  - **Type**: `Weapon` 或 `Placeable`。
  - **Max Stack**: 武器通常为 1，可放置物体可堆叠（如 64）。
- **Inventory Slot**：背包/快捷栏中的一个格子。
  - 包含：`itemDefinitionId`, `count`, `instanceData` (可选，用于武器耐久/配件等)。
- **Hotbar Slot**：快捷栏槽位（1-9），直接指向 Inventory 中的某个 Slot 或持有物品数据。
- **Blueprint**：放置预览状态，显示占地矩形与可放置判定。
- **Hammer**：当选中 Placeable 类型物品时，玩家视觉上持有的“工具”。

## 需求拆解（行为流）

### 1) 背包与堆叠
- Inventory 采用**格子（Slot）制**。
- **堆叠规则**：
  - **武器（Weapon）**：**不可堆叠**（Max Stack = 1）。每个武器占用一个格子。
  - **可放置物体（Placeable）**：**可堆叠**（建议默认 Max Stack = 64）。同种物体在同一格子内累加数量。
- Inventory 支持添加/删除/拆分（可选）操作。
- **初始状态**：
  - 游戏开始时，默认选中**快捷栏第 1 格**（Slot 0）。
  - 若第 1 格有物品，自动装备/进入对应模式；若为空，则为空手状态。

### 2) 快捷栏与选择
- 底部显示 Hotbar（例如 1~9 个槽位）。
- Hotbar 的每个槽位对应一个 Inventory Slot（或引用）。
- 玩家可通过按键（建议 1~9）选择当前槽位。
- **切换逻辑**：
  - 若槽位为空：玩家手无寸铁（或保留上一个状态，建议手无寸铁）。
  - 若槽位是 **Weapon**：
    - 调用 `PlayerSystem.equipWeapon(weaponId)`。
    - 视觉：显示该武器。
    - 左键：射击。
  - 若槽位是 **Placeable**：
    - 调用 `PlayerSystem.equipTool('hammer')`（需新增）。
    - 视觉：显示“锤子”图标/Sprite。
    - 进入“蓝图模式”。
    - 左键：放置物体。

### 3) 蓝图与放置
- 选择 Placeable 槽位后进入“建造预览态”：
  - 鼠标移动时，蓝图跟随鼠标并对齐到网格（32x32 TILE）。
  - 若当前位置可放置：矩形绿色；不可放置：矩形红色。
- 玩家点击鼠标左键（或其它明确动作）在当前位置放置该 object。
- 放置后从当前槽位扣除 1 个数量。
  - 若数量归零，清空该槽位，退出建造态（或保持空手状态）。
- 更新世界的碰撞/寻路状态。

### 4) Test 场景自动填充
- 进入 `test` map 时，自动将所有可放置 object 填满背包（或者每种 +N）。
- 同时给予玩家默认武器（如果背包有空位）。
- 该逻辑应与地图加载绑定：`WorldSystem.loadMap('test')` 后、游戏开始交互前完成。

## 数据设计

### 物品定义（Item Definitions）
统一管理所有物品（Weapon + Placeable）。

建议结构：
- `ItemDefinition`:
  - `id`: string (e.g., `weapon:rifle`, `placeable:box`)
  - `type`: `'weapon' | 'placeable'`
  - `name`: string
  - `icon`: string (resource key)
  - `maxStack`: number (Weapon=1, Placeable=64)
  - `data`: (Type-specific data)
    - For Weapon: `weaponConfigId` (关联到原有的武器配置，不重复存储 damage/rpm 等属性)
    - For Placeable: `breakableType`, `footprint`, `hitboxes`

### Inventory 状态
- `InventoryState`:
  - `slots: Array<Slot>`
  - `capacity: number` (e.g., 27 slots for backpack, 9 for hotbar? Or hotbar IS the first 9 slots)
  - **推荐方案**：Hotbar 是 Inventory 的前 9 个格子（索引 0-8），或者独立引用。为了简化，建议 Inventory 包含 Hotbar，即 Slot 0-8 为 Hotbar，Slot 9+ 为背包内。

- `Slot`:
  - `itemId`: string | null
  - `count`: number
  - `instanceData`: object | null

## 系统与模块划分（建议新增）

> 注意：本项目的逻辑分层以 `core/systems` 为主（见 [TECH_OVERVIEW.md](file:///Users/wanqilin/WorkSpace/ai/rougelike/docs/TECH_OVERVIEW.md)），方案建议以“系统化”方式落地，避免把逻辑堆进现有文件。

### 1) InventorySystem（核心数据与操作）
建议新增系统文件：`src/core/systems/InventorySystem.js`

- 职责：
  - 维护 `ItemRegistry` (所有 ItemDefinition)
  - 维护 `slots` 数据
  - 提供 `add(itemId, count)`, `remove(slotIndex, count)`, `swap(i, j)`
  - 提供 `getHotbarItem(index)`
  - 提供 `selectHotbarSlot(index)` 及 `getSelectedSlot()`

### 2) PlayerSystem（状态整合）
修改 `src/core/systems/PlayerSystem.js`

- 职责：
  - 监听 `InventorySystem` 的选择变化。
  - 状态机扩展：
    - `State.IDLE / MOVE`: 允许切换物品。
    - 当选中 Weapon：设置 `currentWeapon`，允许 `CombatSystem` 处理射击。
    - 当选中 Placeable：设置 `currentTool = 'hammer'`，通知 `BuildSystem` 激活。
- 视觉：
  - 渲染玩家时，根据 `currentTool` 决定是否画锤子。如果 `currentTool` 为空且 `currentWeapon` 有值，画武器。

### 3) BuildSystem（蓝图/放置交互）
建议新增系统文件：`src/core/systems/BuildSystem.js`

- 职责：
  - 仅在 `PlayerSystem` 处于 Build Mode（持有 Placeable）时激活。
  - 根据 `input.mouse.worldX/worldY` 计算蓝图位置（网格吸附）。
  - 根据 `WorldSystem` 当前碰撞环境进行可放置判定。
  - 监听左键点击：执行放置 -> `InventorySystem.consumeCurrentSlot(1)` -> `WorldSystem.addObject(...)`.

### 4) 快捷栏 UI（DOM 扩展）
扩展 [UIManager.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/ui/UIManager.js)

- 职责：
  - 渲染 Hotbar UI。
  - 显示 Slot 内容：图标、数量（如果 > 1）。
  - 高亮当前选中 Slot。

### 5) 蓝图绘制（Canvas Overlay）
在 [Renderer.js](file:///Users/wanqilin/WorkSpace/ai/rougelike/src/core/Renderer.js) 中新增绘制步骤。

## 交互与按键建议

### 选择快捷栏
- 数字键 `1~9`：切换 Hotbar Slot。
- 如果当前 Slot 已选中，再次按下可“收起物品”（徒手状态）。

### 放置动作 vs 射击
- 逻辑互斥：
  - **Weapon Mode**: 左键 = `CombatSystem.shoot()`
  - **Build Mode**: 左键 = `BuildSystem.place()`
- 视觉互斥：
  - **Weapon Mode**: 看到枪。
  - **Build Mode**: 看到锤子 + 蓝图。

## 资源需求
- **Hammer Sprite**: 
  - 使用 `PixelDraw` 程序化绘制一个简单的像素锤子（32x32），作为玩家手持的可视化反馈。
- **Item Icons**:
  - Placeable: 使用对应 Object 的缩略图。
  - Weapon: 使用对应 Weapon 的图标。

## 里程碑（建议实现顺序）
1. [x] **InventorySystem**: 数据结构（Slots, Stack limits），物品注册表（Weapon & Placeable）。
2. [x] **Hotbar UI**: 显示格子，支持键盘切换选中态。
3. [x] **PlayerSystem 集成**:
   - 选中 Weapon -> 切换枪械逻辑（原有）。
   - 选中 Placeable -> 切换到“锤子”状态（视觉）。
4. [x] **BuildSystem**: 蓝图渲染，放置判定，消耗物品。
5. [x] **Test Map**: 自动填充测试数据。
