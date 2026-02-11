# 性能分析器 (Profiler)

## 概述

基于 Canvas 的 Unity 风格性能分析叠加层，用于实时监控游戏帧率和各子系统耗时。按 `I` 键切换显示/隐藏，面板位于屏幕右上角。

## 使用方法

1. 启动游戏（`npm run dev`）
2. 按 `I` 键打开/关闭分析器面板
3. 面板自动显示当前 FPS、历史帧时间图和系统耗时分解

## 面板内容

### FPS 计数器
- 绿色：≥55 FPS（正常）
- 黄色：≥30 FPS（性能下降）
- 红色：<30 FPS（严重卡顿）

### 帧时间历史图
- 显示最近 300 帧（约 5 秒）的帧时间
- 堆叠柱状图，每种颜色代表一个子系统
- 虚线参考线：绿色 = 60fps（16.67ms），黄色 = 30fps（33.33ms）
- Y 轴范围固定为 0-50ms

### 系统耗时分解
- 显示当前帧各子系统的毫秒数和百分比
- 每行包含：颜色标记 + 系统名 + 比例条 + 数值

## 当前监控的系统标签

| 标签 | 对应逻辑 | 包含内容 |
|------|----------|----------|
| Vehicles | 载具系统 | 载具更新、驾驶状态、玩家移动 |
| FlowField | 流场导航 | 敌人寻路流场计算 |
| Camera | 摄像机 | 摄像机跟随、鼠标世界坐标 |
| HandSystem | 手部系统 | 武器瞄准更新 |
| Melee | 近战系统 | 近战攻击状态机 |
| Player | 玩家系统 | 玩家瞄准/射击 |
| Combat | 战斗系统 | 弹道、黑洞、燃烧/流血/冰冻效果 |
| WorldObjects | 世界物体 | 可破坏物、粒子、敌人、传送门、掉落物 |
| Build | 建造系统 | 建造模式更新 |
| UI | 界面更新 | 快捷栏刷新 |
| Render | 渲染管线 | Renderer.draw() 全过程 |

## 接入新系统

只需在 `Game.js` 的 `update()` 方法中用 2 行代码包装：

```javascript
// 在 Game.js update() 中
this.profiler.begin('MyNewSystem');
this.myNewSystem.update();
this.profiler.end('MyNewSystem');
```

**说明：**
- 首次调用 `begin(label)` 时会自动注册该系统并分配颜色，无需显式注册
- `label` 字符串将直接显示在面板中，建议使用 PascalCase
- 可以嵌套多个系统调用，但 begin/end 必须成对出现

## API 参考

```javascript
// ProfilerSystem (src/core/systems/ProfilerSystem.js)

profiler.beginFrame()          // 帧开始（Game.start loop 调用）
profiler.begin(label)          // 子系统计时开始
profiler.end(label)            // 子系统计时结束
profiler.endFrame()            // 帧结束（Game.start loop 调用）

profiler.visible               // 是否显示面板（I 键切换）
profiler.fps                   // 当前 FPS
profiler.getHistory()          // 历史帧数组（旧→新）
profiler.getLatestFrame()      // 最新帧 { total, systems }
profiler.getSystemOrder()      // 已注册系统顺序
profiler.getSystemColor(label) // 系统颜色
```

## 性能开销

- **关闭时**：每帧约 0.03ms（仅 `performance.now()` 调用 + 环形缓冲区写入）
- **开启时**：额外约 0.2ms Canvas 叠加层绘制
- **内存**：约 57KB（300 帧 × 12 系统 × 16 字节）

## 文件位置

| 文件 | 职责 |
|------|------|
| `src/core/systems/ProfilerSystem.js` | 核心测量引擎（环形缓冲区、计时 API、FPS 计算） |
| `src/core/Game.js` | 集成点（实例化、I 键切换、包装系统调用） |
| `src/core/Renderer.js` | 叠加层渲染（`drawProfiler()` 方法） |
| `src/core/Input.js` | I 键注册 |
