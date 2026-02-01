# 项目技术概览

本文档旨在帮助 AI 开发者快速理解项目结构与核心架构。

## 目录结构

- `src/`
  - `assets/`: **美术素材数据**。存放字符画模板，严禁包含游戏逻辑。
    - `characters/player/`: 存放玩家的独立动画帧文件（如 `PlayerRun.js`）。
  - `core/`: **核心游戏逻辑**。
    - `Game.js`: 游戏主循环、状态管理、渲染调度。
    - `Camera.js`: 摄像机跟随与视口计算。
    - `Input.js`: 统一的键鼠输入处理。
  - `graphics/`: **渲染系统**。
    - `SpriteGenerator.js`: 将字符模板转换为 Canvas/Image 的核心工具。
    - `Assets.js`: 负责调用生成器并缓存生成的游戏资源。
  - `utils/`: **工具库**。常量 (`Constants.js`) 和通用辅助函数。
  - `main.js`: **入口文件**。负责初始化游戏实例并挂载到 DOM。

## 基础架构

### 渲染流程
1. **字符生成**: 使用 `SpriteGenerator` 将 ASCII 字符数组 + 调色板转换为 Canvas 图像。
2. **绘制循环**: `Game.js` 中的 `draw()` 方法每帧清除画布并重新绘制。
3. **伪 3D**: 通过简单的 Y 轴排序 (Z-Sorting) 和墙体顶部/前部颜色区分实现 2.5D 视角。

### 游戏循环
- 采用标准的 `requestAnimationFrame` 循环。
- `update()`: 处理输入、物理碰撞、AI 逻辑、状态更新。
- `draw()`: 纯粹的渲染逻辑，依赖 `Camera` 进行坐标转换。

### 规范
- **素材分离**: 所有美术资源定义必须在 `src/assets` 中。
- **逻辑分层**: 渲染代码不应混入业务逻辑，输入处理应通过 `Input` 类解耦。
