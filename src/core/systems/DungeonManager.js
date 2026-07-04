import { TILE_SIZE } from '../../utils/Constants.js';
import { DroppedItem } from '../entities/DroppedItem.js';
import { Portal } from '../entities/Portal.js';
import { weaponItemIdFromConfigId, createWeaponInstanceData } from './WeaponInstanceUtils.js';
import { pickRarity, pickWeaponByRarity } from '../dungeon/LootTable.js';
import { ROOM_CLEAR, BOSS_CHEST_TIER } from '../dungeon/EconomyConfig.js';

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
        if (room.state === 'idle') {
            room.visited = true;
            const tx = Math.floor(player.x / TILE_SIZE);
            const ty = Math.floor(player.y / TILE_SIZE);
            const margin = 2;
            if (tx >= room.x + margin && tx < room.x + room.w - margin &&
                ty >= room.y + margin && ty < room.y + room.h - margin) {
                this.activateRoom(room);
            }
        }

        // Check if active rooms are cleared
        for (const [, rs] of this.rooms) {
            if (rs.state === 'active') {
                this._cleanDeadEnemies(rs);
                if (rs.enemies.size === 0) {
                    this.clearRoom(rs);
                }
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

        // Spawn enemies
        this._spawnRoomEnemies(room);

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
                h: TILE_SIZE
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
        if (!config || !config.types) return;

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
                    room.enemies.add(enemy);
                    if (enemy.isBoss) {
                        enemy.worldSystem = this.worldSystem;
                    }
                }
            }
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

        if (this.currentFloor === 1) {
            // Spawn portal to floor 2
            this.worldSystem.portals.push(new Portal(
                centerX,
                centerY,
                'dungeon_f2',
                'FLOOR 2',
                '#27ae60'
            ));
        } else {
            // Floor 2 cleared: spawn portal back to hub (victory)
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

        // 金币必掉（黄金神像遗物翻倍）
        const coinMult = this.worldSystem.relicSystem
            ? this.worldSystem.relicSystem.roomClearCoinMult()
            : 1;
        const coinAmount = (ROOM_CLEAR.coinMin +
            Math.floor(Math.random() * (ROOM_CLEAR.coinMax - ROOM_CLEAR.coinMin + 1))) * coinMult;
        this.worldSystem.spawnCoinBurst(centerX, centerY, coinAmount);

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
