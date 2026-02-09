# 地毯系统设计方案 (Carpet System Design)

## 1. 概述
地毯 (Carpet) 是一种装饰性物体，用于丰富场景地面的视觉层次。
核心特性：
*   **无碰撞体积**：玩家和物体可以直接穿过。
*   **层级最低**：总是被其他物体（墙壁、家具、角色）遮挡，贴合地面渲染。
*   **装饰性**：多种样式（矩形、圆形、门口地垫）。

约束：
*   地毯类型统一使用 `carpet_` 前缀，并且只能以 `Carpet` 实体存在，禁止作为 `BreakableObject` 生成。

## 2. 架构设计

### 2.1 实体类 `Carpet`
创建一个新的实体类 `src/core/entities/Carpet.js`。
*   **属性**:
    *   `x, y`: 世界坐标 (Top-Left)。
    *   `type`: 地毯类型 (e.g., 'rug_red', 'rug_blue', 'doormat').
    *   `width, height`: 视觉尺寸。
*   **方法**:
    *   `draw(ctx)`: 绘制逻辑。

### 2.2 系统集成
*   **WorldSystem**:
    *   新增 `this.carpets = []` 数组存储所有地毯实例。
    *   在 `loadMap` 时初始化或清空。
*   **Renderer**:
    *   在绘制完基础地板 (Checkerboard) 之后，**立即**绘制所有 `carpets`。
    *   这保证了地毯永远在所有 `renderList` (排序后的实体) 之前绘制，从而实现“总是被遮挡”的效果。

### 2.3 资源生成 (Assets)
使用 `PixelDraw` 程序化生成地毯 Sprite。
*   **样式**:
    *   **Rug (Large)**: 3x2 Tile (96x64)，带有流苏边缘和内部花纹。
    *   **Doormat (Small)**: 1x1 Tile (32x32)，带有 "WELCOME" 字样或简单条纹。
    *   **Runner (Long)**: 1x3 Tile (32x96)，长条形地毯。
    *   **Tutorial Markers**: 工业金属板风格 (Industrial Metal Plate)，带有警示条纹 (Caution Stripes) 和文字说明 (RELOAD, BAG, USE)，用于 Hub 场景的按键教学。

### 2.4 建造系统 (BuildSystem)
*   支持在建造模式下放置地毯。
*   地毯允许与其他物体（如家具）重叠放置（先放地毯再放家具，或反之）。
*   **Inventory**: 添加地毯物品 ID (e.g., `placeable:rug_red`).

## 3. 实现步骤

1.  **资源准备**: 在 `Assets.js` 中使用 Canvas API 绘制地毯 Sprite。
2.  **实体类**: 实现 `Carpet.js`。
3.  **渲染集成**: 修改 `Renderer.js` 引入并绘制 `worldSystem.carpets`。
4.  **数据管理**: 修改 `WorldSystem.js` 管理地毯列表。
5.  **建造支持**: 修改 `InventorySystem.js` 注册物品，修改 `BuildSystem.js` 支持放置逻辑（允许重叠）。

## 4. 细节处理
*   **重叠逻辑**: 建造系统通常检查 `checkCollision`。对于地毯，我们需要一个 `isFloorDecoration` 标记，使得 BuildSystem 允许它与其他物体共存，或者仅仅检查墙壁/虚空。
*   **层级**: 如果有多个地毯重叠？按放置顺序绘制即可。
