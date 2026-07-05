# 人潮基调批次 —— 无敌帧地基 / Boss 重做 / 人潮新敌人 / 掩体模板

> 状态：已完成并验收（2026-07-06）——地基+三 agent 全部落地：Boss 弹幕化三阶段/人潮新敌人×3/70 模板掩体提标与波次人潮化。393 例全绿，待用户实测拍板体验。
> 背景：用户第二轮实测反馈（2026-07-06），核心结论是**基调转向**：
> 放弃挺进地牢式"少量敌人+高设计感"（设计功力撑不起），转向**多单位人潮 + 混杂弹幕单位 + 地形博弈**
> （用户："挑战关卡玩起来特别有意思……既要躲敌人，又要躲弹幕，又要考虑地形"）。

## 用户反馈清单 → 处置

| 反馈 | 处置 | 归属 |
|---|---|---|
| 掉坑直接死，应扣血+旁边复活 | 根因=玩家无受击无敌帧导致连帧扣血；已加 40 帧无敌+坑免疫窗口+远端安全点拉回+清零击退 | 主会话 ✅ |
| 持枪敌人强到离谱，删掉或降小 Boss | 同根因（速射×无无敌帧）；无敌帧修复后仍执行：hunter/soldier 撤出全部常规池与 roleMap，仅存精英房/Boss 护卫限量位（≤1-2 只） | 主会话 ✅ |
| F1 太简单、怪 1-2 枪死没意义 | 人潮化：不加单体 HP（人潮语境下脆怪合理），数量 +60~80%（F1 浅 8-10 / F3 深 14-18），炮灰/弹幕权重上调 | 主会话 ✅ |
| F1 Boss 毫无反抗能力 | MutantBeast 三阶段弹幕化重做 | boss-rework |
| 做新敌人代替枪兵 | 3 个人潮基调新敌人（群居炮灰/支援唤潮/间接弹幕） | horde-enemies |
| 房间缺掩体，有掩体才能加弹幕怪 | 全模板掩体审计+提标（弹幕房 c≥4），波次加密，F1 重点翻新 | cover-templates |
| F2 观感比 F1 好很多 | F1 由 Boss 重做+模板翻新+人潮化三路合力拉平 | 三 agent |

## 已完成（主会话，commit 见 git log）

1. **受击无敌帧**：player.invulnTimer=40（takeDamage 置位、PlayerSystem 递减、Renderer 闪烁提示、坑伤同受保护）。方法论 §3.2 已补记：这是 hit budget 成立的前提。
2. **坑机制加固**：30 帧坑免疫窗口防连触；拉回点用 15 帧前的远端安全采样（不贴坑沿）；拉回时清零击退防二次坠坑。
3. **枪兵出池**：hunter/soldier 从三层 depthTiers/roleMap 全部移除；精英房编成限 ≤1 只/条目；Boss 护卫减量。floor-configs 测试同步为新口径。
4. **人潮化数值**：9 个档位数量全面上调（F1 8-10/10-13/12-15、F2 10-12/12-15/13-16、F3 11-13/13-16/14-18）；plague_rat/wraith/zombie_female/cultist/spinner/weeper 等炮灰与弹幕权重上调补位。

## Agent 分工

### boss-rework（F1 Boss 弹幕化三阶段）
MutantBeast（HP 900 / dpsCap 26 不动，难度来自弹幕与节奏）：
- P1（>60%）：保留近战招 + 新增「怒吼环形弹幕」（10-12 发放射，伤 8）。
- P2（60-25%）：新增「横扫弹幕波」（扇形三连发）+ 冲锋撞墙震落「落石预警圈」（延迟落点 AoE）。
- P3（<25%）：狂暴——持续唤起小怪潮（贴人潮基调，替代一次性 summon）+ 跳劈落地环形弹幕 + 移速提升。
弹幕复用敌方弹幕管线（Warlock/Spinner 的 ring/fan 参数式弹幕）；预警必须清晰（伤害↑=前摇↑）。

**✅ 已完成（boss-rework）**——`src/core/entities/MutantBeast.js` 独占重写，纯逻辑上 vitest（`tests/mutant-beast.test.js` 10 例：怒吼冷却/环形角度/横扫三连/落石延迟/唤潮上限/相位红线）。招式表：

| 相位 | 招式 | 前摇 | 伤害 | 冷却 |
|---|---|---|---|---|
| P1+ | 怒吼环形弹幕 | 0.6s（后仰+蓄力环+`boss_roar`） | 10-12 发×8 | ~4s |
| P1+ | 近战 砸/横扫/震地 | 0.5-0.6s | 15-25 | 0.7s |
| P2+ | 横扫弹幕波（扇形三连） | 0.4s | 3 波×5 发×8（55°/间隔0.25s） | ~4.3s |
| P2+ | 冲锋 | 0.5s | 30 撞击 + 撞墙震落 3× 落石 | 0.8s |
| P2+（撞墙） | 落石预警圈 | 0.8s 红圈+`boss_rockfall_warn` | AoE 半径40/伤12 | — |
| P2+ | 跳劈（P3 落地追加 16 发环形弹） | 起跳20帧 | 20 AoE + 16×8 | 1s |
| P3 | 唤潮（边缘 wraith/plague_rat，上限6） | — | 每5s 2 只 | 5s |
| P3 | 全身泛红 + 移速 0.6→0.75 | — | — | — |

实现要点：弹幕经 `computeRingAngles`/`computeFanAngles` 算角 → `CombatSystem.spawnEnemyBullet`（单发≤12 红线、速2.8）；落石延迟 AoE 走自持 `rockfalls[]` + 每帧 `updateRockfalls()` 到点 `spawnGroundSlam`；转阶段 0.5s 停顿 + 吼叫（P2 `boss_roar`/P3 `boss_enrage`）+ 屏幕震动。数值红线 HP 900 / dpsCap 26 未动。实机三相位截图已过（P1 环形/P2 落石圈/P3 唤潮红化）。

### horde-enemies（3 个人潮新敌人，替代枪兵生态位）
1. **尸群蹒跚者 shambler**：HP 10 炮灰档、慢速、高权重成群——人潮填充物，割草爽感来源。
2. **骨笛吹手 bone_piper**：HP 30，不直接攻击；给周围敌人加速光环 + 每 6s 从地面唤起 2 只 shambler（房内上限 6）——制造"先杀奶妈"的目标优先级决策。
3. **雨幕射手 rain_archer**：HP 26，朝天抛射，2s 后玩家所在区域落下箭雨（3 个预警圈 AoE）——间接弹幕+地形压力。
全套美术管线（Generator+Idle16/Run12/Attack8）；入三层池（shambler 权重 3+、piper 1、rain_archer 1.5）。

**✅ 已完成（horde-enemies）**——三实体独占 `src/core/entities/{Shambler,BonePiper,RainArcher}.js` + 三美术目录 `src/assets/characters/enemies/{shambler,bone_piper,rain_archer}/`。共享文件小幅 append（均 `[horde:enemies]` 锚点）：`WorldSystem._createEnemyByType`（三行）+ 延迟 AoE 结构（`groundHazards[]`/`spawnDelayedAoe`/`updateGroundHazards`，箭雨落点独立结算）、`Assets`（三帧集）、`FloorConfigs`（9 档位权重）、`EconomyConfig`（金币 1/5/4）、`DungeonManager.scaleUncountedSpawn`（唤起物不计房间配额）、`Enemy.getEffectiveSpeed`（骨笛光环乘算 + `speedAuraTimer` 递减）、`Renderer`（`groundHazards` 预警圈绘制）。关键实现：加速光环=固定倍率覆写（多 piper 不叠乘，精英上限安全）、唤潮上限=`SummonBehavior` per-piper cap 6、箭雨=`preDelay(2s滞空)+warn(0.8s红圈)+stagger(0.3s)` 单倒计时模型。vitest `tests/horde-enemies.test.js` 16 例全绿（入池权重/光环范围+不叠乘/唤潮上限6+补满/延迟落点+精英倍率/滞空不伤+翻滚免疫）；`npm test`（除 cover-templates 并行未完成的 encounter 断言外全绿）、`npm run build`、`balance_report` 敌人告警 0。实机三幕截图已过（shambler 成群/piper 金环+唤潮/箭雨红色预警圈）。

### cover-templates（掩体与波次人潮化）
- 审计全部遭遇战模板（BASE 27 + F1 9+4 + F2 10+4 + F3 10+4）：凡含 r 位的模板掩体 c ≥4 且分散布置。
- 波次加密：波1/波2 各 +2~3 个近战字符（贴人潮基调）。
- F1 重点翻新（用户点名最无聊）：逐模板过一遍 + 新增 2 个弹幕主题模板（弹幕妖+密集掩体阵）。
- tests/encounter-templates.test.js 掩体断言提标同步。

**✅ 已完成（cover-templates）**——独占 `EncounterTemplates.js` + `encounters/f{1,2,3}_*.js` + `tests/encounter-templates.test.js`（并未动 Assets/ObjectRegistry，legend 复用既有 spike_trap/decoy_statue 等）。
- **掩体审计提标**：全池 70 个模板中 63 个含 r/h 远程位，其中 **35 个掩体不达标**（BASE 7 + F1 11 + F2 10 + F3 7）从 c=2/3 补到 **c≥4 且分散**——原掩体多为"同一行两个"或"中央挤一处"，统一按行/列错落到房间左右两侧。BASE 27 老模板重灾区已全过。
- **波次人潮化**：全 70 个模板波1/波2 各加密 2~3 近战——波1 中位 3-4→**5-6**、波2 4→**6-7**（`enemyConfig.count = spawns.length` 直接决定房间敌人数）；含大量 p 坑的 killbox/chasm_bridge/ritual_hall/reactor_core/collapse_rift/blood_altar/abyss_maw/offering_ring 酌情少加。波次顺序刷新（波1 全灭才刷波2），同屏峰值≈单波量 ≈8-10，不触 15+ 帧率红线。
- **F1 翻新**：13 个模板逐个补掩体+加密+故事注释润色；新增 **f1_arrow_execution（乱箭刑场·雉堞墙）** 与 **f1_hellfire_gallery（狱火炮廊·柱廊）**——r/R 弹幕位为主角 + 密集分散掩体阵 + spike_trap/decoy_statue 机关，异形 `#` 雕刻。F1 模板数 13→15。
- **测试提标**：encounter-templates.test.js 掩体断言 `≥2` → `≥4 + 不全同行/同列`；波1 上限 `≤5`→`≤8`、单房出怪 `≤12`→`≤18`；f1-prison-encounters.test.js 波1 上限同步 `≤8`。`npm test` 393 例全绿、`npm run build` 通过。
- **实机截图**：临时 `__forceEncId` 强制放置取景（已撤除）后截 6 房——2 新弹幕房 + f1_cell_block_breakout/f1_torture_room/chapel/f1_d_block_solitary，掩体在房间两侧成排渲染、异形柱廊/雉堞成形。
- **已知限制**：F1 战斗房 BFS 深度多为 shallow，mid/deep 模板（含 2 个新弹幕房）需较深/较大房才自然出现——实机自然分布依赖楼层深度与房尺寸生成（非本批范畴）。

## 验收标准（用户实测拍板）

- F1 一路杀过去"手一直有事做"（人潮）且有 2 次以上濒死；
- 枪兵只在精英房少量出现，不再是主要死因；
- 坑=损血惩罚而非死刑；
- F1 Boss 战需要认真躲弹幕 60-90s；
- 帧率在 15+ 敌人房间不掉（主会话验收时截图+profiler 抽查）。
