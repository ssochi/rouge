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

// 通用池 + 三层主题池（f1 监狱 / f2 圣殿 / f3 深渊实验室）
export const ENCOUNTER_TEMPLATES = [
    ...BASE_TEMPLATES,
    ...F1_PRISON_TEMPLATES,
    ...F2_TEMPLE_TEMPLATES,
    ...F3_DEPTHS_TEMPLATES
];

/** 深度 → 模板档位（与 FloorConfigs.getDepthTier 同口径）。 */
export function tierForDepth(depth) {
    if (depth <= 2) return 'shallow';
    if (depth <= 4) return 'mid';
    return 'deep';
}

const TIER_FALLBACK = { deep: 'mid', mid: 'shallow', shallow: null };

/**
 * 解析字符画模板 → 相对坐标要素表。
 * 小写 m/r/h/e 为第一波（wave 0），大写为第二波（wave 1）；
 * legend 字符解析为具体物件（props，家具/牢栏等可破坏装饰）。
 */
export function parseEncounter(template) {
    const rows = template.rows;
    const legend = template.legend || {};
    const h = rows.length;
    const w = rows[0].length;
    const walls = [];
    const pits = [];
    const covers = [];
    const decors = [];
    const spawns = [];
    const props = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = rows[y][x];
            if (ch === '.') continue;
            if (ch === '#') walls.push({ x, y });
            else if (ch === 'p') pits.push({ x, y });
            else if (ch === 'c') covers.push({ x, y });
            else if (ch === 'd') decors.push({ x, y });
            else if (ch === 'm' || ch === 'r' || ch === 'h' || ch === 'e') {
                spawns.push({ x, y, role: ch, wave: 0 });
            } else if (ch === 'M' || ch === 'R' || ch === 'H' || ch === 'E') {
                spawns.push({ x, y, role: ch.toLowerCase(), wave: 1 });
            } else if (legend[ch]) {
                props.push({ x, y, type: legend[ch] });
            }
        }
    }

    return { id: template.id, w, h, walls, pits, covers, decors, spawns, props, floorType: template.floorType || null };
}

/**
 * 按档位与房间内部尺寸选模板（放不下则降档，已用减权防重复）。
 * @returns 解析后的模板或 null
 */
export function selectEncounter(tier, interiorW, interiorH, rng, usedIds = new Set(), floor = null) {
    let currentTier = tier;
    while (currentTier) {
        const candidates = ENCOUNTER_TEMPLATES.filter(t => {
            if (t.tier !== currentTier) return false;
            // 楼层亲和：带 floors 标记的模板只在对应楼层出现（缺省=全楼层通用）
            if (t.floors && floor != null && !t.floors.includes(floor)) return false;
            const th = t.rows.length;
            const tw = t.rows[0].length;
            return tw <= interiorW && th <= interiorH;
        });

        if (candidates.length > 0) {
            let totalWeight = 0;
            const weights = candidates.map(t => {
                let weight = usedIds.has(t.id) ? t.weight * 0.4 : t.weight;
                // 面积利用率加权：模板越接近房间内部尺寸越优先（避免小模板落进大房显空）
                const util = (t.rows[0].length * t.rows.length) / (interiorW * interiorH);
                weight *= 0.35 + util;
                totalWeight += weight;
                return weight;
            });
            let roll = rng() * totalWeight;
            for (let i = 0; i < candidates.length; i++) {
                roll -= weights[i];
                if (roll <= 0) return parseEncounter(candidates[i]);
            }
            return parseEncounter(candidates[candidates.length - 1]);
        }

        currentTier = TIER_FALLBACK[currentTier];
    }
    return null;
}

/**
 * 把解析后的模板居中放进房间（四周自然留 ≥2 tile 通带），输出绝对 tile 坐标。
 * @param {Object} parsed parseEncounter 结果
 * @param {Object} room {x, y, w, h}
 */
export function placeEncounter(parsed, room) {
    const interiorX = room.x + 2;
    const interiorY = room.y + 2;
    const interiorW = room.w - 4;
    const interiorH = room.h - 4;
    const offsetX = interiorX + Math.floor((interiorW - parsed.w) / 2);
    const offsetY = interiorY + Math.floor((interiorH - parsed.h) / 2);

    const shift = (p) => ({ ...p, x: p.x + offsetX, y: p.y + offsetY });
    return {
        id: parsed.id,
        floorType: parsed.floorType || null,
        walls: parsed.walls.map(shift),
        covers: parsed.covers.map(shift),
        decors: parsed.decors.map(shift),
        spawns: parsed.spawns.map(shift),
        props: parsed.props.map(shift),
        pits: parsed.pits.map(shift)
    };
}
