// FloorTopology —— [room-v2:p3] 图优先拓扑规划 + 宏观网格嵌入。
//
// 连接算法 V2 的「先规划、再落空间」核心：
//   1) planTopologyGraph：先规划一张有意图的抽象图——
//      主干 spine（起点 → 若干战斗/动词房 → Boss 前厅 → Boss）
//      + 支线 branch（宝藏~40%、商店~60%、精英随机深度，各垂直外挂）
//      + 至多 1 条有意图的环 loop（主干深处开一条捷径接回前段，且不穿 Boss 前厅）。
//      房型（category）在此期就规划好，不再靠事后 BFS 深度贴标签；
//      三动词房（survival/hunt/pact）保底每层各 ≥1。
//   2) embedTopology：把抽象图嵌入 cols×rows 的宏观 cell 网格——
//      spine 用「直行偏置 + 前瞻空位」的自避行走蛇形推进，
//      支线落在锚点垂直方向的空邻格，环边只连相邻格。
//      邻接严格按格（保证下游门/走廊短直、不斜穿、不交叉）。
//
// 抽象层不认 tile，只认 cell（col,row）；房间矩形/走廊 tile 的落地在
// DungeonLayoutGenerator 完成（它知道 cell 的像素尺寸与楼层主题）。
//
// 失败即返回 null（放不下），交由生成器换种子重试 / 最终降级 v1。

// 三种玩法动词房（每层保底各 ≥1，规划期指派）。
const VERBS = ['survival', 'hunt', 'pact'];

/**
 * 每层拓扑参数（缺省 + 逐层覆写）。
 * - spineCombat: 主干上「战斗/动词房」数量区间（不含起点/前厅/Boss）。
 * - branchDepthFrac: 支线锚点在主干战斗段的相对深度（treasure/shop 定深，elite 随机带）。
 * - loopChance / loopMinGap: 环边生成概率 / 环两端最小 spineIndex 间隔（够短才算捷径）。
 */
const DEFAULT_TOPOLOGY = {
    spineCombat: [4, 4],
    branchDepthFrac: { treasure: 0.4, shop: 0.6, elite: [0.55, 0.85] },
    loopChance: 0.75,
    loopMinGap: 3
};

const TOPOLOGY_BY_FLOOR = {
    1: { spineCombat: [4, 4] },
    2: { spineCombat: [4, 5] },
    3: { spineCombat: [4, 5] }
};

export const TOPOLOGY_CONFIG = { default: DEFAULT_TOPOLOGY, byFloor: TOPOLOGY_BY_FLOOR };

/** 取某层拓扑配置（缺省 + 覆写浅合并）。 */
export function topologyConfigForFloor(floor) {
    const override = TOPOLOGY_BY_FLOOR[floor] || {};
    return { ...DEFAULT_TOPOLOGY, ...override };
}

function randInt(rng, min, max) {
    if (max <= min) return min;
    return min + Math.floor(rng() * (max - min + 1));
}

function shuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * 主干战斗房 category：按主干相对深度 p 走「浅=开阔 / 中=掩体迷宫 / 深=高压」分布。
 * 复刻旧 assignRoomCategories 的深度→category 语义（保留全部战斗 category）。
 */
function combatCategoryForDepth(p, rng) {
    const roll = rng();
    if (p < 0.35) {
        return roll < 0.55 ? 'combat_open' : 'combat_cover';
    }
    if (p < 0.7) {
        if (roll < 0.45) return 'combat_cover';
        if (roll < 0.82) return 'combat_maze';
        return 'challenge_trapline';
    }
    if (roll < 0.25) return 'combat_cover';
    if (roll < 0.65) return 'combat_maze';
    return 'challenge_trapline';
}

/**
 * 第一步：规划抽象拓扑图（不含空间坐标）。
 * @returns {{nodes, edges, startId, bossId, spine: number[]}}
 *   nodes: [{ id, role, type, category, spineIndex? }]
 *     role ∈ start|combat|antechamber|boss|treasure|shop|elite
 *   edges: [{ a, b, kind }]  kind ∈ spine|branch|loop
 *   spine: 主干节点 id 顺序表 [start, c1..cS, antechamber, boss]
 */
export function planTopologyGraph(rng, floor) {
    const cfg = topologyConfigForFloor(floor);
    const S = randInt(rng, cfg.spineCombat[0], cfg.spineCombat[1]);

    const nodes = [];
    const edges = [];
    const push = (role, type, category, extra = {}) => {
        const id = nodes.length;
        nodes.push({ id, role, type, category, ...extra });
        return id;
    };

    // ── 主干 spine：start → S 个战斗/动词房 → 前厅 → Boss ──
    const spine = [];
    const startId = push('start', 'start', 'start', { spineIndex: 0 });
    spine.push(startId);

    // 战斗房先按深度指派 category，稍后覆写 3 间为动词房。
    const combatIds = [];
    for (let k = 1; k <= S; k++) {
        const p = S > 1 ? (k - 1) / (S - 1) : 0;
        const cat = combatCategoryForDepth(p, rng);
        const id = push('combat', 'normal', cat, { spineIndex: k });
        spine.push(id);
        combatIds.push(id);
    }

    // 三动词保底：洗牌战斗房取前 3 间轮转指派 survival/hunt/pact。
    const verbPick = shuffle(combatIds.slice(), rng).slice(0, Math.min(3, combatIds.length));
    const verbOrder = shuffle(VERBS.slice(), rng);
    verbPick.forEach((id, i) => { nodes[id].category = verbOrder[i % verbOrder.length]; });

    // Boss 前厅（战斗房，紧邻 Boss；环边永不经过它）。
    const anteCat = combatCategoryForDepth(0.85, rng);
    const anteId = push('antechamber', 'normal', anteCat, { spineIndex: S + 1, isAntechamber: true });
    spine.push(anteId);

    const bossId = push('boss', 'boss', 'boss_arena', { spineIndex: S + 2 });
    spine.push(bossId);

    // spine 相邻边
    for (let i = 0; i + 1 < spine.length; i++) {
        edges.push({ a: spine[i], b: spine[i + 1], kind: 'spine' });
    }

    // ── 支线 branch：宝藏/商店/精英，各挂在指定深度的主干战斗节点 ──
    // spine[idx] 即第 idx 个战斗节点（spine[0]=start），其 spineIndex === idx。
    const clampIdx = (v) => Math.max(1, Math.min(S, v));
    const df = cfg.branchDepthFrac;
    const treasureIdx = clampIdx(Math.round(df.treasure * S));           // ~40% 处
    // 商店 ~60%，且严格深于宝藏（S 小时四舍五入会撞车 → 下压至宝藏+1）。
    let shopIdx = clampIdx(Math.round(df.shop * S));
    if (shopIdx <= treasureIdx) shopIdx = clampIdx(treasureIdx + 1);
    const eliteFrac = Array.isArray(df.elite)
        ? df.elite[0] + rng() * (df.elite[1] - df.elite[0])
        : df.elite;
    const eliteIdx = clampIdx(Math.round(eliteFrac * S));

    const branchSpecs = [
        { role: 'treasure', anchor: spine[treasureIdx] },
        { role: 'shop', anchor: spine[shopIdx] },
        { role: 'elite', anchor: spine[eliteIdx] }
    ];
    for (const spec of branchSpecs) {
        const category = spec.role; // treasure/shop/elite 即其 category
        const id = push(spec.role, 'normal', category, { branchOf: spec.anchor });
        edges.push({ a: spec.anchor, b: id, kind: 'branch' });
    }

    return { nodes, edges, startId, bossId, spine, spineCombat: S };
}

// 四邻方向（col,row 偏移）
const DIRS = [
    { dc: 1, dr: 0 }, { dc: -1, dr: 0 },
    { dc: 0, dr: 1 }, { dc: 0, dr: -1 }
];

function cellKey(col, row) { return `${col},${row}`; }

/**
 * 第二步：把抽象图嵌入 cols×rows cell 网格（就地给 nodes 写 cell:{col,row}）。
 * spine 蛇形自避行走；branch 落锚点垂直空邻格；loop 只连相邻格。
 * @returns {{cols, rows}|null} 成功返回网格尺寸；放不下返回 null。
 */
export function embedTopology(topo, cols, rows, rng) {
    const { nodes, edges, spine } = topo;
    const inBounds = (c, r) => c >= 0 && c < cols && r >= 0 && r < rows;

    // 单次嵌入尝试：放置 spine（自避行走）+ branch（锚点垂直外挂）。
    // 成功返回 occupied（cellKey→nodeId），失败返回 null。窄网格（4 列）自避行走偶会自锁，
    // 故外层多次重试（每次 rng 前进 → 不同随机选择），把单层可嵌入率拉满。
    const tryPlace = () => {
        const occupied = new Map();
        const isFree = (c, r) => inBounds(c, r) && !occupied.has(cellKey(c, r));
        const freeNeighbors = (c, r) => {
            let n = 0;
            for (const d of DIRS) if (isFree(c + d.dc, r + d.dr)) n++;
            return n;
        };
        const setCell = (id, c, r) => {
            nodes[id].cell = { col: c, row: r };
            occupied.set(cellKey(c, r), id);
        };

        // ── spine 自避行走 ──
        // 起点靠一角（随机四角之一），直行偏置 + 前瞻优选开阔落点 → 长可读主干段、给支线留位。
        const corners = [
            { col: 0, row: 0 }, { col: cols - 1, row: 0 },
            { col: 0, row: rows - 1 }, { col: cols - 1, row: rows - 1 }
        ];
        const start = corners[Math.floor(rng() * corners.length)];
        setCell(spine[0], start.col, start.row);

        let cur = { c: start.col, r: start.row };
        let lastDir = null;
        for (let i = 1; i < spine.length; i++) {
            const cand = [];
            for (const d of DIRS) {
                const nc = cur.c + d.dc;
                const nr = cur.r + d.dr;
                if (!isFree(nc, nr)) continue;
                const straight = lastDir && d.dc === lastDir.dc && d.dr === lastDir.dr;
                // 前瞻：落点周围空位越多越好；直行加成鼓励长直段。
                const score = freeNeighbors(nc, nr) * 2 + (straight ? 3 : 0) + rng() * 1.5;
                cand.push({ d, nc, nr, score });
            }
            if (cand.length === 0) return null; // 走进死角
            cand.sort((a, b) => b.score - a.score);
            const chosen = cand[0];
            setCell(spine[i], chosen.nc, chosen.nr);
            lastDir = chosen.d;
            cur = { c: chosen.nc, r: chosen.nr };
        }

        // ── branch 落位：锚点垂直空邻格优先 ──
        const nodeAtDir = (node, d) => {
            const c = node.cell.col + d.dc;
            const r = node.cell.row + d.dr;
            return isFree(c, r) ? { c, r } : null;
        };
        for (const e of edges) {
            if (e.kind !== 'branch') continue;
            const anchor = nodes[e.a];
            const branch = nodes[e.b];
            // 锚点主干走向（指向 prev/next 的方向）→ 垂直方向为「外挂」优先
            const spineDirs = [];
            for (const other of edges) {
                if (other.kind !== 'spine') continue;
                let nb = -1;
                if (other.a === anchor.id) nb = other.b;
                else if (other.b === anchor.id) nb = other.a;
                if (nb < 0 || !nodes[nb].cell) continue;
                spineDirs.push({ dc: Math.sign(nodes[nb].cell.col - anchor.cell.col), dr: Math.sign(nodes[nb].cell.row - anchor.cell.row) });
            }
            const isPerp = (d) => !spineDirs.some(sd => sd.dc === d.dc && sd.dr === d.dr);
            const perp = DIRS.filter(isPerp).map(d => ({ d, p: nodeAtDir(anchor, d) })).filter(x => x.p);
            const any = DIRS.map(d => ({ d, p: nodeAtDir(anchor, d) })).filter(x => x.p);
            const pool = perp.length > 0 ? perp : any;
            if (pool.length === 0) return null; // 锚点无空邻格
            pool.sort((a, b) => freeNeighbors(b.p.c, b.p.r) - freeNeighbors(a.p.c, a.p.r) + (rng() - 0.5));
            const spot = pool[0].p;
            setCell(branch.id, spot.c, spot.r);
        }

        return occupied;
    };

    const MAX_EMBED_TRIES = 40;
    let occupied = null;
    for (let a = 0; a < MAX_EMBED_TRIES && !occupied; a++) {
        for (const n of nodes) n.cell = undefined; // 清上次尝试的残留
        occupied = tryPlace();
    }
    if (!occupied) return null;

    // ── loop：主干深处 → 前段的相邻捷径（不含前厅/Boss/起点） ──
    // 已连边表（spine+branch，用于判定「未连接」；loop 边稍后追加）
    const edgeSet = new Set(edges.map(e => (e.a < e.b ? `${e.a}:${e.b}` : `${e.b}:${e.a}`)));
    const cfg = topologyConfigForFloor(topo.floor || 1);
    if (rng() < cfg.loopChance) {
        // 只在「战斗主干节点」间找：spineIndex 1..spineCombat。
        const combatSpine = spine.filter(id => nodes[id].role === 'combat');
        const candidates = [];
        for (const u of combatSpine) {
            for (const d of DIRS) {
                const c = nodes[u].cell.col + d.dc;
                const r = nodes[u].cell.row + d.dr;
                const vId = occupied.get(cellKey(c, r));
                if (vId === undefined) continue;
                if (nodes[vId].role !== 'combat') continue;
                const gap = Math.abs(nodes[u].spineIndex - nodes[vId].spineIndex);
                if (gap < cfg.loopMinGap) continue;
                const key = u < vId ? `${u}:${vId}` : `${vId}:${u}`;
                if (edgeSet.has(key)) continue;
                candidates.push({ a: Math.min(u, vId), b: Math.max(u, vId), gap, key });
            }
        }
        if (candidates.length > 0) {
            // 去重同一对，取 gap 最大（最像「深处→前段」的捷径）；同 gap 随机。
            const seen = new Set();
            const uniq = [];
            for (const c of candidates) {
                if (seen.has(c.key)) continue;
                seen.add(c.key);
                uniq.push(c);
            }
            uniq.sort((a, b) => (b.gap - a.gap) || (rng() - 0.5));
            const pick = uniq[0];
            edges.push({ a: pick.a, b: pick.b, kind: 'loop' });
        }
    }

    return { cols, rows };
}

/**
 * 组合入口：规划 + 嵌入。成功返回带 cell 的完整拓扑；失败返回 null。
 * @param {Function} rng 种子随机源
 * @param {number} floor 楼层
 * @param {number} cols 网格列数
 * @param {number} rows 网格行数
 */
export function planFloorTopology(rng, floor, cols, rows) {
    const topo = planTopologyGraph(rng, floor);
    topo.floor = floor;
    const grid = embedTopology(topo, cols, rows, rng);
    if (!grid) return null;
    topo.grid = grid;
    return topo;
}
