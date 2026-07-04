// EncounterTemplates —— 手作遭遇战房间模板库（P-Redesign R3）。
// 每个模板是一张字符画：地形墙、掩体、出怪点（角色）、装饰在同一张图里一体设计，
// 房间因此成为一道「战斗题」，而不是随机杂物堆砌。
//
// 图例：
//   # 内墙   c 掩体   d 装饰   . 空地
//   m 近战出怪   r 远程出怪   h 重装出怪   e 精英出怪（保底词缀）
//
// 角色 → 具体敌人由 FloorConfigs.roleMap 按楼层映射（新敌人入池零模板改动）。
// 设计约束（tests/encounter-templates.test.js 强制）：
//   - 墙不得封死任何区域（BFS 连通）
//   - 含远程（r/h）的模板掩体 ≥2（玩家有依托）
//   - 模板放进房间后四周保留 ≥2 tile 通带（放置逻辑保证）

const T = (id, tier, weight, rows) => ({ id, tier, weight, rows });

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
    ])
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
 */
export function parseEncounter(template) {
    const rows = template.rows;
    const h = rows.length;
    const w = rows[0].length;
    const walls = [];
    const covers = [];
    const decors = [];
    const spawns = [];

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = rows[y][x];
            if (ch === '#') walls.push({ x, y });
            else if (ch === 'c') covers.push({ x, y });
            else if (ch === 'd') decors.push({ x, y });
            else if (ch === 'm' || ch === 'r' || ch === 'h' || ch === 'e') spawns.push({ x, y, role: ch });
        }
    }

    return { id: template.id, w, h, walls, covers, decors, spawns };
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
                const weight = usedIds.has(t.id) ? t.weight * 0.4 : t.weight;
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
        spawns: parsed.spawns.map(shift)
    };
}
