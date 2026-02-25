import { tileKey, randomInt } from './GenerationUtils.js';
import { applyTemplate } from './RoomInteriorTemplates.js';

/**
 * BSP-based dungeon layout generator.
 * Generates interconnected rooms with corridors suitable for a roguelike dungeon crawl.
 */

const DUNGEON_CONFIG = {
    mapPadding: 3,
    roomCountMin: 7,
    roomCountMax: 9,
    normalRoomMin: 14,
    normalRoomMax: 22,
    bossRoomMin: 20,
    bossRoomMax: 24,
    startRoomMin: 10,
    startRoomMax: 14,
    corridorWidth: 3,
    bspMinRegion: 20,
    roomPadding: 1
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
    if (node.w > node.h * 1.3) {
        splitH = false;
    } else if (node.h > node.w * 1.3) {
        splitH = true;
    } else {
        splitH = rng() > 0.5;
    }

    const minRatio = 0.35;
    const maxRatio = 0.65;

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
    const rw = randomInt(rng, Math.min(minW, leaf.w - padding * 2), Math.min(maxW, leaf.w - padding * 2));
    const rh = randomInt(rng, Math.min(minH, leaf.h - padding * 2), Math.min(maxH, leaf.h - padding * 2));
    if (rw < 6 || rh < 6) return null;

    const rx = leaf.x + randomInt(rng, padding, Math.max(padding, leaf.w - rw - padding));
    const ry = leaf.y + randomInt(rng, padding, Math.max(padding, leaf.h - rh - padding));

    return { x: rx, y: ry, w: rw, h: rh };
}

/**
 * Find the closest edge points between two rooms for corridor connection.
 */
function closestEdgePoints(a, b) {
    // Clamp each room's center onto the other room's span
    const acx = Math.floor(a.x + a.w / 2);
    const acy = Math.floor(a.y + a.h / 2);
    const bcx = Math.floor(b.x + b.w / 2);
    const bcy = Math.floor(b.y + b.h / 2);

    let ax, ay, bx, by;

    // Determine dominant axis
    const dx = bcx - acx;
    const dy = bcy - acy;

    if (Math.abs(dx) >= Math.abs(dy)) {
        // Horizontally separated - connect left/right edges
        if (dx > 0) {
            ax = a.x + a.w; // right edge of A
            bx = b.x;       // left edge of B
        } else {
            ax = a.x;       // left edge of A
            bx = b.x + b.w; // right edge of B
        }
        // Y: clamp to overlapping range, or use centers
        const overlapTop = Math.max(a.y + 2, b.y + 2);
        const overlapBot = Math.min(a.y + a.h - 2, b.y + b.h - 2);
        if (overlapTop <= overlapBot) {
            ay = by = Math.floor((overlapTop + overlapBot) / 2);
        } else {
            ay = acy;
            by = bcy;
        }
    } else {
        // Vertically separated
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

/**
 * Generate L-shaped corridor between closest room edges.
 */
function generateCorridor(roomA, roomB, corridorWidth, rng) {
    const { ax, ay, bx, by } = closestEdgePoints(roomA, roomB);

    const tiles = new Set();
    const hw = Math.floor(corridorWidth / 2);

    const hFirst = rng() > 0.5;

    if (hFirst) {
        const minX = Math.min(ax, bx);
        const maxX = Math.max(ax, bx);
        for (let x = minX; x <= maxX; x++) {
            for (let d = -hw; d <= hw; d++) tiles.add(tileKey(x, ay + d));
        }
        const minY = Math.min(ay, by);
        const maxY = Math.max(ay, by);
        for (let y = minY; y <= maxY; y++) {
            for (let d = -hw; d <= hw; d++) tiles.add(tileKey(bx + d, y));
        }
    } else {
        const minY = Math.min(ay, by);
        const maxY = Math.max(ay, by);
        for (let y = minY; y <= maxY; y++) {
            for (let d = -hw; d <= hw; d++) tiles.add(tileKey(ax + d, y));
        }
        const minX = Math.min(ax, bx);
        const maxX = Math.max(ax, bx);
        for (let x = minX; x <= maxX; x++) {
            for (let d = -hw; d <= hw; d++) tiles.add(tileKey(x, by + d));
        }
    }

    return tiles;
}

function buildMST(rooms) {
    if (rooms.length <= 1) return [];
    const edges = [];
    const inMST = new Set([0]);
    const candidates = [];

    for (let i = 1; i < rooms.length; i++) {
        candidates.push({ from: 0, to: i, dist: roomDist(rooms[0], rooms[i]) });
    }

    while (inMST.size < rooms.length) {
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let i = 0; i < candidates.length; i++) {
            if (!inMST.has(candidates[i].to) && candidates[i].dist < bestDist) {
                bestDist = candidates[i].dist;
                bestIdx = i;
            }
        }
        if (bestIdx === -1) break;

        const edge = candidates[bestIdx];
        edges.push({ a: edge.from, b: edge.to });
        inMST.add(edge.to);

        for (let i = 0; i < rooms.length; i++) {
            if (!inMST.has(i)) {
                candidates.push({ from: edge.to, to: i, dist: roomDist(rooms[edge.to], rooms[i]) });
            }
        }
    }

    return edges;
}

function roomDist(a, b) {
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    return Math.abs(ax - bx) + Math.abs(ay - by);
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
            if (depths[nb] === -1) {
                depths[nb] = depths[cur] + 1;
                queue.push(nb);
            }
        }
    }

    return { depths, adj };
}

/**
 * Find gate positions at room-corridor boundaries.
 * Each gate is a group of tiles that fully blocks a corridor entrance.
 * Returns gates with a `tiles` array containing all tile positions to block.
 */
function findGatePositions(rooms, allCorridorTiles) {
    // Collect all individual gate tiles per room edge
    const rawTiles = []; // { x, y, orientation, roomId, edge }

    for (const room of rooms) {
        // Top edge: corridor tile is at y-1, gate tile at y (inside room edge)
        for (let x = room.x; x < room.x + room.w; x++) {
            if (allCorridorTiles.has(tileKey(x, room.y - 1))) {
                rawTiles.push({ x, y: room.y, orientation: 'h', roomId: room.id, edge: `top_${room.id}` });
            }
        }
        // Bottom edge
        for (let x = room.x; x < room.x + room.w; x++) {
            if (allCorridorTiles.has(tileKey(x, room.y + room.h))) {
                rawTiles.push({ x, y: room.y + room.h - 1, orientation: 'h', roomId: room.id, edge: `bot_${room.id}` });
            }
        }
        // Left edge
        for (let y = room.y; y < room.y + room.h; y++) {
            if (allCorridorTiles.has(tileKey(room.x - 1, y))) {
                rawTiles.push({ x: room.x, y, orientation: 'v', roomId: room.id, edge: `left_${room.id}` });
            }
        }
        // Right edge
        for (let y = room.y; y < room.y + room.h; y++) {
            if (allCorridorTiles.has(tileKey(room.x + room.w, y))) {
                rawTiles.push({ x: room.x + room.w - 1, y, orientation: 'v', roomId: room.id, edge: `right_${room.id}` });
            }
        }
    }

    // Group into contiguous runs along the same edge
    // For horizontal gates (top/bottom): group by same y and edge, contiguous x
    // For vertical gates (left/right): group by same x and edge, contiguous y
    const edgeGroups = new Map();
    for (const t of rawTiles) {
        if (!edgeGroups.has(t.edge)) edgeGroups.set(t.edge, []);
        edgeGroups.get(t.edge).push(t);
    }

    const gates = [];
    for (const [, tiles] of edgeGroups) {
        if (tiles.length === 0) continue;
        const orient = tiles[0].orientation;

        if (orient === 'h') {
            // Sort by x, group contiguous
            tiles.sort((a, b) => a.x - b.x);
            let run = [tiles[0]];
            for (let i = 1; i < tiles.length; i++) {
                if (tiles[i].x === run[run.length - 1].x + 1 && tiles[i].y === run[0].y) {
                    run.push(tiles[i]);
                } else {
                    gates.push(_buildGate(run, orient));
                    run = [tiles[i]];
                }
            }
            gates.push(_buildGate(run, orient));
        } else {
            // Sort by y, group contiguous
            tiles.sort((a, b) => a.y - b.y);
            let run = [tiles[0]];
            for (let i = 1; i < tiles.length; i++) {
                if (tiles[i].y === run[run.length - 1].y + 1 && tiles[i].x === run[0].x) {
                    run.push(tiles[i]);
                } else {
                    gates.push(_buildGate(run, orient));
                    run = [tiles[i]];
                }
            }
            gates.push(_buildGate(run, orient));
        }
    }

    // Deduplicate gates at same position (two rooms may share a corridor entrance)
    const dedupMap = new Map();
    for (const g of gates) {
        const key = g.tiles.map(t => `${t.x},${t.y}`).sort().join('|');
        if (dedupMap.has(key)) {
            // Merge roomIds
            const existing = dedupMap.get(key);
            for (const rid of g.roomIds) {
                if (!existing.roomIds.includes(rid)) existing.roomIds.push(rid);
            }
        } else {
            dedupMap.set(key, g);
        }
    }

    return [...dedupMap.values()];
}

function _buildGate(tileRun, orientation) {
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

/**
 * Compute enemy configuration for a room based on depth and floor.
 */
function computeEnemyConfig(roomType, depth, floor) {
    if (roomType === 'start') {
        return { types: [], count: 0 };
    }

    if (floor === 2) {
        return computeEnemyConfigFloor2(roomType, depth);
    }

    if (roomType === 'boss') {
        return {
            types: [
                { type: 'mutant_beast', count: 1 },
                { type: 'zombie', count: 2 },
                { type: 'zombie_female', count: 1 }
            ],
            count: 4
        };
    }

    if (depth <= 2) {
        const count = 4 + Math.floor(Math.random() * 2);
        return {
            types: [
                { type: 'zombie', count: Math.ceil(count * 0.6) },
                { type: 'zombie_female', count: Math.floor(count * 0.4) }
            ],
            count
        };
    }
    if (depth <= 4) {
        const count = 5 + Math.floor(Math.random() * 3);
        return {
            types: [
                { type: 'zombie', count: Math.floor(count * 0.3) },
                { type: 'zombie_female', count: Math.floor(count * 0.3) },
                { type: 'zombie_brute', count: Math.max(1, Math.floor(count * 0.15)) },
                { type: 'hunter', count: Math.max(1, Math.ceil(count * 0.25)) }
            ],
            count
        };
    }
    const count = 6 + Math.floor(Math.random() * 3);
    return {
        types: [
            { type: 'zombie_brute', count: Math.floor(count * 0.25) },
            { type: 'hunter', count: Math.floor(count * 0.35) },
            { type: 'soldier', count: Math.ceil(count * 0.4) }
        ],
        count
    };
}

function computeEnemyConfigFloor2(roomType, depth) {
    if (roomType === 'boss') {
        return {
            types: [
                { type: 'mecha_golem', count: 1 },
                { type: 'soldier', count: 3 },
                { type: 'hunter', count: 1 }
            ],
            count: 5
        };
    }

    if (depth <= 2) {
        const count = 6 + Math.floor(Math.random() * 2);
        return {
            types: [
                { type: 'zombie_female', count: Math.floor(count * 0.3) },
                { type: 'zombie_brute', count: Math.floor(count * 0.3) },
                { type: 'hunter', count: Math.ceil(count * 0.4) }
            ],
            count
        };
    }
    if (depth <= 4) {
        const count = 7 + Math.floor(Math.random() * 3);
        return {
            types: [
                { type: 'zombie_brute', count: Math.floor(count * 0.25) },
                { type: 'hunter', count: Math.floor(count * 0.35) },
                { type: 'soldier', count: Math.ceil(count * 0.4) }
            ],
            count
        };
    }
    const count = 8 + Math.floor(Math.random() * 3);
    return {
        types: [
            { type: 'hunter', count: Math.floor(count * 0.4) },
            { type: 'soldier', count: Math.ceil(count * 0.6) }
        ],
        count
    };
}

/**
 * Generate cover objects (boxes, barrels) inside a room.
 */
function generateRoomCover(room, rng, interiorWallTiles = new Set()) {
    if (room.type === 'start') return [];

    const covers = [];
    const coverTypes = ['box', 'box', 'box', 'barrel', 'barrel', 'explosive_barrel'];

    // Scale cover count with room area
    const area = (room.w - 4) * (room.h - 4); // interior area
    const count = room.type === 'boss'
        ? randomInt(rng, 6, 10)
        : Math.min(12, randomInt(rng, 4, Math.floor(area / 25)));

    const occupied = new Set();
    const cx = Math.floor(room.x + room.w / 2);
    const cy = Math.floor(room.y + room.h / 2);

    for (let i = 0; i < count; i++) {
        for (let attempt = 0; attempt < 20; attempt++) {
            let tx, ty;
            if (room.type === 'boss') {
                // Boss room: place in corners
                const cornerIdx = i % 4;
                const qx = cornerIdx % 2 === 0 ? room.x + 2 : room.x + room.w - 3;
                const qy = cornerIdx < 2 ? room.y + 2 : room.y + room.h - 3;
                tx = qx + randomInt(rng, -1, 1);
                ty = qy + randomInt(rng, -1, 1);
            } else {
                tx = randomInt(rng, room.x + 2, room.x + room.w - 3);
                ty = randomInt(rng, room.y + 2, room.y + room.h - 3);
            }

            // Skip center area
            if (Math.abs(tx - cx) <= 1 && Math.abs(ty - cy) <= 1) continue;

            // Skip interior wall tiles and 1-tile buffer around them
            let onWall = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (interiorWallTiles.has(tileKey(tx + dx, ty + dy))) {
                        onWall = true;
                        break;
                    }
                }
                if (onWall) break;
            }
            if (onWall) continue;

            // Check spacing from other covers
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

            // Bounds check
            if (tx < room.x + 2 || tx >= room.x + room.w - 2) continue;
            if (ty < room.y + 2 || ty >= room.y + room.h - 2) continue;

            occupied.add(key);
            const type = coverTypes[Math.floor(rng() * coverTypes.length)];
            covers.push({ x: tx, y: ty, type });
            break;
        }
    }

    return covers;
}

/**
 * Main dungeon generation function.
 * @param {number} mapWidth - Map width in tiles
 * @param {number} mapHeight - Map height in tiles
 * @param {number} [seed] - Optional random seed
 * @param {number} [floor=1] - Dungeon floor (1 or 2)
 * @returns {Object} Dungeon layout
 */
export function generateDungeonLayout(mapWidth, mapHeight, seed, floor = 1) {
    const rng = createRng(seed || (Date.now() & 0xFFFFFFFF));
    const cfg = DUNGEON_CONFIG;

    const pad = cfg.mapPadding;
    const areaW = mapWidth - pad * 2;
    const areaH = mapHeight - pad * 2;

    // 1. BSP partition
    const root = new BSPNode(pad, pad, areaW, areaH);
    const maxDepth = 2 + Math.floor(rng() * 2);
    splitBSP(root, rng, 0, maxDepth, cfg.bspMinRegion);

    // 2. Collect leaves and place rooms
    const leaves = collectLeaves(root);
    const rooms = [];

    for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        const isFirst = i === 0;
        const minW = isFirst ? cfg.startRoomMin : cfg.normalRoomMin;
        const maxW = isFirst ? cfg.startRoomMax : cfg.normalRoomMax;

        const room = placeRoom(leaf, rng, minW, maxW, minW, maxW, cfg.roomPadding);
        if (room) {
            room.id = `dungeon_room_${rooms.length}`;
            room.connectedTo = [];
            rooms.push(room);
        }
    }

    const targetCount = randomInt(rng, cfg.roomCountMin, cfg.roomCountMax);
    while (rooms.length > targetCount) {
        rooms.pop();
    }

    if (rooms.length < 3) {
        throw new Error('Dungeon generation failed: too few rooms');
    }

    // 3. Build MST + extra edges
    const mstEdges = buildMST(rooms);
    const extraEdgeCount = randomInt(rng, 1, 2);
    for (let e = 0; e < extraEdgeCount; e++) {
        const a = randomInt(rng, 0, rooms.length - 1);
        const b = randomInt(rng, 0, rooms.length - 1);
        if (a !== b && !mstEdges.some(ed => (ed.a === a && ed.b === b) || (ed.a === b && ed.b === a))) {
            mstEdges.push({ a, b });
        }
    }

    for (const e of mstEdges) {
        rooms[e.a].connectedTo.push(rooms[e.b].id);
        rooms[e.b].connectedTo.push(rooms[e.a].id);
    }

    // 4. Assign room types
    const startIdx = 0;
    const { depths } = computeDepths(rooms, mstEdges, startIdx);

    let bossIdx = 0;
    let maxDepth2 = 0;
    for (let i = 1; i < rooms.length; i++) {
        if (depths[i] > maxDepth2) {
            maxDepth2 = depths[i];
            bossIdx = i;
        }
    }

    rooms[startIdx].type = 'start';
    rooms[startIdx].depth = 0;
    rooms[bossIdx].type = 'boss';
    rooms[bossIdx].depth = depths[bossIdx];

    if (rooms[bossIdx].w < cfg.bossRoomMin) rooms[bossIdx].w = cfg.bossRoomMin;
    if (rooms[bossIdx].h < cfg.bossRoomMin) rooms[bossIdx].h = cfg.bossRoomMin;

    for (let i = 0; i < rooms.length; i++) {
        if (i !== startIdx && i !== bossIdx) {
            rooms[i].type = 'normal';
            rooms[i].depth = depths[i];
        }
    }

    // 5. Generate corridors
    const allCorridorTiles = new Set();
    const corridors = [];

    for (const edge of mstEdges) {
        const tiles = generateCorridor(rooms[edge.a], rooms[edge.b], cfg.corridorWidth, rng);
        corridors.push({
            id: `corridor_${corridors.length}`,
            tiles: [...tiles].map(k => { const [x, y] = k.split(',').map(Number); return { x, y }; }),
            connectsRooms: [rooms[edge.a].id, rooms[edge.b].id]
        });
        for (const t of tiles) allCorridorTiles.add(t);
    }

    // 6. Compute floor tiles
    const floorTiles = new Set();
    for (const room of rooms) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                floorTiles.add(tileKey(x, y));
            }
        }
    }
    for (const t of allCorridorTiles) floorTiles.add(t);

    // 6.5. Generate interior wall tiles from room templates
    const interiorWallTiles = new Set();
    const usedTemplateIds = new Set();
    for (const room of rooms) {
        const result = applyTemplate(room, rng, usedTemplateIds);
        if (result.walls && result.walls.length > 0) {
            for (const w of result.walls) {
                const key = tileKey(w.x, w.y);
                interiorWallTiles.add(key);
                floorTiles.delete(key); // interior walls are not walkable floor
            }
        }
    }

    // 7. Compute wall tiles
    const wallTiles = new Set();
    for (const key of floorTiles) {
        const [fx, fy] = key.split(',').map(Number);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nk = tileKey(fx + dx, fy + dy);
                if (!floorTiles.has(nk)) wallTiles.add(nk);
            }
        }
    }

    // 8. Find gate positions (energy barriers at room-corridor boundaries)
    const gates = findGatePositions(rooms, allCorridorTiles);

    // Gate tiles: remove from walls, ensure they're floor
    for (const g of gates) {
        for (const t of g.tiles) {
            const gk = tileKey(t.x, t.y);
            wallTiles.delete(gk);
            floorTiles.add(gk);
        }
    }

    // 8.5. Merge interior wall tiles into wallTiles
    for (const key of interiorWallTiles) {
        wallTiles.add(key);
    }

    // 9. Enemy config per room
    for (const room of rooms) {
        room.enemyConfig = computeEnemyConfig(room.type, room.depth, floor);
    }

    // 10. Spawn points (skip interior wall tiles)
    for (const room of rooms) {
        room.spawnPoints = [];
        for (let y = room.y + 2; y < room.y + room.h - 2; y++) {
            for (let x = room.x + 2; x < room.x + room.w - 2; x++) {
                if (interiorWallTiles.has(tileKey(x, y))) continue;
                room.spawnPoints.push({ x, y });
            }
        }
    }

    // 11. Cover objects (avoid interior wall tiles)
    const coverObjects = [];
    for (const room of rooms) {
        coverObjects.push(...generateRoomCover(room, rng, interiorWallTiles));
    }

    return {
        rooms,
        corridors,
        gates,
        wallTiles,
        floorTiles,
        coverObjects,
        startRoomId: rooms[startIdx].id,
        bossRoomId: rooms[bossIdx].id,
        floor
    };
}
