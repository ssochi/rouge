# 新武器批次一：5 种新武器设计方案

## 0. 概述

本文档定义 5 种新武器的完整设计方案，用以丰富现有武器生态。

**现有武器分析**：
| 武器 | 类型 | 射速(ms) | 伤害 | 弹匣 | 定位 |
|------|------|----------|------|------|------|
| Assault Rifle | RIFLE | 150 | 10 | 30 | 中距离全自动泛用 |
| Pistol | PISTOL | 400 | 25 | 12 | 半自动副武器 |
| RPG-7 | RIFLE | 1500 | 30+AOE | 1 | 远距离爆破 |

**新增武器一览**：
| # | 武器 | 类型 | 定位 | 新增机制 |
|---|------|------|------|----------|
| 1 | Shotgun 散弹枪 | RIFLE | 近距离爆发 | 散射（多弹丸） |
| 2 | Sniper Rifle 狙击步枪 | RIFLE | 远距离精确 | 穿透 |
| 3 | SMG 冲锋枪 | PISTOL | 近/中距离压制 | 无（纯数值差异） |
| 4 | Crossbow 弩 | RIFLE | 中距离特种 | 穿透 + 静音（无弹壳） |
| 5 | Grenade Launcher 榴弹发射器 | RIFLE | 中距离范围控场 | 弧线弹道（重力） |

---

## 1. Shotgun 散弹枪 (Pump-Action)

### 1.1 设计理念
近距离高爆发、宽扇面覆盖的经典霰弹枪。一次射击发射 6 颗弹丸，呈扇形散布。单颗伤害低，但全部命中时总伤害极高。

### 1.2 美术规格
- **画布**: 28x12
- **风格**: Remington 870 风格，木质前护木 + 金属枪管
- **配色**:
  - 枪管/机匣: `G`(深灰) + `g`(浅灰)
  - 枪托/前护木: `7`(深木) + `8`(浅木)
  - 扳机/细节: `9`(金属灰)
- **文件**: `src/assets/weapons/ShotgunGenerator.js` (PixelDraw 程序化生成)
- **造型要点**:
  - 粗短枪管（比步枪短，比手枪长）
  - 明显的木质前护木（泵动标志）
  - 略向下弯的枪托

### 1.3 WeaponData 配置
```javascript
shotgun: {
    name: "Shotgun",
    type: WeaponType.RIFLE,
    sprite: "shotgun",
    drawOffset: { x: -10, y: -6 },
    muzzleOffset: { x: 18, y: -1 },
    scale: 1.5,
    hands: {
        right: { x: 0, y: 3 },
        left: { x: 6, y: 3 }
    },
    orbitRadius: 10,
    // 射击参数
    fireRate: 800,        // 泵动间隔，较慢
    damage: 8,            // 单颗弹丸伤害（6颗全中 = 48）
    bulletSpeed: 10,
    bulletLife: 25,        // 短射程
    bulletColor: '#e74c3c',
    bulletSize: 3,
    // 散射机制（新增属性）
    pelletCount: 6,       // 弹丸数量
    spread: 25,           // 散布角度（度），左右各 12.5°
    // 弹药
    magazineSize: 6,
    maxReserve: 36,
    reloadTime: 2500,
    // 弹壳
    caliber: 'shotgun'
}
```

### 1.4 所需代码变更
**CombatSystem.tryShoot()** 需支持 `pelletCount` 和 `spread`：
```javascript
// 在 tryShoot() 中，当 weapon.pelletCount > 1 时：
const pellets = weapon.pelletCount || 1;
const spreadRad = (weapon.spread || 0) * Math.PI / 180;

for (let i = 0; i < pellets; i++) {
    const offsetAngle = (Math.random() - 0.5) * spreadRad;
    const finalAngle = muzzle.angle + offsetAngle;
    this.bullets.push({
        x: muzzle.x,
        y: muzzle.y,
        vx: Math.cos(finalAngle) * (weapon.bulletSpeed || 12),
        vy: Math.sin(finalAngle) * (weapon.bulletSpeed || 12),
        // ... 其余属性同标准子弹
    });
}
```

---

## 2. Sniper Rifle 狙击步枪

### 2.1 设计理念
远距离、高伤害、低射速的精确打击武器。子弹可穿透一个敌人继续飞行（穿透机制）。强调一击必杀的爽快感，但射速极慢，近战乏力。

### 2.2 美术规格
- **画布**: 32x12
- **风格**: Barrett M82 风格，长枪管 + 大型瞄准镜
- **配色**:
  - 枪身/枪管: `G`(深灰) + `9`(金属灰)
  - 瞄准镜: `m`(深蓝灰) + `g`(浅灰高光)
  - 枪托: `m`(深蓝灰)
  - 镜片高光: `w`(白色) — 1-2 像素反光点
- **文件**: `src/assets/weapons/SniperGenerator.js`
- **造型要点**:
  - 整体最长（32px 画布用满）
  - 巨大的瞄准镜（4x3 像素以上，镜片有白色高光）
  - 粗壮的制退器（枪口处 2px 宽度突出）
  - 长消音器/枪口制退器

### 2.3 WeaponData 配置
```javascript
sniper: {
    name: "Sniper Rifle",
    type: WeaponType.RIFLE,
    sprite: "sniper",
    drawOffset: { x: -12, y: -6 },
    muzzleOffset: { x: 28, y: -1 },
    scale: 1.5,
    hands: {
        right: { x: 0, y: 3 },
        left: { x: 8, y: 3 }
    },
    orbitRadius: 10,
    // 射击参数
    fireRate: 1200,       // 栓动，极慢
    damage: 80,           // 一击高伤
    bulletSpeed: 20,      // 极快弹速
    bulletLife: 120,       // 超远射程
    bulletColor: '#3498db',
    bulletSize: 4,
    // 穿透机制（新增属性）
    piercing: 1,          // 可穿透 1 个敌人
    // 弹药
    magazineSize: 5,
    maxReserve: 25,
    reloadTime: 3000,
    caliber: 'rifle'
}
```

### 2.4 所需代码变更
**CombatSystem.updateBullets()** 需支持 `piercing`：
```javascript
// 命中敌人后，如果子弹有 piercing > 0：
if (b.piercing > 0) {
    b.piercing--;
    b.damage *= 0.6; // 穿透后伤害衰减 40%
    // 不设置 hit = true，子弹继续飞行
    // 但需要记录已命中的敌人，避免同一帧重复判定
} else {
    hit = true;
}
```

---

## 3. SMG 冲锋枪

### 3.1 设计理念
极高射速、低单发伤害的近/中距离压制武器。弹匣大，适合持续输出。不需要新机制，纯数值差异即可定义其手感。

### 3.2 美术规格
- **画布**: 16x14
- **风格**: UZI/MAC-10 风格，紧凑方正
- **配色**:
  - 枪身: `G`(深灰) + `9`(金属灰)
  - 握把: `m`(深蓝灰)
  - 高光: `g`(浅灰)
- **文件**: `src/assets/weapons/SmgGenerator.js`
- **造型要点**:
  - 紧凑方正的机匣（比手枪略大）
  - 弹匣从握把前方向下突出（UZI 标志性设计）
  - 短粗枪管（3-4px 长）
  - 折叠枪托（可选，用 1-2px 线条暗示）

### 3.3 WeaponData 配置
```javascript
smg: {
    name: "SMG",
    type: WeaponType.PISTOL,  // 单手持握
    sprite: "smg",
    drawOffset: { x: -6, y: -7 },
    muzzleOffset: { x: 10, y: -2 },
    scale: 1.5,
    hands: {
        right: { x: 0, y: 3 }
    },
    orbitRadius: 16,
    // 射击参数
    fireRate: 80,         // 极高射速
    damage: 6,            // 低单发伤害
    bulletSpeed: 11,
    bulletLife: 40,        // 中等射程
    bulletColor: '#f39c12',
    bulletSize: 3,
    // 弹药
    magazineSize: 40,
    maxReserve: 200,
    reloadTime: 1800,
    caliber: 'pistol'
}
```

### 3.4 所需代码变更
无。完全使用现有子弹系统，仅靠数值差异体现手感。

---

## 4. Crossbow 弩

### 4.1 设计理念
安静、精准的中距离特种武器。弩箭飞行速度较慢但可穿透一个敌人。无弹壳抛出效果，射击反馈偏"安静"。适合潜行风格的玩家。

### 4.2 美术规格
- **画布**: 20x16
- **风格**: 战术弩，现代复合弓臂
- **配色**:
  - 弓臂: `G`(深灰金属)
  - 弓弦: `g`(浅灰) — 单像素线
  - 枪托/握把: `m`(深蓝灰)
  - 弩箭: `9`(金属灰) + `f`(红色箭尾)
- **文件**: `src/assets/weapons/CrossbowGenerator.js`
- **造型要点**:
  - 横置的弓臂（宽度 > 高度，约 14px 宽）
  - 弓弦为两条斜线汇聚于中心
  - 导轨上有待发弩箭（细线条 + 红色尾羽）
  - 手枪式握把

### 4.3 WeaponData 配置
```javascript
crossbow: {
    name: "Crossbow",
    type: WeaponType.RIFLE,
    sprite: "crossbow",
    drawOffset: { x: -8, y: -8 },
    muzzleOffset: { x: 12, y: 0 },
    scale: 1.5,
    hands: {
        right: { x: 0, y: 3 },
        left: { x: 5, y: 1 }
    },
    orbitRadius: 10,
    shellEject: false,    // 无弹壳
    // 射击参数
    fireRate: 1000,       // 慢速上弦
    damage: 45,           // 高单发
    bulletSpeed: 8,       // 弩箭飞行较慢
    bulletLife: 80,        // 射程尚可
    bulletColor: '#95a5a6',
    bulletSize: 4,
    bulletType: 'bolt',   // 新弹药类型标识
    // 穿透（复用 Sniper 的机制）
    piercing: 1,
    // 弹药
    magazineSize: 1,      // 单发装填
    maxReserve: 20,
    reloadTime: 1500,
}
```

### 4.4 所需代码变更
- **穿透机制**：复用 Sniper Rifle 的 `piercing` 实现。
- **弩箭视觉**：在 Renderer 中为 `bulletType: 'bolt'` 绘制矩形旋转贴图（而非圆形），使弩箭看起来像一根细长的箭矢，朝飞行方向旋转。
```javascript
// Renderer 中 bullet 渲染扩展:
if (b.type === 'bolt') {
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(Math.atan2(b.vy, b.vx));
    ctx.fillStyle = b.color;
    ctx.fillRect(-6, -1, 12, 2); // 细长箭身
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-6, -2, 3, 4);  // 红色尾羽
    ctx.restore();
}
```

---

## 5. Grenade Launcher 榴弹发射器

### 5.1 设计理念
中距离范围控场武器，发射抛物线弹道的榴弹。与 RPG 的区别在于：弹速更慢、弹道有弧度（受重力影响）、爆炸半径更小但射速更快。定位为"战术型 AOE"而非"重型毁灭"。

### 5.2 美术规格
- **画布**: 24x14
- **风格**: M79 破片榴弹发射器，单管翻转式
- **配色**:
  - 枪管（粗管）: `G`(深灰) + `9`(金属灰)
  - 枪托: `7`(深木) + `8`(浅木)
  - 握把: `m`(深蓝灰)
  - 弹膛铰链: `g`(浅灰)
- **文件**: `src/assets/weapons/GrenadeLauncherGenerator.js`
- **造型要点**:
  - 粗大的单管（4-5px 直径，远比步枪粗）
  - 截短的木质枪托
  - 枪管与枪身之间有明显的铰链/转折
  - 整体圆润（多用 fillPath 表现管状感）

### 5.3 WeaponData 配置
```javascript
grenade_launcher: {
    name: "Grenade Launcher",
    type: WeaponType.RIFLE,
    sprite: "grenade_launcher",
    drawOffset: { x: -10, y: -7 },
    muzzleOffset: { x: 16, y: -1 },
    scale: 1.5,
    hands: {
        right: { x: 0, y: 3 },
        left: { x: 6, y: 3 }
    },
    orbitRadius: 10,
    shellEject: false,
    // 射击参数
    fireRate: 1000,
    damage: 20,
    bulletSpeed: 6,       // 慢弹速
    bulletLife: 80,
    bulletType: 'grenade', // 新弹药类型
    blastRadius: 64,      // 比 RPG (96) 小
    knockback: 8,
    // 弧线弹道（新增属性）
    gravity: 0.15,        // 重力加速度，使弹道下坠
    // 弹药
    magazineSize: 1,
    maxReserve: 15,
    reloadTime: 2000,
}
```

### 5.4 所需代码变更
**CombatSystem.updateBullets()** 需支持 `gravity`（弧线弹道）：
```javascript
// 在子弹更新循环中：
if (b.gravity) {
    b.vy += b.gravity; // 每帧给 vy 施加向下的加速度
}
```

**榴弹渲染**：在 Renderer 中为 `bulletType: 'grenade'` 绘制一个小圆球 + 烟尾：
```javascript
if (b.type === 'grenade') {
    // 烟雾拖尾（复用 rocket 的粒子逻辑，但更稀疏）
    // 弹体绘制为一个带深色轮廓的小圆
    ctx.fillStyle = '#556b2f'; // 橄榄绿
    ctx.beginPath();
    ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b4d23';
    ctx.stroke();
}
```

---

## 6. 新增机制汇总

需要对 `CombatSystem` 进行以下扩展（按优先级排列）：

| 机制 | 涉及武器 | 改动范围 | 说明 |
|------|----------|----------|------|
| **散射 (Spread/Pellets)** | Shotgun | `tryShoot()` | 单次射击生成多颗子弹，各自带随机角度偏移 |
| **穿透 (Piercing)** | Sniper, Crossbow | `updateBullets()` | 命中后不销毁子弹，减少穿透次数和伤害，继续飞行 |
| **重力弹道 (Gravity)** | Grenade Launcher | `updateBullets()` | 每帧给 `vy` 施加向下加速度 |
| **弩箭渲染 (Bolt)** | Crossbow | `Renderer.js` | 矩形旋转贴图替代默认圆形子弹 |
| **榴弹渲染 (Grenade)** | Grenade Launcher | `Renderer.js` | 橄榄绿圆球 + 稀疏烟尾 |

---

## 7. 文件清单

### 新增文件
```
src/assets/weapons/
├── ShotgunGenerator.js          # 散弹枪素材
├── SniperGenerator.js           # 狙击步枪素材
├── SmgGenerator.js              # 冲锋枪素材
├── CrossbowGenerator.js         # 弩素材
└── GrenadeLauncherGenerator.js  # 榴弹发射器素材
```

### 需修改的文件
```
src/assets/weapons/WeaponData.js    # 新增 5 个武器配置
src/assets/Palette.js               # 如需新增配色（预计不需要，现有色板足够）
src/graphics/Assets.js              # 注册 5 个新 Sprite
src/core/systems/CombatSystem.js    # 散射 + 穿透 + 重力弹道
src/core/Renderer.js                # bolt 和 grenade 子弹渲染
src/core/systems/InventorySystem.js # 注册 5 个新武器物品
docs/TECH_OVERVIEW.md               # 同步更新
```

---

## 8. 开发顺序

1. **Phase 1 — SMG**（零新机制，验证武器注册流程）
2. **Phase 2 — Shotgun**（实现散射机制）
3. **Phase 3 — Sniper Rifle**（实现穿透机制）
4. **Phase 4 — Crossbow**（复用穿透 + 新增弩箭渲染）
5. **Phase 5 — Grenade Launcher**（实现重力弹道 + 新增榴弹渲染）

每个 Phase 完成后运行 `npm run build` 验证。

---

## 9. 实现细节补充

### 9.1 CombatSystem.tryShoot() 散射改造
将单发子弹创建改为循环，同时前置声明 `piercing`/`gravity`/`hitList` 属性，确保所有子弹结构统一：
- `pelletCount` 未定义时默认 1，完全向后兼容
- 每颗弹丸角度 = 基础角度 + `random(-0.5, 0.5) * spreadRad`

### 9.2 CombatSystem.updateBullets() 穿透逻辑
在敌人碰撞段（原 L201-238）中：
- 命中时检查 `b.piercing > 0`
- 是：`piercing--`，`damage *= 0.6`，记录 `hitList[j]`，**不设 hit=true**
- 否：正常 `hit = true`
- `hitList` 用于同帧内跳过已命中的敌人

### 9.3 Grenade 爆炸触发
- 与 Rocket 的区别：榴弹在 `life <= 0` 时也触发爆炸（模拟落地引爆）
- 三处 `b.type !== 'rocket'` 需扩展为 `b.type !== 'rocket' && b.type !== 'grenade'`（L155, L185, L219），确保榴弹不造成直接伤害，仅通过爆炸伤害

### 9.4 Renderer.js 新增渲染分支
在 bullet forEach（L378-398）的 `rocket` 分支后、默认 `else` 前插入：
- `bolt`: `ctx.rotate()` + 细长矩形箭身 + 红色尾羽
- `grenade`: 橄榄绿填充圆 + 深色描边
