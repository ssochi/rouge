import { TILE_SIZE } from '../../utils/Constants.js';
import { DroppedItem } from '../entities/DroppedItem.js';
import { Portal } from '../entities/Portal.js';
import { weaponItemIdFromConfigId, createWeaponInstanceData } from './WeaponInstanceUtils.js';
import { pickRarity, pickWeaponByRarity } from '../dungeon/LootTable.js';
import { ROOM_CLEAR, BOSS_CHEST_TIER, ELITE_CLEAR, FINAL_FLOOR } from '../dungeon/EconomyConfig.js';
import { getFloorConfig } from '../dungeon/FloorConfigs.js';
import { applyAffixes, pickRandomAffixes } from '../dungeon/EnemyAffixSystem.js';

// 用户反馈：手枪猎人 / 随机武器士兵手感偏强，F1/F2 枪兵应是稀有强敌，避免一波涌出多只。
// 每个遭遇战房间限制 hunter+soldier 合计生成 ≤2 只；超额时从同角色池改抽非枪兵类型。
const GUN_USER_TYPES = new Set(['hunter', 'soldier']);
const MAX_GUN_USERS_PER_ROOM = 2;

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
        }

        // Activate room on first entry - only when player is well inside
        // (not at edge tiles where gates are, to avoid trapping player outside)
        if (room.state === 'idle' && !this.worldSystem.debugPeaceMode) {
            room.visited = true;
            const tx = Math.floor(player.x / TILE_SIZE);
            const ty = Math.floor(player.y / TILE_SIZE);
            const margin = 2;
            if (tx >= room.x + margin && tx < room.x + room.w - margin &&
                ty >= room.y + margin && ty < room.y + room.h - margin) {
                this.activateRoom(room);
            }
        }

        // Check if active rooms are cleared（支持遭遇战多波次）
        for (const [, rs] of this.rooms) {
            if (rs.state !== 'active') continue;
            this._cleanDeadEnemies(rs);
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
                rs.waveTelegraphTimer = 50; // 增援波预警 ~0.83s
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

    /**
     * Activate a gate: add wall rects for all tiles to block passage.
     */
    _activateGate(gate) {
        if (gate.active) return;
        gate.active = true;
        gate.animTimer = 0;

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

        // 概率掉武器（稀有度加权抽取）
        if (Math.random() < ROOM_CLEAR.weaponChance) {
            const rarity = pickRarity(ROOM_CLEAR.weaponRarityWeights);
            const weaponConfigId = pickWeaponByRarity(rarity);
            const weaponItemId = weaponConfigId ? weaponItemIdFromConfigId(weaponConfigId) : null;
            if (weaponItemId) {
                const instanceData = createWeaponInstanceData({ weaponConfigId });
                const offsetX = (Math.random() - 0.5) * 32;
                const offsetY = (Math.random() - 0.5) * 32;
                this.worldSystem.droppedItems.push(
                    new DroppedItem(centerX + offsetX, centerY + offsetY, weaponItemId, 1, instanceData)
                );
            }
        }

        // 50% chance to drop a consumable
        if (Math.random() < 0.5) {
            const consumables = ['consumable:medkit', 'consumable:hamburger'];
            const itemId = consumables[Math.floor(Math.random() * consumables.length)];
            const offsetX = (Math.random() - 0.5) * 48;
            const offsetY = (Math.random() - 0.5) * 48;
            this.worldSystem.droppedItems.push(
                new DroppedItem(centerX + offsetX, centerY + offsetY, itemId)
            );
        }
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

        return {
            rooms: roomData,
            edges: this.graphEdges,
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
