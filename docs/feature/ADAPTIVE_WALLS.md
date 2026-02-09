# 自适应可破坏墙体系统方案

## 1. 概述 (Overview)
我们建议用一个统一的 `wall` 类型替换当前的静态 `wall_h` / `wall_v` 类型。该类型将使用 **4位自动平铺 (Bitmasking)** 技术，根据相邻墙体的状态在视觉上进行自适应连接。每个墙块仍然是一个独立的 `BreakableObject`，支持细粒度的破坏效果。当一堵墙被摧毁时，相邻的墙体将动态更新其精灵贴图，以反映新的几何形状（例如，墙上的洞会产生新的“断裂面”）。

## 2. 核心概念 (Core Concepts)

### 2.1. 位掩码算法 (Bitmasking Algorithm)
我们将根据 4 个基数方向上相邻 **墙体对象 (Wall Objects)** 的存在情况，使用标准的 4 位掩码算法：
- **北 (上)**: 1
- **东 (右)**: 2
- **南 (下)**: 4
- **西 (左)**: 8

**掩码值 (0-15) = (北 * 1) + (东 * 2) + (南 * 4) + (西 * 8)**

这产生了 16 种独特的视觉状态，涵盖所有连接情况：
- **0**: 柱子 (孤立)
- **5 (1+4)**: 垂直梁
- **10 (2+8)**: 水平墙
- **6 (2+4)**: 左上角 (连接东和南)
- **15 (1+2+4+8)**: 十字路口
- 等等。

### 2.2. 2.5D 视觉挑战 (2.5D Visual Challenges)
与 2D 俯视游戏不同，我们的 2.5D 透视（能看到物体的顶面和正面）带来了一些限制：
- **透视一致性**: 我们不能简单地旋转精灵。例如，将垂直墙旋转 90 度虽然变成了水平墙，但其“正面”的阴影和厚度方向会变错（因为光照和视角是固定的）。
- **解决方案**: 我们将使用 `PixelDraw` 程序化生成所有 16 种变体，确保光照（顶面高光、正面阴影）和透视深度在任何连接状态下都是正确的。

## 3. 实施计划 (Implementation Plan)

### 3.1. 资产生成 (`WallSprite.js`)
我们将重构 `WallSprite.js`，导出一个 `createAdaptiveWallSprites()` 函数，该函数返回一个包含 16 个精灵的数组或映射表。

**单个瓦片的绘制逻辑 (32x32 + 垂直偏移):**
- **中心柱 (Center Post)**: 在所有精灵中都绘制。
- **北臂 (North Arm)**: 连接中心到上边缘。
- **南臂 (South Arm)**: 连接中心到下边缘。
- **东臂 (East Arm)**: 连接中心到右边缘。
- **西臂 (West Arm)**: 连接中心到左边缘。
- **2.5D 投影 (Projection)**: 
    - **顶面**: 在连接的邻居之间是连续的。
    - **正面 (厚度)**: 仅在该块的“南”侧**没有**南邻居时绘制。这可以防止内部墙壁出现不必要的正面厚度，使视觉效果更整洁。

### 3.2. 动态更新 (`WorldSystem.js`)
1.  **初始化 (Initialization)**:
    -   加载地图时，遍历所有 `wall` 对象。
    -   查询 `NavGrid` 或空间哈希以查找邻居。
    -   计算位掩码并分配 `spriteIndex`。
2.  **破坏事件 (Destruction Event)**:
    -   当墙体死亡 (`hp <= 0`) 时：
        -   识别其网格邻居 (北, 南, 东, 西)。
        -   对这些邻居触发 `updateNeighborVisuals()`。
        -   邻居重新计算掩码（因为少了一个连接对象）并更新其精灵。

### 3.3. 实体与物理 (`BreakableObject.js`)
-   **类型**: 统一使用 `wall` 类型。
-   **碰撞箱 (Hitbox)**: 
    -   *当前*: `wall_v` 和 `wall_h` 较薄 (8px)。
    -   *建议*: 自适应墙体通常表现为“厚”墙（填充瓦片中心）。建议使用 **全瓦片 (32x32)** 或 **中心柱 + 延伸臂** 的形式。
    -   *简化方案*: 直接使用 32x32 的全瓦片碰撞。这样“角落”和“十字路口”的阻挡感更强，且计算更简单。
-   **受击箱 (Hurtbox)**: 需要匹配视觉高度（根据精灵动态调整）。

## 4. 工作流程 (Workflows)

### 4.1. 地图生成
```javascript
// 伪代码
for (let wall of walls) {
    let mask = 0;
    if (hasWall(wall.x, wall.y - 32)) mask |= 1; // 北
    if (hasWall(wall.x + 32, wall.y)) mask |= 2; // 东
    if (hasWall(wall.x, wall.y + 32)) mask |= 4; // 南
    if (hasWall(wall.x - 32, wall.y)) mask |= 8; // 西
    
    wall.setFrame(mask);
}
```

### 4.2. 破坏逻辑
```javascript
// BreakableObject.break() 中的伪代码
worldSystem.removeEntity(this);
worldSystem.updateNeighbors(this.x, this.y); 
```

## 5. 任务总结 (Summary of Tasks)
1.  **重构资产**: 创建 `AdaptiveWallSprite.js`，程序化生成 16 种连接状态的墙体精灵。
2.  **更新 BreakableObject**: 添加 `setFrame(mask)` 方法，并支持动态切换精灵。
3.  **更新 WorldSystem**: 实现 `updateWallVisuals(x, y)` 方法，并在初始化和墙体破坏时调用。
4.  **物理更新**: 标准化墙体碰撞箱为 32x32（或适应性形状）。
