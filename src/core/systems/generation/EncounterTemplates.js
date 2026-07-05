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
//   - 含远程（r/h）的模板掩体 ≥2（玩家有依托）
//   - 模板放进房间后四周保留 ≥2 tile 通带（放置逻辑保证）

const T = (id, tier, weight, rows, legend) => ({ id, tier, weight, rows, legend });

export const ENCOUNTER_TEMPLATES = [
    // ═══════════ 浅层：热身节奏（波1 轻 3-4 → 波2 上强度 4-5） ═══════════
    // 空旷斗殴场：无家具的空房，被围攻的开阔地
    T('open_brawl', 'shallow', 0.6, [
        'm...........m',
        '.............',
        '...c.....c...',
        '....pp.pp....',
        '...r..d..r...',
        'M....c.c....M',
        '.............',
        '...M.....M...',
        '.....H.......'
    ]),
    // 食堂：成排长桌与散落的椅子，用餐时刻的惨案
    T('mess_hall', 'shallow', 1.6, [
        '..............',
        '.ttt.q..q.ttt.',
        '.q.........q..',
        '...m......m...',
        '......cc......',
        '..r........r..',
        '......cc......',
        '...M..HH..M...',
        '.ttt.q..q.ttt.',
        '..............'
    ], { t: 'table', q: 'chair' }),
    // 浴场：一圈浴缸的澡堂，水汽未散
    T('flooded_bath', 'shallow', 1.4, [
        '.u..u....u..u.',
        '......r.......',
        '...c......c...',
        '.m..........m.',
        '......cc......',
        '..M........M..',
        '...c......c...',
        '.....R..R.....',
        '.u..u....u..u.'
    ], { u: 'bathtub' }),
    // 仓库：靠墙的补给箱垛与中央工作台
    T('storage_vault', 'shallow', 1.5, [
        '.cc........cc.',
        '.cc........cc.',
        '..............',
        '..m........m..',
        '.....v..v.....',
        '..............',
        '.r..........r.',
        '.cc..M..M..cc.',
        '.cc...HH...cc.'
    ], { v: 'workbench' }),
    // 哨卡：栅栏工事后的岗哨
    T('guard_checkpoint', 'shallow', 1.3, [
        '..g...gg...g..',
        '..............',
        '...c......c...',
        '.m....rr....m.',
        '..pp......pp..',
        '......cc......',
        '..M........M..',
        '....R....R....',
        '..g...gg...g..'
    ], { g: 'dungeon_bars' }),

    // ═══════════ 中层：组合威胁（波1 4 → 波2 5-6 含重装/精英） ═══════════
    // 十字火力网：对称工事的交叉火力
    T('crossfire_net', 'mid', 0.7, [
        '..c.......c..',
        '......r......',
        '..#.......#..',
        '.....m.m.....',
        '.r....#....r.',
        '.....M.M.....',
        '..#.......#..',
        '..M..HH...M..',
        '..c.......c..'
    ]),
    // 地堡：中央钢筋工事里的火力点
    T('bunker', 'mid', 0.8, [
        '.....c.....',
        '..#######..',
        '..#..r..#..',
        'c.....h...c',
        '..#..r..#..',
        '..#######..',
        '.m...c...m.',
        '..M.....M..',
        '....EHH....'
    ]),
    // 档案室：靠墙书架阵与中央研究坛，禁术研究者的领域
    T('archive', 'mid', 1.6, [
        '.kkkk....kkkk.',
        '..............',
        '..c........c..',
        '.....a..a.....',
        '..m...e....m..',
        '.....a..a.....',
        '..c........c..',
        '...R......R...',
        '......MM......',
        '.kkkk....kkkk.'
    ], { k: 'bookshelf', a: 'dungeon_altar' }),
    // 卫兵室：桌椅岗位与武器架，换岗的守军
    T('guard_post', 'mid', 1.5, [
        '.ttq.....v.v..',
        '.q............',
        '..............',
        '.r..c....c..r.',
        '......##......',
        '..m...##...m..',
        '..............',
        '..R..c..c..R..',
        '.....HEH......',
        '.ttq......qtt.'
    ], { t: 'table', q: 'chair', v: 'workbench' }),
    // 典狱长办公室：办公桌、大钟与书柜，精英亲卫镇守
    T('warden_office', 'mid', 1.4, [
        '.j.kkkk....w..',
        '..............',
        '....o.q.......',
        '..............',
        '..c...e....c..',
        '......##......',
        '.r..........r.',
        '...c......c...',
        '....M.HH.M....',
        '.kk........kk.'
    ], { j: 'grandfather_clock', k: 'bookshelf', w: 'wardrobe', o: 'computer_desk', q: 'chair' }),
    // 兵营：床铺成列的宿舍，驻军闻声而起
    T('barracks', 'mid', 1.5, [
        '.n..n..n..n..w.',
        '...............',
        '..r.........r..',
        '.....c...c.....',
        '...m...t...m...',
        '.....c...c.....',
        '...............',
        '..R...HH....R..',
        '.....M..M......',
        '.n..n..n..n..w.'
    ], { n: 'bed', w: 'wardrobe', t: 'table' }),
    // 小礼拜堂：成排长椅朝向祭坛，祷告者未曾离开
    T('chapel', 'mid', 1.4, [
        '......aa......',
        '....a.EE.a....',
        '......r.......',
        '.qq.q....q.qq.',
        '...m......m...',
        '.qq.q....q.qq.',
        '..c........c..',
        '.qq.q.MM.q.qq.',
        '...R......R...',
        '..............'
    ], { q: 'chair', a: 'dungeon_altar' }),

    // 监控室：整排电脑与电视墙仍在运转，鱼缸幽幽发光
    T('surveillance', 'mid', 1.4, [
        '.ooo....ooo...',
        '..............',
        '.t..........t.',
        '...c......c...',
        '..r...##...r..',
        '......##......',
        '...m......m...',
        '..c........c..',
        '.f..R..R...f..',
        '.....HH..E....'
    ], { o: 'computer_desk', t: 'tv_stand', f: 'fish_tank' }),

    // ═══════════ 深层：高压工事（波1 4-5 → 波2 6-7 含精英） ═══════════
    // 要塞：环形工事内外两线
    T('fortress', 'deep', 0.8, [
        '.c...r...c..',
        '..###..###..',
        '..#......#..',
        'm.....h....m',
        '..#..MM..#..',
        '..###..###..',
        '.c...R...c..',
        '..M..EE..M..',
        '.....H......'
    ]),
    // 绝杀场：开阔中央+四向火力（走位终试炼）
    T('killbox', 'deep', 0.8, [
        '.r.......r.',
        '...c...c...',
        '....ppp....',
        'h...ppp...h',
        '....ppp....',
        '...c...c...',
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
        '................',
        '.###..###..###..',
        '.#M#..#E#..#M#..',
        '......HH..R.....',
        '................'
    ], { g: 'dungeon_bars' }),
    // 刑讯室：刑架与铁笼之间的看守
    T('torture_chamber', 'deep', 1.5, [
        '..x......x....',
        '..............',
        '.g...c..c...g.',
        '..h........h..',
        '..............',
        '......e.......',
        '.....c..c.....',
        '..M........M..',
        '.g...R..R...g.',
        '..x...HH...x..'
    ], { x: 'dungeon_rack', g: 'dungeon_iron_cage' }),
    // 祭仪厅：烛坛环绕的召唤现场，打断仪式会激怒信徒
    T('ritual_hall', 'deep', 1.6, [
        '................',
        '..r..........r..',
        '.....pp..pp.....',
        '....#......#....',
        '......a.a.......',
        '.....a.e.a......',
        '......a.a.......',
        '....#......#....',
        '.....pp..pp.....',
        '..M...HH...M....',
        '....M..E..M.....',
        '..c..........c..'
    ], { a: 'dungeon_altar' }),
    // 军械库：箱阵武器架与常驻火力点
    T('armory_vault', 'deep', 1.4, [
        '.cc...v....cc.',
        '.cc........cc.',
        '..............',
        '..r........r..',
        '.....c..c.....',
        '...m......m...',
        '..............',
        '..R..EHH..R...',
        '.cc........cc.',
        '.cc...v....cc.'
    ], { v: 'workbench' })
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

    return { id: template.id, w, h, walls, pits, covers, decors, spawns, props };
}

/**
 * 按档位与房间内部尺寸选模板（放不下则降档，已用减权防重复）。
 * @returns 解析后的模板或 null
 */
export function selectEncounter(tier, interiorW, interiorH, rng, usedIds = new Set()) {
    let currentTier = tier;
    while (currentTier) {
        const candidates = ENCOUNTER_TEMPLATES.filter(t => {
            if (t.tier !== currentTier) return false;
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
        walls: parsed.walls.map(shift),
        covers: parsed.covers.map(shift),
        decors: parsed.decors.map(shift),
        spawns: parsed.spawns.map(shift),
        props: parsed.props.map(shift),
        pits: parsed.pits.map(shift)
    };
}
