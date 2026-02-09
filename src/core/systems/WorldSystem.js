import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../../utils/Constants.js';
import { Zombie } from '../entities/Zombie.js';
import { ZombieFemale } from '../entities/ZombieFemale.js';
import { Hunter } from '../entities/Hunter.js';
import { DroppedItem } from '../entities/DroppedItem.js';
import { BreakableObject } from '../entities/BreakableObject.js';
import { Carpet } from '../entities/Carpet.js';
import { Enemy } from '../entities/Enemy.js';
import { Portal } from '../entities/Portal.js';
import { Vehicle } from '../entities/Vehicle.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { Assets } from '../../graphics/Assets.js';
import { generateConstructionLayout } from './generation/ConstructionLayoutGenerator.js';

export class WorldSystem {
    constructor({ navGrid, walls, enemies, droppedItems, breakableObjects, player, combatSystem, vehicles, inventorySystem }) {
        this.navGrid = navGrid;
        this.walls = walls;
        this.enemies = enemies;
        this.droppedItems = droppedItems;
        this.breakableObjects = breakableObjects;
        this.player = player;
        this.combatSystem = combatSystem;
        this.vehicles = vehicles;
        this.inventorySystem = inventorySystem;
        this.portals = [];
        this.carpets = [];
    }

    loadMap(mapType) {
        // Clear existing entities
        this.walls.length = 0;
        this.enemies.length = 0;
        this.droppedItems.length = 0;
        this.breakableObjects.length = 0;
        this.portals.length = 0;
        this.carpets.length = 0;
        if (this.vehicles) this.vehicles.length = 0;
        
        // Reset player state if needed (position is handled per map)
        
        switch (mapType) {
            case 'hub':
                this.initHubMap();
                break;
            case 'test':
                this.initTestMap();
                break;
            case 'construction':
                this.initConstructionMap();
                break;
            case 'game':
                this.initGameMap();
                break;
            default:
                console.error('Unknown map type:', mapType);
                this.initHubMap();
        }
        
        if (mapType === 'test' && this.inventorySystem) {
            this.fillInventoryForTest();
        }
        
        this.navGrid.setWalls(this.walls);
        this.navGrid.updateFlowField(this.player.x, this.player.y);
    }

    fillInventoryForTest() {
        if (!this.inventorySystem) return;
        
        // Add Weapons
        this.inventorySystem.add('weapon:rifle', 1);
        this.inventorySystem.add('weapon:rocket_launcher', 1);
        this.inventorySystem.add('weapon:pistol', 1);
        this.inventorySystem.add('weapon:smg', 1);
        this.inventorySystem.add('weapon:shotgun', 1);
        this.inventorySystem.add('weapon:sniper', 1);
        this.inventorySystem.add('weapon:crossbow', 1);
        this.inventorySystem.add('weapon:grenade_launcher', 1);

        // Add Placeables
        const ids = this.inventorySystem.getAllPlaceableIds();
        ids.forEach(id => {
            this.inventorySystem.add(id, 99);
        });
        
        // Select first slot
        this.inventorySystem.selectHotbarSlot(0);
    }

    initHubMap() {
        // Safe Zone: Boxed room
        const w = 20;
        const h = 15;
        const startX = 5 * TILE_SIZE;
        const startY = 5 * TILE_SIZE;
        
        // Walls
        this.walls.push({x: startX, y: startY, w: w * TILE_SIZE, h: TILE_SIZE}); // Top
        this.walls.push({x: startX, y: startY + (h-1)*TILE_SIZE, w: w * TILE_SIZE, h: TILE_SIZE}); // Bottom
        this.walls.push({x: startX, y: startY, w: TILE_SIZE, h: h * TILE_SIZE}); // Left
        this.walls.push({x: startX + (w-1)*TILE_SIZE, y: startY, w: TILE_SIZE, h: h * TILE_SIZE}); // Right
        
        // Player Spawn
        this.player.x = startX + (w/2) * TILE_SIZE;
        this.player.y = startY + (h/2) * TILE_SIZE;
        
        // Carpets
        // Tutorial Carpets (3 Separate)
        const carpetY = startY + 5 * TILE_SIZE;
        this.carpets.push(new Carpet(startX + 6 * TILE_SIZE, carpetY, 'carpet_tutorial_r'));
        this.carpets.push(new Carpet(startX + 8 * TILE_SIZE, carpetY, 'carpet_tutorial_b'));
        this.carpets.push(new Carpet(startX + 10 * TILE_SIZE, carpetY, 'carpet_tutorial_e'));
        
        // Portals
        // Game Portal (Red)
        this.portals.push(new Portal(
            startX + 5 * TILE_SIZE, 
            startY + 2 * TILE_SIZE, 
            'game', 
            'GAME', 
            '#e74c3c'
        ));
        
        // Test Portal (Blue)
        this.portals.push(new Portal(
            startX + 12 * TILE_SIZE, 
            startY + 2 * TILE_SIZE, 
            'test', 
            'TEST', 
            '#3498db'
        ));

        // Construction Portal (Orange)
        this.portals.push(new Portal(
            startX + 8 * TILE_SIZE,
            startY + 9 * TILE_SIZE,
            'construction',
            'BUILD',
            '#e67e22'
        ));
    }

    initConstructionMap() {
        // Large empty area
        this.walls.push({x: 0, y: 0, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: (MAP_HEIGHT - 1) * TILE_SIZE, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});
        this.walls.push({x: (MAP_WIDTH - 1) * TILE_SIZE, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});

        const layout = generateConstructionLayout({
            mapWidth: MAP_WIDTH,
            mapHeight: MAP_HEIGHT
        });

        if (layout.ok) {
            layout.breakables.forEach(def => {
                this.breakableObjects.push(new BreakableObject(def.x, def.y, def.type));
            });

            if (layout.spawn) {
                this.player.x = layout.spawn.x;
                this.player.y = layout.spawn.y;
            } else {
                this.player.x = 200;
                this.player.y = 300;
            }
        } else {
            this.initConstructionFallbackLayout();
        }

        // Return Portal
        this.portals.push(new Portal(
            100, 
            100, 
            'hub', 
            'HUB', 
            '#9b59b6'
        ));
    }

    initConstructionFallbackLayout() {
        const houseTileX = 12;
        const houseTileY = 10;
        const houseW = 12;
        const houseH = 8;

        for (let x = 0; x < houseW; x++) {
            this.breakableObjects.push(new BreakableObject((houseTileX + x) * TILE_SIZE, houseTileY * TILE_SIZE, 'wall'));
            const isDoor = x === Math.floor(houseW / 2);
            const bottomType = isDoor ? 'door_h' : 'wall';
            this.breakableObjects.push(new BreakableObject((houseTileX + x) * TILE_SIZE, (houseTileY + houseH - 1) * TILE_SIZE, bottomType));
        }

        for (let y = 1; y < houseH - 1; y++) {
            this.breakableObjects.push(new BreakableObject(houseTileX * TILE_SIZE, (houseTileY + y) * TILE_SIZE, 'wall'));
            this.breakableObjects.push(new BreakableObject((houseTileX + houseW - 1) * TILE_SIZE, (houseTileY + y) * TILE_SIZE, 'wall'));
        }

        const baseX = houseTileX * TILE_SIZE;
        const baseY = houseTileY * TILE_SIZE;
        this.breakableObjects.push(new BreakableObject(baseX + 2 * TILE_SIZE, baseY + 2 * TILE_SIZE, 'sofa'));
        this.breakableObjects.push(new BreakableObject(baseX + 6 * TILE_SIZE, baseY + 2 * TILE_SIZE, 'tv_stand'));
        this.breakableObjects.push(new BreakableObject(baseX + 8 * TILE_SIZE, baseY + 4 * TILE_SIZE, 'bed'));
        this.breakableObjects.push(new BreakableObject(baseX + 9 * TILE_SIZE, baseY + 4 * TILE_SIZE, 'nightstand'));
        this.breakableObjects.push(new BreakableObject(baseX + 5 * TILE_SIZE, baseY + 5 * TILE_SIZE, 'table'));

        this.player.x = (houseTileX + Math.floor(houseW / 2)) * TILE_SIZE + TILE_SIZE / 2;
        this.player.y = (houseTileY + houseH) * TILE_SIZE + TILE_SIZE / 2;
    }

    initTestMap() {
        // Open area with test sections
        // Walls
        this.walls.push({x: 0, y: 0, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: (MAP_HEIGHT - 1) * TILE_SIZE, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});
        this.walls.push({x: (MAP_WIDTH - 1) * TILE_SIZE, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});
        
        this.player.x = 200;
        this.player.y = 300;
        
        // Weapon Rack
        let wx = 200;
        for (const key in WEAPONS) {
            this.droppedItems.push(new DroppedItem(wx, 200, `weapon:${key.replace('default_', '')}`, 1));
            wx += 64;
        }
        
        // Breakable Grid (All Types)
        // Dynamically get all object types from Assets.objects
        // Filter out _flash variants
        const allTypes = Object.keys(Assets.objects).filter(key => !key.endsWith('_flash'));
        const carpetTypes = allTypes.filter(key => key.startsWith('carpet_'));
        const types = allTypes.filter(key => !key.startsWith('carpet_'));

        if (carpetTypes.length > 0) {
            const carpetStartX = 200;
            const carpetStartY = 350;
            let cx = carpetStartX;
            let cy = carpetStartY;
            let rowMaxH = 0;
            const maxRowWidth = 900;
            const margin = 24;

            carpetTypes.forEach(type => {
                const sprite = Assets.objects[type];
                const w = sprite ? sprite.width : 32;
                const h = sprite ? sprite.height : 32;

                if (cx + w > carpetStartX + maxRowWidth) {
                    cx = carpetStartX;
                    cy += rowMaxH + margin;
                    rowMaxH = 0;
                }

                this.carpets.push(new Carpet(cx, cy, type));
                cx += w + margin;
                rowMaxH = Math.max(rowMaxH, h);
            });
        }

        const baseStartX = 200;
        const baseStartY = 520;
        const typesPerRow = 5;
        const gridSpacingX = 250;
        const gridSpacingY = 300; // 5 rows * 40 = 200 + margin
        
        types.forEach((type, index) => {
            const typeRow = Math.floor(index / typesPerRow);
            const typeCol = index % typesPerRow;
            
            const currentStartX = baseStartX + typeCol * gridSpacingX;
            const currentStartY = baseStartY + typeRow * gridSpacingY;

            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    const obj = new BreakableObject(
                        currentStartX + c * 40,
                        currentStartY + r * 40,
                        type
                    );
                    
                    // Special spacing for Bed (it's tall)
                    if (type === 'bed') {
                        // Increase vertical spacing
                        obj.y = currentStartY + r * 60;
                    } else if (type === 'bed_h') {
                         // Increase horizontal spacing (it's wide)
                         obj.x = currentStartX + c * 60;
                    } else if (type === 'wardrobe') {
                         // Increase vertical spacing
                         obj.y = currentStartY + r * 70;
                    } else if (type === 'sofa') {
                         obj.x = currentStartX + c * 60; // Wider
                    } else if (type === 'bookshelf') {
                         obj.y = currentStartY + r * 60; // Taller
                    }
                    
                    this.breakableObjects.push(obj);
                }
            }
        });
        
        // Return Portal
        this.portals.push(new Portal(
            100, 
            100, 
            'hub', 
            'HUB', 
            '#9b59b6'
        ));

        // Add Test Vehicle
        if (this.vehicles) {
            // Place vehicles near the portal (100, 100) aligned in a row
            // Away from items (which are at Y=200)
            this.vehicles.push(new Vehicle(220, 100, 'suv'));
            this.vehicles.push(new Vehicle(320, 100, 'truck'));
            this.vehicles.push(new Vehicle(420, 100, 'police'));
        }
    }

    initGameMap() {
        this.initMap(); // Use existing logic
        
        // Add Return Portal? Maybe not for main game loop yet
    }

    initMap() {
        this.walls.push({x: 0, y: 0, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: (MAP_HEIGHT - 1) * TILE_SIZE, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});
        this.walls.push({x: (MAP_WIDTH - 1) * TILE_SIZE, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});

        for (let i = 0; i < 20; i++) {
            const wx = Math.floor(Math.random() * (MAP_WIDTH - 4) + 2) * TILE_SIZE;
            const wy = Math.floor(Math.random() * (MAP_HEIGHT - 4) + 2) * TILE_SIZE;
            this.walls.push({x: wx, y: wy, w: TILE_SIZE * 2, h: TILE_SIZE * 2});
        }

        // Spawn Zombies
        for (let i = 0; i < 40; i++) {
            this.spawnEnemy('zombie');
        }

        // Spawn Female Zombies
        for (let i = 0; i < 30; i++) {
            this.spawnEnemy('zombie_female');
        }

        // Spawn Hunters
        for (let i = 0; i < 10; i++) {
            this.spawnEnemy('hunter');
        }
        
        this.droppedItems.push(new DroppedItem(500, 400, 'weapon:rifle', 1));
        this.droppedItems.push(new DroppedItem(600, 350, 'weapon:rifle', 1));

        for (let i = 0; i < 30; i++) {
            const types = ['box', 'barrel', 'vase'];
            const type = types[Math.floor(Math.random() * types.length)];
            const ox = Math.floor(Math.random() * (MAP_WIDTH - 4) + 2) * TILE_SIZE;
            const oy = Math.floor(Math.random() * (MAP_HEIGHT - 4) + 2) * TILE_SIZE;
            
            let overlap = false;
            for (const w of this.walls) {
                if (ox < w.x + w.w && ox + 32 > w.x && oy < w.y + w.h && oy + 32 > w.y) {
                    overlap = true;
                    break;
                }
            }
            if (!overlap) {
                this.breakableObjects.push(new BreakableObject(ox, oy, type));
            }
        }
        
        // Set Player Start
        this.player.x = 400;
        this.player.y = 300;

        this.navGrid.setWalls(this.walls);
        this.navGrid.updateFlowField(this.player.x, this.player.y);
    }

    updatePortals() {
        this.portals.forEach(p => {
            p.update(this.player);
            // Collision logic moved to PlayerSystem or handled here if purely collision based.
            // But we want 'E' interaction now.
            // Keeping collision check for proximity detection only if needed.
        });
    }

    spawnEnemy(type = 'zombie') {
        const ex = Math.floor(Math.random() * (MAP_WIDTH - 4) + 2) * TILE_SIZE;
        const ey = Math.floor(Math.random() * (MAP_HEIGHT - 4) + 2) * TILE_SIZE;

        if (type === 'hunter') {
            this.enemies.push(new Hunter(ex, ey));
        } else if (type === 'zombie_female') {
            this.enemies.push(new ZombieFemale(ex, ey));
        } else {
            this.enemies.push(new Zombie(ex, ey));
        }
    }

    checkRectCollision(rect1, rect2) {
        const r1w = rect1.width ?? rect1.w;
        const r1h = rect1.height ?? rect1.h;
        const r2w = rect2.width ?? rect2.w;
        const r2h = rect2.height ?? rect2.h;
        return (rect1.x < rect2.x + r2w &&
                rect1.x + r1w > rect2.x &&
                rect1.y < rect2.y + r2h &&
                rect1.y + r1h > rect2.y);
    }

    getEntityMovementRect(entity, x = entity.x, y = entity.y) {
        if (entity.getMovementHitboxAt) {
            return entity.getMovementHitboxAt(x, y);
        }

        const hbWidth = entity.hitboxWidth || entity.width;
        const hbHeight = entity.hitboxHeight || entity.height;
        const hbOffsetY = entity.hitboxOffsetY || 0;
        return {
            x: x - hbWidth / 2,
            y: y + hbOffsetY - hbHeight / 2,
            width: hbWidth,
            height: hbHeight
        };
    }

    isRectBlocked(rect, options = {}) {
        const ignoreObject = options.ignoreObject || null;
        for (const wall of this.walls) {
            if (this.checkRectCollision(rect, wall)) {
                return true;
            }
        }

        for (const obj of this.breakableObjects) {
            if (obj.isBroken || obj === ignoreObject) continue;
            const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
            for (const hb of hitboxes) {
                if (this.checkRectCollision(rect, hb)) {
                    return true;
                }
            }
        }
        return false;
    }

    isEntityBlockedAt(entity, x, y, options = {}) {
        const rect = this.getEntityMovementRect(entity, x, y);
        return this.isRectBlocked(rect, options);
    }

    _updateMovementState(entity, fromX, fromY, intentX, intentY, options = {}) {
        const state = entity._movementState || {
            stuckFrames: 0,
            lastSafeX: fromX,
            lastSafeY: fromY
        };

        const movedDist = Math.hypot(entity.x - fromX, entity.y - fromY);
        const intentDist = Math.hypot(intentX, intentY);

        if (!this.isEntityBlockedAt(entity, entity.x, entity.y, options)) {
            state.lastSafeX = entity.x;
            state.lastSafeY = entity.y;
        }

        if (intentDist > 0.2 && movedDist < 0.1) {
            state.stuckFrames++;
        } else {
            state.stuckFrames = 0;
        }

        if (state.stuckFrames >= 8) {
            const unstuck = this.unstuckEntity(entity, options);
            state.stuckFrames = 0;

            if (!unstuck && Number.isFinite(state.lastSafeX) && Number.isFinite(state.lastSafeY)) {
                entity.x = state.lastSafeX;
                entity.y = state.lastSafeY;
            }
        }

        entity._movementState = state;
    }

    resolveEntityMovement(entity, newX, newY, intentX = newX - entity.x, intentY = newY - entity.y, options = {}) {
        const fromX = entity.x;
        const fromY = entity.y;

        const tryMove = (tx, ty) => {
            if (this.isEntityBlockedAt(entity, tx, ty, options)) return false;
            entity.x = tx;
            entity.y = ty;
            return true;
        };

        let moved = tryMove(newX, newY);

        if (!moved) {
            const preferX = Math.abs(intentX) >= Math.abs(intentY);
            if (preferX) {
                moved = tryMove(newX, fromY) || tryMove(fromX, newY);
            } else {
                moved = tryMove(fromX, newY) || tryMove(newX, fromY);
            }
        }

        if (!moved) {
            const halfX = fromX + (newX - fromX) * 0.5;
            const halfY = fromY + (newY - fromY) * 0.5;
            moved = tryMove(halfX, halfY);
        }

        this._updateMovementState(entity, fromX, fromY, intentX, intentY, options);
        return moved;
    }

    unstuckEntity(entity, options = {}) {
        const state = entity._movementState || {};
        const originX = entity.x;
        const originY = entity.y;
        const startRadius = options.startRadius ?? 2;
        const maxRadius = options.maxRadius ?? 48;
        const step = options.step ?? 2;
        const dirs = [
            { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
            { x: 0.707, y: 0.707 }, { x: -0.707, y: 0.707 }, { x: 0.707, y: -0.707 }, { x: -0.707, y: -0.707 }
        ];

        for (let r = startRadius; r <= maxRadius; r += step) {
            for (const d of dirs) {
                const tx = originX + d.x * r;
                const ty = originY + d.y * r;
                if (!this.isEntityBlockedAt(entity, tx, ty, options)) {
                    entity.x = tx;
                    entity.y = ty;
                    state.lastSafeX = tx;
                    state.lastSafeY = ty;
                    entity._movementState = state;
                    return true;
                }
            }
        }

        if (Number.isFinite(state.lastSafeX) && Number.isFinite(state.lastSafeY) &&
            !this.isEntityBlockedAt(entity, state.lastSafeX, state.lastSafeY, options)) {
            entity.x = state.lastSafeX;
            entity.y = state.lastSafeY;
            entity._movementState = state;
            return true;
        }

        return false;
    }

    resolveWallCollision(entity, newX, newY) {
        return this.resolveEntityMovement(entity, newX, newY, newX - entity.x, newY - entity.y);
    }

    updateFlowField() {
        this.navGrid.buildWallGrid();
        
        for (const obj of this.breakableObjects) {
            if (obj.isBroken) continue;
            const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];

            for (const hitbox of hitboxes) {
                const hbWidth = hitbox.width ?? hitbox.w;
                const hbHeight = hitbox.height ?? hitbox.h;
                const startX = Math.floor(hitbox.x / TILE_SIZE);
                const endX = Math.floor((hitbox.x + hbWidth - 1) / TILE_SIZE);
                const startY = Math.floor(hitbox.y / TILE_SIZE);
                const endY = Math.floor((hitbox.y + hbHeight - 1) / TILE_SIZE);

                for (let gx = startX; gx <= endX; gx++) {
                    for (let gy = startY; gy <= endY; gy++) {
                        const cell = this.navGrid.getCell(gx * TILE_SIZE, gy * TILE_SIZE);
                        const idx = cell.y * MAP_WIDTH + cell.x;
                        if (idx >= 0 && idx < this.navGrid.wallBlocked.length) {
                            this.navGrid.wallBlocked[idx] = 1;
                            const key = cell.x + cell.y * MAP_WIDTH;
                            let list = this.navGrid.wallGrid.get(key);
                            if (!list) {
                                list = [];
                                this.navGrid.wallGrid.set(key, list);
                            }
                            list.push(hitbox);
                        }
                    }
                }
            }
        }

        this.navGrid.updateFlowField(this.player.x, this.player.y);
    }

    updateFlowFieldForPlayer(frameCount, flowPlayerCellX, flowPlayerCellY) {
        const cell = this.navGrid.getCell(this.player.x, this.player.y);
        const playerCellX = cell.x;
        const playerCellY = cell.y;
        if (playerCellX !== flowPlayerCellX || playerCellY !== flowPlayerCellY || frameCount % 10 === 0) {
            this.updateFlowField();
            return { x: playerCellX, y: playerCellY };
        }
        return { x: flowPlayerCellX, y: flowPlayerCellY };
    }

    updateWallConnectivity() {
        // 1. Index all active (non-broken) walls AND doors by position
        const wallMap = new Map();
        const walls = [];
        
        for (const obj of this.breakableObjects) {
            // Check for wall OR door types
            if (!obj.isBroken && (obj.type === 'wall' || obj.baseType === 'door_h' || obj.baseType === 'door_v')) {
                const key = `${Math.floor(obj.x)},${Math.floor(obj.y)}`;
                wallMap.set(key, obj);
                if (obj.type === 'wall') {
                    walls.push(obj);
                }
            }
        }
        
        // 2. Update masks for walls only (doors don't change shape based on neighbors, but they affect walls)
        for (const wall of walls) {
            let mask = 0;
            const x = Math.floor(wall.x);
            const y = Math.floor(wall.y);
            const TILE = 32; // Assuming 32 is TILE_SIZE
            
            // North
            if (wallMap.has(`${x},${y - TILE}`)) mask |= 1;
            // East
            if (wallMap.has(`${x + TILE},${y}`)) mask |= 2;
            // South
            if (wallMap.has(`${x},${y + TILE}`)) mask |= 4;
            // West
            if (wallMap.has(`${x - TILE},${y}`)) mask |= 8;
            
            wall.setWallMask(mask);
        }
    }

    updateEnemies() {
        // Periodically update wall visuals (e.g., every 10 frames)
        // We assume updateEnemies is called every frame
        // We can add a frame counter or just use a random check?
        // Let's assume Game.js calls this every frame.
        // We don't have access to frameCount here easily unless passed.
        // Let's just do it every frame for now, optimization later if needed.
        // Actually, N is small.
        this.updateWallConnectivity();

        // Filter dead enemies and remove them from the array
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].hp <= 0) {
                this.enemies.splice(i, 1);
            }
        }
        
        this.navGrid.buildEnemyGrid(this.enemies);
        const wallQuery = (rect, options = {}) => this.isRectBlocked(rect, options);
        const getFlowDirection = (x, y) => this.navGrid.getFlowDirection(x, y);
        const getNearbyEnemies = (enemy) => this.navGrid.getNearbyEnemies(enemy);
        const getNavDirection = (enemy, desiredX, desiredY) => {
            const hbWidth = enemy.hitboxWidth || enemy.width;
            const hbHeight = enemy.hitboxHeight || enemy.height;
            const hbOffsetY = enemy.hitboxOffsetY || 0;
            return this.navGrid.findNavigableDirection(
                enemy.x,
                enemy.y + hbOffsetY,
                hbWidth,
                hbHeight,
                desiredX,
                desiredY
            );
        };
        const resolveEnemyMove = (enemy, nextX, nextY, intentX, intentY) => {
            this.resolveEntityMovement(enemy, nextX, nextY, intentX, intentY);
        };

        // Simple Enemy-Enemy Collision Resolution (Separation)
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const e1 = this.enemies[i];
                const e2 = this.enemies[j];
                
                const dx = e1.x - e2.x;
                const dy = e1.y - e2.y;
                const distSq = dx*dx + dy*dy;
                const minDist = (e1.width + e2.width) / 2; // Approximate radius
                
                if (distSq < minDist * minDist && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    const push = overlap / 2;
                    const e1TargetX = e1.x + nx * push;
                    const e1TargetY = e1.y + ny * push;
                    const e2TargetX = e2.x - nx * push;
                    const e2TargetY = e2.y - ny * push;

                    if (!this.isEntityBlockedAt(e1, e1TargetX, e1TargetY)) {
                        e1.x = e1TargetX;
                        e1.y = e1TargetY;
                    }
                    if (!this.isEntityBlockedAt(e2, e2TargetX, e2TargetY)) {
                        e2.x = e2TargetX;
                        e2.y = e2TargetY;
                    }
                }
            }
        }

        this.enemies.forEach(e => {
            e.update(
                this.player,
                this.walls,
                wallQuery,
                getFlowDirection,
                getNearbyEnemies,
                getNavDirection,
                this.combatSystem,
                resolveEnemyMove
            );
        });
    }
}
