# 人物制作规范 (Procedural Edition)

本文档定义了项目中所有像素人物角色的设计标准与动画规范。

## 1. 基础规范

*   **画布尺寸**: 32x32 像素网格。
*   **生成方式**: 必须使用 `src/utils/PixelDraw.js` 进行**程序化生成** (Procedural Generation)，严禁使用静态字符数组模板。
*   **美术风格 (Cool Guy Archetype)**:
    *   **头部**: 巨大化设计 (Chibi Style)，头部宽度约 16px (Avatar 为 20px)。
    *   **身体**: 短小 (Torso ~7px 高)，主要展示服装特征（风衣、立领）。
    *   **腿部**: 必须有清晰的独立腿部表现，支持 7 种以上的基础姿势。
*   **视角**: 35度俯视 (Top-Down)。
*   **文件格式**: 导出生成的 `HTMLCanvasElement` 或其数组。

## 2. 角色设计细节 (Player: Cool Guy)

*   **配色表 (Palette)**:
    *   **头发/胡须**: 深褐色 Dark Brown (`#2c1a0e`)，高光 (`#4e342e`)。
    *   **皮肤**: `PALETTE['s']` (Base), `PALETTE['S']` (Shadow).
    *   **墨镜**: 近黑色 (`#111111`)，边框 (`#333333`)，必须有纯白高光点 (`#ffffff`)。
    *   **风衣**: 蓝灰色 (`#455a64`)，内衬/阴影 (`#263238`)，高光 (`#607d8b`)。
    *   **衬衫**: 灰色 (`#95a5a6`)，V领设计。
    *   **裤子**: 靛蓝色/牛仔蓝 (`#3949ab`)，与风衣形成高对比度。
    *   **靴子**: 黑色 (`#1a1a1a`)。

*   **头部 (Head)**:
    *   **发型**: 长发披肩 (Back Layer) + 顶部高光 (Front Layer)。
    *   **面部**: 连鬓络腮胡 (Full Beard)，遮住下巴和脸颊。
    *   **配饰**: 墨镜带有鼻梁架 (Bridge) 和镜腿 (Arms)。

*   **身体 (Body)**:
    *   **风衣结构**: 分为左片、右片、立领 (Pop-up Collar)。
    *   **物理动态**: 
        *   `coatWave` 参数 (0..1) 控制风衣下摆的摆动 (`swing`) 和扩张 (`flare`)。
        *   摆动幅度约为 +/- 2px，模拟空气阻力。

*   **UI 头像 (Avatar)**:
    *   文件: `AvatarSprite.js`。
    *   **特写设计**: 头部放大至 20px 宽，增加 V 领衬衫和衣领细节，不包含腿部。

## 3. 动画规范

### 3.1 待机 (Idle)
*   **文件**: `PlayerIdle.js`
*   **帧数**: 16 帧循环。
*   **逻辑**:
    *   **呼吸 (Breathing)**: `Math.sin` 控制 Y 轴起伏 (-0.8px ~ 0px)。
    *   **头发 (Hair)**: 独立相位的正弦波飘动。
    *   **头部**: 跟随身体起伏。

### 3.2 奔跑 (Run)
*   **文件**: `PlayerRun.js`
*   **帧数**: 12 帧循环 (Standard Run Cycle)。
*   **周期**: Contact -> Down -> Pass -> Up -> Air -> Reach。
*   **腿部姿势 (Leg Poses)**:
    *   必须在 `drawLegs` 中实现以下状态：
    *   `idle`/`stand`: 站立。
    *   `fwd1`: 轻微前伸。
    *   `fwd2`: 完全前伸 (Contact)。
    *   `back1`: 轻微后蹬。
    *   `back2`: 完全后蹬 (Push)。
    *   `knee`: 提膝 (Pass)。
    *   `tuck`: 收腿 (Air)。
*   **同步**: 
    *   Phase 1 (Frames 0-5): 右腿接触，左腿摆动。
    *   Phase 2 (Frames 6-11): 左腿接触，右腿摆动。

### 3.3 翻滚 (Roll)
*   **文件**: `PlayerRoll.js` (已弃用 Deprecated)。
*   **实现**: 逻辑层直接旋转 `Idle` 帧 (Canvas Rotation)。
*   **视觉**: 360度旋转。

## 4. 目录结构

```
src/assets/characters/player/
├── PlayerGenerator.js // 核心生成器 (Class) - 定义颜色、绘制方法(Head, Body, Legs)
├── PlayerIdle.js      // 导出 PLAYER_IDLE_FRAMES (Array<Canvas>)
├── PlayerRun.js       // 导出 PLAYER_RUN_FRAMES (Array<Canvas>) - 定义 12 帧动画数据
└── AvatarSprite.js    // 导出 AVATAR_SPRITE (Canvas) - UI 头像专用生成
```

## 5. 技术栈映射
*   **绘图工具**: `PixelDraw` (src/utils/PixelDraw.js)
    *   常用 API: `rect`, `fillPath`, `fillQuadCurve`, `line`, `pixel`.
*   **颜色表**: `PALETTE` (src/assets/Palette.js)

## 6. 敌人设计 (Enemies)

### 6.1 Zombie (Undead Office Worker)
*   **Archetype**: 末日办公室僵尸 (Undead Office Worker)。
*   **配色方案**: 使用 `PALETTE` 中的僵尸色系 (`z`/`Z` 皮肤, `x`/`X` 血迹)。
    *   **皮肤**: `PALETTE['z']` (#82e0aa) / `PALETTE['Z']` (#27ae60) 阴影 / 高光 (#a9dfbf)。
    *   **血迹**: `PALETTE['x']` (#922b21) / `PALETTE['X']` (#641e16)。
    *   **衬衫**: 污白色 (#d5d0c8) / 阴影 (#b0a89e) / 污渍 (#8b7355)。
    *   **领带**: 暗红色 (#8b0000) / 阴影 (#5c0000)。
    *   **西装外套**: 深灰 (#4a4a4a) / 阴影 (#2d2d2d) / 高光 (#636363)。
    *   **裤子**: 深蓝灰 (#3d4f5f)。
*   **外观特征**:
    *   **头部**: 标准大头 (16x14)，不对称眼睛 (一大一小)、暴露头骨/脑、张嘴带牙齿、稀疏秃头发、破碎眼镜。
    *   **身体**: 多层结构 — 破烂西装外套 (左右分片 + 翻领) + 污白衬衫 + 松动领带 + 暴露肋骨。
    *   **外套下摆**: `coatWave` 参数控制动态摆动，与主角/猎人一致。
    *   **领带**: `tieAngle` 参数控制松散领带的摆动。
    *   **手臂**: 伸出式僵尸经典姿势，西装袖子半撕裂露出绿色皮肤，爪状手指。
    *   **腿部**: 标准 7 种姿势 (idle/fwd1/fwd2/back1/back2/knee/tuck)，兼容旧 drag/step 别名。
*   **动画风格**:
    *   **Idle** (16帧): 呼吸起伏 + 第 8-10 帧突然抽搐 + 缓慢张嘴 + 领带/外套摆动。
    *   **Run** (12帧): 标准 Contact→Down→Pass→Up→Air→Reach 循环，加大身体起伏 (蹒跚感)、头部甩动、嘴巴张开抖动、领带大幅摆动、外套下摆飘动。

### 6.2 Hunter (Bandit/Rogue)
*   **Archetype**: 强盗/流亡佣兵 (Bandit / Rogue Mercenary)。
*   **外观特征**:
    *   **头部**: 巨大化设计 (Burly Size 18x16)，比主角更大，极具压迫感。
    *   **脸部**: 额头和眼部区域露出皮肤 (Visible Skin)，下半脸佩戴黑色面罩/方巾 (Bandana)。
    *   **护目镜**: 琥珀色/橙色战术护目镜 (Amber Goggles)，带有深色边框。
    *   **身体**: 强壮的身体 (14x9)，穿着棕色皮革背心/夹克 (Leather Vest) 和醒目的红色围巾 (Red Scarf)。
    *   **姿态**: 正常直立或轻微前倾 (Athletic)，无明显驼背。
*   **动画风格**:
    *   **Idle**: 自信且警觉 (Confident & Alert)，平稳呼吸，缓慢扫视周围。
    *   **Run**: 具有攻击性的奔跑 (Aggressive Run)，身体轻微前倾，步伐稳健有力。
