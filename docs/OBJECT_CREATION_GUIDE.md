# Object Creation Guide (Objects 制作规范)

本文档详细说明了如何在项目中创建新的交互式物体（BreakableObject），包括家具、装饰物、可破坏物体等。

## 1. 概述

项目中的物体主要由以下三个部分组成：
1.  **Visual (PixelDraw)**: 使用程序化绘图工具生成的像素画素材。
2.  **Asset Registration**: 在资源管理器中注册素材。
3.  **Logic (BreakableObject)**: 定义物体的物理属性（碰撞箱、血量、阴影）和交互逻辑。

---

## 2. 制作流程

### 步骤 1: 绘制素材 (PixelDraw)

所有物体素材均通过代码动态生成，**不使用外部图片文件**。请在 `src/assets/objects/` 或其子目录（如 `furniture/`）下新建文件。

**文件命名规范**: `[ObjectName]Sprite.js` (例如 `ChairSprite.js`)

**代码模板**:
```javascript
import { PixelDraw } from '../../../utils/PixelDraw.js';
// 如果需要统一配色，可以引入 Palette
import { FurniturePalette } from './FurniturePalette.js'; 

export function createChairSprite() {
    // 1. 定义画布尺寸
    const w = 32;
    const h = 32;
    const drawer = new PixelDraw(w, h);
    
    // 2. 定义颜色
    const colorMain = '#8e44ad';
    
    // 3. 绘制逻辑 (参考 PixelDraw API)
    // 绘制椅背
    drawer.fillPath([
        {x: 8, y: 0}, {x: 24, y: 0},
        {x: 24, y: 20}, {x: 8, y: 20}
    ], colorMain);
    
    // 绘制椅面
    drawer.rect(8, 20, 16, 4, '#9b59b6');
    
    // 绘制椅腿
    drawer.rect(8, 24, 2, 8, '#5e3370'); // 左腿
    drawer.rect(22, 24, 2, 8, '#5e3370'); // 右腿

    // 4. 返回 Canvas 对象
    return drawer.getCanvas();
}
```

**PixelDraw 常用 API**:
- `rect(x, y, w, h, color)`: 填充矩形
- `fillPath(points, color)`: 填充多边形 (`points` 为 `{x,y}` 数组)
- `pixel(x, y, color)`: 绘制单像素
- `hLine`, `vLine`: 绘制水平/垂直线
- `getCanvas()`: 获取最终 Canvas

---

### 步骤 2: 注册资源 (Assets)

在 `src/graphics/Assets.js` 中注册新生成的 Sprite。

1.  **导入生成函数**:
    ```javascript
    import { createChairSprite } from '../assets/objects/furniture/ChairSprite.js';
    ```

2.  **生成并缓存 Sprite**:
    ```javascript
    const chairSprite = createChairSprite();
    ```

3.  **注册到 `Assets.objects`**:
    *   同时需要生成 `_flash` 版本（用于受击闪白效果）。
    ```javascript
    export const Assets = {
        // ...
        objects: {
            // ...
            chair: chairSprite,
            chair_flash: PixelDraw.createSilhouette(chairSprite), // 自动生成白色剪影
        }
    };
    ```

---

### 步骤 3: 定义逻辑 (BreakableObject)

不要再在 `BreakableObject.js` 里追加 `switch/case`。每个 object 的逻辑应放在自己的文件中，并通过注册表统一接入。

**文件位置**:
- `src/core/entities/objects/<ObjectName>Object.js`（例如 `ChairObject.js`）
- 并在 `src/core/entities/objects/ObjectRegistry.js` 中注册类型映射

**核心属性配置**:
*   **Hitbox (碰撞箱)**: 定义物体在地面上的占地面积（阻挡玩家移动）。
*   **HP (血量)**: 物体耐久度。
*   **Shadow (阴影)**: 投射在地面的阴影，通常与 Hitbox 对应。
*   **DrawOffset (绘制偏移)**: 关键属性，用于处理 2.5D 遮挡关系。
*   **可选行为**: `update / draw / interact / getHitboxes / getHurtbox / setWallMask`

**配置示例**:
```javascript
export const ChairObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 8, offsetY: 8, width: 16, height: 16 };
        obj.hp = 20;
        obj.shadow = { type: 'rect', x: 8, y: 8, w: 16, h: 16 };
        obj.drawOffset = { x: 0, y: 0 };
    },
    getHurtbox(obj) {
        return obj.getHitbox();
    }
};
```

然后在 `src/core/entities/objects/ObjectRegistry.js` 注册：
```javascript
['chair', ChairObject],
```

---

## 3. 关键概念详解

### 3.0 地毯例外 (Carpet)
以 `carpet_` 开头的地毯不是 `BreakableObject`，它们是纯装饰地面贴花：
*   **无碰撞体积**：不会参与玩家/敌人的移动碰撞，也不会阻挡导航。
*   **实体类**：使用 `src/core/entities/Carpet.js`，由 `WorldSystem.carpets` 管理。
*   **建造放置**：`BuildSystem` 识别 `carpet_` 前缀并生成 `Carpet`，而不是 `BreakableObject`。

### 3.1 坐标系与对齐 (Visual vs Logical)
*   **Tile Grid**: 游戏基于 32x32 网格。
*   **Visual Height**: 2.5D 游戏中，Y 轴同时表示“向里走”和“垂直高度”。
*   **Draw Offset**: 为了让物体看起来“站在”地上，我们需要调整绘制的 Y 坐标。
    *   **通用公式**: `drawOffset.y = 32 - SpriteHeight` (假设物体底部贴合 Tile 底部)。

### 3.2 Hitbox vs Hurtbox
*   **Hitbox (`getHitbox`)**: 物理碰撞箱，通常较矮，只覆盖物体的“底座”或“腿”。玩家子弹如果是低空飞行或扫射，可能会打中这里。主要用于**阻挡移动**。
*   **Hurtbox (`getHurtbox`)**: 受击判定框。对于高物体（如衣柜、墙壁），Hurtbox 应该覆盖整个视觉高度，确保玩家射击物体上半部分也能造成伤害。`BreakableObject` 已有默认逻辑处理大部分情况，特殊物体可重写 `getHurtbox`。

### 3.3 自适应物体 (Adaptive Objects)
如 `wall` (墙壁)，需要根据周围连接情况改变形态。
*   需要设置 `this.isAdaptive = true`。
*   逻辑会调用 `setWallMask(mask)` 来更新 `frameIndex` 和 `hitbox`。

## 4. 常见问题
*   **Q: 物体看起来位置不对（飘在空中或陷在地下）？**
    *   A: 检查 `drawOffset.y`。
*   **Q: 玩家穿模（从物体上方走过）？**
    *   A: 检查 `hitbox` 的 `offsetY` 和 `height`。Hitbox 应该覆盖物体底部的行走区域。
*   **Q: 射击打不中物体上半部分？**
    *   A: 检查 `getHurtbox` 逻辑，确保它返回了覆盖 Sprite 全身的高度。
