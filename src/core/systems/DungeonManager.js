import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../../utils/Constants.js';
import { DroppedItem } from '../entities/DroppedItem.js';
import { Portal } from '../entities/Portal.js';
import { weaponItemIdFromConfigId, createWeaponInstanceData } from './WeaponInstanceUtils.js';

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
        this.gridW = MAP_WIDTH;
        this.gridH = MAP_HEIGHT;
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

        // 30% chance to drop a weapon
        if (Math.random() < 0.3) {
            const pool = this.worldSystem._getRoomWeaponPool();
            if (pool && pool.length > 0) {
                const weaponConfigId = pool[Math.floor(Math.random() * pool.length)];
                const weaponItemId = weaponItemIdFromConfigId(weaponConfigId);
                if (weaponItemId) {
                    const instanceData = createWeaponInstanceData({ weaponConfigId });
                    const offsetX = (Math.random() - 0.5) * 32;
                    const offsetY = (Math.random() - 0.5) * 32;
                    this.worldSystem.droppedItems.push(
                        new DroppedItem(centerX + offsetX, centerY + offsetY, weaponItemId, 1, instanceData)
                    );
                }
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
     * @returns {{ rooms: Array, corridors: Array, currentRoomId: string, playerTileX: number, playerTileY: number, floor: number }}
     */
    getMinimapData(player) {
        const roomData = [];
        for (const [, rs] of this.rooms) {
            if (!rs.visited) continue;
            roomData.push({
                x: rs.x,
                y: rs.y,
                w: rs.w,
                h: rs.h,
                type: rs.type,
                state: rs.state,
                id: rs.id
            });
        }

        // Also reveal rooms adjacent to visited rooms (as unexplored silhouettes)
        for (const [, rs] of this.rooms) {
            if (rs.visited) continue;
            // Check if any connected room is visited
            const isAdjacent = rs.connectedTo.some(cid => {
                const connected = this.rooms.get(cid);
                return connected && connected.visited;
            });
            if (isAdjacent) {
                roomData.push({
                    x: rs.x,
                    y: rs.y,
                    w: rs.w,
                    h: rs.h,
                    type: rs.type,
                    state: 'unknown',
                    id: rs.id
                });
            }
        }

        return {
            rooms: roomData,
            corridors: this.layout.corridors,
            currentRoomId: this.currentRoomId,
            playerTileX: Math.floor(player.x / TILE_SIZE),
            playerTileY: Math.floor(player.y / TILE_SIZE),
            floor: this.currentFloor
        };
    }
}
