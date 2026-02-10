# 武器制作规范 (Weapon Creation Guide)

本文档详细说明了如何为游戏添加新的武器，包括美术绘制、挂载点配置以及数据接入流程。

## 1. 美术绘制规范

为了避免“方方正正”的方块感，绘制武器时请遵循以下原则：

### 1.1 像素风格与尺寸
- **画布尺寸**: 推荐使用 24x12 (步枪/长枪) 或 16x16 (手枪/短枪) 的字符矩阵。
- **调色板**: 必须使用 `src/assets/Palette.js` 中定义的颜色代码。
  - `g`: 浅灰色金属 (Metal Light)
  - `G`: 深灰色金属 (Metal Dark) - *用于增加厚度感和阴影*
  - `m`: 握把/枪托 (Gun Grip/Stock)
  - `f`: 细节/瞄具 (Detail/Sight)

### 1.2 造型与细节 (避免方块感)
1. **轮廓雕刻**: 不要画矩形。
   - **枪管**: 使用细线条，不要和枪身一样粗。
   - **握把**: 稍微倾斜或带有弧度（如使用错位像素）。
   - **扳机护圈**: 即使只有1-2个像素，也要表现出镂空感。
2. **层次感 (Shading)**:
   - **顶部高光**: 枪身上方使用浅色 (`g`)。
   - **侧面/底部阴影**: 枪身下半部分或侧面使用深色 (`G`)。
   - **部件分离**: 瞄准镜、弹匣、枪托应有明显的连接点或颜色区分。

**示例模板 (Rifle)**:
```javascript
export const RIFLE_TEMPLATE = [
    "........................",
    "..........mmmm..........", // 瞄准镜 (悬空感)
    "..........mm..mm........", // 支架
    ".......GGGGGGGGGGggg....", // 枪管 (细长)
    "....mmGGGGGGGGGGGGGGgg..", // 机匣 (厚重)
    "....mm....mm..mm........", // 握把 & 弹匣 (向下突出)
    "........................"
];
```

## 2. 文件结构与注册

### 2.1 创建素材文件
在 `src/assets/weapons/` 下新建文件，例如 `MyGunSprite.js`。导出字符数组模板。

### 2.2 注册资源
在 `src/graphics/Assets.js` 中引入并生成 Sprite：
```javascript
import { MY_GUN_TEMPLATE } from '../assets/weapons/MyGunSprite.js';

export const Assets = {
    // ...
    my_gun: spriteGenerator.generate(MY_GUN_TEMPLATE, PALETTE),
};
```

## 3. 挂载配置 (WeaponData)

在 `src/assets/weapons/WeaponData.js` 中定义武器属性。这是最关键的一步，决定了手放在哪里、枪怎么转。

### 3.1 核心属性
```javascript
my_gun: {
    name: "Super Rifle",
    type: WeaponType.RIFLE, // 或 PISTOL
    sprite: "my_gun",       // 对应 Assets 中的 key
    scale: 1.5,             // 渲染缩放倍数
    orbitRadius: 10,        // 枪离身体中心的距离 (越小越贴身)
    
    // ... 挂载点配置 (见下文) ...
}
```

### 3.2 绘制偏移 (Draw Offset) & 旋转锚点
**`drawOffset`** 决定了枪的哪个像素点重合在“旋转中心”上。
- 坐标系: 像素坐标 (x, y)，原点在 Sprite 左上角。
- **原则**: 通常选择**后握把 (Rear Grip)** 的中心作为锚点。
- 示例: 如果后握把在像素图的 (10, 9) 位置:
  ```javascript
  drawOffset: { x: -10, y: -9 } 
  ```
  *注意: 必须为负值，意为将图片向左上移动，使 (10,9) 对齐原点。*

### 3.3 手部挂载点 (Hands)
定义左右手相对于**旋转锚点**的偏移量（像素）。
- **Right Hand**: 通常是**后手**（扣扳机的手）。如果锚点就在后握把，则为 `{x:0, y:0}`。
- **Left Hand**: 通常是**前手**（托举护木的手）。测量像素图中前握把相对于后握把的距离。
- **Y轴微调**: 为了让手看起来“握住”而不是“浮在上面”，通常需要将手向下微调 2-3 像素。

**配置示例**:
```javascript
hands: {
    // 后手 (右手): 在锚点处，向下偏 3px
    right: { x: 0, y: 3 },   
    // 前手 (左手): 在锚点前方 4px，向下偏 3px
    left: { x: 4, y: 3 }     
}
```

## 4. 枪口与弹道 (Muzzle & Stats)

### 4.1 射击参数
```javascript
fireRate: 150,      // 射击间隔 (ms)
damage: 10,         // 单发伤害
bulletSpeed: 12,    // 子弹速度
bulletLife: 60,     // 子弹射程/存在时间
// 弹药系统
magazineSize: 30,   // 弹匣容量
maxReserve: 120,    // 最大备弹
reloadTime: 2000    // 换弹时间(ms)
```

### 4.2 枪口位置 (Muzzle Offset)
**`muzzleOffset`** 定义了相对于旋转锚点的枪口位置，用于精确计算子弹发射点和特效位置。

```javascript
muzzleOffset: { x: 12, y: -3 }
```

- **X轴**: 正数表示向枪管前方延伸。测量从后握把到枪管末端的像素距离。
- **Y轴**: 微调垂直位置，使枪口与枪管中心对齐（通常为负值，向上偏移）。

**测量方法**: 在像素图中，从锚点（后握把）到枪管最前端的水平距离即为 `x` 值。

---

## 5. 特效适配规范

### 5.1 枪口火焰 (Muzzle Flash)

#### 创建多帧动画素材
枪口火焰应使用多帧动画来表现爆发和消散过程。在 `src/assets/weapons/` 下创建动画配置文件：

```javascript
// MuzzleFlashRifle.js - 步枪火焰示例
export const MUZZLE_FLASH_RIFLE = {
    // 帧序列：从爆发到消散
    frames: [
        [
            "................",
            "................",
            ".....yY.........",
            "....yYYY........",
            "....yYYYYrr.....",  // 第1帧：最大爆发
            "....yYYYYrr.....",
            "....yYYY........",
            ".....yY.........",
        ],
        [
            "................",
            "................",
            "................",
            ".....yY.........",
            "....yYYY..r.....",  // 第2帧：开始收缩
            "....yYYY........",
            ".....yY.........",
            "................",
        ],
        [
            "................",
            "................",
            "................",
            "................",
            ".....yY.........",  // 第3帧：余烬
            "....yYy.........",
            "................",
            "................",
        ]
    ],
    // 动画参数
    fps: 12,           // 播放帧率
    loop: false,       // 是否循环（火焰通常播放一次）
    tint: null         // 可选：整体色调 '#ff6600'
};

// 霰弹枪火焰：短粗、范围大
export const MUZZLE_FLASH_SHOTGUN = {
    frames: [
        [
            "................",
            "...yY...........",
            "..yYYY..........",
            "..yYYYYY........",
            "..yYYYYYYY......",  // 宽大的扇形
            "..yYYYYY........",
            "..yYYY..........",
            "...yY...........",
        ],
        // ... 更多帧
    ],
    fps: 10,
    loop: false
};

// 狙击枪火焰：细长、尖锐
export const MUZZLE_FLASH_SNIPER = {
    frames: [
        [
            "................",
            "................",
            "................",
            "......y.........",
            ".....yY.........",
            "....yYYrr.......",  // 细长延伸
            "...yYYYrr.......",
            "....yYYrr.......",
        ],
        // ... 更长延伸的帧
    ],
    fps: 15,
    loop: false
};
```

#### 武器配置适配
在 `WeaponData` 中配置动画引用和位置：

```javascript
default_rifle: {
    // ... 其他配置
    muzzleOffset: { x: 12, y: -3 },

    // 特效配置
    effects: {
        muzzleFlash: {
            animation: 'MUZZLE_FLASH_RIFLE',  // 引用动画配置
            scale: 1.0,                       // 缩放倍数
            offset: { x: 0, y: 0 }           // 相对muzzleOffset的微调
        }
    }
}
```

**绘制要点**:
- **尺寸**: 推荐使用 16x16 或 24x12 画布，根据武器类型调整
- **颜色层次**:
  - `Y` (亮黄): 核心高温区
  - `y` (黄色): 主体火焰
  - `r` (红色): 外围余烬
  - `o` (橙色): 过渡层次
- **动态表现**: 第1帧向外爆发，后续帧向内收缩并变暗
- **武器差异**:
  - 自动武器：快速、高频、较小规模
  - 霰弹枪：宽大、扇形、短促
  - 狙击枪：细长、延伸、明显尾焰

### 5.2 弹壳掉落 (Shell Casing)

弹壳系统已内置，无需为每种武器单独创建素材，但需要配置以下参数：

```javascript
caliber: 'rifle',  // 或 'pistol' - 影响弹壳大小和颜色
casingColor: '#d4af37'  // 可选，自定义弹壳颜色
```

**弹壳行为**:
- **抛射方向**: 始终向下和向右（相对于武器朝向）
- **物理效果**: 包含弹跳、旋转和高度模拟
- **生命周期**: 约2秒后消失

---

## 6. 子弹制作规范

### 6.1 子弹外形配置

在 `WeaponData` 中定义子弹的视觉属性：

```javascript
bulletColor: '#f1c40f',  // 子弹主体颜色
bulletSize: 5,           // 子弹半径（像素）
bulletType: 'round'      // 形状类型: 'round'(圆形), 'pixel'(像素块)
```

**颜色建议**:
| 武器类型 | 推荐颜色 | 说明 |
|---------|---------|------|
| 步枪 | `#f1c40f` (金黄) | 高速弹药的火光效果 |
| 手枪 | `#ecf0f1` (银白) | 标准金属弹头 |
| 霰弹 | `#e74c3c` (红色) | 区分视觉效果 |
| 特殊 | `#9b59b6` (紫色) | 能量武器等 |

### 6.2 子弹移动方式

#### 基础直线弹道（默认）
```javascript
// WeaponData 配置
bulletSpeed: 12,    // 速度（像素/帧）
bulletLife: 60,     // 存在时间（帧），决定射程
```

#### 特殊弹道扩展（预留）
如需实现特殊弹道，可在代码中扩展以下属性：

```javascript
// 重力弹道（抛物线）
gravity: 0.2,       // 重力加速度

// 追踪弹道
homing: false,      // 是否追踪目标
homingStrength: 0.1 // 转向强度

// 散射弹道
spread: 0,          // 散布角度（度）

### 6.4 特殊弹药类型 (Special Ammo)

目前支持以下特殊弹药类型：

#### Rocket (火箭弹)
```javascript
bulletType: 'rocket',
blastRadius: 80,      // 爆炸半径
knockback: 10         // 击退力度
```
- **行为**:
  - **飞行**: 带有烟雾拖尾 (`particle` trail)。
  - **命中**: 接触墙壁、物体或敌人时触发爆炸。
  - **爆炸**: 造成范围伤害 (AOE) 并击退敌人。
  - **渲染**: 使用 `Assets.rocket_projectile` 贴图，并根据飞行方向旋转。

### 6.3 弹道视觉效果

**拖尾效果**: 如需添加子弹拖尾，可在 `Game.js` 的子弹渲染逻辑中扩展：

```javascript
// 在渲染循环中为子弹添加拖尾
this.ctx.save();
this.ctx.globalAlpha = 0.5;
this.ctx.fillStyle = b.color;
// 在子弹后方绘制渐隐的轨迹
this.ctx.restore();
```

---

## 7. 近战武器制作规范

近战武器使用 `WeaponType.MELEE` 类型，由 `MeleeSystem` 管理攻击逻辑，不产生子弹。

### 7.1 WeaponData 配置

```javascript
katana: {
    name: "Katana",
    type: WeaponType.MELEE,
    sprite: "katana",
    drawOffset: { x: -5, y: -5 },
    scale: 1.5,
    hands: { right: { x: 0, y: 2 }, left: { x: 3, y: 2 } },
    orbitRadius: 12,
    isMelee: true,           // 必须设为 true
    fireRate: 400,            // 攻击冷却(ms)
    damage: 35,
    meleeRange: 52,           // 命中检测半径(px)
    meleeArc: 120,            // 命中扇形角度(度)
    knockback: 6,
    windupFrames: 4,          // 蓄力帧数
    swingFrames: 8,           // 挥砍帧数
    recoveryFrames: 6,        // 收招帧数
    swingArcDegrees: 150,     // 视觉挥砍弧度
    magazineSize: 0,
    maxReserve: 0
}
```

### 7.2 近战特有属性说明

| 属性 | 说明 | 参考值 |
|------|------|--------|
| `isMelee` | 近战标志，阻止远程射击流程 | `true` |
| `meleeRange` | 命中检测半径（像素） | 匕首30, 长刀52, 大剑70 |
| `meleeArc` | 命中扇形角度（度） | 匕首90, 长刀120, 大剑150 |
| `windupFrames` | 蓄力帧数（越少越快） | 2-6 |
| `swingFrames` | 挥砍帧数 | 6-12 |
| `recoveryFrames` | 收招帧数 | 4-8 |
| `swingArcDegrees` | 武器视觉扫过的弧度 | 120-180 |

### 7.3 添加新近战武器流程

1. 创建 `src/assets/weapons/MyMeleeGenerator.js`（PixelDraw 绘制）
2. 在 `Assets.js` 导入并注册 sprite
3. 在 `WeaponData.js` 添加配置，必须包含 `isMelee: true`
4. 在 `InventorySystem.js` 注册 `weapon:my_melee`
5. 无需修改 MeleeSystem / HandSystem / PlayerSystem

### 7.4 攻击状态机

```
IDLE → (点击) → WINDUP(蓄力) → SWING(挥砍+命中检测) → RECOVERY(收招) → IDLE
```

- **WINDUP**: 武器反向拉回约30°，产生蓄力感
- **SWING**: 武器扫过 `swingArcDegrees` 弧度，每帧检测扇形区域内敌人
- **RECOVERY**: 武器平滑回归鼠标方向，不可打断

## 8. 总结流程
1. **画**: 用字符画出枪，注意阴影和非矩形轮廓。
2. **测**: 找到后握把坐标 (Pivot)，测算前握把距离。
3. **配**: 填写 `drawOffset` (负的Pivot坐标) 和 `hands` (相对Pivot坐标 + Y轴下沉)。
4. **调**: 运行游戏，观察手是否对齐握把，微调 `hands.y`。
