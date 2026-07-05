// EncounterTemplates —— 手作遭遇战房间模板库（R3 + W4 环境叙事扩容）。
// 每个模板是一张字符画：地形墙、掩体、出怪点（角色）、装饰在同一张图里一体设计，
// 房间因此成为一道「战斗题」；叙事模板通过 legend 指定具体家具/道具，
// 让房间「看得出曾经是干什么的」（囚区/食堂/档案室/刑讯室/祭仪厅…）。
//
// 图例：
//   # 内墙   p 坑（敌人可被击退坠杀/玩家翻滚可跨越）   c 掩体   d 装饰（主题池随机）   . 空地
//   m/r/h/e 第一波出怪（近战/远程/重装/精英保底词缀）
//   M/R/H/E 第二波出怪（首波全灭后短暂预警再刷新）
//   其余字符由模板 legend 映射为具体物件（家具/牢栏/刑架等，可破坏）
//
// 角色 → 具体敌人由 FloorConfigs.roleMap 按楼层映射（新敌人入池零模板改动）。
// 设计约束（tests/encounter-templates.test.js 强制）：
//   - 墙不得封死任何区域（BFS 连通）
//   - 含远程/弹幕（r/h）的模板掩体 ≥4 且分散（不全挤一行、不全挤一列——房间两侧都有依托）
//   - 波次人潮化：波1 开局 3-8、波2 数量不少于波1、单房出怪 ≤18（波次顺序刷新，同屏峰值≈单波量）
//   - 模板放进房间后四周保留 ≥2 tile 通带（放置逻辑保证）

import { F1_PRISON_TEMPLATES } from './encounters/f1_prison.js';
import { F2_TEMPLE_TEMPLATES } from './encounters/f2_temple.js';
import { F3_DEPTHS_TEMPLATES } from './encounters/f3_depths.js';
// [room-v2:p1] 字符模板经适配器进入 RoomPlan IR；selectEncounter/placeEncounter 只认 RoomPlan。
import { encounterToRoomPlan, roomPlanToParsed } from './rooms/EncounterAdapter.js';
import { maskToWallCoords, objectsOfKind, OBJECT_COVER, OBJECT_DECOR, OBJECT_PROP } from './rooms/RoomPlan.js';
// [room-v2:p2] 代码构建器示范房与字符模板同池：defineRoom 产物（__code）经统一接口进入选池。
import { V2_SHOWCASE_ROOMS } from './encounters/v2_showcase.js';
import { FLOOR_TYPES } from '../../../utils/FloorTypes.js';

// 适配器出口再导出，供模板测试从单一入口取用。
export { encounterToRoomPlan };

// opts 可选：{ floors: [1], floorType: 'WOOD' } —— 楼层亲和（缺省=全楼层）与每房间地板材质
const T = (id, tier, weight, rows, legend, opts = {}) => ({ id, tier, weight, rows, legend, ...opts });

// 楼层主题模板（encounters/ 下按层拆分，故事化房间；本文件为通用池）
// 2026-07-06 人潮基调：全模板波次加密（波1/波2 各 +2~3 近战），含 r 模板掩体提标至 ≥4 分散。
const BASE_TEMPLATES = [
    // ═══════════ 浅层：热身节奏（波1 5-6 → 波2 6-8） ═══════════
    // 空旷斗殴场：无家具的空房，被围攻的开阔地
    T('open_brawl', 'shallow', 0.6, [
        'm...........m',
        '....m...m....',
        '...c.....c...',
        '....pp.pp....',
        '...r..d..r...',
        'M....c.c....M',
        '......M......',
        '...M.....M...',
        '.....H.......'
    ]),
    // 食堂：成排长桌与散落的椅子，用餐时刻的惨案
    T('mess_hall', 'shallow', 1.6, [
        '..............',
        '.ttt.q..q.ttt.',
        '.q..m..m..q...',
        '...m......m...',
        '..c........c..',
        '..r........r..',
        '..c........c..',
        '...M..HH..M...',
        '.ttt.q..q.ttt.',
        '....M...M.....'
    ], { t: 'table', q: 'chair' }),
    // 浴场：一圈浴缸的澡堂，水汽未散
    T('flooded_bath', 'shallow', 1.4, [
        '.u..u....u..u.',
        '...m..r..m....',
        '...c......c...',
        '.m..........m.',
        '......cc......',
        '..M...MM...M..',
        '...c......c...',
        '.....R..R.....',
        '.u..u....u..u.'
    ], { u: 'bathtub' }),
    // 仓库：靠墙的补给箱垛与中央工作台
    T('storage_vault', 'shallow', 1.5, [
        '.cc........cc.',
        '.cc........cc.',
        '....m....m....',
        '..m........m..',
        '.....v..v.....',
        '....M....M....',
        '.r..........r.',
        '.cc..M..M..cc.',
        '.cc...HH...cc.'
    ], { v: 'workbench' }),
    // 哨卡：栅栏工事后的岗哨
    T('guard_checkpoint', 'shallow', 1.3, [
        '..g...gg...g..',
        '....m..m......',
        '...c......c...',
        '.m....rr....m.',
        '..pp......pp..',
        '......cc......',
        '..M........M..',
        '....R.MM.R....',
        '..g...gg...g..'
    ], { g: 'dungeon_bars' }),
    // 锅炉房：爆炸桶密布的动力舱，近战冲阵引爆连锁、远程随后压制
    T('boiler_room', 'shallow', 1.5, [
        '.cc........cc.',
        '.cc........cc.',
        '....m..m......',
        '...m......m...',
        '.c..........c.',
        '....m..m......',
        '.c..........c.',
        '...R..MM..R...',
        '.....RRR......',
        '.cc........cc.'
    ]),
    // 酒窖：两排酒架夹一条走位通道，桶后残兵负隅顽抗
    T('wine_cellar', 'shallow', 1.4, [
        '..............',
        '.wwww....wwww.',
        '....m..m......',
        '...m......m...',
        '..c........c..',
        '.....m..m.....',
        '..c........c..',
        '.wwww....wwww.',
        '...R..HH..R...',
        '....M...M.....'
    ], { w: 'wine_rack' }),
    // 淋浴间：成列浴缸旁的开阔中场，幽魂贴着水汽快攻（纯近战人潮）
    T('shower_hall', 'shallow', 1.4, [
        '.u.u.u..u.u.u.',
        '...m..m..m....',
        '.c..........c.',
        '....m....m....',
        '.....m..m.....',
        '..M.M.M.M.M...',
        '...M...M...M..',
        '..............',
        '.u.u.u..u.u.u.'
    ], { u: 'bathtub' }),

    // ═══════════ 中层：组合威胁（波1 5-7 → 波2 6-8 含重装/精英） ═══════════
    // 十字火力网：对称工事的交叉火力
    T('crossfire_net', 'mid', 0.7, [
        '..c.......c..',
        '...m..r..m...',
        '..#.......#..',
        '.....m.m.....',
        '.r....#....r.',
        '.....M.M.....',
        '..#.M...M.#..',
        '..M..HH...M..',
        '..c.......c..'
    ]),
    // 地堡：中央钢筋工事里的火力点
    T('bunker', 'mid', 0.8, [
        '..m..c..m..',
        '..#######..',
        '..#..r..#..',
        'c.....h...c',
        '..#..r..#..',
        '..#######..',
        '.m...c...m.',
        '..M.MM..M..',
        '....EHH....'
    ]),
    // 档案室：靠墙书架阵与中央研究坛，禁术研究者的领域
    T('archive', 'mid', 1.6, [
        '.kkkk....kkkk.',
        '....m..m......',
        '..c........c..',
        '.....a..a.....',
        '..m...e....m..',
        '.....a..a.....',
        '..c........c..',
        '...R..MM..R...',
        '......MM......',
        '.kkkk....kkkk.'
    ], { k: 'bookshelf', a: 'dungeon_altar' }),
    // 卫兵室：桌椅岗位与武器架，换岗的守军
    T('guard_post', 'mid', 1.5, [
        '.ttq.....v.v..',
        '.q............',
        '....m..m......',
        '.r..c....c..r.',
        '......##......',
        '..m...##...m..',
        '...M......M...',
        '..R..c..c..R..',
        '.....HEH......',
        '.ttq......qtt.'
    ], { t: 'table', q: 'chair', v: 'workbench' }),
    // 典狱长办公室：办公桌、大钟与书柜，精英亲卫镇守
    T('warden_office', 'mid', 1.4, [
        '.j.kkkk....w..',
        '....m..m......',
        '....o.q.......',
        '..............',
        '..c...e....c..',
        '......##......',
        '.r..........r.',
        '...c......c...',
        '....M.HH.M....',
        '.kk..MM....kk.'
    ], { j: 'grandfather_clock', k: 'bookshelf', w: 'wardrobe', o: 'computer_desk', q: 'chair' }),
    // 兵营：床铺成列的宿舍，驻军闻声而起
    T('barracks', 'mid', 1.5, [
        '.n..n..n..n..w.',
        '...............',
        '..r.........r..',
        '...c.......c...',
        '...m...t...m...',
        '...c.......c...',
        '......m.m......',
        '..R...HH....R..',
        '.....M..M......',
        '.n..n..n..n..w.'
    ], { n: 'bed', w: 'wardrobe', t: 'table' }),
    // 小礼拜堂：成排长椅朝向祭坛，祷告者未曾离开
    T('chapel', 'mid', 1.4, [
        '......aa......',
        '....a.EE.a....',
        '..c...r...c...',
        '.qq.q....q.qq.',
        '...m..m...m...',
        '.qq.q....q.qq.',
        '..c........c..',
        '.qq.q.MM.q.qq.',
        '...R..MM..R...',
        '..............'
    ], { q: 'chair', a: 'dungeon_altar' }),

    // 监控室：整排电脑与电视墙仍在运转，鱼缸幽幽发光
    T('surveillance', 'mid', 1.4, [
        '.ooo....ooo...',
        '....m..m......',
        '.t..........t.',
        '...c......c...',
        '..r...##...r..',
        '......##......',
        '...m..MM..m...',
        '..c........c..',
        '.f..R..R...f..',
        '.....HH..E....'
    ], { o: 'computer_desk', t: 'tv_stand', f: 'fish_tank' }),
    // 军犬舍：成排栅栏隔间，猎犬破笼扑出，驯犬狱卒随后清场
    T('kennel', 'mid', 1.5, [
        '..ggg.ggg.ggg..',
        '...m...m...m...',
        '..c.........c..',
        '..m.........m..',
        '.......m.......',
        '....c.....c....',
        '...............',
        '..R...HH...R...',
        '...M.M...M.M...',
        '..ggg.ggg.ggg..'
    ], { g: 'dungeon_bars' }),
    // 雕像长廊：两列装饰基座延伸成廊，掩体沿廊分散、精英压轴登场
    T('statue_gallery', 'mid', 1.4, [
        '...r....r...',
        '.d.d....d.d.',
        '....c..c....',
        '.d.d....d.d.',
        '....m..m....',
        '.d.d....d.d.',
        '...m....m...',
        '.d.dc..cd.d.',
        '............',
        '.d.d....d.d.',
        '...M.EE.M...',
        '....M..M....'
    ]),
    // 军官休息室：钢琴大钟与桌椅围出的雅座，精英军官居中镇场
    T('piano_lounge', 'mid', 1.4, [
        '.ii.......j...',
        '..............',
        '...tq..qt.....',
        '..c..m..m..c..',
        '..m........m..',
        '......e.......',
        '.....c..c.....',
        '..R........R..',
        '....M.HH.M....',
        '.tq..MM....qt.'
    ], { i: 'piano', t: 'table', q: 'chair', j: 'grandfather_clock' }),

    // ═══════════ 深层：高压工事（波1 5-7 → 波2 7-8 含精英） ═══════════
    // 要塞：环形工事内外两线
    T('fortress', 'deep', 0.8, [
        '.c...r...c..',
        '..###..###..',
        '..#.m..m.#..',
        'm.....h....m',
        '..#..MM..#..',
        '..###..###..',
        '.c...R...c..',
        '..M..EE..M..',
        '.....H......'
    ]),
    // 绝杀场：开阔中央+四向火力（走位终试炼，坑区密集故少加近战）
    T('killbox', 'deep', 0.8, [
        '.r...m...r.',
        '...c...c...',
        '....ppp....',
        'h...ppp...h',
        '....ppp....',
        '...c.m.c...',
        '.M.......M.',
        '....EHE....',
        '..R.....R..'
    ]),
    // 囚区：牢房隔间里的囚徒，狱卒随后赶来清场
    T('cell_block', 'deep', 1.6, [
        '.###..###..###..',
        '.#m#..#m#..#m#..',
        '................',
        '...c.......c....',
        '.....r...r......',
        '....g.....g.....',
        '...c..m..m..c...',
        '.###..###..###..',
        '.#M#..#E#..#M#..',
        '...M..HH..R.M...',
        '................'
    ], { g: 'dungeon_bars' }),
    // 刑讯室：刑架与铁笼之间的看守
    T('torture_chamber', 'deep', 1.5, [
        '..x......x....',
        '...m....m.....',
        '.g..c....c..g.',
        '..h........h..',
        '......m.......',
        '......e.......',
        '.....c..c.....',
        '..M........M..',
        '.g...R..R...g.',
        '..x...HH...x..'
    ], { x: 'dungeon_rack', g: 'dungeon_iron_cage' }),
    // 祭仪厅：烛坛环绕的召唤现场，坑区环绕故近战酌减
    T('ritual_hall', 'deep', 1.6, [
        '................',
        '..r..........r..',
        '.....pp..pp.....',
        '..c.#......#.c..',
        '......a.a.......',
        '.....a.e.a......',
        '......a.a.......',
        '....#......#....',
        '.....pp..pp.....',
        '..M...HH...M....',
        '....M..E..M.....',
        '..c..m..m....c..'
    ], { a: 'dungeon_altar' }),
    // 军械库：箱阵武器架与常驻火力点
    T('armory_vault', 'deep', 1.4, [
        '.cc...v....cc.',
        '.cc........cc.',
        '....m..m......',
        '..r........r..',
        '.....c..c.....',
        '...m......m...',
        '...M....M.....',
        '..R..EHH..R...',
        '.cc........cc.',
        '.cc...v....cc.'
    ], { v: 'workbench' }),
    // 断桥深渊：横贯房间的坑带只留三格窄桥，隔坑对射、重装堵桥（坑区大故少加）
    T('chasm_bridge', 'deep', 1.5, [
        '...r.......r...',
        '.....m...m.....',
        '..m.........m..',
        '....c.....c....',
        'pppppp...pppppp',
        'pppppp...pppppp',
        'pppppp...pppppp',
        '....c.....c....',
        '..R.........R..',
        '...............',
        '...M.HHH.M.....'
    ]),
    // 处刑场：中央刑架四面围观席，处刑者当场行刑、援军全场围杀
    T('execution_ground', 'deep', 1.5, [
        '..M........M..',
        '.qqq......qqq.',
        '.qqq......qqq.',
        '.R..........R.',
        '..m..h..h..m..',
        '...c..xx..c...',
        '......e.......',
        '...c......c...',
        '.qqq......qqq.',
        '.qqq......qqq.',
        '....M.HH.M....'
    ], { x: 'dungeon_rack', q: 'chair' })
];

// 通用池 + 三层主题池（f1 监狱 / f2 圣殿 / f3 深渊实验室）—— 字符模板池（黄金测试口径，仅 rows 前端）
export const ENCOUNTER_TEMPLATES = [
    ...BASE_TEMPLATES,
    ...F1_PRISON_TEMPLATES,
    ...F2_TEMPLE_TEMPLATES,
    ...F3_DEPTHS_TEMPLATES
];

// [room-v2:p2] 真正的「选池」= 字符模板 + 代码构建器示范房（两种授权前端同池选中）。
// ENCOUNTER_TEMPLATES 保持纯字符模板（供 room-plan-golden / encounter-templates 测试逐一遍历 rows）；
// selectEncounter 消费本合并池，代码模板（__code）每次选中用当局 rng 重新 build（变体生效）。
export const SELECTABLE_TEMPLATES = [
    ...ENCOUNTER_TEMPLATES,
    ...V2_SHOWCASE_ROOMS
];

// [room-v2:p2] 模板栅格尺寸统一读取：字符模板走 rows，代码模板走 defineRoom 固定的 w/h。
function templateGridSize(t) {
    if (t.__code) return { w: t.w, h: t.h };
    return { w: t.rows[0].length, h: t.rows.length };
}

// [room-v2:p2] 物化为 RoomPlan：字符模板确定性解析；代码模板用传入 rng 重新 build 出变体。
function materializeTemplate(t, rng) {
    return t.__code ? t.build(rng) : encounterToRoomPlan(t);
}

// [room-v2:p2] 地板层数值 id → FLOOR_TYPES 枚举键名（placeEncounter 把逐格地板还原为覆写用键名）。
const FLOOR_ID_TO_KEY = {};
for (const [k, v] of Object.entries(FLOOR_TYPES)) {
    if (FLOOR_ID_TO_KEY[v] === undefined) FLOOR_ID_TO_KEY[v] = k;
}

/** 深度 → 模板档位（与 FloorConfigs.getDepthTier 同口径）。 */
export function tierForDepth(depth) {
    if (depth <= 2) return 'shallow';
    if (depth <= 4) return 'mid';
    return 'deep';
}

const TIER_FALLBACK = { deep: 'mid', mid: 'shallow', shallow: null };

/**
 * 解析字符画模板 → 相对坐标要素表（旧口径向后兼容视图）。
 * [room-v2:p1] 底层已迁移到 RoomPlan IR：本函数 = 适配器 + 旧形状投影，
 * 单一解析实现（encounterToRoomPlan），现存模板测试零改动。
 * 小写 m/r/h/e 为第一波（wave 0），大写为第二波（wave 1）；
 * legend 字符解析为具体物件（props，家具/牢栏等可破坏装饰）。
 */
export function parseEncounter(template) {
    return roomPlanToParsed(encounterToRoomPlan(template));
}

/**
 * 按档位与房间内部尺寸选模板（放不下则降档，已用减权防重复）。
 * [room-v2:p1] 返回 RoomPlan（IR）或 null —— rng 只在此选模板阶段用，解析层确定性。
 * @returns {Object|null} RoomPlan 或 null
 */
export function selectEncounter(tier, interiorW, interiorH, rng, usedIds = new Set(), floor = null) {
    let currentTier = tier;
    while (currentTier) {
        // [room-v2:p2] 选池含字符模板 + 代码构建器示范房；尺寸经统一接口读取。
        const candidates = SELECTABLE_TEMPLATES.filter(t => {
            if (t.tier !== currentTier) return false;
            // 楼层亲和：带 floors 标记的模板只在对应楼层出现（缺省=全楼层通用）
            if (t.floors && floor != null && !t.floors.includes(floor)) return false;
            const { w: tw, h: th } = templateGridSize(t);
            return tw <= interiorW && th <= interiorH;
        });

        if (candidates.length > 0) {
            let totalWeight = 0;
            const weights = candidates.map(t => {
                let weight = usedIds.has(t.id) ? t.weight * 0.4 : t.weight;
                // 面积利用率加权：模板越接近房间内部尺寸越优先（避免小模板落进大房显空）
                const { w: tw, h: th } = templateGridSize(t);
                const util = (tw * th) / (interiorW * interiorH);
                weight *= 0.35 + util;
                totalWeight += weight;
                return weight;
            });
            let roll = rng() * totalWeight;
            for (let i = 0; i < candidates.length; i++) {
                roll -= weights[i];
                // [room-v2:p2] 代码模板用当局 rng 重新 build（同一 rng 流延续消费，变体确定性）。
                if (roll <= 0) return materializeTemplate(candidates[i], rng);
            }
            return materializeTemplate(candidates[candidates.length - 1], rng);
        }

        currentTier = TIER_FALLBACK[currentTier];
    }
    return null;
}

/**
 * [room-v2:p2] 按 id 直接从选池物化一个 RoomPlan（代码模板用 rng 出变体）。
 * 供测试断言「入池可被选中」与调试直达，不参与常规加权选择。
 * @returns {Object|null} RoomPlan 或 null（id 不存在）
 */
export function selectEncounterById(id, rng = Math.random) {
    const t = SELECTABLE_TEMPLATES.find(x => x.id === id);
    return t ? materializeTemplate(t, rng) : null;
}

/**
 * 把 RoomPlan 居中放进房间（四周自然留 ≥2 tile 通带），输出绝对 tile 坐标。
 * [room-v2:p1] 只吃 RoomPlan（字符模板经 encounterToRoomPlan 进入）。
 * 输出形状保持旧 placeEncounter 契约（DungeonLayoutGenerator 消费链逐 tile 不变）：
 *   内墙由 mask===0 还原、掩体/装饰/道具按类别拆分（保留 row-major 顺序 → rng 序列一致）、
 *   出怪波次由 IR 的 1|2 还原为下游 0|1。
 * @param {Object} plan RoomPlan
 * @param {Object} room {x, y, w, h}
 */
export function placeEncounter(plan, room) {
    const interiorX = room.x + 2;
    const interiorY = room.y + 2;
    const interiorW = room.w - 4;
    const interiorH = room.h - 4;
    const offsetX = interiorX + Math.floor((interiorW - plan.w) / 2);
    const offsetY = interiorY + Math.floor((interiorH - plan.h) / 2);

    const shift = (x, y) => ({ x: x + offsetX, y: y + offsetY });

    // [room-v2:p2] 逐格地板层 → 绝对坐标覆写单元（字符模板 floor 恒全 0 → floorCells 为空，零回归）。
    // 数值 id 反查回 FLOOR_TYPES 键名，交下游 floorOverrides（1x1）着色，实现「地板即像素画」。
    const floorCells = [];
    for (let y = 0; y < plan.h; y++) {
        for (let x = 0; x < plan.w; x++) {
            const id = plan.floor[y * plan.w + x];
            if (id === 0) continue;
            const key = FLOOR_ID_TO_KEY[id];
            if (key === undefined) continue;
            const p = shift(x, y);
            floorCells.push({ x: p.x, y: p.y, floorType: key });
        }
    }

    return {
        id: plan.meta.id,
        floorType: plan.meta.floorType || null,
        walls: maskToWallCoords(plan).map((p) => shift(p.x, p.y)),
        covers: objectsOfKind(plan, OBJECT_COVER).map((o) => shift(o.x, o.y)),
        decors: objectsOfKind(plan, OBJECT_DECOR).map((o) => shift(o.x, o.y)),
        // 波次 1|2 → 0|1（下游 DungeonManager 按 !wave / wave===1 分波）
        spawns: plan.spawns.map((s) => ({ ...shift(s.x, s.y), role: s.role, wave: s.wave - 1 })),
        props: objectsOfKind(plan, OBJECT_PROP).map((o) => ({ ...shift(o.x, o.y), type: o.type })),
        pits: plan.pits.map((p) => shift(p.x, p.y)),
        floorCells
    };
}
