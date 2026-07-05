// EncounterTemplates —— 手作遭遇战房间模板库（R3 + W4 环境叙事扩容）。
// 每个模板是一张字符画：地形墙、掩体、出怪点（角色）、装饰在同一张图里一体设计，
// 房间因此成为一道「战斗题」；叙事模板通过 legend 指定具体家具/道具，
// 让房间「看得出曾经是干什么的」（囚区/食堂/档案室/刑讯室/祭仪厅…）。
//
// 图例：
//   # 内墙   c 掩体   d 装饰（主题池随机）   . 空地
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
    // ───────────────────── 浅层（3-5 敌，教学节奏） ─────────────────────
    T('open_brawl', 'shallow', 1.0, [
        'm.....m',
        '.......',
        '..c.c..',
        '...d...',
        '..c.c..',
        '.......',
        'm.....m'
    ]),
    T('twin_cover', 'shallow', 1.0, [
        '....r....',
        '.c.....c.',
        '.........',
        '.c..d..c.',
        '.........',
        '.m.....m.'
    ]),
    T('first_crossfire', 'shallow', 0.9, [
        'r.......',
        '...c...m',
        '.c...#..',
        '..#...c.',
        'm...c...',
        '.......r'
    ]),
    T('rush_lane', 'shallow', 0.9, [
        'm..#....#..m',
        '...#.c..#...',
        'd..........d',
        '...#..c.#...',
        'm..#....#..m'
    ]),
    T('pillar_skirmish', 'shallow', 1.0, [
        '.m.....r.',
        '..##.....',
        '.c...c...',
        '....d....',
        '...c...c.',
        '.....##..',
        '.r.....m.'
    ]),

    // ───────────────────── 中层（5-7 敌，组合威胁） ─────────────────────
    T('crossfire_net', 'mid', 1.0, [
        '..c.......c..',
        '......r......',
        '..#.......#..',
        '.....m.m.....',
        '.r....#....r.',
        '.....m.m.....',
        '..#.......#..',
        '......r......',
        '..c.......c..'
    ]),
    T('sniper_gallery', 'mid', 1.0, [
        '..r...#...r...',
        '.####...####..',
        '..............',
        '..c...c....c..',
        '..............',
        '.m....d.....m.'
    ]),
    T('bunker', 'mid', 1.0, [
        '.....c.....',
        '..#######..',
        '..#..r..#..',
        'c.....h...c',
        '..#..r..#..',
        '..#######..',
        '.m...c...m.'
    ]),
    T('pincer', 'mid', 0.9, [
        'm.........m',
        '..c.....c..',
        '.....r.....',
        '#....d....#',
        '.....r.....',
        '..c.....c..',
        'm.........m'
    ]),
    T('swarm_pit', 'mid', 0.9, [
        'm...c...m',
        '....#....',
        '..d...d..',
        'c.#.r.#.c',
        '.........',
        '....#....',
        'm...c...m'
    ]),
    T('artillery_yard', 'mid', 0.9, [
        '.h...#...h..',
        '..####......',
        '.....c...c..',
        '.c..........',
        '......c.....',
        '..m..d...m..'
    ]),

    // ───────────────────── 深层（6-8 敌，高压工事） ─────────────────────
    T('fortress', 'deep', 1.0, [
        '.c...r...c..',
        '..###..###..',
        '..#......#..',
        'm.....h....m',
        '..#......#..',
        '..###..###..',
        '.c...r...c..',
        '.....m......'
    ]),
    T('gauntlet_hall', 'deep', 1.0, [
        'r....#....r.',
        '.c...#..c...',
        '.....#......',
        '..#.....#...',
        '......c.....',
        '...#.....#..',
        '...c...#....',
        '.m.....#..h.'
    ]),
    T('killbox', 'deep', 1.0, [
        '.r.......r.',
        '...c...c...',
        '...........',
        '.....d.....',
        'h....c....h',
        '...........',
        '...c...c...',
        '.m.......m.'
    ]),
    T('elite_vanguard', 'deep', 0.9, [
        '..c......c..',
        '.....##.....',
        '.r...e....r.',
        '.....##.....',
        '..#......#..',
        '.m..c..c..m.',
        '......d.....'
    ]),

    // ───────────── W4 环境叙事模板（废弃地下监狱的功能区，带第二波） ─────────────
    // 食堂：两排长桌翻倒的餐厅，用餐者变成了怪物
    T('mess_hall', 'shallow', 1.1, [
        '..............',
        '..tttt..tttt..',
        '..q..q..q..q..',
        '.m....mm....m.',
        '..............',
        '..tttt..tttt..',
        '..q.....q...q.',
        '.M....MM....M.',
        '..............'
    ], { t: 'table', q: 'chair' }),
    // 浴场：积水的澡堂，浴缸仍在
    T('flooded_bath', 'shallow', 0.9, [
        '..u....u.....',
        '.............',
        '...c....c....',
        '.m.........m.',
        '......d......',
        '..c....c.....',
        '.............',
        '..u....M...u.',
        '.............'
    ], { u: 'bathtub' }),
    // 仓库：成堆的补给箱与工作台
    T('storage_vault', 'shallow', 1.0, [
        '..cc....cc....',
        '..cc....cc....',
        '..............',
        '.m..........m.',
        '......v.......',
        '..............',
        '..cc....cc....',
        '..cc..M...M...',
        '..............'
    ], { v: 'workbench' }),
    // 档案室：狱医的书架与研究祭坛，禁术研究者驻守
    T('archive', 'mid', 1.1, [
        '.kkk....kkk....',
        '...............',
        '.kkk..a..kkk...',
        '......e........',
        '...............',
        '.c....d.....c..',
        '.kkk....kkk....',
        '...R.......R...',
        '...............',
        '.m...........m.'
    ], { k: 'bookshelf', a: 'dungeon_altar' }),
    // 卫兵室：岗哨的桌椅与工事，增援从后方赶来
    T('guard_post', 'mid', 1.0, [
        '..t.q.....c...',
        '..............',
        '.r..........r.',
        '......##......',
        '..c...##...c..',
        '..............',
        '.....tqt......',
        '..h........v..',
        '..R......R....',
        '..............'
    ], { t: 'table', q: 'chair', v: 'workbench' }),
    // 典狱长办公室：电脑桌、大钟与书柜，精英亲卫镇守
    T('warden_office', 'mid', 0.9, [
        '.j.kkk....w..',
        '.............',
        '....o..e.....',
        '....q........',
        '.............',
        '..c......c...',
        '.....##......',
        '.r........r..',
        '.....MM......',
        '.............'
    ], { j: 'grandfather_clock', k: 'bookshelf', w: 'wardrobe', o: 'computer_desk', q: 'chair' }),
    // 兵营：成排床铺的宿舍，驻军尚在
    T('barracks', 'mid', 1.0, [
        '.n..n..n..n..w.',
        '...............',
        '...............',
        '..r.........r..',
        '.......t.......',
        '..c.........c..',
        '...............',
        '.R....hh....R..',
        '...............',
        '.n..n.....n..n.'
    ], { n: 'bed', w: 'wardrobe', t: 'table' }),
    // 囚区：一排排牢房，囚犯早已不是人形；第二波狱卒赶来
    T('cell_block', 'deep', 1.1, [
        '.###..###..###..',
        '.#m#..#m#..#M#..',
        '................',
        '...c......c.....',
        '.....r....r.....',
        '................',
        '.###..###..###..',
        '.#m#..#M#..#m#..',
        '................',
        '....g......g....',
        '................'
    ], { g: 'dungeon_bars' }),
    // 刑讯室：刑架与铁笼之间，看守者仍在巡视
    T('torture_chamber', 'deep', 1.0, [
        '..x......x....',
        '..............',
        '.g..........g.',
        '.....c..c.....',
        '..h........h..',
        '..............',
        '.....e........',
        '.....c..c.....',
        '.g..........g.',
        '..R......R....',
        '..............'
    ], { x: 'dungeon_rack', g: 'dungeon_iron_cage' }),
    // 祭仪厅：烛坛环绕的仪式现场，主祭正在召唤；打断它会引来信徒
    T('ritual_hall', 'deep', 1.1, [
        '................',
        '..r..........r..',
        '................',
        '....#......#....',
        '......a.a.......',
        '.....a.e.a......',
        '......a.a.......',
        '....#......#....',
        '..M..........M..',
        '.....M..M.......',
        '..c..........c..',
        '................'
    ], { a: 'dungeon_altar' })
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
    const covers = [];
    const decors = [];
    const spawns = [];
    const props = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = rows[y][x];
            if (ch === '.') continue;
            if (ch === '#') walls.push({ x, y });
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

    return { id: template.id, w, h, walls, covers, decors, spawns, props };
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
        props: parsed.props.map(shift)
    };
}
