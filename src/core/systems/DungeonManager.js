import { TILE_SIZE } from '../../utils/Constants.js';
import { DroppedItem } from '../entities/DroppedItem.js';
import { Portal } from '../entities/Portal.js';
import { weaponItemIdFromConfigId, createWeaponInstanceData } from './WeaponInstanceUtils.js';
import { pickRarity, pickWeaponByRarity, weaponRarityWeightsForFloor, shouldForceWeaponDrop } from '../dungeon/LootTable.js';
import { ROOM_CLEAR, BOSS_CHEST_TIER, ELITE_CLEAR, FINAL_FLOOR, GAMBLE } from '../dungeon/EconomyConfig.js';
import { getFloorConfig, getDepthTier } from '../dungeon/FloorConfigs.js';
import { applyAffixes, pickRandomAffixes } from '../dungeon/EnemyAffixSystem.js';
// [tension-batch:verbs] 房间玩法动词状态机（生存/猎杀/契约）
import {
    activateSurvival, updateSurvival,
    activateHunt, updateHunt,
    startPact, updatePact,
    PACT, HUNT
} from './dungeon/RoomVerbs.js';

// 用户反馈：手枪猎人 / 随机武器士兵手感偏强，F1/F2 枪兵应是稀有强敌，避免一波涌出多只。
// 每个遭遇战房间限制 hunter+soldier 合计生成 ≤2 只；超额时从同角色池改抽非枪兵类型。
const GUN_USER_TYPES = new Set(['hunter', 'soldier']);
const MAX_GUN_USERS_PER_ROOM = 2;

// [tension-batch:verbs] 动词房池化出怪剔除项：盗宝地精（非战斗惊喜怪）、电弧双子（成对刷、数量不可控）
const VERB_POOL_EXCLUDE = new Set(['loot_goblin', 'arc_twin']);

/**
 * 枪兵限额工具：若 type 为枪兵且本房已达上限，则从同角色池改抽一个非枪兵类型；
 * 池内无非枪兵替补时维持原选择（不至于生成失败）。
 * @param {string} type 初选类型
 * @param {string[]} pool 该角色候选池
 * @param {number} spawnedGunUsers 本房已生成枪兵数
 * @param {Function} [rng=Math.random] 随机源
 * @returns {string} 最终敌人类型
 */
function capGunUsers(type, pool, spawnedGunUsers, rng = Math.random) {
    if (!GUN_USER_TYPES.has(type)) return type;
    if (spawnedGunUsers < MAX_GUN_USERS_PER_ROOM) return type;
    const alts = pool.filter(t => !GUN_USER_TYPES.has(t));
    if (alts.length === 0) return type;
    return alts[Math.floor(rng() * alts.length)];
}

/**
 * DungeonManager - Runtime manager for dungeon room state machine.
 * Uses energy barrier gates instead of door objects.
 * Handles room activation, gate locking, enemy tracking, rewards, and floor progression.
 */
export class DungeonManager {
    /**
     * @param {Object} layout - Output from DungeonLayoutGenerator
     * @param {Object} worldSystem - Reference to WorldSystem
     */
    constructor(layout, worldSystem) {
        this.layout = layout;
        this.worldSystem = worldSystem;
        this.rooms = new Map(); // roomId → room state
        this.currentFloor = layout.floor || 1;
        this._floorSlotMachines = 0; // [depth-batch:gamble] 本层已在战斗房刷出的老虎机数（DungeonManager 每层重建即归零）
        // [tension-batch:power] 每层武器保底计数（DungeonManager 每层重建即归零）：已清房数 + 本层是否已掉过武器
        this._floorRoomsCleared = 0;
        this._floorWeaponDropped = false;

        // Build room grid for O(1) position lookups
        this.gridW = worldSystem?.getWorldTileWidth ? worldSystem.getWorldTileWidth() : 130;
        this.gridH = worldSystem?.getWorldTileHeight ? worldSystem.getWorldTileHeight() : 130;
        this.roomGrid = new Array(this.gridW * this.gridH).fill(null);

        for (const room of layout.rooms) {
            this.rooms.set(room.id, {
                ...room,
                state: room.type === 'start' ? 'cleared' : 'idle',
                enemies: new Set(),
                visited: room.type === 'start',
                gates: [] // filled by initGates
            });

            // Fill room grid
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (x >= 0 && x < this.gridW && y >= 0 && y < this.gridH) {
                        this.roomGrid[y * this.gridW + x] = room.id;
                    }
                }
            }
        }

        this.currentRoomId = layout.startRoomId;
        this.prevRoomId = null;

        this.graphNodesById = new Map((layout.graph?.nodes || []).map(node => [node.id, node]));
        this.graphEdges = Array.isArray(layout.graph?.edges) && layout.graph.edges.length > 0
            ? layout.graph.edges
            : (layout.corridors || []).map(c => ({
                a: c.connectsRooms[0],
                b: c.connectsRooms[1]
            }));

        // Energy barrier gates
        this.gates = []; // { x, y, orientation, roomIds, active, wallRef, alpha, animTimer }

        this._frameCount = 0;

        // [tension-batch:verbs] 房间动词状态机副作用注入口（出怪/封门/开门/掉落/遁走）
        this._verbCtx = this._buildVerbCtx();
    }

    /**
     * [tension-batch:verbs] 构造房间动词状态机的副作用回调集。
     * RoomVerbs 纯逻辑仅决定"何时"，此处提供地牢内真实的"如何"。
     */
    _buildVerbCtx() {
        return {
            rng: Math.random,
            aliveCount: (room) => room.enemies.size,
            lockGates: (room) => { for (const gate of room.gates) this._activateGate(gate); },
            spawnBatch: (room, count) => this._spawnPooledBatch(room, count, {}),
            spawnHuntTarget: (room) => this._spawnHuntTarget(room),
            spawnGuards: (room, n) => this._spawnPooledBatch(room, n, {}),
            spawnPactEnemies: (room) => this._spawnPactEnemies(room),
            wipeEnemies: (room) => this._wipeRoomEnemies(room),
            escapeTarget: (room, target) => this._escapeHuntTarget(room, target),
            clearWithReward: (room, kind) => this._clearVerbRoom(room, kind),
            clearNoReward: (room) => this._clearVerbRoom(room, null)
        };
    }

    /**
     * Initialize gates from layout data.
     * Call after constructor.
     */
    initGates(gateData) {
        for (const g of gateData) {
            const gate = {
                tiles: g.tiles.map(t => ({ x: t.x, y: t.y })),
                orientation: g.orientation,
                roomIds: [...g.roomIds],
                active: false,
                wallRefs: [], // one wall rect per tile
                alpha: 0,
                animTimer: 0
            };
            this.gates.push(gate);

            // Link gate to rooms
            for (const rid of gate.roomIds) {
                const rs = this.rooms.get(rid);
                if (rs) {
                    rs.gates.push(gate);
                }
            }
        }
    }

    /**
     * Get room at a world position.
     * @returns {Object|null} Room state or null
     */
    getRoomAt(worldX, worldY) {
        const tx = Math.floor(worldX / TILE_SIZE);
        const ty = Math.floor(worldY / TILE_SIZE);
        if (tx < 0 || tx >= this.gridW || ty < 0 || ty >= this.gridH) return null;
        const rid = this.roomGrid[ty * this.gridW + tx];
        return rid ? this.rooms.get(rid) : null;
    }

    /**
     * Main update - call every frame.
     */
    update(player) {
        this._frameCount++;

        const room = this.getRoomAt(player.x, player.y);
        if (!room) return;

        // Track current room
        if (room.id !== this.currentRoomId) {
            this.prevRoomId = this.currentRoomId;
            this.currentRoomId = room.id;
            // [depth-batch:relics] 命运骰子：进入新房间随机掷出临时增益（离房失效）
            const relicSystem = this.worldSystem.relicSystem;
            if (relicSystem && relicSystem.onRoomEnter) relicSystem.onRoomEnter();
        }

        // 进入任意 idle 房间即标记已探索（供小地图/大地图着色）；peace 布景模式同样记录 [depth-batch:minimap]
        // 房间激活（出怪）仍受 peace 模式抑制，且需玩家深入（避开门口边缘 tile，避免把玩家挡在门外）
        if (room.state === 'idle') {
            room.visited = true;
            // [tension-batch:verbs] 契约房进房不封门、不出怪，靠中央拉杆开战——跳过自动激活
            if (!this.worldSystem.debugPeaceMode && room.category !== 'pact') {
                const tx = Math.floor(player.x / TILE_SIZE);
                const ty = Math.floor(player.y / TILE_SIZE);
                const margin = 2;
                if (tx >= room.x + margin && tx < room.x + room.w - margin &&
                    ty >= room.y + margin && ty < room.y + room.h - margin) {
                    this.activateRoom(room);
                }
            }
        }

        // Check if active rooms are cleared（支持遭遇战多波次）
        for (const [, rs] of this.rooms) {
            if (rs.state !== 'active') continue;
            this._cleanDeadEnemies(rs);

            // [tension-batch:verbs] 玩法动词房走各自状态机（生存计时/猎杀目标/契约拉杆），不进遭遇战波次逻辑
            if (rs.category === 'survival') { updateSurvival(rs, this._verbCtx); continue; }
            if (rs.category === 'hunt') { updateHunt(rs, this._verbCtx); continue; }
            if (rs.category === 'pact') { updatePact(rs, this._verbCtx); continue; }

            if (rs.enemies.size > 0) continue;

            if (rs.waveTelegraphTimer > 0) {
                // 出生魔法阵进行中：计时结束后实体化
                rs.waveTelegraphTimer--;
                if (rs.waveTelegraphTimer === 0) {
                    const wave = rs.pendingWaves.shift();
                    this._spawnEncounterWave(rs, wave, getFloorConfig(this.currentFloor));
                    rs.wavesSpawned = (rs.wavesSpawned || 0) + 1;
                }
            } else if (Array.isArray(rs.pendingWaves) && rs.pendingWaves.length > 0) {
                rs.waveTelegraphTimer = 32; // [tension-batch:ai] 增援波预警 0.83s→0.53s（缩短波间喘息、制造压迫）
            } else {
                this.clearRoom(rs);
            }
        }

        // Update gate animations
        for (const gate of this.gates) {
            if (gate.active) {
                gate.alpha = Math.min(1, gate.alpha + 0.08);
                gate.animTimer++;
            } else {
                gate.alpha = Math.max(0, gate.alpha - 0.1);
            }
        }
    }

    /**
     * Activate a room: lock gates, spawn enemies.
     */
    activateRoom(room) {
        if (room.enemyConfig.count === 0) {
            room.state = 'cleared';
            return;
        }

        room.state = 'active';

        // Activate all gates for this room
        for (const gate of room.gates) {
            this._activateGate(gate);
        }

        // [tension-batch:verbs] 生存/猎杀房走各自的出怪节奏（不进遭遇战波次队列）
        if (room.category === 'survival') {
            activateSurvival(room, this._verbCtx);
            this.worldSystem.markWorldStaticDirty();
            return;
        }
        if (room.category === 'hunt') {
            activateHunt(room, this._verbCtx);
            this.worldSystem.markWorldStaticDirty();
            return;
        }

        // 遭遇战房：所有波次（含波1）都走出生魔法阵队列（Gungeon 式读房时间）
        if (Array.isArray(room.encounterSpawns) && room.encounterSpawns.length > 0) {
            const firstWave = room.encounterSpawns.filter(s => !s.wave);
            const wave1 = room.encounterSpawns.filter(s => s.wave === 1);
            room.pendingWaves = [firstWave.length > 0 ? firstWave : room.encounterSpawns];
            if (wave1.length > 0 && firstWave.length > 0) room.pendingWaves.push(wave1);
            room.wavesSpawned = 0;
            room.waveTelegraphTimer = 40; // 波1 魔法阵 ~0.67s
        } else {
            // 池化房（精英/Boss/兜底）：保持立即出怪
            this._spawnRoomEnemies(room);
        }

        this.worldSystem.markWorldStaticDirty();
    }

    // ─────────────────────── [tension-batch:verbs] 房间玩法动词 ───────────────────────

    /** 契约拉杆委托入口：封门 + 刷 ×1.5 全精英敌人（拉杆物件 interact 调用）。 */
    startPactFight(room) {
        if (!room || room.category !== 'pact' || room.pactStarted) return false;
        room.state = 'active';
        const ok = startPact(room, this._verbCtx);
        if (ok) this.worldSystem.markWorldStaticDirty();
        else room.state = 'idle';
        return ok;
    }

    /** 按楼层深度池加权随机一个敌人类型（剔除非战斗惊喜怪 / 成对怪，保证批量可控）。 */
    _pickPooledType(tier) {
        const entries = Object.entries(tier.weights).filter(([t]) => !VERB_POOL_EXCLUDE.has(t));
        const pool = entries.length > 0 ? entries : Object.entries(tier.weights);
        let total = 0;
        for (const [, w] of pool) total += w;
        let r = Math.random() * total;
        for (const [type, w] of pool) {
            r -= w;
            if (r <= 0) return type;
        }
        return pool[0][0];
    }

    /**
     * 池化批量出怪（生存增援 / 猎杀护卫 / 契约敌群）：按楼层深度池加权抽型，
     * 落在房内随机出怪点（退让避坑），应用楼层缩放 + 出生保护；opts.elite 时叠精英词缀。
     * @returns {Array} 本批成功生成的敌人
     */
    _spawnPooledBatch(room, count, opts = {}) {
        const floorConfig = getFloorConfig(this.currentFloor);
        const tier = getDepthTier(floorConfig, room.depth || 1);
        const points = (room.spawnPoints && room.spawnPoints.length) ? room.spawnPoints : [];
        const spawned = [];
        for (let i = 0; i < count; i++) {
            const type = this._pickPooledType(tier);
            let enemy = null;
            for (let a = 0; a < 5 && !enemy; a++) {
                const sp = points[Math.floor(Math.random() * points.length)];
                if (!sp) break;
                if (this.worldSystem.isPitAt && this.worldSystem.isPitAt(sp.x * TILE_SIZE + 16, sp.y * TILE_SIZE + 16)) continue;
                enemy = this.worldSystem.spawnEnemy(type, { tileX: sp.x, tileY: sp.y, strict: true });
            }
            if (!enemy) continue;
            this._applyFloorScaling(enemy, floorConfig);
            this._applySpawnGrace(enemy);
            if (opts.elite && !enemy.isBoss && !enemy.isSegment) {
                const [minCount, maxCount] = floorConfig.eliteAffixCount || [1, 1];
                const c = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
                applyAffixes(enemy, pickRandomAffixes(c));
            }
            room.enemies.add(enemy);
            spawned.push(enemy);
        }
        const relicSystem = this.worldSystem.relicSystem;
        if (relicSystem && relicSystem.onWaveSpawned) relicSystem.onWaveSpawned(spawned);
        return spawned;
    }

    /** 猎杀目标怪：该层近战池选一只，套精英词缀 + 1.5 倍速 + 加厚血 + 金色描边标记。 */
    _spawnHuntTarget(room) {
        const floorConfig = getFloorConfig(this.currentFloor);
        const meleePool = (floorConfig.roleMap && floorConfig.roleMap.m) || ['zombie'];
        const type = meleePool[Math.floor(Math.random() * meleePool.length)];
        // 优先靠近房心刷出（醒目）
        const cx = room.x + room.w / 2, cy = room.y + room.h / 2;
        const points = [...(room.spawnPoints || [])].sort(
            (a, b) => ((a.x - cx) ** 2 + (a.y - cy) ** 2) - ((b.x - cx) ** 2 + (b.y - cy) ** 2)
        );
        let enemy = null;
        for (const sp of points) {
            if (this.worldSystem.isPitAt && this.worldSystem.isPitAt(sp.x * TILE_SIZE + 16, sp.y * TILE_SIZE + 16)) continue;
            enemy = this.worldSystem.spawnEnemy(type, { tileX: sp.x, tileY: sp.y, strict: true });
            if (enemy) break;
        }
        if (!enemy) return null;
        this._applyFloorScaling(enemy, floorConfig);
        const [minCount, maxCount] = floorConfig.eliteAffixCount || [1, 1];
        const c = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
        applyAffixes(enemy, pickRandomAffixes(c));
        enemy.speed *= HUNT.targetSpeedMult;
        enemy.hp = Math.round(enemy.hp * HUNT.targetHpMult);
        enemy.maxHp = Math.round(enemy.maxHp * HUNT.targetHpMult);
        enemy.isHuntTarget = true; // Renderer 据此画金色描边
        enemy.worldSystem = this.worldSystem;
        return enemy;
    }

    /** 契约敌群：以房间常规编成数量 ×1.5 刷池化敌人、全体精英词缀。 */
    _spawnPactEnemies(room) {
        const base = (Array.isArray(room.encounterSpawns) && room.encounterSpawns.length)
            || (room.enemyConfig && room.enemyConfig.count)
            || 4;
        const count = Math.max(1, Math.round(base * PACT.countMult));
        this._spawnPooledBatch(room, count, { elite: true });
    }

    /** 生存房撑满犒赏：全灭现存敌人（经死亡清扫掉落各自战利品）。 */
    _wipeRoomEnemies(room) {
        for (const e of room.enemies) {
            if (e.hp > 0) e.hp = 0;
        }
        room.enemies.clear();
    }

    /** 猎杀超时：目标遁地逃走——无掉落移除（escaped 语义）+ 尘土迸发。 */
    _escapeHuntTarget(room, target) {
        if (!target) return;
        target.escaped = true; // WorldSystem 死亡清扫据此跳过掉落
        target.hp = 0;
        room.enemies.delete(target);
        const cs = this.worldSystem.combatSystem;
        if (cs && Array.isArray(cs.particles)) {
            for (let i = 0; i < 14; i++) {
                const a = Math.random() * Math.PI * 2;
                const spd = Math.random() * 1.8 + 0.5;
                cs.particles.push({
                    x: target.x + (Math.random() - 0.5) * 12,
                    y: target.y + 8,
                    vx: Math.cos(a) * spd,
                    vy: -Math.random() * 2 - 0.5,
                    life: 20 + Math.random() * 14,
                    color: Math.random() > 0.5 ? '#8a7048' : '#5c4a2e',
                    size: Math.random() * 2 + 1,
                    gravity: 0.15,
                    friction: 0.95
                });
            }
        }
    }

    /** 结算动词房：开门、置 cleared；kind 非空时掉落对应丰厚奖励。 */
    _clearVerbRoom(room, kind) {
        room.state = 'cleared';
        for (const gate of room.gates) this._deactivateGate(gate);
        this._floorRoomsCleared++;
        if (kind) this._dropVerbRewards(room, kind);
        this.worldSystem.markWorldStaticDirty();
    }

    /** 动词房丰厚掉落：生存=金币×2+铁箱 / 猎杀=金币大堆+高稀有武器 / 契约=翻倍+保底遗物。 */
    _dropVerbRewards(room, kind) {
        const centerX = (room.x + room.w / 2) * TILE_SIZE;
        const centerY = (room.y + room.h / 2) * TILE_SIZE;
        const relicMult = this.worldSystem.relicSystem ? this.worldSystem.relicSystem.roomClearCoinMult() : 1;
        const baseCoin = ROOM_CLEAR.coinMin + Math.floor(Math.random() * (ROOM_CLEAR.coinMax - ROOM_CLEAR.coinMin + 1));

        if (kind === 'survival') {
            this.worldSystem.spawnCoinBurst(centerX, centerY, Math.round(baseCoin * 2 * relicMult));
            this.worldSystem.spawnChest(centerX - 13, centerY - 40, 'iron');
        } else if (kind === 'hunt') {
            this.worldSystem.spawnCoinBurst(centerX, centerY, Math.round(baseCoin * 2.5 * relicMult));
            // 高稀有度武器（rare+ 为主）
            this._dropWeaponDrop(centerX, centerY, { rare: 45, epic: 35, legendary: 20 });
            this._floorWeaponDropped = true; // [tension-batch:power] 猎杀房已产出武器，计入每层武器保底
        } else if (kind === 'pact') {
            this.worldSystem.spawnCoinBurst(centerX, centerY, Math.round(baseCoin * 2 * relicMult));
            const chest = this.worldSystem.spawnChest(centerX - 13, centerY - 40, 'silver');
            chest.guaranteedRelic = true; // 保底遗物
        }
    }

    /** 按稀有度权重掉一把武器（复用清房武器掉落管线）。 */
    _dropWeaponDrop(centerX, centerY, rarityWeights) {
        const rarity = pickRarity(rarityWeights);
        const weaponConfigId = pickWeaponByRarity(rarity);
        const weaponItemId = weaponConfigId ? weaponItemIdFromConfigId(weaponConfigId) : null;
        if (!weaponItemId) return;
        const instanceData = createWeaponInstanceData({ weaponConfigId });
        const offsetX = (Math.random() - 0.5) * 32;
        const offsetY = (Math.random() - 0.5) * 32;
        this.worldSystem.droppedItems.push(
            new DroppedItem(centerX + offsetX, centerY + offsetY, weaponItemId, 1, instanceData)
        );
    }

    /**
     * 玩家当前房间的动词倒计时 HUD 数据（生存 / 猎杀）；无则 null。
     * @returns {{kind: string, remaining: number, total: number}|null}
     */
    getVerbTimer() {
        const rs = this.rooms.get(this.currentRoomId);
        if (!rs || rs.state !== 'active') return null;
        if (rs.category === 'survival' && !rs.survivalComplete && rs.survivalTimer > 0) {
            return { kind: 'survival', remaining: rs.survivalTimer, total: rs.survivalTimerMax };
        }
        if (rs.category === 'hunt' && !rs.huntEscaped && rs.huntTarget && rs.huntTarget.hp > 0 && rs.huntTimer > 0) {
            return { kind: 'hunt', remaining: rs.huntTimer, total: rs.huntTimerMax };
        }
        return null;
    }

    /** 门口预告：可预告房间（动词/精英/宝藏/商店/Boss）在其门口的世界坐标 + 图标 kind。 */
    _roomPreviewKind(room) {
        if (room.type === 'boss') return 'boss';
        const c = room.category;
        if (c === 'survival' || c === 'hunt' || c === 'pact' || c === 'elite' || c === 'treasure' || c === 'shop') return c;
        return null;
    }

    /**
     * 门口预告图标数据（Renderer 世界内漂浮绘制）：为每扇通向"可预告房间"的门
     * 生成 {x, y, kind}。已清房 / 当前所在房不再预告。
     * @returns {Array<{x: number, y: number, kind: string}>}
     */
    getDoorPreviews() {
        const out = [];
        for (const gate of this.gates) {
            if (!gate.tiles || gate.tiles.length === 0) continue;
            let kind = null;
            for (const rid of gate.roomIds) {
                if (rid === this.currentRoomId) continue; // 不预告脚下这间
                const rs = this.rooms.get(rid);
                if (!rs || rs.state === 'cleared') continue;
                const k = this._roomPreviewKind(rs);
                if (k) { kind = k; break; }
            }
            if (!kind) continue;
            let sx = 0, sy = 0;
            for (const t of gate.tiles) { sx += t.x; sy += t.y; }
            const cx = (sx / gate.tiles.length + 0.5) * TILE_SIZE;
            const cy = (sy / gate.tiles.length + 0.5) * TILE_SIZE;
            out.push({ x: cx, y: cy, kind });
        }
        return out;
    }

    /**
     * Activate a gate: add wall rects for all tiles to block passage.
     */
    _activateGate(gate) {
        if (gate.active) return;
        gate.active = true;
        gate.animTimer = 0;
        if (gate.tiles[0]) this.worldSystem.soundSystem?.play('door_slam', { x: (gate.tiles[0].x + 0.5) * TILE_SIZE, y: (gate.tiles[0].y + 0.5) * TILE_SIZE }); // [audio-p1] 封门石门隆隆

        // Add wall rect for each tile in the gate
        gate.wallRefs = [];
        for (const t of gate.tiles) {
            const wallRect = {
                x: t.x * TILE_SIZE,
                y: t.y * TILE_SIZE,
                w: TILE_SIZE,
                h: TILE_SIZE,
                // 标记为屏障占位墙：参与碰撞/寻路/光照遮挡，但不按墙体贴图绘制
                isGateBarrier: true
            };
            gate.wallRefs.push(wallRect);
            this.worldSystem.walls.push(wallRect);
        }
    }

    /**
     * Deactivate a gate: remove all its wall rects.
     */
    _deactivateGate(gate) {
        if (!gate.active) return;
        gate.active = false;
        if (gate.tiles[0]) this.worldSystem.soundSystem?.play('door_open', { x: (gate.tiles[0].x + 0.5) * TILE_SIZE, y: (gate.tiles[0].y + 0.5) * TILE_SIZE }); // [audio-p1] 开门石门隆隆

        // Remove all wall rects
        for (const wallRef of gate.wallRefs) {
            const idx = this.worldSystem.walls.indexOf(wallRef);
            if (idx !== -1) {
                this.worldSystem.walls.splice(idx, 1);
            }
        }
        gate.wallRefs = [];
    }

    /**
     * Spawn enemies for a room based on its enemyConfig.
     */
    _spawnRoomEnemies(room) {
        const config = room.enemyConfig;
        if (!config) return;

        const floorConfig = getFloorConfig(this.currentFloor);

        if (!config.types) return;

        const spawnPoints = [...room.spawnPoints];
        // Shuffle spawn points
        for (let i = spawnPoints.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [spawnPoints[i], spawnPoints[j]] = [spawnPoints[j], spawnPoints[i]];
        }

        let spIdx = 0;
        for (const spec of config.types) {
            for (let c = 0; c < spec.count; c++) {
                const sp = spawnPoints[spIdx % spawnPoints.length];
                spIdx++;

                const enemy = this.worldSystem.spawnEnemy(spec.type, {
                    tileX: sp.x,
                    tileY: sp.y,
                    strict: true
                });

                if (enemy) {
                    this._applyFloorScaling(enemy, floorConfig);
                    this._maybePromoteElite(enemy, room, floorConfig);
                    room.enemies.add(enemy);
                    if (enemy.isBoss) {
                        enemy.worldSystem = this.worldSystem;
                    }
                }
            }
        }
    }

    /**
     * 波次预警数据（Renderer 画出怪点收缩圈）。
     * @returns {Array<{x: number, y: number, progress: number}>} 世界像素坐标
     */
    getWaveTelegraphs() {
        const out = [];
        for (const [, rs] of this.rooms) {
            if (rs.state !== 'active' || !rs.waveTelegraphTimer || rs.waveTelegraphTimer <= 0) continue;
            const nextWave = rs.pendingWaves && rs.pendingWaves[0];
            if (!nextWave) continue;
            const total = (rs.wavesSpawned || 0) === 0 ? 40 : 50;
            const progress = 1 - rs.waveTelegraphTimer / total;
            const isFirstWave = (rs.wavesSpawned || 0) === 0;
            for (const spawn of nextWave) {
                out.push({
                    x: spawn.x * TILE_SIZE + TILE_SIZE / 2,
                    y: spawn.y * TILE_SIZE + TILE_SIZE / 2,
                    progress,
                    // 波1 青白魔法阵（实体化），增援波红色（威胁升级）
                    color: isFirstWave ? '#9fdcff' : '#ff5040'
                });
            }
        }
        return out;
    }

    /**
     * 出生实体化保护：前 frames 帧不动不攻击、半透明渐显（实例包装，通用于所有敌人类型）。
     */
    _applySpawnGrace(enemy, frames = 30) {
        enemy.spawnGraceTimer = frames;

        const origUpdate = enemy.update.bind(enemy);
        enemy.update = (...args) => {
            if (enemy.spawnGraceTimer > 0) {
                enemy.spawnGraceTimer--;
                enemy.animationTimer = (enemy.animationTimer || 0) + 1;
                return;
            }
            origUpdate(...args);
        };

        const origDraw = enemy.draw.bind(enemy);
        enemy.draw = (ctx) => {
            if (enemy.spawnGraceTimer > 0) {
                ctx.save();
                ctx.globalAlpha = 0.3 + 0.6 * (1 - enemy.spawnGraceTimer / frames);
                origDraw(ctx);
                ctx.restore();
                return;
            }
            origDraw(ctx);
        };
    }

    /**
     * 遭遇战出怪（单波）：逐出怪点按角色映射抽敌人类型，点位被占时向邻格退让；
     * e 角色保底词缀精英，其余走常规精英概率。
     */
    _spawnEncounterWave(room, spawns, floorConfig) {
        const roleMap = floorConfig.roleMap || {};
        const offsets = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
        const spawnedThisWave = [];
        // 枪兵限额跨波累计（同房多波共享该计数）
        room._gunUserCount = room._gunUserCount || 0;

        for (const spawn of spawns) {
            const pool = roleMap[spawn.role] || roleMap.m || ['zombie'];
            let type = pool[Math.floor(Math.random() * pool.length)];
            // 每房枪兵限额：超额则改抽非枪兵类型
            type = capGunUsers(type, pool, room._gunUserCount);

            let enemy = null;
            for (const [dx, dy] of offsets) {
                const tx = spawn.x + dx;
                const ty = spawn.y + dy;
                // 退让落点不得在坑上
                if (this.worldSystem.isPitAt && this.worldSystem.isPitAt(tx * TILE_SIZE + 16, ty * TILE_SIZE + 16)) continue;
                enemy = this.worldSystem.spawnEnemy(type, { tileX: tx, tileY: ty, strict: true });
                if (enemy) break;
            }
            if (!enemy) continue;
            if (GUN_USER_TYPES.has(type)) room._gunUserCount++;

            this._applyFloorScaling(enemy, floorConfig);
            this._applySpawnGrace(enemy);
            if (spawn.role === 'e' && !enemy.isBoss && !enemy.isSegment) {
                const [minCount, maxCount] = floorConfig.eliteAffixCount || [1, 1];
                const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
                applyAffixes(enemy, pickRandomAffixes(count));
            } else {
                this._maybePromoteElite(enemy, room, floorConfig);
            }
            room.enemies.add(enemy);
            spawnedThisWave.push(enemy);
        }

        // 冷血怀表：出怪波刷新后对全体新敌人施加短暂减速
        const relicSystem = this.worldSystem.relicSystem;
        if (relicSystem && relicSystem.onWaveSpawned) {
            relicSystem.onWaveSpawned(spawnedThisWave);
        }
    }

    /**
     * 精英晋升（词缀）：精英房保底 1 词缀，普通战斗房按楼层 eliteChance 概率；
     * 词缀数取 FloorConfigs.eliteAffixCount 区间。Boss/分段体不参与。
     */
    _maybePromoteElite(enemy, room, floorConfig) {
        if (!floorConfig || enemy.isBoss || enemy.isSegment) return;

        let promote = false;
        if (room.category === 'elite') {
            promote = true; // 精英房全员保底
        } else if (room.type === 'normal' && Math.random() < floorConfig.eliteChance) {
            promote = true;
        }
        if (!promote) return;

        const [minCount, maxCount] = floorConfig.eliteAffixCount || [1, 1];
        const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
        applyAffixes(enemy, pickRandomAffixes(count));
    }

    /**
     * 中途生成的敌人（召唤物等）注册进来源敌人所在房间，纳入清除判定并应用楼层缩放。
     */
    registerSpawnedEnemy(enemy, sourceEnemy) {
        if (!enemy) return;
        this._applyFloorScaling(enemy, getFloorConfig(this.currentFloor));
        const anchor = sourceEnemy || enemy;
        const room = this.getRoomAt(anchor.x, anchor.y);
        if (room && room.state === 'active') {
            room.enemies.add(enemy);
        }
    }

    /**
     * [horde:enemies] 仅应用楼层缩放、不计入任何房间清除判定的生成登记。
     * 用于骨笛吹手唤起的 shambler：作为人潮补充存在，不占房间出怪配额（杀光配额怪即可清房）。
     */
    scaleUncountedSpawn(enemy) {
        if (!enemy) return;
        this._applyFloorScaling(enemy, getFloorConfig(this.currentFloor));
    }

    /**
     * 楼层数值缩放（FloorConfigs）：HP 与接触伤害直接乘算，
     * 弹幕/武器伤害经 enemy.damageMult 乘区（CombatSystem 消费）。
     * 同时赋首发延迟（锁门后给玩家 ~0.75s 反应窗口，EnemyWeaponController 消费）。
     */
    _applyFloorScaling(enemy, floorConfig) {
        enemy.holdFireTimer = 45;
        if (!floorConfig) return;
        if (floorConfig.hpMult !== 1) {
            enemy.hp = Math.round(enemy.hp * floorConfig.hpMult);
            enemy.maxHp = Math.round(enemy.maxHp * floorConfig.hpMult);
        }
        if (floorConfig.dmgMult !== 1) {
            if (Number.isFinite(enemy.damage)) {
                enemy.damage = Math.round(enemy.damage * floorConfig.dmgMult);
            }
            enemy.damageMult = floorConfig.dmgMult;
        }
    }

    /**
     * Remove dead enemies from room tracking.
     */
    _cleanDeadEnemies(room) {
        for (const enemy of room.enemies) {
            if (enemy.hp <= 0) {
                room.enemies.delete(enemy);
            }
        }
    }

    /**
     * Clear a room: unlock gates, spawn rewards.
     */
    clearRoom(room) {
        room.state = 'cleared';

        // Deactivate all gates for this room
        for (const gate of room.gates) {
            this._deactivateGate(gate);
        }

        // Drop rewards at room center
        this._dropRoomRewards(room);

        // Boss cleared: spawn portal to next floor or hub
        if (room.type === 'boss') {
            this._onBossCleared(room);
        }

        this.worldSystem.markWorldStaticDirty();
    }

    /**
     * Handle boss room cleared - spawn portal to next floor or back to hub.
     */
    _onBossCleared(room) {
        const centerX = (room.x + Math.floor(room.w / 2)) * TILE_SIZE;
        const centerY = (room.y + Math.floor(room.h / 2)) * TILE_SIZE;

        if (this.currentFloor < FINAL_FLOOR) {
            // 下潜传送门：dungeon → dungeon_f2 → dungeon_f3
            const nextFloor = this.currentFloor + 1;
            this.worldSystem.portals.push(new Portal(
                centerX,
                centerY,
                `dungeon_f${nextFloor}`,
                `FLOOR ${nextFloor}`,
                nextFloor === FINAL_FLOOR ? '#e67e22' : '#27ae60'
            ));
        } else {
            // 末层通关：回 hub 的胜利传送门
            this.worldSystem.portals.push(new Portal(
                centerX,
                centerY,
                'hub',
                'VICTORY',
                '#f1c40f'
            ));
        }

        // Boss 保底宝箱：放在传送门旁 2 tile 处，未全收集遗物时必出遗物
        const chestTier = BOSS_CHEST_TIER[this.currentFloor] || 'mithril';
        const bossChest = this.worldSystem.spawnChest(centerX + TILE_SIZE * 2, centerY, chestTier);
        bossChest.guaranteedRelic = true;
    }

    /**
     * [tension-batch:power] 掉落一把「当层带宽」武器（稀有度取 weaponRarityWeightsForFloor(currentFloor)）。
     * 供清房概率掉落与每层保底共用。
     * @returns {boolean} 是否成功生成武器掉落
     */
    _dropFloorWeapon(centerX, centerY) {
        const rarity = pickRarity(weaponRarityWeightsForFloor(this.currentFloor));
        const weaponConfigId = pickWeaponByRarity(rarity);
        const weaponItemId = weaponConfigId ? weaponItemIdFromConfigId(weaponConfigId) : null;
        if (!weaponItemId) return false;
        const instanceData = createWeaponInstanceData({ weaponConfigId });
        const offsetX = (Math.random() - 0.5) * 32;
        const offsetY = (Math.random() - 0.5) * 32;
        this.worldSystem.droppedItems.push(
            new DroppedItem(centerX + offsetX, centerY + offsetY, weaponItemId, 1, instanceData)
        );
        return true;
    }

    /**
     * Drop rewards after clearing a room.
     */
    _dropRoomRewards(room) {
        const centerX = (room.x + room.w / 2) * TILE_SIZE;
        const centerY = (room.y + room.h / 2) * TILE_SIZE;

        if (room.type === 'boss') {
            // Boss drops handled by WorldSystem._dropBossLoot
            return;
        }

        // 金币必掉（黄金神像遗物翻倍；精英房金币加成）
        const relicCoinMult = this.worldSystem.relicSystem
            ? this.worldSystem.relicSystem.roomClearCoinMult()
            : 1;
        const eliteCoinMult = room.category === 'elite' ? ELITE_CLEAR.coinMult : 1;
        const coinAmount = Math.round((ROOM_CLEAR.coinMin +
            Math.floor(Math.random() * (ROOM_CLEAR.coinMax - ROOM_CLEAR.coinMin + 1))) * relicCoinMult * eliteCoinMult);
        this.worldSystem.spawnCoinBurst(centerX, centerY, coinAmount);

        // 精英房：保底钥匙 + 保底宝箱
        if (room.category === 'elite') {
            this.worldSystem.spawnKeyDrop(centerX + 24, centerY + 16);
            this.worldSystem.spawnChest(centerX - 13, centerY - 40, ELITE_CLEAR.chestTier);
        }

        // 概率掉钥匙
        if (Math.random() < ROOM_CLEAR.keyChance) {
            this.worldSystem.spawnKeyDrop(
                centerX + (Math.random() - 0.5) * 40,
                centerY + (Math.random() - 0.5) * 40
            );
        }

        // 概率生成木箱（过渡曝光，正式宝箱房归 P3）
        if (Math.random() < ROOM_CLEAR.chestChance) {
            this.worldSystem.spawnChest(centerX + TILE_SIZE, centerY - TILE_SIZE, 'wood');
        }

        // [tension-batch:power] 概率掉武器（稀有度按当层带宽上移，见 LootTable.weaponRarityWeightsForFloor）
        let weaponDropped = false;
        if (Math.random() < ROOM_CLEAR.weaponChance) {
            weaponDropped = this._dropFloorWeapon(centerX, centerY);
        }
        // [tension-batch:power] 每层保底：已清 ≥ weaponGuaranteeRooms 房仍未掉过武器 → 本次清房必掉当层带宽武器
        if (!weaponDropped && shouldForceWeaponDrop(this._floorRoomsCleared, this._floorWeaponDropped)) {
            weaponDropped = this._dropFloorWeapon(centerX, centerY);
        }
        if (weaponDropped) this._floorWeaponDropped = true;
        this._floorRoomsCleared++;

        // [depth-batch:gamble] 普通战斗房清房后 20% 概率在角落刷一台老虎机（每层最多 maxPerFloorBattleRooms 台）
        if (!room.category && this._floorSlotMachines < GAMBLE.maxPerFloorBattleRooms
            && Math.random() < GAMBLE.battleRoomChance) {
            const corners = [
                { x: room.x + 2, y: room.y + 2 },
                { x: room.x + room.w - 4, y: room.y + 2 },
                { x: room.x + 2, y: room.y + room.h - 4 },
                { x: room.x + room.w - 4, y: room.y + room.h - 4 },
            ];
            const c = corners[Math.floor(Math.random() * corners.length)];
            this.worldSystem.spawnSlotMachine(c.x * TILE_SIZE, c.y * TILE_SIZE);
            this._floorSlotMachines++;
        }

        // [tension-batch:ai] 治疗紧缩：清房消耗品掉率 50%→15%（濒死时刻靠稀缺治疗制造）
        if (Math.random() < 0.15) {
            const consumables = ['consumable:medkit', 'consumable:hamburger'];
            const itemId = consumables[Math.floor(Math.random() * consumables.length)];
            const offsetX = (Math.random() - 0.5) * 48;
            const offsetY = (Math.random() - 0.5) * 48;
            this.worldSystem.droppedItems.push(
                new DroppedItem(centerX + offsetX, centerY + offsetY, itemId)
            );
        }
    }

    /** 规范化无向边 key（房间 id 排序拼接）。 */
    _edgeKey(a, b) {
        return a < b ? `${a}|${b}` : `${b}|${a}`;
    }

    /**
     * 复刻 DungeonLayoutGenerator.closestEdgePoints：从两房矩形推出走廊真实门位（tile 坐标）。
     * @returns {{ ax, ay, bx, by, horizontal }} horizontal 表示主导轴为水平（门在左右面）。
     */
    _closestEdgePoints(a, b) {
        const acx = Math.floor(a.x + a.w / 2);
        const acy = Math.floor(a.y + a.h / 2);
        const bcx = Math.floor(b.x + b.w / 2);
        const bcy = Math.floor(b.y + b.h / 2);
        const dx = bcx - acx;
        const dy = bcy - acy;
        let ax, ay, bx, by;
        const horizontal = Math.abs(dx) >= Math.abs(dy);
        if (horizontal) {
            if (dx > 0) { ax = a.x + a.w; bx = b.x; } else { ax = a.x; bx = b.x + b.w; }
            const overlapTop = Math.max(a.y + 2, b.y + 2);
            const overlapBottom = Math.min(a.y + a.h - 2, b.y + b.h - 2);
            if (overlapTop <= overlapBottom) { ay = by = Math.floor((overlapTop + overlapBottom) / 2); }
            else { ay = acy; by = bcy; }
        } else {
            if (dy > 0) { ay = a.y + a.h; by = b.y; } else { ay = a.y; by = b.y + b.h; }
            const overlapLeft = Math.max(a.x + 2, b.x + 2);
            const overlapRight = Math.min(a.x + a.w - 2, b.x + b.w - 2);
            if (overlapLeft <= overlapRight) { ax = bx = Math.floor((overlapLeft + overlapRight) / 2); }
            else { ax = acx; bx = bcx; }
        }
        return { ax, ay, bx, by, horizontal };
    }

    /**
     * 为一条边构造正交折线（L 形肘线）：落在真实门位，拐弯方向优先匹配真实走廊 tile。
     * @param {Object} a - 房间 A（含 x/y/w/h）
     * @param {Object} b - 房间 B
     * @param {Set<string>|undefined} tileSet - 该走廊 tile 集合 "x,y"（用于判定拐弯朝向）
     * @returns {Array<{x,y}>} tile 空间折线（2 点直线或 3 点 L 形）
     */
    _buildElbowPath(a, b, tileSet) {
        const { ax, ay, bx, by, horizontal } = this._closestEdgePoints(a, b);
        // 沿走廊轴取 tile 中心（+0.5），垂直于门面的坐标取房块边界值
        const pA = horizontal ? { x: ax, y: ay + 0.5 } : { x: ax + 0.5, y: ay };
        const pB = horizontal ? { x: bx, y: by + 0.5 } : { x: bx + 0.5, y: by };

        const aligned = horizontal ? (ay === by) : (ax === bx);
        if (aligned) return [pA, pB];

        // 默认：水平主导先走水平段，垂直主导先走垂直段（门面法向优先）
        let horizFirst = horizontal;
        if (tileSet) {
            if (tileSet.has(`${bx},${ay}`)) horizFirst = true;
            else if (tileSet.has(`${ax},${by}`)) horizFirst = false;
        }
        const elbow = horizFirst ? { x: pB.x, y: pA.y } : { x: pA.x, y: pB.y };
        return [pA, elbow, pB];
    }

    /** 预计算全部图边的正交折线（每层一次，缓存于实例）。 */
    _getMinimapEdgePaths() {
        if (this._minimapEdgePaths) return this._minimapEdgePaths;
        const paths = new Map();
        // 真实走廊 tile 集合（判定 L 形拐弯朝向）：edgeKey → Set("x,y")
        const corridorTiles = new Map();
        for (const c of (this.layout && this.layout.corridors) || []) {
            if (!c || !Array.isArray(c.connectsRooms) || c.connectsRooms.length < 2) continue;
            if (!Array.isArray(c.tiles) || c.tiles.length === 0) continue;
            corridorTiles.set(
                this._edgeKey(c.connectsRooms[0], c.connectsRooms[1]),
                new Set(c.tiles.map(t => `${t.x},${t.y}`))
            );
        }
        for (const edge of this.graphEdges || []) {
            const a = this.rooms.get(edge.a);
            const b = this.rooms.get(edge.b);
            if (!a || !b) continue;
            const key = this._edgeKey(edge.a, edge.b);
            paths.set(key, this._buildElbowPath(a, b, corridorTiles.get(key)));
        }
        this._minimapEdgePaths = paths;
        return paths;
    }

    /**
     * Get minimap data for rendering.
     * @returns {{ rooms: Array, edges: Array, currentRoomId: string, playerTileX: number, playerTileY: number, floor: number }}
     */
    getMinimapData(player, aimAngle = null) {
        const visitedIds = new Set();
        const frontierIds = new Set();

        for (const [, rs] of this.rooms) {
            if (rs.visited) {
                visitedIds.add(rs.id);
            }
        }

        for (const [, rs] of this.rooms) {
            if (!rs.visited) continue;
            for (const cid of rs.connectedTo) {
                const connected = this.rooms.get(cid);
                if (connected && !connected.visited) {
                    frontierIds.add(connected.id);
                }
            }
        }

        const roomData = [];

        for (const [, rs] of this.rooms) {
            const isVisited = visitedIds.has(rs.id);
            const isFrontier = frontierIds.has(rs.id);
            if (!isVisited && !isFrontier) continue;

            const graphNode = this.graphNodesById.get(rs.id) || null;
            roomData.push({
                x: rs.x,
                y: rs.y,
                w: rs.w,
                h: rs.h,
                type: rs.type,
                category: rs.category || null,
                state: isVisited ? rs.state : 'unknown',
                visibilityState: isVisited ? 'visited' : 'frontier',
                id: rs.id,
                locked: isVisited ? rs.gates.some(gate => gate.active) : false,
                graphNode
            });
        }

        // 附带正交折线几何（供小地图/大地图绘制 L 形走廊）
        const edgePaths = this._getMinimapEdgePaths();
        const edges = (this.graphEdges || []).map(e => ({
            a: e.a,
            b: e.b,
            path: edgePaths.get(this._edgeKey(e.a, e.b)) || null
        }));

        return {
            rooms: roomData,
            edges,
            currentRoomId: this.currentRoomId,
            playerTileX: Math.floor(player.x / TILE_SIZE),
            playerTileY: Math.floor(player.y / TILE_SIZE),
            playerFacingAngle: Number.isFinite(aimAngle) ? aimAngle : null,
            floor: this.currentFloor,
            visitedCount: visitedIds.size,
            totalRooms: this.rooms.size
        };
    }
}
