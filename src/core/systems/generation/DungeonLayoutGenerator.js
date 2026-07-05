import { tileKey, randomInt } from './GenerationUtils.js';
import { applyTemplate } from './RoomInteriorTemplates.js';
import { selectEncounter, placeEncounter, tierForDepth } from './EncounterTemplates.js';
import { getDungeonTheme } from '../../dungeon/DungeonThemes.js';
import { getFloorConfig, getDepthTier } from '../../dungeon/FloorConfigs.js';
// [room-v2:p3] 连接算法 V2：图优先拓扑 + 宏观网格嵌入（默认路径；?layout=v1 回退旧 BSP 算法）。
import { planFloorTopology } from './rooms/FloorTopology.js';

/**
 * Compact dungeon layout generator.
 * Focuses on tighter room clusters, shorter corridors, stronger room identity,
 * and richer tactical cover/decor distribution.
 */

const DUNGEON_CONFIG = {
    // Generate dungeon inside a compact central work area, not the full world map.
    // W4：房间全面加大（容纳叙事化遭遇战模板 13~16 宽），工作区同步扩到 100。
    dungeonBoundsSize: 110,
    mapPadding: 4,

    roomCountMin: 8,
    roomCountMax: 10,
    normalRoomMin: 17,
    normalRoomMax: 22,
    bossRoomMin: 18,
    bossRoomMax: 22,
    startRoomMin: 10,
    startRoomMax: 13,

    corridorWidth: 3,
    bspMinRegion: 22,
    roomPadding: 1,

    // Graph shaping for short corridors.
    neighborLimit: 4,
    edgeDistanceThreshold: 48,
    loopEdgeMaxDistance: 44,
    extraEdgeMin: 1,
    extraEdgeMax: 2,

    // Generation quality gates.
    maxGenerationAttempts: 8,
    maxCorridorLenHard: 130,
    maxCorridorAvg: 65,

    // [room-v2:p3] 宏观网格嵌入参数：cell = 24×20 tile（含房间 + 走廊余量）。
    // 单元尺寸研究：最大遭遇战模板 16×12 → 房 20×16（+4 通带）→ cell 需 ≥ 24×20；
    // Boss（≤22）亦落单格，故本期全节点 1×1（多格 2×1/2×2 在当前尺寸区间无必要，列为后续）。
    gridCellW: 24,
    gridCellH: 20,
    gridRoomMargin: 1,   // 房在 cell 内四周至少留 1 tile（保证相邻房 gap ≥2、走廊短直）
    gridJitter: 2,       // 房在 cell 内的有机抖动幅度（clamp 保证邻接不变、门位重叠充足）
    doorWidth: 3         // 门 / 走廊宽（共享边重叠不足时收窄至 ≥2）
};

function createRng(seed) {
    let s = seed | 0;
    return function() {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

class BSPNode {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.left = null;
        this.right = null;
    }

    isLeaf() {
        return !this.left && !this.right;
    }
}

function splitBSP(node, rng, depth, maxDepth, minSize) {
    if (depth >= maxDepth) return;
    if (node.w < minSize * 2 && node.h < minSize * 2) return;

    let splitH;
    if (node.w > node.h * 1.25) {
        splitH = false;
    } else if (node.h > node.w * 1.25) {
        splitH = true;
    } else {
        splitH = rng() > 0.5;
    }

    const minRatio = 0.38;
    const maxRatio = 0.62;

    if (splitH) {
        if (node.h < minSize * 2) return;
        const splitY = node.y + Math.floor(node.h * (minRatio + rng() * (maxRatio - minRatio)));
        node.left = new BSPNode(node.x, node.y, node.w, splitY - node.y);
        node.right = new BSPNode(node.x, splitY, node.w, node.y + node.h - splitY);
    } else {
        if (node.w < minSize * 2) return;
        const splitX = node.x + Math.floor(node.w * (minRatio + rng() * (maxRatio - minRatio)));
        node.left = new BSPNode(node.x, node.y, splitX - node.x, node.h);
        node.right = new BSPNode(splitX, node.y, node.x + node.w - splitX, node.h);
    }

    splitBSP(node.left, rng, depth + 1, maxDepth, minSize);
    splitBSP(node.right, rng, depth + 1, maxDepth, minSize);
}

function collectLeaves(node) {
    if (node.isLeaf()) return [node];
    const leaves = [];
    if (node.left) leaves.push(...collectLeaves(node.left));
    if (node.right) leaves.push(...collectLeaves(node.right));
    return leaves;
}

function placeRoom(leaf, rng, minW, maxW, minH, maxH, padding) {
    const maxAllowedW = leaf.w - padding * 2;
    const maxAllowedH = leaf.h - padding * 2;

    const rwMin = Math.max(8, Math.min(minW, maxAllowedW));
    const rhMin = Math.max(8, Math.min(minH, maxAllowedH));
    const rwMax = Math.min(maxW, maxAllowedW);
    const rhMax = Math.min(maxH, maxAllowedH);

    if (rwMax < rwMin || rhMax < rhMin) return null;

    const rw = randomInt(rng, rwMin, rwMax);
    const rh = randomInt(rng, rhMin, rhMax);

    const xMin = leaf.x + padding;
    const yMin = leaf.y + padding;
    const xMax = leaf.x + leaf.w - rw - padding;
    const yMax = leaf.y + leaf.h - rh - padding;

    const rx = randomInt(rng, xMin, Math.max(xMin, xMax));
    const ry = randomInt(rng, yMin, Math.max(yMin, yMax));

    return { x: rx, y: ry, w: rw, h: rh };
}

function roomDist(a, b) {
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    return Math.abs(ax - bx) + Math.abs(ay - by);
}

function getRoomCenter(room) {
    return {
        x: room.x + room.w / 2,
        y: room.y + room.h / 2
    };
}

function computeDungeonBounds(mapWidth, mapHeight, cfg) {
    const maxSize = Math.min(mapWidth - cfg.mapPadding * 2, mapHeight - cfg.mapPadding * 2);
    const size = Math.max(48, Math.min(cfg.dungeonBoundsSize, maxSize));
    const x = Math.floor((mapWidth - size) / 2);
    const y = Math.floor((mapHeight - size) / 2);
    return { x, y, w: size, h: size };
}

function selectCompactRooms(rooms, targetCount, center, rng) {
    const scored = rooms
        .map((room, idx) => {
            const c = getRoomCenter(room);
            const dist = Math.abs(c.x - center.x) + Math.abs(c.y - center.y);
            return {
                room,
                idx,
                score: dist + rng() * 4
            };
        })
        .sort((a, b) => a.score - b.score);

    const out = scored.slice(0, targetCount).map(s => ({ ...s.room }));
    for (let i = 0; i < out.length; i++) {
        out[i].id = `dungeon_room_${i}`;
        out[i].connectedTo = [];
    }
    return out;
}

function buildAllDistanceEdges(rooms) {
    const edges = [];
    for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
            edges.push({ a: i, b: j, dist: roomDist(rooms[i], rooms[j]) });
        }
    }
    edges.sort((x, y) => x.dist - y.dist);
    return edges;
}

function edgeKey(a, b) {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function buildConstrainedMST(rooms, allEdges, cfg) {
    if (rooms.length <= 1) return [];

    const byNode = new Map();
    for (let i = 0; i < rooms.length; i++) byNode.set(i, []);
    for (const e of allEdges) {
        byNode.get(e.a).push(e);
        byNode.get(e.b).push(e);
    }

    // Candidate edges: per-node nearest K + global short threshold.
    const candidateKeys = new Set();

    for (let i = 0; i < rooms.length; i++) {
        const nearest = byNode.get(i)
            .slice()
            .sort((x, y) => x.dist - y.dist)
            .slice(0, cfg.neighborLimit);
        for (const e of nearest) candidateKeys.add(edgeKey(e.a, e.b));
    }

    for (const e of allEdges) {
        if (e.dist <= cfg.edgeDistanceThreshold) {
            candidateKeys.add(edgeKey(e.a, e.b));
        }
    }

    const inTree = new Set([0]);
    const mst = [];

    while (inTree.size < rooms.length) {
        let best = null;

        for (const e of allEdges) {
            const aIn = inTree.has(e.a);
            const bIn = inTree.has(e.b);
            if (aIn === bIn) continue;

            const key = edgeKey(e.a, e.b);
            if (!candidateKeys.has(key)) continue;

            if (!best || e.dist < best.dist) best = e;
        }

        // Fallback: connect disconnected pieces using shortest possible edge.
        if (!best) {
            for (const e of allEdges) {
                const aIn = inTree.has(e.a);
                const bIn = inTree.has(e.b);
                if (aIn === bIn) continue;
                if (!best || e.dist < best.dist) best = e;
            }
        }

        if (!best) break;

        mst.push({ a: best.a, b: best.b });
        inTree.add(best.a);
        inTree.add(best.b);
        candidateKeys.add(edgeKey(best.a, best.b));
    }

    return { mst, candidateKeys };
}

function addLoopEdges(mst, allEdges, candidateKeys, rng, cfg) {
    const result = [...mst];
    const existing = new Set(mst.map(e => edgeKey(e.a, e.b)));

    const extraCandidates = allEdges.filter(e => {
        const key = edgeKey(e.a, e.b);
        if (existing.has(key)) return false;
        if (!candidateKeys.has(key)) return false;
        if (e.dist > cfg.loopEdgeMaxDistance) return false;
        return true;
    });

    // Shuffle for variety while staying in short-edge pool.
    for (let i = extraCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [extraCandidates[i], extraCandidates[j]] = [extraCandidates[j], extraCandidates[i]];
    }

    const extraEdgeCount = randomInt(rng, cfg.extraEdgeMin, cfg.extraEdgeMax);
    let added = 0;

    for (const e of extraCandidates) {
        if (added >= extraEdgeCount) break;
        const key = edgeKey(e.a, e.b);
        if (existing.has(key)) continue;
        result.push({ a: e.a, b: e.b });
        existing.add(key);
        added++;
    }

    return result;
}

function computeDepths(rooms, edges, startIdx) {
    const adj = new Map();
    for (let i = 0; i < rooms.length; i++) adj.set(i, []);
    for (const e of edges) {
        adj.get(e.a).push(e.b);
        adj.get(e.b).push(e.a);
    }

    const depths = new Array(rooms.length).fill(-1);
    depths[startIdx] = 0;

    const queue = [startIdx];
    let head = 0;

    while (head < queue.length) {
        const cur = queue[head++];
        for (const nb of adj.get(cur)) {
            if (depths[nb] !== -1) continue;
            depths[nb] = depths[cur] + 1;
            queue.push(nb);
        }
    }

    return { depths, adj };
}

function closestEdgePoints(a, b) {
    const acx = Math.floor(a.x + a.w / 2);
    const acy = Math.floor(a.y + a.h / 2);
    const bcx = Math.floor(b.x + b.w / 2);
    const bcy = Math.floor(b.y + b.h / 2);

    let ax;
    let ay;
    let bx;
    let by;

    const dx = bcx - acx;
    const dy = bcy - acy;

    if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 0) {
            ax = a.x + a.w;
            bx = b.x;
        } else {
            ax = a.x;
            bx = b.x + b.w;
        }

        const overlapTop = Math.max(a.y + 2, b.y + 2);
        const overlapBottom = Math.min(a.y + a.h - 2, b.y + b.h - 2);
        if (overlapTop <= overlapBottom) {
            ay = by = Math.floor((overlapTop + overlapBottom) / 2);
        } else {
            ay = acy;
            by = bcy;
        }
    } else {
        if (dy > 0) {
            ay = a.y + a.h;
            by = b.y;
        } else {
            ay = a.y;
            by = b.y + b.h;
        }

        const overlapLeft = Math.max(a.x + 2, b.x + 2);
        const overlapRight = Math.min(a.x + a.w - 2, b.x + b.w - 2);
        if (overlapLeft <= overlapRight) {
            ax = bx = Math.floor((overlapLeft + overlapRight) / 2);
        } else {
            ax = acx;
            bx = bcx;
        }
    }

    return { ax, ay, bx, by };
}

function generateCorridor(roomA, roomB, corridorWidth, rng) {
    const { ax, ay, bx, by } = closestEdgePoints(roomA, roomB);
    const tiles = new Set();
    const halfWidth = Math.floor(corridorWidth / 2);
    const horizontalFirst = rng() > 0.5;

    if (horizontalFirst) {
        const minX = Math.min(ax, bx);
        const maxX = Math.max(ax, bx);
        for (let x = minX; x <= maxX; x++) {
            for (let d = -halfWidth; d <= halfWidth; d++) {
                tiles.add(tileKey(x, ay + d));
            }
        }

        const minY = Math.min(ay, by);
        const maxY = Math.max(ay, by);
        for (let y = minY; y <= maxY; y++) {
            for (let d = -halfWidth; d <= halfWidth; d++) {
                tiles.add(tileKey(bx + d, y));
            }
        }
    } else {
        const minY = Math.min(ay, by);
        const maxY = Math.max(ay, by);
        for (let y = minY; y <= maxY; y++) {
            for (let d = -halfWidth; d <= halfWidth; d++) {
                tiles.add(tileKey(ax + d, y));
            }
        }

        const minX = Math.min(ax, bx);
        const maxX = Math.max(ax, bx);
        for (let x = minX; x <= maxX; x++) {
            for (let d = -halfWidth; d <= halfWidth; d++) {
                tiles.add(tileKey(x, by + d));
            }
        }
    }

    return tiles;
}

function findGatePositions(rooms, allCorridorTiles) {
    const rawTiles = [];

    for (const room of rooms) {
        for (let x = room.x; x < room.x + room.w; x++) {
            if (allCorridorTiles.has(tileKey(x, room.y - 1))) {
                rawTiles.push({ x, y: room.y, orientation: 'h', roomId: room.id, edge: `top_${room.id}` });
            }
            if (allCorridorTiles.has(tileKey(x, room.y + room.h))) {
                rawTiles.push({ x, y: room.y + room.h - 1, orientation: 'h', roomId: room.id, edge: `bot_${room.id}` });
            }
        }

        for (let y = room.y; y < room.y + room.h; y++) {
            if (allCorridorTiles.has(tileKey(room.x - 1, y))) {
                rawTiles.push({ x: room.x, y, orientation: 'v', roomId: room.id, edge: `left_${room.id}` });
            }
            if (allCorridorTiles.has(tileKey(room.x + room.w, y))) {
                rawTiles.push({ x: room.x + room.w - 1, y, orientation: 'v', roomId: room.id, edge: `right_${room.id}` });
            }
        }
    }

    const edgeGroups = new Map();
    for (const t of rawTiles) {
        if (!edgeGroups.has(t.edge)) edgeGroups.set(t.edge, []);
        edgeGroups.get(t.edge).push(t);
    }

    const gates = [];

    for (const [, tiles] of edgeGroups) {
        if (!tiles.length) continue;

        const orient = tiles[0].orientation;

        if (orient === 'h') {
            tiles.sort((a, b) => a.x - b.x);
            let run = [tiles[0]];
            for (let i = 1; i < tiles.length; i++) {
                if (tiles[i].x === run[run.length - 1].x + 1 && tiles[i].y === run[0].y) {
                    run.push(tiles[i]);
                } else {
                    gates.push(buildGate(run, orient));
                    run = [tiles[i]];
                }
            }
            gates.push(buildGate(run, orient));
        } else {
            tiles.sort((a, b) => a.y - b.y);
            let run = [tiles[0]];
            for (let i = 1; i < tiles.length; i++) {
                if (tiles[i].y === run[run.length - 1].y + 1 && tiles[i].x === run[0].x) {
                    run.push(tiles[i]);
                } else {
                    gates.push(buildGate(run, orient));
                    run = [tiles[i]];
                }
            }
            gates.push(buildGate(run, orient));
        }
    }

    const dedup = new Map();
    for (const g of gates) {
        const key = g.tiles.map(t => `${t.x},${t.y}`).sort().join('|');
        if (!dedup.has(key)) {
            dedup.set(key, g);
            continue;
        }

        const existing = dedup.get(key);
        for (const rid of g.roomIds) {
            if (!existing.roomIds.includes(rid)) existing.roomIds.push(rid);
        }
    }

    return [...dedup.values()];
}

function buildGate(tileRun, orientation) {
    const roomIds = [];
    for (const t of tileRun) {
        if (!roomIds.includes(t.roomId)) roomIds.push(t.roomId);
    }

    return {
        tiles: tileRun.map(t => ({ x: t.x, y: t.y })),
        orientation,
        roomIds
    };
}

function assignRoomCategories(rooms, depths, startIdx, bossIdx, rng) {
    const normalIds = [];
    let maxDepth = 0;
    for (let i = 0; i < rooms.length; i++) {
        if (depths[i] > maxDepth) maxDepth = depths[i];
        if (i !== startIdx && i !== bossIdx) normalIds.push(i);
    }

    // 特殊房分配（每层各 1 间）：
    // treasure（宝箱房）= 最深普通房；elite（精英房）= 次深普通房；
    // shop（商店房）= 深度最接近 50% 的普通房。房间不足时按优先级降级跳过。
    normalIds.sort((a, b) => depths[b] - depths[a]);
    const treasureId = normalIds.length >= 3 ? normalIds[0] : -1;
    const eliteId = normalIds.length >= 4 ? normalIds[1] : -1;
    let shopId = -1;
    if (normalIds.length >= 5) {
        const targetDepth = maxDepth * 0.5;
        let best = Infinity;
        for (const id of normalIds) {
            if (id === treasureId || id === eliteId) continue;
            const diff = Math.abs(depths[id] - targetDepth);
            if (diff < best) {
                best = diff;
                shopId = id;
            }
        }
    }

    for (let i = 0; i < rooms.length; i++) {
        if (i === startIdx) {
            rooms[i].category = 'start';
            continue;
        }
        if (i === bossIdx) {
            rooms[i].category = 'boss_arena';
            continue;
        }

        if (i === treasureId) {
            rooms[i].category = 'treasure';
            continue;
        }
        if (i === eliteId) {
            rooms[i].category = 'elite';
            continue;
        }
        if (i === shopId) {
            rooms[i].category = 'shop';
            continue;
        }

        const d = depths[i];
        const p = maxDepth > 0 ? d / maxDepth : 0;
        const roll = rng();

        if (p < 0.35) {
            rooms[i].category = roll < 0.55 ? 'combat_open' : 'combat_cover';
        } else if (p < 0.7) {
            if (roll < 0.45) rooms[i].category = 'combat_cover';
            else if (roll < 0.82) rooms[i].category = 'combat_maze';
            else rooms[i].category = 'challenge_trapline';
        } else {
            if (roll < 0.25) rooms[i].category = 'combat_cover';
            else if (roll < 0.65) rooms[i].category = 'combat_maze';
            else rooms[i].category = 'challenge_trapline';
        }
    }

    // [tension-batch:verbs] 玩法动词房：从普通战斗房中挑选若干替换为 survival/hunt/pact，
    // 保底每层至少各出现 1 次（选路才有意义）。普通战斗房不足 3 间时不强插（避免独木桥无常规战斗）。
    assignVerbRooms(rooms, rng);
}

/**
 * [tension-batch:verbs] 在普通战斗房中植入三种玩法动词房。
 * 洗牌后取前 N 间（N≈35%，下限 3），按 survival/hunt/pact 轮转赋值——
 * 前三间即覆盖三型，保证同一层三种动词各现 ≥1 次。
 */
function assignVerbRooms(rooms, rng) {
    const COMBAT_CATS = new Set(['combat_open', 'combat_cover', 'combat_maze', 'challenge_trapline']);
    const combatIds = [];
    for (let i = 0; i < rooms.length; i++) {
        if (COMBAT_CATS.has(rooms[i].category)) combatIds.push(i);
    }
    if (combatIds.length < 3) return;

    // Fisher-Yates 洗牌（用生成器 rng，保证同种子可复现）
    for (let i = combatIds.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [combatIds[i], combatIds[j]] = [combatIds[j], combatIds[i]];
    }

    const nConvert = Math.min(combatIds.length, Math.max(3, Math.round(combatIds.length * 0.35)));
    const verbs = ['survival', 'hunt', 'pact'];
    for (let k = 0; k < nConvert; k++) {
        rooms[combatIds[k]].category = verbs[k % verbs.length];
    }
}

/**
 * 房间敌人编成：全部走 FloorConfigs 数据驱动。
 * Boss/精英房固定编成；普通战斗房按 BFS 深度档位取池，权重比例分配数量。
 */
function computeEnemyConfig(roomType, depth, floor, category = 'combat_cover') {
    if (roomType === 'start') {
        return { types: [], count: 0 };
    }

    const config = getFloorConfig(floor);

    if (roomType === 'boss') {
        const types = config.boss.types.map(t => ({ ...t }));
        return { types, count: types.reduce((s, t) => s + t.count, 0) };
    }

    // 宝箱房/商店房：安全区，不刷怪不锁门（宝箱与商品在地图初始化时投放）。
    if (category === 'treasure' || category === 'shop') {
        return { types: [], count: 0 };
    }

    // 精英房：固定精锐小队（词缀强化在 spawn 时叠加）。
    if (category === 'elite') {
        const types = config.eliteSquad.types.map(t => ({ ...t }));
        return { types, count: types.reduce((s, t) => s + t.count, 0) };
    }

    // 普通战斗房：深度档位敌人池，按权重比例分配。
    const tier = getDepthTier(config, depth);
    const count = tier.countMin + Math.floor(Math.random() * (tier.countMax - tier.countMin + 1));

    const entries = Object.entries(tier.weights);
    const totalWeight = entries.reduce((s, [, w]) => s + w, 0);
    const types = [];
    let assigned = 0;
    for (const [type, weight] of entries) {
        const n = Math.max(1, Math.floor(count * (weight / totalWeight)));
        types.push({ type, count: n });
        assigned += n;
    }

    // 差额修正到权重最高的类型（保证 count === Σtypes.count）
    types.sort((a, b) => tier.weights[b.type] - tier.weights[a.type]);
    let diff = count - assigned;
    while (diff !== 0 && types.length > 0) {
        if (diff > 0) {
            types[0].count++;
            diff--;
        } else if (types[0].count > 1) {
            types[0].count--;
            diff++;
        } else {
            break;
        }
    }

    const finalCount = types.reduce((s, t) => s + t.count, 0);
    return { types, count: finalCount };
}

function generateRoomCover(room, rng, interiorWallTiles = new Set(), occupied = new Set()) {
    if (room.type === 'start') return [];

    const covers = [];
    const coverTypes = ['box', 'box', 'box', 'barrel', 'barrel', 'explosive_barrel'];

    const area = (room.w - 4) * (room.h - 4);
    let minCount = 3;
    let maxCount = Math.max(4, Math.floor(area / 22));

    if (room.category === 'combat_open') {
        minCount = 2;
        maxCount = Math.max(3, Math.floor(area / 35));
    } else if (room.category === 'combat_cover') {
        minCount = 4;
        maxCount = Math.max(6, Math.floor(area / 18));
    } else if (room.category === 'challenge_trapline') {
        minCount = 5;
        maxCount = Math.max(7, Math.floor(area / 17));
    } else if (room.category === 'treasure') {
        minCount = 1;
        maxCount = 2;
    } else if (room.category === 'shop') {
        minCount = 0;
        maxCount = 0;
    } else if (room.category === 'elite') {
        minCount = 5;
        maxCount = Math.max(7, Math.floor(area / 16));
    } else if (room.type === 'boss') {
        minCount = 6;
        maxCount = 10;
    }

    const count = randomInt(rng, minCount, Math.min(12, maxCount));
    const cx = Math.floor(room.x + room.w / 2);
    const cy = Math.floor(room.y + room.h / 2);

    // 模板建议掩体位优先落位（计入 count）
    if (Array.isArray(room.templateCoverSpots)) {
        for (const spot of room.templateCoverSpots) {
            if (covers.length >= count) break;
            const key = tileKey(spot.x, spot.y);
            if (occupied.has(key) || interiorWallTiles.has(key)) continue;
            if (spot.x < room.x + 2 || spot.x >= room.x + room.w - 2) continue;
            if (spot.y < room.y + 2 || spot.y >= room.y + room.h - 2) continue;
            occupied.add(key);
            covers.push({
                x: spot.x,
                y: spot.y,
                type: coverTypes[Math.floor(rng() * coverTypes.length)],
                roomId: room.id
            });
        }
    }

    for (let i = covers.length; i < count; i++) {
        for (let attempt = 0; attempt < 24; attempt++) {
            let tx;
            let ty;

            if (room.type === 'boss') {
                const cornerIdx = i % 4;
                const qx = cornerIdx % 2 === 0 ? room.x + 2 : room.x + room.w - 3;
                const qy = cornerIdx < 2 ? room.y + 2 : room.y + room.h - 3;
                tx = qx + randomInt(rng, -1, 1);
                ty = qy + randomInt(rng, -1, 1);
            } else {
                tx = randomInt(rng, room.x + 2, room.x + room.w - 3);
                ty = randomInt(rng, room.y + 2, room.y + room.h - 3);
            }

            // Keep center open for navigation readability.
            if (Math.abs(tx - cx) <= 1 && Math.abs(ty - cy) <= 1) continue;

            let blocked = false;
            for (let dy = -1; dy <= 1 && !blocked; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (interiorWallTiles.has(tileKey(tx + dx, ty + dy))) {
                        blocked = true;
                        break;
                    }
                }
            }
            if (blocked) continue;

            const key = tileKey(tx, ty);
            if (occupied.has(key)) continue;

            let tooClose = false;
            for (const ok of occupied) {
                const [ox, oy] = ok.split(',').map(Number);
                if (Math.abs(tx - ox) <= 1 && Math.abs(ty - oy) <= 1) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            if (tx < room.x + 2 || tx >= room.x + room.w - 2) continue;
            if (ty < room.y + 2 || ty >= room.y + room.h - 2) continue;

            occupied.add(key);
            const type = coverTypes[Math.floor(rng() * coverTypes.length)];
            covers.push({ x: tx, y: ty, type, roomId: room.id });
            break;
        }
    }

    return covers;
}

function pickWeighted(weights, rng) {
    let total = 0;
    for (const k in weights) total += weights[k];
    if (total <= 0) return null;
    let roll = rng() * total;
    for (const k in weights) {
        roll -= weights[k];
        if (roll <= 0) return k;
    }
    return null;
}

/**
 * 房间装饰：特殊房固定件（Boss 对称雕像/精英旗帜/宝箱房祭坛）+
 * 楼层主题加权随机件，密度按房间类别驱动。
 */
function generateRoomDecor(room, rng, interiorWallTiles = new Set(), occupied = new Set(), decorWeights = null) {
    if (room.type === 'start') return [];

    const weights = decorWeights || { dungeon_rubble: 3, dungeon_bone_pile: 2, dungeon_iron_cage: 1 };
    const out = [];
    const centerX = room.x + Math.floor(room.w / 2);
    const centerY = room.y + Math.floor(room.h / 2);

    const tryPlace = (tx, ty, type) => {
        if (tx < room.x + 2 || tx > room.x + room.w - 3) return false;
        if (ty < room.y + 2 || ty > room.y + room.h - 3) return false;
        const key = tileKey(tx, ty);
        if (occupied.has(key) || interiorWallTiles.has(key)) return false;
        // Keep gates/major passages cleaner: avoid strict center cross.
        if (Math.abs(tx - centerX) <= 1 && Math.abs(ty - centerY) <= 1) return false;
        occupied.add(key);
        out.push({ x: tx, y: ty, type, roomId: room.id });
        return true;
    };

    // 特殊房固定装饰
    if (room.type === 'boss') {
        tryPlace(room.x + 2, centerY - 2, 'dungeon_statue');
        tryPlace(room.x + room.w - 3, centerY - 2, 'dungeon_statue');
    } else if (room.category === 'elite') {
        tryPlace(centerX - 2, room.y + 2, 'dungeon_banner');
        tryPlace(centerX + 2, room.y + 2, 'dungeon_banner');
    } else if (room.category === 'treasure') {
        tryPlace(centerX, centerY - 3, 'dungeon_altar');
    } else if (room.category === 'shop') {
        // 商店保持整洁，仅角落一件氛围装饰
        tryPlace(room.x + 2, room.y + 2, 'dungeon_banner');
        return out;
    }

    // 随机装饰（类别驱动密度）
    let minCount = 2;
    let maxCount = 4;
    if (room.category === 'combat_open') { minCount = 1; maxCount = 3; }
    else if (room.category === 'combat_maze' || room.category === 'challenge_trapline') { minCount = 3; maxCount = 6; }
    else if (room.category === 'treasure') { minCount = 1; maxCount = 2; }

    const count = randomInt(rng, minCount, maxCount);
    for (let i = 0; i < count; i++) {
        const type = pickWeighted(weights, rng);
        if (!type) break;
        for (let attempt = 0; attempt < 20; attempt++) {
            const tx = randomInt(rng, room.x + 2, room.x + room.w - 3);
            const ty = randomInt(rng, room.y + 2, room.y + room.h - 3);
            if (tryPlace(tx, ty, type)) break;
        }
    }

    return out;
}

/**
 * 特殊房间火盆布点（Boss 四角/精英对角/宝箱房与商店房中轴两侧）。
 * 火盆为阻挡型可破坏发光装饰，与掩体/装饰共用 occupied 防重叠。
 */
function generateRoomBraziers(room, interiorWallTiles, occupied) {
    const spots = [];
    const inset = 2;
    const left = room.x + inset;
    const right = room.x + room.w - 1 - inset;
    const top = room.y + inset;
    const bottom = room.y + room.h - 1 - inset;
    const cx = room.x + Math.floor(room.w / 2);
    const cy = room.y + Math.floor(room.h / 2);

    if (room.type === 'boss') {
        spots.push([left, top], [right, top], [left, bottom], [right, bottom]);
    } else if (room.category === 'elite') {
        spots.push([left, top], [right, bottom]);
    } else if (room.category === 'treasure') {
        spots.push([cx - 3, cy - 1], [cx + 3, cy - 1]);
    } else if (room.category === 'shop') {
        spots.push([cx - 4, cy - 1], [cx + 4, cy - 1]);
    } else if (room.type === 'normal') {
        // 普通战斗房：角落火盆照亮房间中部（火把只能挂北墙，没有它房间中央是死黑）
        const area = room.w * room.h;
        if (area >= 300) {
            spots.push([left, bottom], [right, top], [right, bottom]);
        } else if (area >= 170) {
            spots.push([left, bottom], [right, top]);
        } else {
            spots.push([left, bottom]);
        }
    }

    const out = [];
    for (const [tx, ty] of spots) {
        if (tx < room.x + 1 || tx > room.x + room.w - 2) continue;
        if (ty < room.y + 1 || ty > room.y + room.h - 2) continue;
        const key = tileKey(tx, ty);
        if (occupied.has(key) || interiorWallTiles.has(key)) continue;
        occupied.add(key);
        out.push({ x: tx, y: ty, type: 'dungeon_brazier', roomId: room.id });
    }
    return out;
}

/**
 * 房间地板贴花：Boss 房保底圆环刻纹 + 角落蛛网 + 主题加权散布贴花。
 * 坐标为 tile 浮点（含亚 tile 抖动），WorldSystem 盖印时乘 TILE_SIZE。
 */
function generateRoomDecals(room, rng, interiorWallTiles, decalWeights) {
    const out = [];
    if (room.type === 'start') return out;

    if (room.type === 'boss') {
        out.push({ kind: 'boss_ring', x: room.x + room.w / 2, y: room.y + room.h / 2, variant: 0 });
    }

    // 角落蛛网
    if ((decalWeights.web || 0) > 0) {
        const corners = [
            [room.x + 1, room.y + 1],
            [room.x + room.w - 2, room.y + 1],
            [room.x + 1, room.y + room.h - 2],
            [room.x + room.w - 2, room.y + room.h - 2]
        ];
        for (const [cx, cy] of corners) {
            if (rng() < 0.35 && !interiorWallTiles.has(tileKey(cx, cy))) {
                out.push({ kind: 'web', x: cx, y: cy, variant: 0 });
            }
        }
    }

    // 散布贴花（血迹/裂纹/苔藓/水洼/散页，主题配比；干净路线降密）
    const count = randomInt(rng, 1, 3);
    for (let i = 0; i < count; i++) {
        const kind = pickWeighted(decalWeights, rng);
        if (!kind || kind === 'web') continue;
        const tx = randomInt(rng, room.x + 1, room.x + room.w - 3);
        const ty = randomInt(rng, room.y + 1, room.y + room.h - 3);
        if (interiorWallTiles.has(tileKey(tx, ty))) continue;
        out.push({
            kind,
            x: tx + rng() * 0.5,
            y: ty + rng() * 0.5,
            variant: Math.floor(rng() * 2)
        });
    }

    return out;
}

/**
 * 走廊稀疏贴花（每条走廊 40% 概率 1 个）。
 */
function generateCorridorDecals(corridors, rng, decalWeights) {
    const out = [];
    for (const corridor of corridors) {
        const n = rng() < 0.4 ? 1 : 0;
        for (let i = 0; i < n && corridor.tiles.length > 0; i++) {
            const kind = pickWeighted(decalWeights, rng);
            if (!kind || kind === 'web') continue;
            const t = corridor.tiles[Math.floor(rng() * corridor.tiles.length)];
            out.push({ kind, x: t.x, y: t.y, variant: Math.floor(rng() * 2) });
        }
    }
    return out;
}

/**
 * 壁挂火把布点：所有「南邻为地板」的墙面（房间北墙/走廊北壁/内部结构南面）
 * 按连续墙段等距布置（段长 ≥3，间距 6，段首抖动）。
 */
function generateTorchPlacements(wallTiles, floorTiles, rng) {
    const rows = new Map();
    for (const key of wallTiles) {
        const [wx, wy] = key.split(',').map(Number);
        if (!floorTiles.has(tileKey(wx, wy + 1))) continue;
        if (!rows.has(wy)) rows.set(wy, []);
        rows.get(wy).push(wx);
    }

    const torches = [];
    const SPACING = 5;
    const sortedRows = [...rows.keys()].sort((a, b) => a - b);

    for (const wy of sortedRows) {
        const xs = rows.get(wy).sort((a, b) => a - b);
        const flushRun = (start, end) => {
            const len = end - start + 1;
            if (len < 3) return;
            const first = start + 1 + Math.floor(rng() * Math.min(2, len - 2));
            for (let x = first; x <= end - 1; x += SPACING) {
                torches.push({ x, y: wy, type: 'dungeon_torch' });
            }
        };

        let runStart = null;
        let prev = null;
        for (const x of xs) {
            if (runStart === null) {
                runStart = prev = x;
                continue;
            }
            if (x === prev + 1) {
                prev = x;
                continue;
            }
            flushRun(runStart, prev);
            runStart = prev = x;
        }
        if (runStart !== null) flushRun(runStart, prev);
    }

    return torches;
}

function buildMinimapGraph(rooms, edges, bounds) {
    const gridSize = 14;
    const occupied = new Set();

    const nodes = rooms.map(room => {
        const c = getRoomCenter(room);
        const nx = bounds.w > 1 ? (c.x - bounds.x) / (bounds.w - 1) : 0.5;
        const ny = bounds.h > 1 ? (c.y - bounds.y) / (bounds.h - 1) : 0.5;

        let gx = Math.max(0, Math.min(gridSize - 1, Math.round(nx * (gridSize - 1))));
        let gy = Math.max(0, Math.min(gridSize - 1, Math.round(ny * (gridSize - 1))));

        // Resolve collisions with a small spiral search.
        if (occupied.has(tileKey(gx, gy))) {
            let placed = false;
            for (let radius = 1; radius <= 5 && !placed; radius++) {
                for (let dy = -radius; dy <= radius && !placed; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
                        const sx = gx + dx;
                        const sy = gy + dy;
                        if (sx < 0 || sx >= gridSize || sy < 0 || sy >= gridSize) continue;
                        const sk = tileKey(sx, sy);
                        if (occupied.has(sk)) continue;
                        gx = sx;
                        gy = sy;
                        placed = true;
                        break;
                    }
                }
            }
        }

        occupied.add(tileKey(gx, gy));

        return {
            id: room.id,
            gx,
            gy,
            type: room.type,
            category: room.category,
            depth: room.depth
        };
    });

    return {
        nodes,
        edges: edges.map(e => ({ a: rooms[e.a].id, b: rooms[e.b].id }))
    };
}

function computeCorridorMetrics(corridors) {
    if (!corridors.length) {
        return { avg: 0, max: 0 };
    }

    let total = 0;
    let max = 0;

    for (const c of corridors) {
        const len = c.tiles.length;
        total += len;
        if (len > max) max = len;
    }

    return {
        avg: total / corridors.length,
        max
    };
}

function generateDungeonLayoutAttemptV1(mapWidth, mapHeight, rng, floor, cfg) {
    const theme = getDungeonTheme(floor);
    const bounds = computeDungeonBounds(mapWidth, mapHeight, cfg);

    const root = new BSPNode(
        bounds.x + cfg.mapPadding,
        bounds.y + cfg.mapPadding,
        bounds.w - cfg.mapPadding * 2,
        bounds.h - cfg.mapPadding * 2
    );

    const maxDepth = 4 + Math.floor(rng() * 2);
    splitBSP(root, rng, 0, maxDepth, cfg.bspMinRegion);

    const leaves = collectLeaves(root);
    const candidates = [];

    for (const leaf of leaves) {
        const room = placeRoom(
            leaf,
            rng,
            cfg.normalRoomMin,
            cfg.normalRoomMax,
            cfg.normalRoomMin,
            cfg.normalRoomMax,
            cfg.roomPadding
        );
        if (room) candidates.push(room);
    }

    if (candidates.length < cfg.roomCountMin) {
        throw new Error(`Dungeon generation failed: too few candidate rooms (${candidates.length})`);
    }

    const center = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
    const targetCount = randomInt(
        rng,
        cfg.roomCountMin,
        Math.min(cfg.roomCountMax, candidates.length)
    );

    const rooms = selectCompactRooms(candidates, targetCount, center, rng);

    // Start room: closest to center.
    let startIdx = 0;
    let minCenterDist = Infinity;
    for (let i = 0; i < rooms.length; i++) {
        const c = getRoomCenter(rooms[i]);
        const dist = Math.abs(c.x - center.x) + Math.abs(c.y - center.y);
        if (dist < minCenterDist) {
            minCenterDist = dist;
            startIdx = i;
        }
    }

    const allEdges = buildAllDistanceEdges(rooms);
    const { mst, candidateKeys } = buildConstrainedMST(rooms, allEdges, cfg);

    if (mst.length < rooms.length - 1) {
        throw new Error('Dungeon generation failed: graph disconnected');
    }

    const graphEdges = addLoopEdges(mst, allEdges, candidateKeys, rng, cfg);

    for (const room of rooms) {
        room.connectedTo = [];
    }

    for (const e of graphEdges) {
        rooms[e.a].connectedTo.push(rooms[e.b].id);
        rooms[e.b].connectedTo.push(rooms[e.a].id);
    }

    const { depths } = computeDepths(rooms, graphEdges, startIdx);

    let bossIdx = startIdx;
    let bestDepth = -1;
    let bestArea = -1;

    for (let i = 0; i < rooms.length; i++) {
        if (i === startIdx) continue;

        const d = depths[i];
        const area = rooms[i].w * rooms[i].h;

        if (d > bestDepth || (d === bestDepth && area > bestArea)) {
            bestDepth = d;
            bestArea = area;
            bossIdx = i;
        }
    }

    for (let i = 0; i < rooms.length; i++) {
        rooms[i].depth = depths[i];
        if (i === startIdx) rooms[i].type = 'start';
        else if (i === bossIdx) rooms[i].type = 'boss';
        else rooms[i].type = 'normal';
    }

    assignRoomCategories(rooms, depths, startIdx, bossIdx, rng);

    selectAndShrinkEncounters(rooms, rng, floor);

    const { corridors, allCorridorTiles } = buildCorridorsV1(rooms, graphEdges, cfg, rng);

    return finalizeLayout({
        rooms, graphEdges, corridors, allCorridorTiles,
        startIdx, bossIdx, bounds, floor, theme, cfg, rng
    });
}

/**
 * [room-v2:p3] 遭遇战定形（v1/v2 共用）：把战斗房收缩到所选模板尺寸 + 2 tile 通带，房心不变。
 * category/type 已由前置阶段（v1 assignRoomCategories / v2 拓扑规划）定好，此处只按 isCombatRoom
 * 选模板并写 room.encounterParsed。契约房用空旷布景，不套遭遇战模板。
 */
function selectAndShrinkEncounters(rooms, rng, floor) {
    // ── 战斗房定形（Gungeon 式：房间尺寸=模板尺寸+2 tile 通带） ──
    // 在走廊/门/地板生成之前收缩房间到所选模板大小（房心保持），
    // 根治「随机大矩形里居中放小模板」造成的四周空旷带。
    const usedEncounterIds = new Set();
    for (const room of rooms) {
        const isCombatRoom = room.type === 'normal'
            && room.category !== 'treasure'
            && room.category !== 'shop'
            && room.category !== 'elite'
            // [tension-batch:verbs] 契约房用空旷布景（拉杆居中、开战前可自由穿行），不套遭遇战模板
            && room.category !== 'pact';
        if (!isCombatRoom) continue;

        // [room-v2:p1] selectEncounter 返回 RoomPlan（IR）；id 迁入 meta，w/h 不变。
        const plan = selectEncounter(tierForDepth(room.depth), room.w - 4, room.h - 4, rng, usedEncounterIds, floor);
        if (!plan) continue;
        usedEncounterIds.add(plan.meta.id);

        const newW = plan.w + 4;
        const newH = plan.h + 4;
        const cx = room.x + Math.floor(room.w / 2);
        const cy = room.y + Math.floor(room.h / 2);
        room.x = cx - Math.floor(newW / 2);
        room.y = cy - Math.floor(newH / 2);
        room.w = newW;
        room.h = newH;
        room.encounterParsed = plan;
    }
}

/**
 * [room-v2:p3] v1 走廊：房心最近边点 + L 形肘线（保留旧几何，供 ?layout=v1 回退）。
 */
function buildCorridorsV1(rooms, graphEdges, cfg, rng) {
    const allCorridorTiles = new Set();
    const corridors = [];

    for (const edge of graphEdges) {
        const tiles = generateCorridor(rooms[edge.a], rooms[edge.b], cfg.corridorWidth, rng);
        const tileArray = [...tiles].map(k => {
            const [x, y] = k.split(',').map(Number);
            return { x, y };
        });

        corridors.push({
            id: `corridor_${corridors.length}`,
            tiles: tileArray,
            connectsRooms: [rooms[edge.a].id, rooms[edge.b].id]
        });

        for (const t of tiles) allCorridorTiles.add(t);
    }

    return { corridors, allCorridorTiles };
}

/**
 * [room-v2:p3] 布局收尾（v1/v2 共用）：走廊质量闸 → 地板/门/墙 → 遭遇战放置/模板墙 →
 * 掩体/装饰/光源/贴花/编成 → 小地图图 → 返回完整 layout（下游契约字段不变）。
 * rng 消费顺序与旧实现逐字一致（走廊在各自 attempt 内先消费，进入本函数后依次消费
 * applyTemplate → 掩体/装饰/贴花），故 v1 路径行为等价。
 */
function finalizeLayout(ctx) {
    const { rooms, graphEdges, corridors, allCorridorTiles, startIdx, bossIdx, bounds, floor, theme, cfg, rng } = ctx;

    const corridorMetrics = computeCorridorMetrics(corridors);
    if (corridorMetrics.max > cfg.maxCorridorLenHard || corridorMetrics.avg > cfg.maxCorridorAvg) {
        throw new Error(`Dungeon generation failed: corridor quality max=${corridorMetrics.max}, avg=${corridorMetrics.avg.toFixed(1)}`);
    }

    const floorTiles = new Set();

    for (const room of rooms) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                floorTiles.add(tileKey(x, y));
            }
        }
    }

    for (const t of allCorridorTiles) {
        floorTiles.add(t);
    }

    const gates = findGatePositions(rooms, allCorridorTiles);

    const interiorWallTiles = new Set();
    const pitTiles = new Set();
    const usedTemplateIds = new Set();
    // 每房间地板材质覆写（模板 floorType 字段 → WorldSystem 铺地时应用）
    const floorOverrides = [];

    for (const room of rooms) {
        // 遭遇战房（定形阶段已选定模板）：铺设墙/坑/掩体/出怪点/道具
        if (room.encounterParsed) {
            const placed = placeEncounter(room.encounterParsed, room);
            room.encounter = placed;
            if (placed.floorType) {
                floorOverrides.push({
                    x: room.x + 1, y: room.y + 1,
                    w: room.w - 2, h: room.h - 2,
                    floorType: placed.floorType
                });
            }
            // [room-v2:p2] 逐格地板层：代码构建器 floor.checker/scatter/border 产 1x1 覆写，
            // 置于整房 floorType 之后 → 逐格精确色胜出（渐变污渍/棋盘拼花即由此渲染）。
            for (const c of (placed.floorCells || [])) {
                floorOverrides.push({ x: c.x, y: c.y, w: 1, h: 1, floorType: c.floorType });
            }
            for (const w of placed.walls) {
                const key = tileKey(w.x, w.y);
                interiorWallTiles.add(key);
                floorTiles.delete(key);
            }
            // 坑保留在 floorTiles（避免坑周长墙），类型由 pitTiles 标记
            for (const p of (placed.pits || [])) {
                pitTiles.add(tileKey(p.x, p.y));
            }
            continue;
        }

        const result = applyTemplate(room, rng, usedTemplateIds);
        // 模板建议掩体位（generateRoomCover 优先消费）
        if (Array.isArray(result.coverSpots) && result.coverSpots.length > 0) {
            room.templateCoverSpots = result.coverSpots;
        }
        if (!result.walls || result.walls.length === 0) continue;

        for (const w of result.walls) {
            const key = tileKey(w.x, w.y);
            interiorWallTiles.add(key);
            floorTiles.delete(key);
        }
    }

    const wallTiles = new Set();
    for (const key of floorTiles) {
        const [fx, fy] = key.split(',').map(Number);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nk = tileKey(fx + dx, fy + dy);
                if (!floorTiles.has(nk)) {
                    wallTiles.add(nk);
                }
            }
        }
    }

    // Merge interior walls as hard walls.
    for (const key of interiorWallTiles) {
        wallTiles.add(key);
    }

    // Gate tiles should remain passable floor when unlocked.
    for (const g of gates) {
        for (const t of g.tiles) {
            const gk = tileKey(t.x, t.y);
            wallTiles.delete(gk);
            floorTiles.add(gk);
        }
    }

    const decorObjects = [];
    const coverObjects = [];
    const lightObjects = [];
    const decals = [];

    const coverTypes = ['box', 'box', 'box', 'barrel', 'barrel', 'explosive_barrel'];

    for (const room of rooms) {
        room.spawnPoints = [];
        for (let y = room.y + 2; y < room.y + room.h - 2; y++) {
            for (let x = room.x + 2; x < room.x + room.w - 2; x++) {
                const key = tileKey(x, y);
                if (interiorWallTiles.has(key) || pitTiles.has(key)) continue;
                room.spawnPoints.push({ x, y });
            }
        }

        // 遭遇战房：编成/掩体/装饰全部来自模板（角色→敌人映射在 spawn 时按楼层做）
        if (room.encounter) {
            room.enemyConfig = { types: [], count: room.encounter.spawns.length };
            room.encounterSpawns = room.encounter.spawns;

            const occupied = new Set();
            for (const c of room.encounter.covers) occupied.add(tileKey(c.x, c.y));
            for (const dPos of room.encounter.decors) occupied.add(tileKey(dPos.x, dPos.y));
            for (const p of (room.encounter.props || [])) occupied.add(tileKey(p.x, p.y));
            for (const s of room.encounter.spawns) occupied.add(tileKey(s.x, s.y));

            lightObjects.push(...generateRoomBraziers(room, interiorWallTiles, occupied));

            for (const c of room.encounter.covers) {
                coverObjects.push({
                    x: c.x,
                    y: c.y,
                    type: coverTypes[Math.floor(rng() * coverTypes.length)],
                    roomId: room.id
                });
            }
            for (const dPos of room.encounter.decors) {
                const type = pickWeighted(theme.decorWeights, rng) || 'dungeon_rubble';
                decorObjects.push({ x: dPos.x, y: dPos.y, type, roomId: room.id });
            }
            // 叙事道具（legend 指定的具体家具：桌椅/书架/牢栏/刑架…环境叙事词汇）
            for (const p of (room.encounter.props || [])) {
                decorObjects.push({ x: p.x, y: p.y, type: p.type, roomId: room.id });
            }

            decals.push(...generateRoomDecals(room, rng, interiorWallTiles, theme.decalWeights));
            continue;
        }

        // 特殊房/兜底路径：池化编成 + 随机掩体装饰
        room.enemyConfig = computeEnemyConfig(room.type, room.depth, floor, room.category);

        const occupied = new Set();
        // 火盆先于掩体/装饰落位，保证特殊房固定光源不被随机件挤掉
        const roomBraziers = generateRoomBraziers(room, interiorWallTiles, occupied);
        lightObjects.push(...roomBraziers);

        const roomCovers = generateRoomCover(room, rng, interiorWallTiles, occupied);
        coverObjects.push(...roomCovers);

        const roomDecor = generateRoomDecor(room, rng, interiorWallTiles, occupied, theme.decorWeights);
        decorObjects.push(...roomDecor);

        decals.push(...generateRoomDecals(room, rng, interiorWallTiles, theme.decalWeights));
    }

    // 壁挂火把（依赖最终 wallTiles/floorTiles，门 tile 已被剔除）
    lightObjects.push(...generateTorchPlacements(wallTiles, floorTiles, rng));

    // 走廊稀疏贴花
    decals.push(...generateCorridorDecals(corridors, rng, theme.decalWeights));

    const graph = buildMinimapGraph(rooms, graphEdges, bounds);

    return {
        rooms,
        corridors,
        gates,
        wallTiles,
        floorTiles,
        pitTiles,
        floorOverrides,
        coverObjects,
        decorObjects,
        lightObjects,
        decals,
        startRoomId: rooms[startIdx].id,
        bossRoomId: rooms[bossIdx].id,
        floor,
        bounds,
        graph,
        metrics: {
            roomCount: rooms.length,
            corridorAvg: corridorMetrics.avg,
            corridorMax: corridorMetrics.max
        }
    };
}

// ───────────────────────── [room-v2:p3] 连接算法 V2 ─────────────────────────

/**
 * [room-v2:p3] 网格规格：从工作区 bounds 切出 cols×rows 的 cell 网格并居中放置。
 */
function computeGridSpec(bounds, cfg) {
    const availW = bounds.w - cfg.mapPadding * 2;
    const availH = bounds.h - cfg.mapPadding * 2;
    const cols = Math.max(3, Math.floor(availW / cfg.gridCellW));
    const rows = Math.max(3, Math.floor(availH / cfg.gridCellH));
    const gridW = cols * cfg.gridCellW;
    const gridH = rows * cfg.gridCellH;
    return {
        cols, rows,
        w: cfg.gridCellW, h: cfg.gridCellH,
        originX: bounds.x + cfg.mapPadding + Math.floor((availW - gridW) / 2),
        originY: bounds.y + cfg.mapPadding + Math.floor((availH - gridH) / 2),
        roomMargin: cfg.gridRoomMargin,
        jitter: cfg.gridJitter
    };
}

/**
 * [room-v2:p3] 按拓扑角色定房间尺寸（受 cell 上限约束）。
 * 战斗/前厅/生存/猎杀房先给 cell 最大（供选大模板），随后 selectAndShrinkEncounters 收缩到模板；
 * 其余角色为固定尺寸功能房；契约房固定中等（不套模板）。
 */
function roomSizeForRole(node, cell, rng) {
    const maxW = cell.w - cell.roomMargin * 2;
    const maxH = cell.h - cell.roomMargin * 2;
    const fit = (w, h) => ({ rw: Math.min(w, maxW), rh: Math.min(h, maxH) });

    switch (node.role) {
        case 'start':
            return fit(randomInt(rng, 11, 13), randomInt(rng, 10, 12));
        case 'boss':
            return { rw: maxW, rh: maxH }; // 填满单元 → 大型 Boss 竞技场
        case 'treasure':
            return fit(randomInt(rng, 14, 17), randomInt(rng, 12, 14));
        case 'shop':
            return fit(randomInt(rng, 15, 18), randomInt(rng, 12, 14));
        case 'elite':
            return fit(randomInt(rng, 16, 19), randomInt(rng, 13, 15));
        default:
            // combat / antechamber：契约房固定中等，其余（含 survival/hunt）给最大待收缩。
            if (node.category === 'pact') return fit(randomInt(rng, 15, 18), randomInt(rng, 12, 14));
            return { rw: maxW, rh: maxH };
    }
}

function clampVal(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * [room-v2:p3] 由已嵌入 cell 的拓扑节点物化房间矩形：每房居中于其 cell + 有机抖动，
 * clamp 保证四周 ≥roomMargin（相邻房 gap ≥2、门位重叠充足）。
 */
function materializeRoomsFromTopology(topo, cell, rng) {
    const rooms = new Array(topo.nodes.length);
    for (const node of topo.nodes) {
        const { col, row } = node.cell;
        const cellX = cell.originX + col * cell.w;
        const cellY = cell.originY + row * cell.h;
        const { rw, rh } = roomSizeForRole(node, cell, rng);
        const m = cell.roomMargin;
        const baseX = cellX + Math.floor((cell.w - rw) / 2);
        const baseY = cellY + Math.floor((cell.h - rh) / 2);
        const x = clampVal(baseX + randomInt(rng, -cell.jitter, cell.jitter), cellX + m, cellX + cell.w - m - rw);
        const y = clampVal(baseY + randomInt(rng, -cell.jitter, cell.jitter), cellY + m, cellY + cell.h - m - rh);
        rooms[node.id] = {
            x, y, w: rw, h: rh,
            id: `dungeon_room_${node.id}`,
            type: node.type,
            category: node.category,
            connectedTo: []
        };
    }
    return rooms;
}

/**
 * [room-v2:p3] 读遭遇战模板 doorSlots 建议门位（RoomBuilder R.door(side,offset)，offset∈[0,1]）。
 * 现有模板均未标注 → 恒返回 null（走共享边重叠中点）；此为规范预留消费口。
 */
function doorSlotOffset(room, side) {
    const slots = room && room.encounterParsed && room.encounterParsed.doorSlots;
    if (!slots || slots.length === 0) return null;
    const hit = slots.find(s => s.side === side);
    return hit ? clampVal(hit.offset, 0, 1) : null;
}

/** [room-v2:p3] 门在共享重叠段 [lo,hi] 内的起始坐标：默认取中点；有 doorSlot 则按归一化偏移。 */
function doorStart(lo, hi, width, slotOffset) {
    const span = hi - lo + 1;
    const start = (slotOffset != null)
        ? lo + Math.round(slotOffset * (span - width))
        : lo + Math.floor((span - width) / 2);
    return clampVal(start, lo, hi - width + 1);
}

/**
 * [room-v2:p3] 相邻格两房的短直走廊 tile：门开在共享格边两房投影重叠段中点（doorSlots 优先），
 * 走廊 = 门宽 × 间隙长的直段，永不斜穿、永不交叉（各走廊独占其相邻格间隙）。
 * 重叠不足返回 null（触发重试）。
 */
function straightCorridorTiles(A, B, cellA, cellB, cfg) {
    const dCol = cellB.col - cellA.col;
    const dRow = cellB.row - cellA.row;

    if (dRow === 0 && Math.abs(dCol) === 1) {
        const left = dCol > 0 ? A : B;
        const right = dCol > 0 ? B : A;
        const gapStart = left.x + left.w;
        const gapEnd = right.x - 1;
        if (gapStart > gapEnd) return null;
        const top = Math.max(left.y, right.y);
        const bot = Math.min(left.y + left.h, right.y + right.h) - 1;
        if (bot - top + 1 < 2) return null;
        const width = Math.min(cfg.doorWidth, bot - top + 1);
        const slot = doorSlotOffset(left, 'E') ?? doorSlotOffset(right, 'W');
        const dy0 = doorStart(top, bot, width, slot);
        const tiles = new Set();
        for (let x = gapStart; x <= gapEnd; x++) {
            for (let dy = 0; dy < width; dy++) tiles.add(tileKey(x, dy0 + dy));
        }
        return tiles;
    }

    if (dCol === 0 && Math.abs(dRow) === 1) {
        const up = dRow > 0 ? A : B;
        const down = dRow > 0 ? B : A;
        const gapStart = up.y + up.h;
        const gapEnd = down.y - 1;
        if (gapStart > gapEnd) return null;
        const lft = Math.max(up.x, down.x);
        const rgt = Math.min(up.x + up.w, down.x + down.w) - 1;
        if (rgt - lft + 1 < 2) return null;
        const width = Math.min(cfg.doorWidth, rgt - lft + 1);
        const slot = doorSlotOffset(up, 'S') ?? doorSlotOffset(down, 'N');
        const dx0 = doorStart(lft, rgt, width, slot);
        const tiles = new Set();
        for (let y = gapStart; y <= gapEnd; y++) {
            for (let dx = 0; dx < width; dx++) tiles.add(tileKey(dx0 + dx, y));
        }
        return tiles;
    }

    return null; // 非相邻格（不应出现）
}

/**
 * [room-v2:p3] v2 走廊：按拓扑图边逐一在相邻格间隙落短直走廊（开门纪律）。
 */
function buildCorridorsV2(rooms, graphEdges, nodes, cell, cfg) {
    const allCorridorTiles = new Set();
    const corridors = [];
    for (const edge of graphEdges) {
        const A = rooms[edge.a];
        const B = rooms[edge.b];
        const tiles = straightCorridorTiles(A, B, nodes[edge.a].cell, nodes[edge.b].cell, cfg);
        if (!tiles || tiles.size === 0) {
            throw new Error(`room-v2:p3 走廊落位失败（门位重叠不足）: ${A.id}<->${B.id}`);
        }
        const tileArray = [...tiles].map(k => {
            const [x, y] = k.split(',').map(Number);
            return { x, y };
        });
        corridors.push({
            id: `corridor_${corridors.length}`,
            tiles: tileArray,
            connectsRooms: [A.id, B.id]
        });
        for (const t of tiles) allCorridorTiles.add(t);
    }
    return { corridors, allCorridorTiles };
}

/**
 * [room-v2:p3] V2 单次尝试：图优先拓扑 + 宏观网格嵌入 + 开门纪律，复用共用收尾。
 */
function generateDungeonLayoutAttemptV2(mapWidth, mapHeight, rng, floor, cfg) {
    const theme = getDungeonTheme(floor);
    const bounds = computeDungeonBounds(mapWidth, mapHeight, cfg);
    const cell = computeGridSpec(bounds, cfg);

    const topo = planFloorTopology(rng, floor, cell.cols, cell.rows);
    if (!topo) throw new Error('room-v2:p3 拓扑嵌入失败（网格放不下）');

    const rooms = materializeRoomsFromTopology(topo, cell, rng);

    const graphEdges = topo.edges.map(e => ({ a: e.a, b: e.b }));
    for (const room of rooms) room.connectedTo = [];
    for (const e of graphEdges) {
        rooms[e.a].connectedTo.push(rooms[e.b].id);
        rooms[e.b].connectedTo.push(rooms[e.a].id);
    }

    const startIdx = topo.startId;
    const bossIdx = topo.bossId;

    // 深度：BFS from start（含 loop 捷径）→ 敌人档位（category 已在拓扑期定，此处不再事后贴标签）
    const { depths } = computeDepths(rooms, graphEdges, startIdx);
    for (let i = 0; i < rooms.length; i++) rooms[i].depth = depths[i];

    selectAndShrinkEncounters(rooms, rng, floor);

    const { corridors, allCorridorTiles } = buildCorridorsV2(rooms, graphEdges, topo.nodes, cell, cfg);

    return finalizeLayout({
        rooms, graphEdges, corridors, allCorridorTiles,
        startIdx, bossIdx, bounds, floor, theme, cfg, rng
    });
}

/**
 * [room-v2:p3] 多次尝试跑一个 attempt 函数（换种子重试），全失败抛最后错误。
 */
function runAttempts(attemptFn, mapWidth, mapHeight, baseSeed, floor, cfg) {
    let lastErr = null;
    for (let attempt = 0; attempt < cfg.maxGenerationAttempts; attempt++) {
        const attemptSeed = (baseSeed + attempt * 0x9E3779B9) | 0;
        const rng = createRng(attemptSeed);
        try {
            return attemptFn(mapWidth, mapHeight, rng, floor, cfg);
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr || new Error('unknown generation error');
}

/**
 * Main dungeon generation function.
 * [room-v2:p3] 默认走 V2（图优先拓扑 + 网格嵌入）；options.algorithm==='v1' 或 V2 失败时回退旧 BSP。
 * @param {number} mapWidth - Map width in tiles
 * @param {number} mapHeight - Map height in tiles
 * @param {number} [seed] - Optional random seed
 * @param {number} [floor=1] - Dungeon floor (1-3)
 * @param {{algorithm?: 'v1'|'v2'}} [options] - 连接算法选择（缺省 v2）
 * @returns {Object} Dungeon layout
 */
export function generateDungeonLayout(mapWidth, mapHeight, seed, floor = 1, options = {}) {
    const cfg = DUNGEON_CONFIG;
    const baseSeed = (seed || (Date.now() & 0xFFFFFFFF)) | 0;
    const algorithm = options.algorithm === 'v1' ? 'v1' : 'v2';

    if (algorithm === 'v1') {
        return runAttempts(generateDungeonLayoutAttemptV1, mapWidth, mapHeight, baseSeed, floor, cfg);
    }

    try {
        return runAttempts(generateDungeonLayoutAttemptV2, mapWidth, mapHeight, baseSeed, floor, cfg);
    } catch (err) {
        // 放不下自动降级 v1（保底可玩）
        if (typeof console !== 'undefined' && console.warn) {
            console.warn(`[room-v2:p3] V2 布局生成失败，降级 v1：${err?.message || 'unknown'}`);
        }
        return runAttempts(generateDungeonLayoutAttemptV1, mapWidth, mapHeight, baseSeed, floor, cfg);
    }
}
