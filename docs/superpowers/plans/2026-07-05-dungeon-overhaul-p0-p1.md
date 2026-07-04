# 地牢 Roguelike 重构实施计划 — 总纲 + P0/P1（经济骨架）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 落地 `docs/feature/DUNGEON_ROGUELIKE_OVERHAUL.md` 的 P0（基线与设施）+ P1（经济骨架）：稀有度落库、金币/钥匙/宝箱、单局状态、掉落接线与 HUD，使地牢形成「杀怪捡钱开箱」的可玩循环。

**Architecture:** 新增 `src/core/dungeon/` 数据驱动子系统（EconomyConfig/LootTable/DungeonRunState），拾取物与宝箱为独立实体接入 WorldSystem 更新/渲染循环，掉落改造集中在 `DungeonManager._dropRoomRewards` 与 `WorldSystem` 死亡/破碎钩子。所有数值集中在数据文件，P6 统一调参。

**Tech Stack:** 原生 Canvas + Vite；新增 vitest（纯逻辑单测）；美术走 PixelDraw 程序化绘制。

## Global Constraints

- 文档一律中文；每个任务完成必须 `npm run build` 通过（CLAUDE.md）。
- 美术素材代码只放 `src/assets/`，严禁混入游戏逻辑。
- 新增系统需接入 ProfilerSystem（涉及每帧更新的：pickups 更新计入现有 `WorldObjects` 分段即可，不强制新增标签）。
- 主世界（hub/game/construction/test）玩法路径零行为变化：所有经济逻辑用 `worldSystem.currentMapType` 是否以 `'dungeon'` 开头做门控。
- 提交信息末尾带 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。
- 数值初值按本计划写入，允许执行者微调 ±30%，P6 统一平衡。

## 分期总纲（本文件只含 P0/P1 详细任务）

| 阶段 | 内容 | 计划文件 |
|---|---|---|
| P0 | 基线提交、vitest 设施、gate 渲染 bug 修复 | 本文件 Task 1-3 |
| P1 | 经济骨架：rarity 落库、LootTable、RunState、金币/钥匙/宝箱、掉落接线、HUD | 本文件 Task 4-10 |
| P2 | 遗物系统 | 待 P1 合入后另写 |
| P3 | 特殊房间（商店/宝箱房/精英房） | 待写 |
| P4 | 敌人（行为组件/6 新敌人/词缀/Boss 整合） | 待写 |
| P5 | 生成与视觉（房间模板池/墙体 sprite/火把/装饰/F3） | 待写 |
| P6 | 平衡与收尾 | 待写 |

---

### Task 1: P0-1 基线提交（城镇 WIP）

**Files:** 无新建；提交现有全部未提交改动。

- [ ] **Step 1: 检查状态** — `git status --short`，确认改动均为城镇生成/光照线（TownLayoutGenerator 等）与本次方案文档无关文件。
- [ ] **Step 2: 提交基线**

```bash
git add -A
git commit -m "wip(town): 城镇模板生成与光照阶段性工作基线提交（地牢重构前置）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 3: 验证工作区干净** — `git status --short` 输出为空。

### Task 2: P0-2 测试设施（vitest）

**Files:**
- Modify: `package.json`（devDependencies + scripts.test）
- Create: `tests/weapon-data.test.js`

- [ ] **Step 1: 安装** — `npm install -D vitest`
- [ ] **Step 2: 加脚本** — `package.json` scripts 增加 `"test": "vitest run"`。
- [ ] **Step 3: 冒烟测试**

```js
// tests/weapon-data.test.js
import { describe, it, expect } from 'vitest';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';

describe('WeaponData', () => {
  it('武器库可导入且非空', () => {
    expect(Object.keys(WEAPONS).length).toBeGreaterThan(30);
  });
});
```

注意：若 WeaponData 传递 import 了依赖 Canvas 的模块导致 node 环境报错，改为 `vitest` + `environment: 'node'` 并在测试中仅断言纯数据；如仍不可行，将 rarity 表拆到独立纯数据文件再测。
- [ ] **Step 4: 运行** — `npm test` 全绿；`npm run build` 通过。
- [ ] **Step 5: Commit** — `chore(test): 引入 vitest 测试设施`

### Task 3: P0-3 修复能量屏障 gate.isHorizontal 渲染 bug

**Files:**
- Modify: `src/core/Renderer.js:221-222`（`_drawEnergyBarrier` 调用处附近）

**问题:** Renderer 读取 `gate.isHorizontal`，但 `DungeonManager.initGates` 只写 `gate.orientation`（'horizontal'|'vertical'），导致横向屏障宽高取值错误。

- [ ] **Step 1: 修复** — 将读取处改为 `const isHorizontal = gate.orientation === 'horizontal';` 并沿用原宽高分支逻辑。
- [ ] **Step 2: 验证** — `npm run build` 通过；启动 `npm run dev` 进地牢目视检查横向门屏障为「横条」而非「竖条」（可用固定种子，见 Task 6 的 seed 支持，或多刷几局）。
- [ ] **Step 3: Commit** — `fix(dungeon): 能量屏障横向门渲染尺寸错误`

---

### Task 4: P1-1 武器稀有度落库

**Files:**
- Create: `src/core/dungeon/RarityConfig.js`
- Modify: `src/assets/weapons/WeaponData.js`（全部战斗武器加 `rarity` 字段）
- Create: `tests/rarity.test.js`

**Interfaces (Produces):**
- `RARITY_TIERS = ['common','uncommon','rare','epic','legendary']`
- `RARITY_COLORS = { common:'#b0b0b0', uncommon:'#4caf50', rare:'#2196f3', epic:'#9c27b0', legendary:'#ff9800' }`
- `WEAPONS[id].rarity: string`（`isUtility` 武器与 `hammer` 不加，掉落池本就排除）

**定档初值**（P6 可调；按 WeaponData 中武器名对应）：
- common：Pistol、SMG、Shotgun、Assault Rifle、Crossbow、Dagger
- uncommon：Sniper、Grenade Launcher、Flamethrower、Katana、Spear、Ricochet Gun、Boomerang、Needle Gun、疾风散弹
- rare：RPG-7、Laser Gun、Laser Shotgun、Freeze Ray、Acid Gun、Force Gun、Greatsword、Battle Axe、Plasma Rifle、毒雾喷射器
- epic：Lightning Gun、Laser Rifle、Homing Launcher、Cluster Gun、Vampyre Gun、Railgun、风暴左轮、幻影手枪
- legendary：Black Hole Gun、Teleport Gun、Turret Deployer（已有字段，统一格式）、陨石炮

- [ ] **Step 1: 写失败测试**

```js
// tests/rarity.test.js
import { describe, it, expect } from 'vitest';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';
import { RARITY_TIERS } from '../src/core/dungeon/RarityConfig.js';

describe('武器稀有度', () => {
  it('所有非工具战斗武器都有合法 rarity', () => {
    for (const [id, conf] of Object.entries(WEAPONS)) {
      if (conf.isUtility || conf.damage === 0) continue;
      expect(RARITY_TIERS, `${id} 缺少合法 rarity`).toContain(conf.rarity);
    }
  });
  it('每档至少 3 把武器（legendary 至少 3）', () => {
    const count = Object.fromEntries(RARITY_TIERS.map(t => [t, 0]));
    for (const conf of Object.values(WEAPONS)) {
      if (conf.rarity) count[conf.rarity]++;
    }
    for (const t of RARITY_TIERS) expect(count[t], t).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: 运行确认失败** — `npm test` → RarityConfig 不存在 / rarity 缺失。
- [ ] **Step 3: 实现** — 创建 `RarityConfig.js`（导出 RARITY_TIERS/RARITY_COLORS）；WeaponData 每把战斗武器按上表加 `rarity: 'xxx'`。
- [ ] **Step 4: 运行通过** — `npm test` 全绿，`npm run build` 通过。
- [ ] **Step 5: Commit** — `feat(dungeon): 武器稀有度五档落库`

### Task 5: P1-2 掉落表 LootTable

**Files:**
- Create: `src/core/dungeon/EconomyConfig.js`
- Create: `src/core/dungeon/LootTable.js`
- Test: `tests/loot-table.test.js`

**Interfaces (Produces):**

```js
// EconomyConfig.js（数值集中地，全部可被 P6 调整）
export const ENEMY_COIN_VALUES = { zombie: 2, zombie_female: 2, zombie_brute: 5, hunter: 4, soldier: 5, default: 2, boss: 50 };
export const BREAKABLE_COIN = { chance: 0.3, min: 1, max: 3 };   // 仅地牢
export const ROOM_CLEAR = { keyChance: 0.15, weaponChance: 0.15, coinMin: 3, coinMax: 8 };
export const CHEST_TIERS = {
  wood:    { needsKey: false, coins: [3, 8],   rarityWeights: { common: 55, uncommon: 30, rare: 12, epic: 3,  legendary: 0 } },
  iron:    { needsKey: true,  coins: [6, 14],  rarityWeights: { common: 15, uncommon: 45, rare: 30, epic: 9,  legendary: 1 } },
  mithril: { needsKey: true,  coins: [10, 20], rarityWeights: { common: 0,  uncommon: 20, rare: 45, epic: 28, legendary: 7 } },
  dragon:  { needsKey: true,  coins: [15, 30], rarityWeights: { common: 0,  uncommon: 0,  rare: 30, epic: 45, legendary: 25 } },
};

// LootTable.js
export function pickRarity(weights, rng = Math.random): string
export function weaponsOfRarity(rarity): string[]          // 返回 weaponConfigId 数组（排除 isUtility/damage===0/黑名单）
export function pickWeaponByRarity(rarity, rng = Math.random): string|null  // 档内均匀；空档向下降档
export function rollChest(tierName, rng = Math.random): { weaponConfigId: string, coins: number }
```

- [ ] **Step 1: 写失败测试**

```js
// tests/loot-table.test.js
import { describe, it, expect } from 'vitest';
import { pickRarity, pickWeaponByRarity, weaponsOfRarity, rollChest } from '../src/core/dungeon/LootTable.js';
import { CHEST_TIERS } from '../src/core/dungeon/EconomyConfig.js';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';

describe('LootTable', () => {
  it('pickRarity 按权重分布（种子化验证边界）', () => {
    const w = { common: 50, uncommon: 50, rare: 0, epic: 0, legendary: 0 };
    expect(pickRarity(w, () => 0.0)).toBe('common');
    expect(pickRarity(w, () => 0.99)).toBe('uncommon');
  });
  it('weaponsOfRarity 排除工具武器', () => {
    for (const tier of ['common','uncommon','rare','epic','legendary']) {
      for (const id of weaponsOfRarity(tier)) {
        expect(WEAPONS[id].isUtility).toBeFalsy();
        expect(WEAPONS[id].rarity).toBe(tier);
      }
    }
  });
  it('rollChest 返回合法武器与金币区间', () => {
    for (const tier of Object.keys(CHEST_TIERS)) {
      const r = rollChest(tier, () => 0.5);
      expect(WEAPONS[r.weaponConfigId]).toBeDefined();
      expect(r.coins).toBeGreaterThanOrEqual(CHEST_TIERS[tier].coins[0]);
      expect(r.coins).toBeLessThanOrEqual(CHEST_TIERS[tier].coins[1]);
    }
  });
});
```

- [ ] **Step 2: 运行确认失败** → 模块不存在。
- [ ] **Step 3: 实现两个模块**（pickRarity 累计权重扫描；pickWeaponByRarity 空档时按 tiers 数组向低档回退；rollChest 组合两者 + 金币随机区间）。
- [ ] **Step 4: `npm test` 全绿 + `npm run build` 通过。**
- [ ] **Step 5: Commit** — `feat(dungeon): 稀有度加权掉落表与经济数值配置`

### Task 6: P1-3 单局状态 DungeonRunState

**Files:**
- Create: `src/core/dungeon/DungeonRunState.js`
- Modify: `src/core/Game.js`（构造注入）、`src/core/systems/WorldSystem.js`（loadMap 进出地牢钩子）
- Test: `tests/run-state.test.js`

**Interfaces (Produces):**

```js
export class DungeonRunState {
  active; coins; keys; relicIds; floor; seed;
  start(seed)            // 进入地牢时调用：清零并 active=true，记录种子（console.log('[Dungeon] seed:', seed)）
  end()                  // 回 hub / 通关时调用：全部清零 active=false
  addCoins(n); spendCoins(n) -> boolean;   // 不足返回 false 不扣
  addKeys(n); useKey() -> boolean;
  addRelic(id); hasRelic(id) -> boolean;   // P2 使用，本期先占位
}
```

**接线（Consumes: WorldSystem.currentMapType / loadMap）：**
- `Game` 构造：`this.dungeonRunState = new DungeonRunState()`，传给 WorldSystem 与 UIManager。
- `WorldSystem.loadMap(mapType)`：切图前记录 `prev = this.currentMapType`；切图后：`prev` 非 dungeon 且新图为 `'dungeon'` → `runState.start(Date.now())`；`prev` 为 dungeon 系且新图非 dungeon 系 → `runState.end()`。`'dungeon' → 'dungeon_f2'` 之间仅 `runState.floor = 2`。地牢生成器改为使用 `runState.seed + floor` 作为 mulberry32 种子（替换 `Date.now()`），实现单局内可复现。
- 玩家死亡是整页 reload（`UIManager` restart 按钮），无需额外清算路径。

- [ ] **Step 1: 写失败测试**（start/end 清零、spendCoins 不足返回 false、useKey 无钥匙返回 false、floor 流转——纯逻辑直接测类）
- [ ] **Step 2: 确认失败 → Step 3: 实现类 + Game/WorldSystem 接线 + 生成器种子替换**
- [ ] **Step 4: `npm test` + `npm run build` 通过；dev 进地牢看 console 有 seed 日志、EXIT 回 hub 再进为新种子。**
- [ ] **Step 5: Commit** — `feat(dungeon): 单局运行状态与种子可复现`

### Task 7: P1-4 金币/钥匙拾取物（实体+美术）

**Files:**
- Create: `src/assets/dungeon/PickupSprites.js`（纯美术：`createCoinSprite()` 10×10 金币带高光/边缘暗线 2 帧微闪、`createKeySprite()` 14×8 古铜钥匙）
- Modify: `src/graphics/Assets.js`（注册 `Assets.dungeonCoin`（帧数组）、`Assets.dungeonKey`）
- Create: `src/core/entities/DungeonPickup.js`
- Modify: `src/core/systems/WorldSystem.js`（`this.pickups = []`、更新与清理、`spawnCoinBurst()`/`spawnKeyDrop()`）
- Modify: `src/core/Renderer.js`（在 droppedItems 绘制附近绘制 pickups，带地面阴影）

**Interfaces (Produces):**

```js
// DungeonPickup.js
export class DungeonPickup {
  constructor(x, y, kind, value = 1)  // kind: 'coin' | 'key'
  update(player, runState)  // 重力+初速散开(约0.4s) → 静止悬浮；玩家距离<64px 磁吸加速飞向玩家；<14px 收集：coin→runState.addCoins(value)，key→runState.addKeys(1)；collected=true
  draw(ctx, camera)
}
// WorldSystem
spawnCoinBurst(x, y, totalValue)  // 拆成 max 8 枚（价值均分余数并入），初速随机方向 1.5~3px/f
spawnKeyDrop(x, y)
```

**约束:** pickups 不参与碰撞解析（无墙检测，视觉飞行即可）；每帧更新计入现有 Profiler `WorldObjects` 分段；`loadMap` 时清空数组；上限 200 枚（超出时最旧的直接入账并移除，防高并发）。

- [ ] **Step 1: 美术**（PixelDraw 绘制，参照 `docs/PIXEL_ART_GUIDE.md`；金币：外圈 #8a6d1a、主体 #f1c40f、左上高光 #fff3b0、中心压花 "¢" 形暗纹 #c9a227）→ Assets 注册。
- [ ] **Step 2: 实体与 WorldSystem/Renderer 接线**（按上述接口实现）。
- [ ] **Step 3: 验证** — `npm run build`；dev 模式用 TestPanel 生成敌人于地牢外确认**不**掉金币（门控生效），地牢内击杀掉金币且自动吸取，HUD 数字增长（HUD 在 Task 9，此步可先看 console/runState）。
- [ ] **Step 4: Commit** — `feat(dungeon): 金币与钥匙拾取物实体`

### Task 8: P1-5 掉落接线（敌人死亡/可破坏物/清房/Boss）

**Files:**
- Modify: `src/core/systems/WorldSystem.js`
  - `updateEnemies()` 死亡分支（约 :1820-1841）：`currentMapType.startsWith('dungeon')` 时按 `ENEMY_COIN_VALUES[enemy.type] ?? default` 调 `spawnCoinBurst`；Boss（`isBoss`）用 `boss` 值且**移除 `_dropBossLoot` 的 2-3 把随机武器**（改由 Task 9 宝箱承接）。
  - `BreakableObject.takeDamage`（`src/core/entities/BreakableObject.js:117` `isBroken=true` 处）：通过 WorldSystem 每帧扫描已有的破碎清理路径挂钩，地牢内按 `BREAKABLE_COIN` 掉金币（在 isBroken 置位当帧触发一次，可在对象上加 `_lootDropped` 防重）。
- Modify: `src/core/systems/DungeonManager.js` `_dropRoomRewards()`：重写为——金币 `ROOM_CLEAR.coinMin~Max` 必掉（spawnCoinBurst）+ `keyChance` 掉钥匙 + `weaponChance` 走 `pickRarity(均衡权重{common:40,uncommon:30,rare:20,epic:8,legendary:2}) → pickWeaponByRarity` 替换原全池均匀随机；消耗品 50% 保留原样。

**Interfaces (Consumes):** Task 5 的 LootTable/EconomyConfig、Task 7 的 spawnCoinBurst/spawnKeyDrop。

- [ ] **Step 1: 实现三处接线**（enemy.type 字段以现有实体为准：Zombie/ZombieFemale/ZombieBrute/Hunter/Soldier 的类型标识先 grep 确认，如无统一字段则按构造名映射，映射表放 EconomyConfig）。
- [ ] **Step 2: 验证** — `npm run build`；dev 地牢清一间房：必见金币、偶见钥匙/武器；砸桶出金币；主世界击杀无金币。
- [ ] **Step 3: Commit** — `feat(dungeon): 击杀/破坏/清房金币钥匙掉落接线`

### Task 9: P1-6 宝箱实体 + HUD 计数

**Files:**
- Create: `src/assets/dungeon/ChestSprites.js`（`createChestSprite(tier, isOpen)`，4 档 × 开/关 = 8 张 26×22；遵循家具 5 层标准：轮廓+主体+金属包边（档位色）+右侧阴影+左上高光；档位色 wood #8b5a2b / iron #4a7fb5 / mithril #3fa66a / dragon #c0392b）
- Modify: `src/graphics/Assets.js`（注册 `Assets.dungeonChests = { wood: {closed, open}, ... }`）
- Create: `src/core/entities/Chest.js`
- Modify: `src/core/systems/WorldSystem.js`（`this.chests = []`、loadMap 清空、update 提示检测）
- Modify: `src/core/systems/PlayerSystem.js`（E 键交互分支：靠近 50px 优先级在门/电脑之后）
- Modify: `src/core/Renderer.js`（chests 进 Y-sort 实体绘制流 + 未开箱且需钥匙时头顶画钥匙小图标；交互提示 `[E] OPEN CHEST` / 缺钥匙时 `NEED KEY` 红字，风格同现有门提示 bold 7px monospace）
- Modify: `src/core/systems/DungeonManager.js`（Boss 清除 `_onBossCleared` 中：F1 掉 mithril 箱、F2 掉 dragon 箱，位置在传送门旁 2 tile）
- Modify: `src/ui/UIManager.js` + `src/ui/HUD.css`（HUD 金币/钥匙计数，仅 `currentMapType.startsWith('dungeon')` 时显示；金币图标用 Assets.dungeonCoin 帧 0 转 dataURL）

**Interfaces (Produces):**

```js
// Chest.js
export class Chest {
  constructor(x, y, tier)   // tier: 'wood'|'iron'|'mithril'|'dragon'
  get needsKey()            // 读 CHEST_TIERS[tier].needsKey
  tryOpen(runState, worldSystem) -> 'opened'|'need_key'
  // opened: rollChest(tier) → DroppedItem(武器, 带 createWeaponInstanceData) + spawnCoinBurst；sprite 换 open；isOpen=true
  getHurtbox()              // 不可被子弹破坏：返回 null（占位防未来接口调用）
}
```

**碰撞:** 宝箱作为静态阻挡加入 `ObstacleSpatialIndex` 成本高，简化：不阻挡移动（玩家可穿过），仅视觉+交互。

- [ ] **Step 1: 美术 8 张 + Assets 注册**；`npm run build`。
- [ ] **Step 2: Chest 实体 + 交互 + 掉落**（Consumes Task 5 rollChest、Task 6 runState.useKey、Task 7 spawnCoinBurst）。
- [ ] **Step 3: Boss 箱接线 + 临时投放验证**：在 `DungeonManager` 清房逻辑中普通房 8% 概率于房间中心生成 wood 箱（正式宝箱房归 P3，此为过渡曝光）。
- [ ] **Step 4: HUD 计数**（进地牢显示、回 hub 隐藏）。
- [ ] **Step 5: 验证** — `npm test`+`npm run build`；dev：开木箱直接出武器+金币，铁箱缺钥匙提示 NEED KEY，有钥匙扣 1 开箱，HUD 同步；Boss 房清后出高档箱且不再直掉 2-3 把武器。
- [ ] **Step 6: Commit** — `feat(dungeon): 四档宝箱实体与金币钥匙 HUD`

### Task 10: P1-7 收尾（回归+文档+提交）

- [ ] **Step 1: 全量验证** — `npm test` 全绿；`npm run build` 通过；dev 走一遍完整流程：hub→地牢→清 3 房→开箱→EXIT 回 hub（HUD 隐藏、runState 清零）→再进（新种子）。主世界 game 地图打一场确认无金币/无行为变化。
- [ ] **Step 2: 文档** — 更新 `docs/TECH_OVERVIEW.md`（地牢模式段落：新增 `src/core/dungeon/` 各模块、宝箱/拾取物实体、HUD）；`docs/feature/DUNGEON_ROGUELIKE_OVERHAUL.md` 分期表 P0/P1 标记完成。
- [ ] **Step 3: Commit** — `feat(dungeon): P1 经济骨架完成（稀有度/金币/钥匙/宝箱/掉落循环）`

---

## Self-Review 记录

- 覆盖检查：方案 §4.3 的商店房属 P3 不在本计划；「普通房小概率木箱」以 Task 9 Step 3 过渡实现；带出规则中「武器保留」无需代码（现状即如此），「金币/钥匙/遗物清零」由 Task 6 end() 覆盖。
- 类型一致性：`runState.addKeys(n)`/`useKey()` 在 Task 6 定义、Task 7/9 消费一致；`spawnCoinBurst(x,y,totalValue)` 在 Task 7 定义、Task 8/9 消费一致；`rollChest(tier)` 在 Task 5 定义、Task 9 消费一致。
- 已知留白（刻意）：enemy.type 统一字段需执行时 grep 确认（Task 8 Step 1 已注明处理路径）；vitest 若遇 Canvas 依赖问题的降级路径已在 Task 2 注明。
