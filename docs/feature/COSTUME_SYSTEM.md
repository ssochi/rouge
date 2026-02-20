# 服装系统 (Costume System)

## 概述

玩家角色支持换装功能，通过更换不同的服装部件改变外观。纯装饰性系统，不影响游戏数值。

## 换装部位

| 部位 | 键名 | 是否必选 | 默认值 |
|------|------|---------|--------|
| 发型 | `hairstyle` | 必选 | 长发 (`hair_long`) |
| 帽子 | `hat` | 可选 | 无 |
| 衣服 | `clothes` | 必选 | 风衣 (`clothes_coat`) |
| 眼镜 | `glasses` | 可选 | 墨镜 (`glasses_sun`) |

## 渲染层级

PlayerGenerator 按以下顺序分层绘制到同一个 32x32 Canvas：

```
0. 腿部 (drawLegs)        — 固定逻辑，颜色跟随衣服
1. 身体底层 (drawBodyBase) — 衬衫，颜色跟随衣服
2. 衣服 (clothes.drawUpper)— 可换部件
3. 头发后层 (hair.drawBack) — 可换部件
4. 脸部 (drawFace)         — 固定：脸型 + 胡子
5. 眼镜 (glasses.draw)     — 可换部件（可无）
6. 头发前层 (hair.drawFront)— 可换部件
7. 帽子 (hat.draw)         — 可换部件（可无）
```

## 获取方式

- 击杀敌人后有 3% 概率掉落随机服装物品
- 精英/BOSS 掉率更高（使用现有掉落倍率系统）

## 换装操作

1. 拾取服装物品到背包
2. 按 B 打开背包界面
3. 左侧显示 4 个装备槽（帽子/发型/眼镜/衣服）
4. 点击背包中的服装物品拿到手上，再点击对应装备槽装备
5. 点击已装备的槽位可卸下装备

## 架构

### 核心文件

| 文件 | 职责 |
|------|------|
| `src/assets/characters/player/PlayerGenerator.js` | 分层帧生成器 |
| `src/assets/characters/player/costumes/CostumeData.js` | 服装注册表 |
| `src/assets/characters/player/costumes/DefaultPieces.js` | 默认服装绘制函数 |
| `src/core/systems/CostumeSystem.js` | 换装逻辑 + 帧缓存 |

### 服装部件接口

每个服装部件是一个对象，包含：

```js
{
    id: 'hair_mohawk',       // 唯一 ID
    name: '莫西干',           // 显示名称
    slot: 'hairstyle',       // 所属槽位
    colors: { ... },         // 颜色配置

    // 游戏内绘制函数（32x32 画布）
    drawBack(drawer, cx, headY, wavePhase, colors) {},   // 仅发型
    drawFront(drawer, cx, headY, wavePhase, colors) {},  // 仅发型
    draw(drawer, cx, headY, colors) {},                  // 帽子/眼镜
    drawUpper(drawer, cx, bodyY, coatWave, colors) {},   // 仅衣服

    // 头像绘制函数（32x32 画布，正面近景）
    drawAvatarBack(drawer, hx, hy, headW, headH, colors) {},
    drawAvatarFront(drawer, hx, hy, headW, headH, colors) {},
    drawAvatar(drawer, ...) {},
}
```

### 添加新服装

1. 在 `src/assets/characters/player/costumes/<slot>/` 下创建新文件
2. 实现服装部件对象（参考同目录已有文件）
3. 在 `CostumeData.js` 中导入并注册
4. 在 `CostumeIcons.js` 中创建 16x16 图标
5. 在 `Assets.js` 中注册图标
6. 在 `InventorySystem.js` 中注册物品

## 已有服装列表

### 发型
- 长发 (`hair_long`) — 默认
- 莫西干 (`hair_mohawk`) — 红色尖刺
- 短发 (`hair_short`) — 棕色短发

### 帽子
- 贝雷帽 (`hat_beret`) — 暗红色
- 头巾 (`hat_bandana`) — 蓝色

### 衣服
- 风衣 (`clothes_coat`) — 默认，蓝灰色长风衣
- 帽衫 (`clothes_hoodie`) — 橙色帽衫
- 战术背心 (`clothes_vest`) — 军绿色

### 眼镜
- 墨镜 (`glasses_sun`) — 默认，黑色
- 圆眼镜 (`glasses_round`) — 棕色圆框
- 护目镜 (`glasses_goggles`) — 琥珀色镜片
