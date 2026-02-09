# 地板瓦片系统

## 一、概述

地板瓦片系统为游戏地面提供多种材质类型和自然过渡效果。每个 32×32 网格单元包含 2×2 = 4 块 16×16 像素的地板子格，允许墙内外使用不同地面。

## 二、地板类型

| 类型 | ID | 用途 | 视觉风格 |
|------|-----|------|---------|
| NONE | 0 | 地图边界/未分配 | 原始暗色棋盘格 |
| GRASS | 1 | 建筑远处空地 | 绿色草地 + 草叶细节 |
| WOOD | 2 | 建筑内部 | 横向木板 + 木纹 + 板缝 |
| CONCRETE | 3 | 建筑周围/路径 | 灰色水泥 + 微裂纹噪点 |
| DIRT | 4 | 草地-水泥过渡带 | 棕色泥土 + 碎石 |

## 三、数据结构

```
地图: 50×50 tile (MAP_WIDTH × MAP_HEIGHT)
子格网格: 100×100 (每 tile 2×2)
存储: Uint8Array(100 * 100 = 10,000 bytes)
索引: floorMap[sy * 100 + sx]，值为 FLOOR_TYPES 枚举
```

常量定义在 `src/utils/FloorTypes.js`。

## 四、精灵设计

16×16 像素，使用 `PixelDraw` 程序化绘制。每种地板类型 4 个变体，通过位置哈希 `((sx * 7 + sy * 13) & 0xFFFF) % 4` 确定性选取。

**草地 (GRASS)**：
- 底色 `#4a7a3b`，散布亮绿像素 (`#5d8e4c`)
- 草尖高亮 (`#6ba35a`)，暗绿阴影 (`#345a28`)

**木地板 (WOOD)**：
- 底色 `#6d4c33`，横向板缝线 (`#3e2a1a`)
- 木纹细线 (`#7d5a3c`)，高光像素 (`#9e7b5a`)

**水泥 (CONCRETE)**：
- 底色 `#7a7a78`，浅灰噪点 (`#8e8e8b`)
- 深灰噪点 (`#686865`)，微裂纹 (`#5a5a58`)

**泥土 (DIRT)**：
- 底色 `#8b7355`，亮色碎石 (`#a08968`)
- 暗色斑点 (`#6d5a42`)，高亮石子 (`#9e8d70`)

色板定义在 `src/assets/floors/FloorPalette.js`，精灵生成在 `src/assets/floors/FloorSprites.js`。

## 五、过渡处理

采用 **预渲染 + 噪声梯度抖动** 方案：

1. 地板数据生成后，一次性将整张地图预渲染到一张离屏 Canvas（1600×1600）
2. 第一遍：绘制所有基础瓦片精灵
3. 第二遍：检测相邻子格类型差异，在边界处绘制 **4px 深度的噪声梯度抖动带**：
   - 边缘第 1 行：65% 密度覆盖邻居底色
   - 边缘第 2 行：40% 密度
   - 边缘第 3 行：22% 密度
   - 边缘第 4 行：8% 密度
   - 使用确定性噪声哈希（`x * 374761393 + y * 668265263`）生成有机的不规则边缘
4. 两侧 tile 各贡献 4px，总过渡带宽 8px，形成自然渐变
5. 运行时 Renderer 仅做单次 `drawImage` 裁剪绘制，性能最优

## 六、Construction 场景地板生成算法

生成时机：在 `ConstructionLayoutGenerator` 编译完 breakables 之后，利用已有的 `buildingPlans` 数据。

```
输入: buildingPlans（含 rooms、wallTiles、doors、entranceDoor）
输出: { floorMap: Uint8Array, width: 100, height: 100 }

Step 1: 全图填充 GRASS
Step 2: 遍历每栋建筑的 rooms → 内部子格标记 WOOD
Step 3: 墙体子格分裂处理:
  - 内部墙（非建筑边界）→ 全部标记 WOOD
  - 外围墙（建筑边界）→ 仅内侧子格标记 WOOD，外侧保留 GRASS
  - 入口门同理：内侧 WOOD，外侧保留 GRASS
  - 内部门 → 全部标记 WOOD
Step 4: 建筑外框向外扩展 3 tile → 标记 CONCRETE（仅覆盖 GRASS，含墙外侧子格）
Step 5: 建筑入口门之间用 L 形路径连通 → 路径宽 2 子格 → 标记 CONCRETE
Step 6: GRASS 与 CONCRETE 相邻的子格 → 60% 概率转为 DIRT（自然过渡带）
```

生成器位于 `src/core/systems/generation/FloorMapGenerator.js`。

## 七、渲染集成

- `WorldSystem` 持有 `floorMap`（Uint8Array）和 `floorCanvas`（预渲染离屏 Canvas）
- `Renderer.js` 在绘制地面时：
  - 有 `floorCanvas`：单次 `drawImage` 绘制摄像机可见区域
  - 无 `floorCanvas`：保留原始棋盘格 fallback（Hub/Test/Game 地图）

## 八、文件结构

```
src/
  assets/
    floors/
      FloorPalette.js        — 地板颜色色板
      FloorSprites.js        — 4 种地板 × 4 变体 = 16 个 16×16 精灵
  core/
    systems/
      generation/
        FloorMapGenerator.js — 地板地图生成算法
  utils/
    FloorTypes.js            — 地板类型常量 + 子格尺寸常量
```
