import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../../utils/Constants.js';
import { Zombie } from '../entities/Zombie.js';
import { Hunter } from '../entities/Hunter.js';
import { DroppedItem } from '../entities/DroppedItem.js';
import { BreakableObject } from '../entities/BreakableObject.js';
import { Carpet } from '../entities/Carpet.js';
import { Enemy } from '../entities/Enemy.js';
import { Portal } from '../entities/Portal.js';
import { Vehicle } from '../entities/Vehicle.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { Assets } from '../../graphics/Assets.js';

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
        
        this.player.x = 200;
        this.player.y = 300;

        // --- Large House Build ---
        const houseX = 400;
        const houseY = 200;
        const houseW = 14; // tiles
        const houseH = 10; // tiles
        
        // Outer Walls (Rectangle)
        // Top
        for(let i=0; i<houseW; i++) this.breakableObjects.push(new BreakableObject(houseX + i*32, houseY, 'wall'));
        // Bottom
        for(let i=0; i<houseW; i++) {
            if (i === 7) {
                // Entrance Door
                this.breakableObjects.push(new BreakableObject(houseX + i*32, houseY + (houseH-1)*32, 'door_h'));
            } else {
                this.breakableObjects.push(new BreakableObject(houseX + i*32, houseY + (houseH-1)*32, 'wall'));
            }
        }
        // Left
        for(let i=1; i<houseH-1; i++) this.breakableObjects.push(new BreakableObject(houseX, houseY + i*32, 'wall'));
        // Right
        for(let i=1; i<houseH-1; i++) this.breakableObjects.push(new BreakableObject(houseX + (houseW-1)*32, houseY + i*32, 'wall'));
        
        // Internal Walls (Dividing Rooms)
        // Vertical Divider at x=6 (Living Room Left / Bedroom Right)
        for(let i=1; i<houseH-1; i++) {
            if (i === 4) {
                 // Vertical Door connecting Living Room to Bedroom
                 this.breakableObjects.push(new BreakableObject(houseX + 6*32, houseY + i*32, 'door_v'));
            } else if (i !== 5) { // Leave i=5 as gap? Or just door at i=4 is enough. Let's close gap i=5 with wall
                this.breakableObjects.push(new BreakableObject(houseX + 6*32, houseY + i*32, 'wall'));
            }
        }
        
        // Horizontal Divider in Right Section (Bedroom Top / Bathroom Bottom?)
        // At y=5
        for(let i=7; i<houseW-1; i++) {
             if (i === 9) {
                 // Horizontal Door connecting Bedroom to Bathroom
                 this.breakableObjects.push(new BreakableObject(houseX + i*32, houseY + 5*32, 'door_h'));
             } else {
                 this.breakableObjects.push(new BreakableObject(houseX + i*32, houseY + 5*32, 'wall'));
             }
        }

        // --- Furniture ---
        
        // 1. Living Room (Left Side: 0-5 x 0-9)
        // Sofa area
        this.breakableObjects.push(new BreakableObject(houseX + 1*32, houseY + 2*32, 'sofa')); // Facing down? Sofa sprite is horizontal
        // TV Stand opposite sofa
        this.breakableObjects.push(new BreakableObject(houseX + 1*32, houseY + 5*32, 'tv_stand')); 
        // Table in middle
        this.breakableObjects.push(new BreakableObject(houseX + 3*32, houseY + 3*32, 'table'));
        // Bookshelves along walls
        this.breakableObjects.push(new BreakableObject(houseX + 1*32, houseY + 1*32, 'bookshelf'));
        this.breakableObjects.push(new BreakableObject(houseX + 2*32, houseY + 1*32, 'bookshelf'));
        
        // 2. Master Bedroom (Top Right: 7-13 x 0-4)
        // Bed (Horizontal or Vertical)
        this.breakableObjects.push(new BreakableObject(houseX + 11*32, houseY + 1*32, 'bed'));
        // Nightstand
        this.breakableObjects.push(new BreakableObject(houseX + 10*32, houseY + 1*32, 'nightstand'));
        // Wardrobe
        this.breakableObjects.push(new BreakableObject(houseX + 12*32, houseY + 3*32, 'wardrobe'));
        
        // 3. Storage/Study (Bottom Right: 7-13 x 6-9)
        // More shelves
        this.breakableObjects.push(new BreakableObject(houseX + 8*32, houseY + 7*32, 'bookshelf'));
        this.breakableObjects.push(new BreakableObject(houseX + 9*32, houseY + 7*32, 'bookshelf'));
        // Desk (Table)
        this.breakableObjects.push(new BreakableObject(houseX + 11*32, houseY + 7*32, 'table'));

        // Return Portal
        this.portals.push(new Portal(
            100, 
            100, 
            'hub', 
            'HUB', 
            '#9b59b6'
        ));
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
        } else {
            this.enemies.push(new Zombie(ex, ey));
        }
    }

    checkRectCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.w &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.h &&
                rect1.y + rect1.height > rect2.y);
    }

    resolveWallCollision(entity, newX, newY) {
        let collidedX = false;
        
        // Use custom hitbox if available, otherwise default to full size
        const hbWidth = entity.hitboxWidth || entity.width;
        const hbHeight = entity.hitboxHeight || entity.height;
        const hbOffsetY = entity.hitboxOffsetY || 0;
        
        const testRectX = {
            x: newX - hbWidth/2, 
            y: entity.y + hbOffsetY - hbHeight/2, 
            width: hbWidth, 
            height: hbHeight
        };
        
        collidedX = this.navGrid.isWallRectCollision(testRectX);
        
        if (!collidedX) {
            for (const obj of this.breakableObjects) {
                if (obj.isBroken) continue;
                
                // Support multiple hitboxes (complex shapes) or single hitbox
                const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
                
                for (const hb of hitboxes) {
                    if (this.checkRectCollision(testRectX, hb)) {
                        collidedX = true;
                        break;
                    }
                }
                if (collidedX) break;
            }
        }
        
        if (!collidedX) entity.x = newX;

        let collidedY = false;
        const testRectY = {
            x: entity.x - hbWidth/2, 
            y: newY + hbOffsetY - hbHeight/2, 
            width: hbWidth, 
            height: hbHeight
        };
        
        collidedY = this.navGrid.isWallRectCollision(testRectY);
        
        if (!collidedY) {
            for (const obj of this.breakableObjects) {
                if (obj.isBroken) continue;
                
                const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
                
                for (const hb of hitboxes) {
                    if (this.checkRectCollision(testRectY, hb)) {
                        collidedY = true;
                        break;
                    }
                }
                if (collidedY) break;
            }
        }

        if (!collidedY) entity.y = newY;
    }

    updateFlowField() {
        this.navGrid.buildWallGrid();
        
        for (const obj of this.breakableObjects) {
            if (obj.isBroken) continue;
            const hitbox = obj.getHitbox();
            
            const startX = Math.floor(hitbox.x / TILE_SIZE);
            const endX = Math.floor((hitbox.x + hitbox.w - 1) / TILE_SIZE);
            const startY = Math.floor(hitbox.y / TILE_SIZE);
            const endY = Math.floor((hitbox.y + hitbox.h - 1) / TILE_SIZE);
            
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
        const wallQuery = (rect) => {
            if (this.navGrid.isWallRectCollision(rect)) return true;
            for (const obj of this.breakableObjects) {
                if (obj.isBroken) continue;
                const hitbox = obj.getHitbox();
                if (rect.x < hitbox.x + hitbox.w &&
                    rect.x + rect.width > hitbox.x &&
                    rect.y < hitbox.y + hitbox.h &&
                    rect.y + rect.height > hitbox.y) {
                    return true;
                }
            }
            return false;
        };
        const getFlowDirection = (x, y) => this.navGrid.getFlowDirection(x, y);
        const getNearbyEnemies = (enemy) => this.navGrid.getNearbyEnemies(enemy);
        const getNavDirection = (enemy, desiredX, desiredY) => this.navGrid.findNavigableDirection(enemy.x, enemy.y, enemy.width, enemy.height, desiredX, desiredY);

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
                    
                    // Push apart
                    const push = overlap / 2;
                    e1.x += nx * push;
                    e1.y += ny * push;
                    e2.x -= nx * push;
                    e2.y -= ny * push;
                }
            }
        }

        this.enemies.forEach(e => {
            e.update(this.player, this.walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, this.combatSystem);
        });
    }
}
