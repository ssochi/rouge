# 背包系统与UI设计文档 (Inventory UI Design)

## 1. 概述
本阶段目标是为游戏添加一个可视化的背包界面，允许玩家管理物品。当前系统仅支持快捷栏 (Hotbar)，我们需要扩展 UI 以显示完整的背包库存，并支持物品整理。

## 2. 功能需求

### 2.1 核心功能
*   **显示/隐藏**：按 `B` 键（或 `Tab`）切换背包界面的显示状态。
*   **库存展示**：
    *   显示 **快捷栏 (Hotbar)**：9 个格子 (Slot 0-8)。
    *   显示 **背包 (Backpack)**：27 个格子 (Slot 9-35)。
*   **物品操作**：
    *   **移动/交换**：点击一个物品选中（拿起），再点击另一个格子放下。
        *   若目标格为空：直接放入。
        *   若目标格有不同物品：交换位置。
        *   若目标格有相同物品：尝试堆叠，多余部分留在“手中”。
    *   **快捷栏管理**：可以将背包中的物品拖动到快捷栏，方便游戏中使用。

### 2.2 游戏状态影响
*   **打开背包时**：
    *   暂停游戏世界更新（可选，或仅阻断玩家移动/攻击输入）。建议先实现**阻断输入**，游戏世界保持运行（如多人游戏或实时生存风格），或者简单起见**暂停游戏**。考虑到是单机 Roguelike，**暂停游戏**是更好的体验。
    *   显示鼠标指针（如果使用了 Pointer Lock，需要解锁）。

## 3. UI 布局设计 (DOM 结构)

界面将使用 HTML/CSS 覆盖在 Canvas 之上。

```html
<div id="inventory-overlay" class="hidden">
    <div class="inventory-window">
        <!-- 标题栏 -->
        <div class="inventory-header">INVENTORY</div>
        
        <!-- 背包区域 (27 slots) -->
        <div class="inventory-grid backpack-grid">
            <!-- Slots 9-35 生成于此 -->
            <div class="slot" data-index="9">...</div>
            ...
        </div>

        <!-- 分隔线/装饰 -->
        <div class="inventory-divider"></div>

        <!-- 快捷栏区域 (9 slots) - 镜像显示 -->
        <div class="inventory-grid hotbar-grid">
            <!-- Slots 0-8 生成于此 -->
            <div class="slot" data-index="0">...</div>
            ...
        </div>
        
        <!-- 鼠标跟随图标 (当拿起物品时) -->
        <div id="cursor-item" class="item-icon floating"></div>
    </div>
</div>
```

### 样式风格
*   **背景**：深色半透明遮罩，背包窗口使用像素风边框（类似 RPG 风格）。
*   **格子**：固定大小（如 48x48px），带边框和背景色。
*   **选中状态**：高亮显示。

## 4. 数据结构与逻辑接口

### 4.1 InventorySystem 更新
需要增加以下方法支持 UI 操作：

```javascript
class InventorySystem {
    // ... 现有代码 ...

    /**
     * 交换两个槽位的物品
     * @param {number} indexA 
     * @param {number} indexB 
     * @returns {boolean} 是否成功
     */
    swap(indexA, indexB) {
        // 处理逻辑：
        // 1. 获取 slotA 和 slotB
        // 2. 如果 items 相同，尝试堆叠 (merge)
        // 3. 如果不同，直接交换数据 (itemId, count, instanceData)
    }
}
```

### 4.2 UIManager 更新
*   **初始化**：创建背包 DOM 结构。
*   **状态同步**：`updateInventoryUI()` 方法，遍历 `InventorySystem.slots` 更新 UI 格子内容。
*   **事件监听**：
    *   监听 `mousedown` 或 `click` 事件处理物品交互。
    *   维护 `cursorItem` 状态（当前鼠标是否“拿着”物品）。

### 4.3 输入控制 (Input/Game)
*   监听 `B` 键。
*   增加 `isPaused` 或 `isInventoryOpen` 状态标志。
*   在 `Game.update()` 中，如果背包打开，跳过 `WorldSystem` 和 `PlayerSystem` 的部分更新逻辑，但继续渲染 `UIManager`。

## 5. 实现计划

1.  **后端逻辑**：在 `InventorySystem.js` 中实现 `swap` 方法。
2.  **UI 搭建**：在 `UIManager.js` 中注入背包 HTML 结构和 CSS 样式。
3.  **交互逻辑**：实现点击物品、拿起、放下、堆叠的逻辑流。
4.  **游戏集成**：绑定按键，处理暂停逻辑。

## 6. 交互细节 (Cursor Item Logic)

为了简化实现，采用 **"点击-拿起-点击-放下"** 模式（类似 Minecraft 或 Terraria）：

1.  **State**: `heldItem` (null 或 slot对象副本)
2.  **Action: Click Slot(i)**:
    *   IF `heldItem` is null:
        *   IF `Slot(i)` has item:
            *   `heldItem` = `Slot(i)` content (remove from slot or mark as ghost) -> **Remove from slot immediately** (Visual update).
            *   Update Cursor UI to show item.
    *   IF `heldItem` has item:
        *   IF `Slot(i)` is empty:
            *   Place `heldItem` into `Slot(i)`.
            *   `heldItem` = null.
        *   IF `Slot(i)` has same item (and stackable):
            *   Try to add `heldItem.count` to `Slot(i).count`.
            *   Update `heldItem.count` (remaining).
            *   If remaining is 0, `heldItem` = null.
        *   IF `Slot(i)` has different item:
            *   Swap: `temp` = `Slot(i)`; `Slot(i)` = `heldItem`; `heldItem` = `temp`.

这样可以避免复杂的 Drag&Drop API 兼容性问题，且易于实现像素级控制。
