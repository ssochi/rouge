# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev      # 启动 Vite 开发服务器 (HMR)
npm run build    # 生产构建 (输出到 dist/)
npm run preview  # 预览生产构建
```

**重要：编写完代码后必须运行 `npm run build` 确保构建通过。**

## 项目概述

基于原生 Canvas API 的 2.5D 俯视角像素风 Roguelike 射击游戏。无框架依赖，仅使用 Vite 作为构建工具。所有美术素材均通过代码程序化生成（Canvas API / PixelDraw），不使用外部图片文件。

## 架构核心

### 游戏循环 (Game.js)
`Game.js` 是系统编排中心，通过 `requestAnimationFrame` 驱动 `update()` → `draw()` 循环。各子系统以依赖注入方式初始化，**CombatSystem 必须先于 WorldSystem 初始化**。

### 系统分层
- **core/systems/**: 游戏子系统 — `PlayerSystem`(移动/拾取)、`CombatSystem`(射击/子弹/爆炸)、`WorldSystem`(地图/敌人/流场)、`InventorySystem`(物品/背包)、`BuildSystem`(建造模式)、`NavigationGrid`(空间网格/寻路)
- **core/entities/**: 实体类 — `Zombie`、`Vehicle`、`BreakableObject`、`DroppedWeapon`、`Portal` 等
- **core/Renderer.js**: 场景绘制与 UI 刷新，按 Y 轴 Z-Sort 实现 2.5D 纵深
- **graphics/**: `SpriteGenerator`(字符模板→Canvas) + `Assets`(资源缓存)
- **assets/**: 纯美术数据，严禁包含游戏逻辑
- **utils/**: `Constants.js`、`PixelDraw.js`(程序化像素绘制)、`CollisionUtils.js`

### 碰撞双层系统
移动碰撞（底座 hitbox）与战斗判定（全身 hurtbox）分离。障碍物需实现 `getHurtbox()` 方法。详见 `docs/COLLISION_GUIDE.md`。

## 开发规范

1. **文档使用中文**。编写完文档后询问用户是否符合预期，可提三个问题。
2. **基于文档开发时，完成后必须更新对应文档。**
3. **代码分层**：注意抽象封装，不要在一个文件中写太多逻辑。
4. **美术素材代码**放在独立文件中（如每种枪械一个文件），统一放到 `src/assets/` 目录下。
5. **新增/修改模块**时必须同步更新 `docs/TECH_OVERVIEW.md`。
6. **新增游戏按键**：必须在 `src/core/Input.js` 的 `keys` 对象和 `_initListeners` 中注册。
7. **方案文档**放置在 `docs/feature/` 中。

## 素材制作要点

- **角色**：严格遵循 `docs/CHARACTER_GUIDE.md`（32x32、默认朝左、至少 8 帧全身联动、使用 `PixelDraw` 程序化生成）。
- **武器**：遵循 `docs/WEAPON_GUIDE.md`（字符模板 + `WeaponData.js` 挂载配置 + `Assets.js` 注册）。
- **物体**：遵循 `docs/OBJECT_CREATION_GUIDE.md`（PixelDraw 绘制 → Assets 注册 → ObjectRegistry 注册逻辑）。
- **复杂像素物体**：参考 `docs/PIXEL_ART_GUIDE.md`，使用 `PixelDraw` 程序化绘制。
