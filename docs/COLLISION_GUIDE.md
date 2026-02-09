# 碰撞与子弹判定指南 (Collision & Hitbox Guide)

## 1. 核心理念 (Core Concept)
本项目采用了**双层碰撞系统 (Dual-Layer Collision System)**，将“移动/物理碰撞”与“战斗/射击判定”完全分离。这种设计旨在同时满足流畅的 2.5D 移动手感和直观的战斗体验。

---

## 2. 移动碰撞 (Movement Collision)
**目的**: 决定角色是否能通过某个区域，模拟物体在地面上的占地面积。

### 2.1 规则
- **仅检测底座**: 碰撞体 (Hitbox) 仅覆盖物体或角色的**脚部/底部**区域。
- **允许重叠**: 这种设计允许角色站在物体前方（遮挡物体）或后方（被物体遮挡），从而产生正确的纵深感 (2.5D Depth)。
- **更小的尺寸**: 物理碰撞体通常比视觉贴图要小，以便于通过狭窄的缝隙。

### 2.2 配置规范
若要新增实体，请按以下标准设置物理碰撞体：

#### 角色 (Player/Enemy)
- **Hitbox Width**: `14px` (视觉宽度通常为 24-32px)
- **Hitbox Height**: `8px`
- **Offset Y**: `+12px` (相对于中心下移，贴近脚底)
- **代码示例**:
  ```javascript
  this.width = 32; // 视觉宽度
  this.height = 32; // 视觉高度
  this.hitboxWidth = 14;
  this.hitboxHeight = 8;
  this.hitboxOffsetY = 12; 
  ```

#### 障碍物 (Obstacles)
- **Hitbox**: 仅覆盖物体底部的接触面。
- **Box/Barrel**: 底部 10px 高度。
- **代码示例 (BreakableObject.js)**:
  ```javascript
  // 视觉大小 32x32，物理判定仅在底部
  this.hitbox = { 
      offsetX: 4, 
      offsetY: 20, // 下沉到物体底部
      width: 24, 
      height: 10 
  };
  ```

---

## 3. 战斗判定 (Combat/Hurtbox Collision)
**目的**: 决定子弹是否击中目标。

### 3.1 规则
- **检测全身**: 射击判定 (Hurtbox) 覆盖角色的**完整视觉轮廓**（头、身、脚）。
- **符合直觉**: 只要子弹打在角色的图像上，就应当判定为命中，即使那个位置没有物理碰撞体（例如头部）。

### 3.2 配置规范

#### 角色 (Player/Enemy)
- **判定区域**: 直接使用角色的 `x, y` 坐标和 `width, height`（视觉尺寸）进行矩形检测。
- **系统逻辑**: `CombatSystem` 会自动读取实体的 `width` 和 `height` 构建一个以 `(x, y)` 为中心的矩形。

#### 障碍物 (Breakable Objects)
- **必须实现 `getHurtbox()` 方法**: 
  由于障碍物的物理 Hitbox 仅在底部，为了让子弹能打中箱子的上半部分，必须显式定义 Hurtbox。
- **代码示例**:
  ```javascript
  getHurtbox() {
      return {
          x: this.x + this.hitbox.offsetX,
          y: this.y + 4, // 从顶部开始覆盖
          width: this.hitbox.width,
          height: 28 // 覆盖大部分高度
      };
  }
  ```

---

## 4. 调试工具 (Debugging)
游戏中内置了调试模式，用于可视化这两套系统。

- **开启/关闭**: 按键盘 **`P`** 键。
- **颜色图例**:
  - 🟩 **绿色框**: 玩家物理碰撞体 (脚部)
  - 🟧 **橙色框**: 敌人物理碰撞体 (脚部)
  - 🟦 **蓝色框**: 障碍物物理碰撞体 (底座)
  - 🟥 **红色框**: 墙壁 (不可通行区域)
  - 🟪 **紫色框**: 传送门触发区域

> **注意**: 调试模式目前主要显示“物理碰撞体”。子弹的“射击判定框”通常是隐式的（基于视觉大小），但在代码逻辑中是独立计算的。
