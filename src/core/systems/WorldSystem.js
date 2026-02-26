import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../../utils/Constants.js';
import { Zombie } from '../entities/Zombie.js';
import { ZombieFemale } from '../entities/ZombieFemale.js';
import { ZombieBrute } from '../entities/ZombieBrute.js';
import { Hunter } from '../entities/Hunter.js';
import { Soldier } from '../entities/Soldier.js';
import { MutantBeast } from '../entities/MutantBeast.js';
import { MechaGolem } from '../entities/MechaGolem.js';
import { SnakeBoss } from '../entities/SnakeBoss.js';
import { DroppedItem } from '../entities/DroppedItem.js';
import { BreakableObject } from '../entities/BreakableObject.js';
import { Carpet } from '../entities/Carpet.js';
import { Enemy } from '../entities/Enemy.js';
import { Portal } from '../entities/Portal.js';
import { Vehicle } from '../entities/Vehicle.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { Assets } from '../../graphics/Assets.js';
import { generateConstructionLayout } from './generation/ConstructionLayoutGenerator.js';
import { generateDungeonLayout } from './generation/DungeonLayoutGenerator.js';
import { DungeonManager } from './DungeonManager.js';
import { FLOOR_TYPES, FLOOR_TILE_SIZE, FLOOR_TILES_PER_CELL, FLOOR_TYPE_KEYS } from '../../utils/FloorTypes.js';
import { generateLakes, computeDepthMap, paintLakesOnFloorMap } from './generation/LakeGenerator.js';
import { CollisionUtils } from '../../utils/CollisionUtils.js';
import { ObstacleSpatialIndex } from './ObstacleSpatialIndex.js';
import {
    cloneWeaponInstanceData,
    createWeaponInstanceData,
    weaponItemIdFromConfigId
} from './WeaponInstanceUtils.js';

const ROOM_GUN_SPAWN_CHANCE = 0.05;
const ENEMY_RECOVERY_NEEDLE_DROP_CHANCE = 0.01;
const ENEMY_MEDKIT_DROP_CHANCE = 0.08;
const ENEMY_HAMBURGER_DROP_CHANCE = 0.02;
const ENEMY_COSTUME_DROP_CHANCE = 0.03;

const COSTUME_DROP_POOL = [
    'costume:hair_messy',
    'costume:hair_short',
    'costume:hat_beret',
    'costume:hat_bandana',
    'costume:clothes_hoodie',
    'costume:clothes_vest',
    'costume:glasses_round',
    'costume:glasses_goggles',
    'costume:beard_full',
    'costume:hat_santa',
    'costume:clothes_santa',
    'costume:beard_santa',
    'costume:hat_clown',
    'costume:clothes_clown',
    'costume:hair_clown',
];
const ROOM_GUN_POOL_BLACKLIST = new Set(['hammer', 'boomerang', 'recovery_needle', 'hamburger', 'medkit']);

export class WorldSystem {
    constructor({ navGrid, walls, enemies, droppedItems, breakableObjects, player, combatSystem, vehicles, inventorySystem, pets }) {
        this.navGrid = navGrid;
        this.walls = walls;
        this.enemies = enemies;
        this.droppedItems = droppedItems;
        this.breakableObjects = breakableObjects;
        this.player = player;
        this.combatSystem = combatSystem;
        this.vehicles = vehicles;
        this.inventorySystem = inventorySystem;
        this.pets = pets || [];
        this.portals = [];
        this.carpets = [];
        // Floor tile system
        this.floorMap = null;
        this.floorMapWidth = 0;
        this.floorMapHeight = 0;
        this.floorCanvas = null;
        this.generatedLayoutMeta = null;
        // Lake / water system
        this.waterGrid = null;     // Uint8Array tile-resolution (1=water, 0=land)
        this.waterGridWidth = 0;
        this.waterGridHeight = 0;
        this.waterDepthMap = null;  // Uint8Array tile-resolution depth from shore
        this.waterTiles = null;     // Set<string> of "x,y" tile keys
        this.waterAnimFrame = 0;    // current animation frame index
        this.waterAnimTimer = 0;    // frame counter for animation
        this.soldierWeaponPool = null;
        this.roomWeaponPool = null;
        this.obstacleIndex = new ObstacleSpatialIndex({
            gridSize: this.navGrid?.gridSize || TILE_SIZE,
            gridCols: this.navGrid?.gridCols || MAP_WIDTH,
            gridRows: this.navGrid?.gridRows || MAP_HEIGHT
        });
        this.worldStaticDirty = true;
        this.wallConnectivityDirty = true;
        this._trackedObstacleCount = 0;
        this._trackedObstacleStates = new WeakMap();
        this.dungeonManager = null;
        this.currentMapType = 'hub';
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
        this.floorMap = null;
        this.floorMapWidth = 0;
        this.floorMapHeight = 0;
        this.floorCanvas = null;
        this.generatedLayoutMeta = null;
        this.waterGrid = null;
        this.waterGridWidth = 0;
        this.waterGridHeight = 0;
        this.waterDepthMap = null;
        this.waterTiles = null;
        this.waterAnimFrame = 0;
        this.waterAnimTimer = 0;
        this.markWorldStaticDirty();
        if (this.obstacleIndex) {
            this.obstacleIndex.clear();
        }
        this.dungeonManager = null;
        this.currentMapType = mapType;

        // Reset player state if needed (position is handled per map)

        switch (mapType) {
            case 'hub':
                this.initHubMap();
                break;
            case 'construction':
                this.initConstructionMap();
                break;
            case 'game':
                this.initGameMap();
                break;
            case 'test':
                this.initTestMap();
                break;
            case 'dungeon':
                this.initDungeonMap(1);
                break;
            case 'dungeon_f2':
                this.initDungeonMap(2);
                break;
            default:
                console.error('Unknown map type:', mapType);
                this.initHubMap();
        }
        
        this.navGrid.setWalls(this.walls);
        this.markWorldStaticDirty();
        this._trackedObstacleStates = new WeakMap();
        this._trackedObstacleCount = 0;
        this.rebuildStaticCachesIfNeeded();
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

        // Dungeon Portal (Purple)
        this.portals.push(new Portal(
            startX + 15 * TILE_SIZE,
            startY + 2 * TILE_SIZE,
            'dungeon',
            'DUNGEON',
            '#8e44ad'
        ));
    }

    addBoundaryWalls() {
        this.walls.push({x: 0, y: 0, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: (MAP_HEIGHT - 1) * TILE_SIZE, w: MAP_WIDTH * TILE_SIZE, h: TILE_SIZE});
        this.walls.push({x: 0, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});
        this.walls.push({x: (MAP_WIDTH - 1) * TILE_SIZE, y: 0, w: TILE_SIZE, h: MAP_HEIGHT * TILE_SIZE});
    }

    applyGeneratedLayout(configOverrides = null) {
        this.addBoundaryWalls();

        const layout = generateConstructionLayout({
            mapWidth: MAP_WIDTH,
            mapHeight: MAP_HEIGHT,
            config: configOverrides
        });

        if (layout.ok) {
            layout.breakables.forEach(def => {
                this.breakableObjects.push(new BreakableObject(def.x, def.y, def.type));
            });
            this.generatedLayoutMeta = layout.meta || null;

            if (layout.spawn) {
                this.player.x = layout.spawn.x;
                this.player.y = layout.spawn.y;
            } else {
                this.player.x = 200;
                this.player.y = 300;
            }

            if (layout.floorMap) {
                this.floorMap = layout.floorMap;
                this.floorMapWidth = layout.floorMapWidth;
                this.floorMapHeight = layout.floorMapHeight;
                this.buildFloorCanvas();
            }

            return true;
        }

        this.initConstructionFallbackLayout();
        this.generatedLayoutMeta = null;
        return false;
    }

    spawnGameEncounters() {
        const nonZombieIndoorRatio = 0.7;
        const indoorPool = this._buildIndoorSpawnPool();

        // Spawn Zombies
        for (let i = 0; i < 40; i++) {
            this.spawnEnemy('zombie');
        }

        // Spawn Female Zombies
        for (let i = 0; i < 30; i++) {
            this.spawnEnemy('zombie_female');
        }

        // Spawn Zombie Brutes
        for (let i = 0; i < 8; i++) {
            this.spawnEnemy('zombie_brute');
        }

        // Spawn Hunters
        for (let i = 0; i < 10; i++) {
            this.spawnEnemyWithIndoorPreference('hunter', indoorPool, nonZombieIndoorRatio);
        }

        // Spawn Soldiers
        for (let i = 0; i < 6; i++) {
            this.spawnEnemyWithIndoorPreference('soldier', indoorPool, nonZombieIndoorRatio);
        }

        // Spawn Mutant Beast BOSS (1 per map)
        const boss = this.spawnEnemy('mutant_beast');
        if (boss) {
            boss.worldSystem = this;
        }
    }

    initConstructionMap() {
        this.applyGeneratedLayout();
        this.generateLakes();

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
        const S = FLOOR_TILES_PER_CELL;
        this.floorMapWidth = MAP_WIDTH * S;
        this.floorMapHeight = MAP_HEIGHT * S;
        this.floorMap = new Uint8Array(this.floorMapWidth * this.floorMapHeight);
        this.floorMap.fill(FLOOR_TYPES.GRASS);
        this.buildFloorCanvas();

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

        const clutterCandidates = [
            { x: houseTileX - 5, y: houseTileY - 2 },
            { x: houseTileX - 4, y: houseTileY + 1 },
            { x: houseTileX - 4, y: houseTileY + 4 },
            { x: houseTileX + houseW + 3, y: houseTileY - 1 },
            { x: houseTileX + houseW + 4, y: houseTileY + 2 },
            { x: houseTileX + houseW + 4, y: houseTileY + 5 },
            { x: houseTileX + 2, y: houseTileY + houseH + 3 },
            { x: houseTileX + 5, y: houseTileY + houseH + 4 },
            { x: houseTileX + 8, y: houseTileY + houseH + 3 },
            { x: houseTileX + 1, y: houseTileY - 4 }
        ];
        const clutterTypes = ['box', 'barrel', 'vase'];
        for (const tile of clutterCandidates) {
            if (tile.x < 2 || tile.x > MAP_WIDTH - 3 || tile.y < 2 || tile.y > MAP_HEIGHT - 3) continue;
            const type = clutterTypes[Math.floor(Math.random() * clutterTypes.length)];
            this.breakableObjects.push(new BreakableObject(tile.x * TILE_SIZE, tile.y * TILE_SIZE, type));
        }

        this.player.x = (houseTileX + Math.floor(houseW / 2)) * TILE_SIZE + TILE_SIZE / 2;
        this.player.y = (houseTileY + houseH) * TILE_SIZE + TILE_SIZE / 2;
    }

    /**
     * Pre-render the floor tile map onto a single offscreen canvas.
     * Pass 1: draw base tile sprites.
     * Pass 2: dither edges where adjacent sub-tiles differ in type.
     */
    buildFloorCanvas() {
        const fm = this.floorMap;
        const fw = this.floorMapWidth;
        const fh = this.floorMapHeight;
        const FT = FLOOR_TILE_SIZE;
        const canvasW = fw * FT;
        const canvasH = fh * FT;

        const canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Pass 1: base tiles
        for (let sy = 0; sy < fh; sy++) {
            for (let sx = 0; sx < fw; sx++) {
                const type = fm[sy * fw + sx];
                if (type === FLOOR_TYPES.NONE) continue;
                const key = FLOOR_TYPE_KEYS[type];
                const variants = Assets.floors[key];
                if (!variants) continue;
                const vi = ((sx * 7 + sy * 13) & 0xFFFF) % variants.length;
                ctx.drawImage(variants[vi], sx * FT, sy * FT);
            }
        }

        this.floorCanvas = canvas;
    }

    /** Update a single sub-tile in the floor map and re-render it on the canvas. */
    setFloorTile(sx, sy, type) {
        if (!this.floorMap) return;
        if (sx < 0 || sx >= this.floorMapWidth || sy < 0 || sy >= this.floorMapHeight) return;

        this.floorMap[sy * this.floorMapWidth + sx] = type;

        if (!this.floorCanvas) return;
        const ctx = this.floorCanvas.getContext('2d');
        const FT = FLOOR_TILE_SIZE;

        if (type === FLOOR_TYPES.NONE) {
            ctx.clearRect(sx * FT, sy * FT, FT, FT);
        } else {
            const key = FLOOR_TYPE_KEYS[type];
            const variants = Assets.floors[key];
            if (variants) {
                const vi = ((sx * 7 + sy * 13) & 0xFFFF) % variants.length;
                ctx.drawImage(variants[vi], sx * FT, sy * FT);
            }
        }
    }

    initTestMap() {
        // 1000x1000 px showcase area with 3x3-tile cells
        const cellTiles = 3;
        const cellPx = cellTiles * TILE_SIZE; // 96px per cell
        const cols = 10;
        const rows = 12; // row 0 = spawn, row 1 = vehicles, rows 2+ = objects
        const wallThick = TILE_SIZE;
        const areaW = wallThick * 2 + cols * cellPx; // walls + content
        const areaH = wallThick * 2 + rows * cellPx;

        // Boundary walls
        this.walls.push({ x: 0, y: 0, w: areaW, h: wallThick });
        this.walls.push({ x: 0, y: areaH - wallThick, w: areaW, h: wallThick });
        this.walls.push({ x: 0, y: 0, w: wallThick, h: areaH });
        this.walls.push({ x: areaW - wallThick, y: 0, w: wallThick, h: areaH });

        // Content origin (inside walls)
        const ox = wallThick;
        const oy = wallThick;

        // Row 0: player spawn + return portal
        this.player.x = ox + cellPx * 1.5;
        this.player.y = oy + cellPx * 0.5;
        this.portals.push(new Portal(
            ox + cellPx * 0.5, oy + cellPx * 0.5,
            'hub', 'HUB', '#9b59b6'
        ));

        // Row 1: vehicles (cycle through types)
        const vehicleTypes = ['suv', 'truck', 'police'];
        for (let col = 0; col < cols; col++) {
            const cx = ox + col * cellPx + cellPx / 2;
            const cy = oy + 1 * cellPx + cellPx / 2;
            const vType = vehicleTypes[col % vehicleTypes.length];
            if (this.vehicles) {
                this.vehicles.push(new Vehicle(cx, cy, vType));
            }
        }

        // Rows 2+: one object per cell
        const objectTypes = Object.keys(Assets.objects).filter(k =>
            !k.endsWith('_flash') &&
            !k.includes('_frame') &&
            !k.includes('_panel') &&
            !k.startsWith('carpet_')
        );
        let objectIdx = 0;
        for (let row = 2; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (objectIdx >= objectTypes.length) break;
                const cx = ox + col * cellPx + cellPx / 2;
                const cy = oy + row * cellPx + cellPx / 2;
                this.breakableObjects.push(new BreakableObject(cx, cy, objectTypes[objectIdx]));
                objectIdx++;
            }
        }

        // Floor (grass)
        const S = FLOOR_TILES_PER_CELL;
        this.floorMapWidth = MAP_WIDTH * S;
        this.floorMapHeight = MAP_HEIGHT * S;
        this.floorMap = new Uint8Array(this.floorMapWidth * this.floorMapHeight);
        this.floorMap.fill(FLOOR_TYPES.GRASS);
        this.buildFloorCanvas();
    }

    initGameMap() {
        // Game scene now uses the same building pipeline as construction scene.
        // No reserved portal area is needed here.
        this.applyGeneratedLayout({ reservedRects: [] });
        this.generateLakes();
        this.spawnRoomWeaponDrops();
        this.spawnGameEncounters();
    }

    /**
     * Generate procedural lakes and paint them onto the floor map.
     * Excludes areas around buildings, player spawn, portals, and existing objects.
     */
    generateLakes() {
        if (!this.floorMap) return;

        // Build exclusion zones from buildings and objects
        const excludeRects = [];
        const excludeTiles = new Set();

        // Exclude boundary (first/last 3 tiles)
        excludeRects.push({ x: 0, y: 0, w: MAP_WIDTH, h: 3 });
        excludeRects.push({ x: 0, y: MAP_HEIGHT - 3, w: MAP_WIDTH, h: 3 });
        excludeRects.push({ x: 0, y: 0, w: 3, h: MAP_HEIGHT });
        excludeRects.push({ x: MAP_WIDTH - 3, y: 0, w: 3, h: MAP_HEIGHT });

        // Exclude area around player spawn (5 tile radius)
        const spawnTX = Math.floor(this.player.x / TILE_SIZE);
        const spawnTY = Math.floor(this.player.y / TILE_SIZE);
        excludeRects.push({
            x: spawnTX - 5, y: spawnTY - 5, w: 11, h: 11
        });

        // Exclude area around portals
        for (const p of this.portals) {
            const ptx = Math.floor(p.x / TILE_SIZE);
            const pty = Math.floor(p.y / TILE_SIZE);
            excludeRects.push({ x: ptx - 3, y: pty - 3, w: 7, h: 7 });
        }

        // Exclude tiles that have non-GRASS floor types (buildings, roads etc.)
        const S = FLOOR_TILES_PER_CELL;
        for (let ty = 0; ty < MAP_HEIGHT; ty++) {
            for (let tx = 0; tx < MAP_WIDTH; tx++) {
                // Check all sub-tiles in this cell
                let hasNonGrass = false;
                for (let dy = 0; dy < S && !hasNonGrass; dy++) {
                    for (let dx = 0; dx < S && !hasNonGrass; dx++) {
                        const sx = tx * S + dx;
                        const sy = ty * S + dy;
                        if (sx < this.floorMapWidth && sy < this.floorMapHeight) {
                            const floorType = this.floorMap[sy * this.floorMapWidth + sx];
                            if (floorType !== FLOOR_TYPES.GRASS && floorType !== FLOOR_TYPES.NONE) {
                                hasNonGrass = true;
                            }
                        }
                    }
                }
                if (hasNonGrass) {
                    // Exclude this tile and a 2-tile buffer around it
                    for (let by = -2; by <= 2; by++) {
                        for (let bx = -2; bx <= 2; bx++) {
                            excludeTiles.add(`${tx + bx},${ty + by}`);
                        }
                    }
                }
            }
        }

        // Exclude tiles with breakable objects (and buffer)
        for (const obj of this.breakableObjects) {
            const otx = Math.floor(obj.x / TILE_SIZE);
            const oty = Math.floor(obj.y / TILE_SIZE);
            for (let by = -2; by <= 2; by++) {
                for (let bx = -2; bx <= 2; bx++) {
                    excludeTiles.add(`${otx + bx},${oty + by}`);
                }
            }
        }

        const result = generateLakes({
            mapWidth: MAP_WIDTH,
            mapHeight: MAP_HEIGHT,
            seed: Math.floor(Math.random() * 999999),
            threshold: -0.05,
            frequency: 0.04,
            smoothPasses: 4,
            minLakeSize: 15,
            excludeTiles,
            excludeRects
        });

        this.waterTiles = result.waterTiles;
        this.waterGrid = result.waterGrid;
        this.waterGridWidth = result.gridWidth;
        this.waterGridHeight = result.gridHeight;
        this.waterDepthMap = computeDepthMap(result.waterGrid, result.gridWidth, result.gridHeight);

        // Paint water onto the floor map
        paintLakesOnFloorMap(this.floorMap, this.floorMapWidth, this.floorMapHeight, this.waterTiles);

        // Rebuild the floor canvas
        this.buildFloorCanvas();
    }

    /**
     * Check if a world-coordinate position is on a water tile.
     * @param {number} worldX
     * @param {number} worldY
     * @returns {boolean}
     */
    isWaterAt(worldX, worldY) {
        if (!this.waterGrid) return false;
        const tx = Math.floor(worldX / TILE_SIZE);
        const ty = Math.floor(worldY / TILE_SIZE);
        if (tx < 0 || tx >= this.waterGridWidth || ty < 0 || ty >= this.waterGridHeight) return false;
        return this.waterGrid[ty * this.waterGridWidth + tx] === 1;
    }

    /**
     * Check if any part of a rect overlaps water tiles.
     * @param {{ x: number, y: number, width: number, height: number }} rect
     * @returns {boolean}
     */
    isRectOnWater(rect) {
        if (!this.waterGrid) return false;
        const startTX = Math.floor(rect.x / TILE_SIZE);
        const endTX = Math.floor((rect.x + rect.width - 1) / TILE_SIZE);
        const startTY = Math.floor(rect.y / TILE_SIZE);
        const endTY = Math.floor((rect.y + rect.height - 1) / TILE_SIZE);
        for (let ty = startTY; ty <= endTY; ty++) {
            for (let tx = startTX; tx <= endTX; tx++) {
                if (tx < 0 || tx >= this.waterGridWidth || ty < 0 || ty >= this.waterGridHeight) continue;
                if (this.waterGrid[ty * this.waterGridWidth + tx] === 1) return true;
            }
        }
        return false;
    }

    initDungeonMap(floor = 1) {
        // Generate dungeon layout
        const layout = generateDungeonLayout(MAP_WIDTH, MAP_HEIGHT, undefined, floor);

        // Boundary walls
        this.addBoundaryWalls();

        // Build walls from wallTiles
        for (const key of layout.wallTiles) {
            const [tx, ty] = key.split(',').map(Number);
            this.walls.push({
                x: tx * TILE_SIZE,
                y: ty * TILE_SIZE,
                w: TILE_SIZE,
                h: TILE_SIZE
            });
        }

        // Place cover objects (boxes, barrels)
        for (const cover of layout.coverObjects) {
            this.breakableObjects.push(new BreakableObject(
                cover.x * TILE_SIZE,
                cover.y * TILE_SIZE,
                cover.type
            ));
        }

        // Build floor map (stone for rooms/corridors, NONE elsewhere)
        const S = FLOOR_TILES_PER_CELL;
        this.floorMapWidth = MAP_WIDTH * S;
        this.floorMapHeight = MAP_HEIGHT * S;
        this.floorMap = new Uint8Array(this.floorMapWidth * this.floorMapHeight);
        this.floorMap.fill(FLOOR_TYPES.NONE);

        for (const key of layout.floorTiles) {
            const [tx, ty] = key.split(',').map(Number);
            for (let sy = 0; sy < S; sy++) {
                for (let sx = 0; sx < S; sx++) {
                    const fx = tx * S + sx;
                    const fy = ty * S + sy;
                    if (fx >= 0 && fx < this.floorMapWidth && fy >= 0 && fy < this.floorMapHeight) {
                        this.floorMap[fy * this.floorMapWidth + fx] = FLOOR_TYPES.STONE;
                    }
                }
            }
        }
        this.buildFloorCanvas();

        // Player spawn in start room
        const startRoom = layout.rooms.find(r => r.id === layout.startRoomId);
        this.player.x = (startRoom.x + Math.floor(startRoom.w / 2)) * TILE_SIZE;
        this.player.y = (startRoom.y + Math.floor(startRoom.h / 2)) * TILE_SIZE;

        // Return portal in start room
        this.portals.push(new Portal(
            (startRoom.x + 1) * TILE_SIZE,
            (startRoom.y + 1) * TILE_SIZE,
            'hub',
            'EXIT',
            '#9b59b6'
        ));

        // Initialize dungeon manager with gate system
        this.dungeonManager = new DungeonManager(layout, this);
        this.dungeonManager.initGates(layout.gates);
    }

    updateDungeon() {
        if (!this.dungeonManager) return;
        this.dungeonManager.update(this.player);
    }

    markWorldStaticDirty() {
        this.worldStaticDirty = true;
        this.wallConnectivityDirty = true;
    }

    _refreshStaticDirtyFlags() {
        let changed = false;
        let count = 0;

        for (const obj of this.breakableObjects) {
            if (!obj) continue;
            count++;
            const stamp = `${obj.isBroken ? 1 : 0}:${obj.isOpen ? 1 : 0}`;
            const prev = this._trackedObstacleStates.get(obj);
            if (prev !== stamp) {
                this._trackedObstacleStates.set(obj, stamp);
                changed = true;
            }
        }

        if (count !== this._trackedObstacleCount) {
            this._trackedObstacleCount = count;
            changed = true;
        }

        if (changed) {
            this.markWorldStaticDirty();
        }
    }

    _snapshotObstacleStates() {
        const nextStates = new WeakMap();
        let count = 0;
        for (const obj of this.breakableObjects) {
            if (!obj) continue;
            count++;
            nextStates.set(obj, `${obj.isBroken ? 1 : 0}:${obj.isOpen ? 1 : 0}`);
        }
        this._trackedObstacleStates = nextStates;
        this._trackedObstacleCount = count;
    }

    rebuildObstacleIndex() {
        if (!this.obstacleIndex) return;
        this.obstacleIndex.rebuild({
            walls: this.walls,
            breakableObjects: this.breakableObjects
        });
    }

    rebuildStaticCachesIfNeeded() {
        if (!this.worldStaticDirty && !this.wallConnectivityDirty) return false;

        if (this.wallConnectivityDirty) {
            this.updateWallConnectivity();
        }
        this.rebuildObstacleIndex();
        this.updateFlowField();

        this.worldStaticDirty = false;
        this.wallConnectivityDirty = false;
        this._snapshotObstacleStates();
        return true;
    }

    updatePortals() {
        for (const p of this.portals) {
            p.update(this.player);
            // Collision logic moved to PlayerSystem or handled here if purely collision based.
            // But we want 'E' interaction now.
            // Keeping collision check for proximity detection only if needed.
        }
    }

    _shuffleInPlace(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = list[i];
            list[i] = list[j];
            list[j] = t;
        }
        return list;
    }

    _tileToWorldCenter(tileX, tileY) {
        return {
            x: tileX * TILE_SIZE + TILE_SIZE / 2,
            y: tileY * TILE_SIZE + TILE_SIZE / 2
        };
    }

    _buildIndoorSpawnPool() {
        const raw = this.generatedLayoutMeta?.indoorSpawnTiles || [];
        const pool = [];
        const used = new Set();
        for (const tile of raw) {
            if (!tile) continue;
            const tx = tile.x;
            const ty = tile.y;
            if (!Number.isFinite(tx) || !Number.isFinite(ty)) continue;
            if (tx < 2 || tx > MAP_WIDTH - 3 || ty < 2 || ty > MAP_HEIGHT - 3) continue;
            const key = `${tx},${ty}`;
            if (used.has(key)) continue;
            used.add(key);
            pool.push({ x: tx, y: ty });
        }
        return this._shuffleInPlace(pool);
    }

    _pickRandomSpawnPoint() {
        const tx = Math.floor(Math.random() * (MAP_WIDTH - 4) + 2);
        const ty = Math.floor(Math.random() * (MAP_HEIGHT - 4) + 2);
        return this._tileToWorldCenter(tx, ty);
    }

    _createEnemyByType(type, x, y) {
        if (type === 'hunter') return new Hunter(x, y);
        if (type === 'soldier') return new Soldier(x, y);
        if (type === 'zombie_female') return new ZombieFemale(x, y);
        if (type === 'zombie_brute') return new ZombieBrute(x, y);
        if (type === 'mutant_beast') return new MutantBeast(x, y);
        if (type === 'mecha_golem') return new MechaGolem(x, y);
        if (type === 'snake_boss') return new SnakeBoss(x, y);
        return new Zombie(x, y);
    }

    _getSoldierWeaponPool() {
        if (Array.isArray(this.soldierWeaponPool) && this.soldierWeaponPool.length > 0) {
            return this.soldierWeaponPool;
        }

        this.soldierWeaponPool = Object.keys(WEAPONS).filter(id => {
            const weapon = WEAPONS[id];
            if (!weapon) return false;
            if (weapon.isUtility) return false;
            return id !== 'hammer' && id !== 'boomerang';
        });
        if (this.soldierWeaponPool.length === 0) {
            this.soldierWeaponPool = ['smg'];
        }
        return this.soldierWeaponPool;
    }

    _getRoomWeaponPool() {
        if (Array.isArray(this.roomWeaponPool) && this.roomWeaponPool.length > 0) {
            return this.roomWeaponPool;
        }

        this.roomWeaponPool = Object.keys(WEAPONS).filter(id => {
            const weapon = WEAPONS[id];
            if (!weapon) return false;
            if (weapon.isUtility) return false;
            return !ROOM_GUN_POOL_BLACKLIST.has(id);
        });

        if (this.roomWeaponPool.length === 0) {
            this.roomWeaponPool = ['default_pistol'];
        }
        return this.roomWeaponPool;
    }

    _isDroppedItemPositionValid(x, y, radius = 10) {
        const rect = {
            x: x - radius,
            y: y - radius,
            width: radius * 2,
            height: radius * 2
        };
        if (this.isRectBlocked(rect)) return false;

        for (const item of this.droppedItems) {
            if (!item) continue;
            if (Math.hypot(item.x - x, item.y - y) < radius * 2) {
                return false;
            }
        }
        return true;
    }

    spawnRoomWeaponDrops() {
        const rooms = this.generatedLayoutMeta?.indoorRooms || [];
        if (!Array.isArray(rooms) || rooms.length === 0) return;

        const spawnTiles = this.generatedLayoutMeta?.indoorSpawnTiles || [];
        const roomTileMap = new Map();
        for (const tile of spawnTiles) {
            if (!tile || !tile.roomId) continue;
            if (!Number.isFinite(tile.x) || !Number.isFinite(tile.y)) continue;
            if (tile.x < 1 || tile.x > MAP_WIDTH - 2 || tile.y < 1 || tile.y > MAP_HEIGHT - 2) continue;
            if (!roomTileMap.has(tile.roomId)) {
                roomTileMap.set(tile.roomId, []);
            }
            roomTileMap.get(tile.roomId).push(tile);
        }

        const weaponPool = this._getRoomWeaponPool();
        if (weaponPool.length === 0) return;

        for (const room of rooms) {
            if (!room || !room.id) continue;
            if (Math.random() > ROOM_GUN_SPAWN_CHANCE) continue;

            const candidates = roomTileMap.get(room.id);
            if (!Array.isArray(candidates) || candidates.length === 0) continue;

            const shuffledTiles = this._shuffleInPlace(candidates.slice());
            for (const tile of shuffledTiles) {
                const world = this._tileToWorldCenter(tile.x, tile.y);
                if (!this._isDroppedItemPositionValid(world.x, world.y)) continue;

                const weaponConfigId = weaponPool[Math.floor(Math.random() * weaponPool.length)];
                const weaponItemId = weaponItemIdFromConfigId(weaponConfigId);
                if (!weaponItemId) break;

                const instanceData = createWeaponInstanceData({ weaponConfigId });
                this.droppedItems.push(new DroppedItem(world.x, world.y, weaponItemId, 1, instanceData));
                break;
            }
        }
    }

    _chooseSoldierWeaponConfigId() {
        const pool = this._getSoldierWeaponPool();
        return pool[Math.floor(Math.random() * pool.length)];
    }

    _isVehicleSpawnRectWithinBounds(rect) {
        const worldWidth = MAP_WIDTH * TILE_SIZE;
        const worldHeight = MAP_HEIGHT * TILE_SIZE;
        const margin = TILE_SIZE;

        return (
            rect.x >= margin &&
            rect.y >= margin &&
            rect.x + rect.width <= worldWidth - margin &&
            rect.y + rect.height <= worldHeight - margin
        );
    }

    _isVehicleSpawnPositionAvailable(vehicle, x, y) {
        if (!vehicle) return false;

        const hw = vehicle.hitbox.width / 2;
        const hh = vehicle.hitbox.height / 2;
        const rect = {
            x: x - hw,
            y: y - hh,
            width: hw * 2,
            height: hh * 2
        };

        if (!this._isVehicleSpawnRectWithinBounds(rect)) return false;
        if (this.isRectBlocked(rect)) return false;

        for (const other of this.vehicles || []) {
            if (!other || other.isDead) continue;
            if (other.intersectsAabb && other.intersectsAabb(rect.x, rect.y, rect.width, rect.height)) {
                return false;
            }
        }

        const playerRect = this.getEntityMovementRect(this.player, this.player.x, this.player.y);
        if (this.checkRectCollision(rect, playerRect)) return false;

        for (const enemy of this.enemies) {
            if (!enemy || enemy.hp <= 0) continue;
            const enemyRect = this.getEntityMovementRect(enemy, enemy.x, enemy.y);
            if (this.checkRectCollision(rect, enemyRect)) {
                return false;
            }
        }

        return true;
    }

    spawnVehicleNearPlayer(options = {}) {
        if (!this.vehicles || !this.player) return null;

        const px = this.player.x;
        const py = this.player.y;
        if (!Number.isFinite(px) || !Number.isFinite(py)) return null;

        const minRadius = Math.max(48, Number.isFinite(options.minRadius) ? options.minRadius : 72);
        const maxRadius = Math.max(minRadius, Number.isFinite(options.maxRadius) ? options.maxRadius : 220);
        const radiusStep = Math.max(12, Number.isFinite(options.radiusStep) ? options.radiusStep : 28);
        const angleStep = Math.max(Math.PI / 18, Number.isFinite(options.angleStep) ? options.angleStep : (Math.PI / 6));
        const typePool = Array.isArray(options.types) && options.types.length > 0
            ? options.types
            : ['suv', 'truck', 'police', 'tank', 'spider'];

        for (let radius = minRadius; radius <= maxRadius; radius += radiusStep) {
            const angleOffset = Math.random() * Math.PI * 2;
            const samples = Math.max(12, Math.ceil((Math.PI * 2) / angleStep));

            for (let i = 0; i < samples; i++) {
                const angle = angleOffset + i * angleStep;
                const x = px + Math.cos(angle) * radius;
                const y = py + Math.sin(angle) * radius;
                const type = typePool[Math.floor(Math.random() * typePool.length)];
                const vehicle = new Vehicle(x, y, type);

                if (!this._isVehicleSpawnPositionAvailable(vehicle, x, y)) continue;

                this.vehicles.push(vehicle);
                return vehicle;
            }
        }

        return null;
    }

    _setupEnemyLoadout(enemy, type, options = {}) {
        if (!enemy) return;

        const nonZombie = type === 'hunter' || type === 'soldier';
        if (nonZombie) {
            enemy.isNonZombieEnemy = true;
            enemy.canOpenDoors = true;
            if (!Number.isFinite(enemy.dropWeaponChance)) {
                enemy.dropWeaponChance = 0.3;
            }
        }

        if (type === 'hunter') {
            const weaponConfigId = options.weaponConfigId || 'default_pistol';
            if (enemy.setCombatWeapon) {
                enemy.setCombatWeapon(weaponConfigId);
            } else {
                enemy.weaponConfigId = weaponConfigId;
                enemy.weaponItemId = weaponItemIdFromConfigId(weaponConfigId);
                enemy.weaponInstanceData = createWeaponInstanceData({ weaponConfigId });
            }
            this._initEnemyMeleeIfNeeded(enemy);
        }

        if (type === 'soldier') {
            const weaponConfigId = options.weaponConfigId || this._chooseSoldierWeaponConfigId();
            if (enemy.setCombatWeapon) {
                enemy.setCombatWeapon(weaponConfigId);
            } else {
                enemy.weaponConfigId = weaponConfigId;
                enemy.weaponItemId = weaponItemIdFromConfigId(weaponConfigId);
                enemy.weaponInstanceData = createWeaponInstanceData({ weaponConfigId });
            }
            this._initEnemyMeleeIfNeeded(enemy);
        }
    }

    _initEnemyMeleeIfNeeded(enemy) {
        if (!enemy.initMeleeSystem) return;
        if (!enemy.currentWeapon || !enemy.currentWeapon.isMelee) return;

        enemy.initMeleeSystem({
            player: this.player,
            breakableObjects: this.breakableObjects,
            walls: this.walls,
            particles: this.combatSystem.particles,
            particleSpawner: this.combatSystem.particleSpawner,
            statusEffects: this.combatSystem.statusEffects
        });
    }

    spawnEnemyWithIndoorPreference(type, indoorPool, indoorRatio = 0.7) {
        const wantIndoor = Math.random() < indoorRatio;
        if (wantIndoor && Array.isArray(indoorPool)) {
            while (indoorPool.length > 0) {
                const tile = indoorPool.pop();
                const spawned = this.spawnEnemy(type, { tileX: tile.x, tileY: tile.y, strict: true });
                if (spawned) {
                    return spawned;
                }
            }
        }

        return this.spawnEnemy(type);
    }

    spawnEnemy(type = 'zombie', options = {}) {
        const strict = !!options.strict;
        const maxAttempts = strict ? 1 : 24;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let spawnPos = null;
            if (attempt === 0 && Number.isFinite(options.x) && Number.isFinite(options.y)) {
                spawnPos = { x: options.x, y: options.y };
            } else if (attempt === 0 && Number.isFinite(options.tileX) && Number.isFinite(options.tileY)) {
                spawnPos = this._tileToWorldCenter(options.tileX, options.tileY);
            } else {
                spawnPos = this._pickRandomSpawnPoint();
            }

            const enemy = this._createEnemyByType(type, spawnPos.x, spawnPos.y);
            this._setupEnemyLoadout(enemy, type, options);

            if (this.isEntityBlockedAt(enemy, enemy.x, enemy.y)) {
                continue;
            }

            this.enemies.push(enemy);

            // Set worldSystem reference for bosses that need it
            if (enemy.isBoss && !enemy.worldSystem) {
                enemy.worldSystem = this;
            }

            return enemy;
        }

        return null;
    }

    checkRectCollision(rect1, rect2) {
        const r1w = rect1.width ?? rect1.w;
        const r1h = rect1.height ?? rect1.h;
        const r2w = rect2.width ?? rect2.w;
        const r2h = rect2.height ?? rect2.h;
        if (r1w <= 0 || r1h <= 0 || r2w <= 0 || r2h <= 0) return false;
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
        const skipOpenDoors = options.skipOpenDoors || false;
        const skipWater = options.skipWater || false;
        const canUseIndex = this.obstacleIndex && !this.worldStaticDirty;
        const indexCandidates = canUseIndex ? this.obstacleIndex.queryRect(rect) : null;

        if (indexCandidates) {
            for (const entry of indexCandidates) {
                const obj = entry.object;
                if (obj) {
                    if (obj === ignoreObject || obj.isBroken) continue;
                    if (skipOpenDoors && this._isDoorObject(obj) && obj.isOpen) continue;
                }

                if (this.checkRectCollision(rect, entry.rect)) {
                    return true;
                }
            }
            // Water check (when using spatial index — walls/objects already checked above)
            if (!skipWater && this.isRectOnWater(rect)) {
                return true;
            }
            return false;
        }

        for (const wall of this.walls) {
            if (this.checkRectCollision(rect, wall)) {
                return true;
            }
        }

        for (const obj of this.breakableObjects) {
            if (obj.isBroken || obj === ignoreObject) continue;
            if (skipOpenDoors && this._isDoorObject(obj) && obj.isOpen) continue;
            const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
            for (const hb of hitboxes) {
                if (this.checkRectCollision(rect, hb)) {
                    return true;
                }
            }
        }

        // Water collision — blocks movement like walls
        if (!skipWater && this.isRectOnWater(rect)) {
            return true;
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
        
        const gs = this.navGrid.gridSize;
        const cols = this.navGrid.gridCols;

        for (const obj of this.breakableObjects) {
            if (obj.isBroken) continue;
            if (this._isDoorObject(obj) && obj.isOpen) continue;
            const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];

            for (const hitbox of hitboxes) {
                const hbWidth = hitbox.width ?? hitbox.w;
                const hbHeight = hitbox.height ?? hitbox.h;
                if (hbWidth <= 0 || hbHeight <= 0) continue;
                const startX = Math.floor(hitbox.x / gs);
                const endX = Math.floor((hitbox.x + hbWidth - 1) / gs);
                const startY = Math.floor(hitbox.y / gs);
                const endY = Math.floor((hitbox.y + hbHeight - 1) / gs);

                for (let gx = startX; gx <= endX; gx++) {
                    for (let gy = startY; gy <= endY; gy++) {
                        const cell = this.navGrid.getCell(gx * gs, gy * gs);
                        const idx = cell.y * cols + cell.x;
                        if (idx >= 0 && idx < this.navGrid.wallBlocked.length) {
                            this.navGrid.wallBlocked[idx] = 1;
                            const key = cell.x + cell.y * cols;
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

        // Block water tiles for enemy pathfinding
        if (this.waterGrid) {
            for (let ty = 0; ty < this.waterGridHeight; ty++) {
                for (let tx = 0; tx < this.waterGridWidth; tx++) {
                    if (this.waterGrid[ty * this.waterGridWidth + tx] !== 1) continue;
                    // Mark all nav grid cells covered by this water tile as blocked
                    const wxStart = Math.floor((tx * TILE_SIZE) / gs);
                    const wxEnd = Math.floor(((tx + 1) * TILE_SIZE - 1) / gs);
                    const wyStart = Math.floor((ty * TILE_SIZE) / gs);
                    const wyEnd = Math.floor(((ty + 1) * TILE_SIZE - 1) / gs);
                    for (let gx = wxStart; gx <= wxEnd; gx++) {
                        for (let gy = wyStart; gy <= wyEnd; gy++) {
                            if (gx < 0 || gx >= cols || gy < 0 || gy >= this.navGrid.gridRows) continue;
                            const idx = gy * cols + gx;
                            if (idx >= 0 && idx < this.navGrid.wallBlocked.length) {
                                this.navGrid.wallBlocked[idx] = 1;
                            }
                        }
                    }
                }
            }
        }

        this.navGrid.updateFlowField(this.player.x, this.player.y);
    }

    updateFlowFieldForPlayer(frameCount, flowPlayerCellX, flowPlayerCellY) {
        const rebuilt = this.rebuildStaticCachesIfNeeded();
        const cell = this.navGrid.getCell(this.player.x, this.player.y);
        const playerCellX = cell.x;
        const playerCellY = cell.y;
        if (rebuilt) {
            return { x: playerCellX, y: playerCellY };
        }
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
            let collisionMask = 0;
            const x = Math.floor(wall.x);
            const y = Math.floor(wall.y);
            const TILE = 32; // Assuming 32 is TILE_SIZE

            const directions = [
                { dx: 0, dy: -TILE, bit: 1 }, // North
                { dx: TILE, dy: 0, bit: 2 },  // East
                { dx: 0, dy: TILE, bit: 4 },  // South
                { dx: -TILE, dy: 0, bit: 8 }  // West
            ];

            for (const dir of directions) {
                const neighbor = wallMap.get(`${x + dir.dx},${y + dir.dy}`);
                if (neighbor) {
                    mask |= dir.bit;
                    // Don't extend collision toward open doors (fixes visual-collision gap mismatch)
                    const isOpenDoor = this._isDoorObject(neighbor) && neighbor.isOpen;
                    if (!isOpenDoor) {
                        collisionMask |= dir.bit;
                    }
                }
            }

            wall.setWallMask(mask, collisionMask);
        }
    }

    _getRectCenter(rect) {
        const width = rect.width ?? rect.w ?? 0;
        const height = rect.height ?? rect.h ?? 0;
        return {
            x: rect.x + width / 2,
            y: rect.y + height / 2
        };
    }

    _distancePointToRect(px, py, rect) {
        const width = rect.width ?? rect.w ?? 0;
        const height = rect.height ?? rect.h ?? 0;
        const nearX = Math.max(rect.x, Math.min(px, rect.x + width));
        const nearY = Math.max(rect.y, Math.min(py, rect.y + height));
        return Math.hypot(px - nearX, py - nearY);
    }

    _isDoorObject(obj) {
        if (!obj) return false;
        return obj.baseType === 'door_h' || obj.baseType === 'door_v' || obj.type === 'door_h' || obj.type === 'door_v';
    }

    _getBreachHitboxCandidates(from, to, nearbyRadius) {
        if (this.obstacleIndex && !this.worldStaticDirty) {
            const margin = nearbyRadius + TILE_SIZE;
            const minX = Math.min(from.x, to.x) - margin;
            const minY = Math.min(from.y, to.y) - margin;
            const maxX = Math.max(from.x, to.x) + margin;
            const maxY = Math.max(from.y, to.y) + margin;
            const rect = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
            const indexed = this.obstacleIndex.queryRect(rect, { objectsOnly: true });
            const result = [];
            for (const entry of indexed) {
                if (!entry.object) continue;
                result.push({
                    object: entry.object,
                    hitbox: entry.rect
                });
            }
            return result;
        }

        const result = [];
        for (const obj of this.breakableObjects) {
            if (!obj) continue;
            const hitboxes = obj.getHitboxes ? obj.getHitboxes() : [obj.getHitbox()];
            for (const hb of hitboxes) {
                result.push({
                    object: obj,
                    hitbox: hb
                });
            }
        }
        return result;
    }

    _pickEnemyBreachTarget(enemy) {
        const from = { x: enemy.x, y: enemy.y };
        const to = { x: this.player.x, y: this.player.y };
        const toLen = Math.hypot(to.x - from.x, to.y - from.y) || 1;
        const dirToPlayerX = (to.x - from.x) / toLen;
        const dirToPlayerY = (to.y - from.y) / toLen;
        const nearbyRadius = 84;

        let doorOnPath = null;
        let doorOnPathDist = Number.POSITIVE_INFINITY;
        let doorNearby = null;
        let doorNearbyDist = Number.POSITIVE_INFINITY;
        let blockerOnPath = null;
        let blockerOnPathDist = Number.POSITIVE_INFINITY;
        let blockerNearby = null;
        let blockerNearbyDist = Number.POSITIVE_INFINITY;

        const objectStates = new Map();
        const candidates = this._getBreachHitboxCandidates(from, to, nearbyRadius);

        for (const candidate of candidates) {
            const obj = candidate.object;
            if (!obj || obj.isBroken) continue;

            const isDoor = this._isDoorObject(obj);
            if (isDoor && obj.isOpen) continue;

            const hb = candidate.hitbox;
            if (!hb) continue;
            let state = objectStates.get(obj);
            if (!state) {
                state = {
                    object: obj,
                    minDist: Number.POSITIVE_INFINITY,
                    nearestHitbox: null,
                    intersectsPath: false
                };
                objectStates.set(obj, state);
            }

            const dist = this._distancePointToRect(enemy.x, enemy.y, hb);
            if (dist < state.minDist) {
                state.minDist = dist;
                state.nearestHitbox = hb;
            }

            if (!state.intersectsPath && CollisionUtils.lineIntersectsRect(from, to, hb)) {
                state.intersectsPath = true;
            }
        }

        for (const state of objectStates.values()) {
            const obj = state.object;
            const nearestHitbox = state.nearestHitbox;
            const minDist = state.minDist;
            if (!nearestHitbox || !Number.isFinite(minDist)) continue;

            const isDoor = this._isDoorObject(obj);
            if (state.intersectsPath) {
                if (isDoor && minDist < doorOnPathDist) {
                    doorOnPathDist = minDist;
                    doorOnPath = { object: obj, hitbox: nearestHitbox };
                } else if (!isDoor && minDist < blockerOnPathDist) {
                    blockerOnPathDist = minDist;
                    blockerOnPath = { object: obj, hitbox: nearestHitbox };
                }
                continue;
            }

            if (minDist > nearbyRadius) continue;

            const center = this._getRectCenter(nearestHitbox);
            const vecX = center.x - enemy.x;
            const vecY = center.y - enemy.y;
            const vecLen = Math.hypot(vecX, vecY) || 1;
            const dot = (vecX / vecLen) * dirToPlayerX + (vecY / vecLen) * dirToPlayerY;
            if (dot < -0.15) continue;

            if (isDoor && minDist < doorNearbyDist) {
                doorNearbyDist = minDist;
                doorNearby = { object: obj, hitbox: nearestHitbox };
            } else if (!isDoor && minDist < blockerNearbyDist) {
                blockerNearbyDist = minDist;
                blockerNearby = { object: obj, hitbox: nearestHitbox };
            }
        }

        return doorOnPath || doorNearby || blockerOnPath || blockerNearby || null;
    }

    _damageObstacleFromEnemy(enemy, targetObj) {
        if (!targetObj || targetObj.isBroken) return;

        const baseDamage = Number.isFinite(enemy.damage) ? enemy.damage : 6;
        const damage = Math.max(4, Math.round(baseDamage * 0.8));
        const wasBroken = targetObj.isBroken;
        targetObj.takeDamage(damage);

        if (!wasBroken && targetObj.isBroken) {
            this.markWorldStaticDirty();
        }

        if (!wasBroken && targetObj.isBroken && this.combatSystem) {
            if (this.combatSystem.spawnDebris) {
                this.combatSystem.spawnDebris(
                    targetObj.x + (targetObj.width || 32) / 2,
                    targetObj.y + (targetObj.height || 32) / 2,
                    targetObj.type
                );
            }

            if (targetObj.type === 'explosive_barrel' && this.combatSystem.spawnExplosion) {
                this.combatSystem.spawnExplosion(
                    targetObj.x + (targetObj.width || 32) / 2,
                    targetObj.y + (targetObj.height || 32) / 2,
                    80,
                    100,
                    10
                );
            }
        }
    }

    _dropEnemyWeapon(enemy) {
        if (!enemy || !enemy.isNonZombieEnemy) return;

        const dropChance = Number.isFinite(enemy.dropWeaponChance) ? enemy.dropWeaponChance : 0.3;
        if (Math.random() > dropChance) return;

        const weaponConfigId = enemy.weaponConfigId || 'default_pistol';
        const weaponItemId = enemy.weaponItemId || weaponItemIdFromConfigId(weaponConfigId);
        if (!weaponItemId) return;

        let instanceData = cloneWeaponInstanceData(enemy.weaponInstanceData);
        if (!instanceData) {
            instanceData = createWeaponInstanceData({ weaponConfigId });
        }

        let dropX = enemy.x + (Math.random() - 0.5) * 20;
        let dropY = enemy.y + (Math.random() - 0.5) * 20;
        if (!this._isDroppedItemPositionValid(dropX, dropY)) {
            dropX = enemy.x;
            dropY = enemy.y;
        }
        this.droppedItems.push(new DroppedItem(dropX, dropY, weaponItemId, 1, instanceData));
    }

    _getEnemyDropMultiplier(enemy) {
        if (enemy instanceof MutantBeast) return 5;
        if (enemy instanceof MechaGolem) return 5;
        if (enemy instanceof SnakeBoss) return 5;
        if (enemy instanceof ZombieBrute) return 2;
        if (enemy instanceof Hunter) return 2;
        if (enemy instanceof Soldier) return 3;
        return 1;
    }

    _dropBossLoot(enemy) {
        const pool = this._getRoomWeaponPool();
        if (!pool || pool.length === 0) return;
        // Drop 2-3 random weapons around the boss
        const dropCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < dropCount; i++) {
            const weaponId = pool[Math.floor(Math.random() * pool.length)];
            const itemId = weaponItemIdFromConfigId(weaponId);
            if (!itemId) continue;
            const instanceData = createWeaponInstanceData({ weaponConfigId: weaponId });
            const angle = (Math.PI * 2 * i) / dropCount;
            let dropX = enemy.x + Math.cos(angle) * 24;
            let dropY = enemy.y + Math.sin(angle) * 24;
            if (!this._isDroppedItemPositionValid(dropX, dropY)) {
                dropX = enemy.x;
                dropY = enemy.y;
            }
            this.droppedItems.push(new DroppedItem(dropX, dropY, itemId, 1, instanceData));
        }
    }

    _dropEnemyConsumable(enemy, baseChance, itemId) {
        if (!enemy) return;
        const chance = Math.min(1, baseChance * this._getEnemyDropMultiplier(enemy));
        if (Math.random() > chance) return;
        if (this.inventorySystem && !this.inventorySystem.getItemDef(itemId)) return;

        let dropX = enemy.x + (Math.random() - 0.5) * 18;
        let dropY = enemy.y + (Math.random() - 0.5) * 18;
        if (!this._isDroppedItemPositionValid(dropX, dropY)) {
            dropX = enemy.x;
            dropY = enemy.y;
        }
        this.droppedItems.push(new DroppedItem(dropX, dropY, itemId, 1));
    }

    _dropEnemyRecoveryNeedle(enemy) {
        this._dropEnemyConsumable(enemy, ENEMY_RECOVERY_NEEDLE_DROP_CHANCE, 'consumable:recovery_needle');
    }

    _dropEnemyMedkit(enemy) {
        this._dropEnemyConsumable(enemy, ENEMY_MEDKIT_DROP_CHANCE, 'consumable:medkit');
    }

    _dropEnemyHamburger(enemy) {
        this._dropEnemyConsumable(enemy, ENEMY_HAMBURGER_DROP_CHANCE, 'consumable:hamburger');
    }

    _dropEnemyCostume(enemy) {
        const itemId = COSTUME_DROP_POOL[Math.floor(Math.random() * COSTUME_DROP_POOL.length)];
        this._dropEnemyConsumable(enemy, ENEMY_COSTUME_DROP_CHANCE, itemId);
    }

    _updateEnemyBreachBehavior(enemy) {
        if (!enemy || enemy.hp <= 0) return false;

        const distToPlayer = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
        if (distToPlayer > 700) return false;

        const flowDist = this.navGrid.getFlowDistance(enemy.x, enemy.y);
        const stuckFrames = enemy._movementState?.stuckFrames || 0;
        const stuckThreshold = flowDist >= 0 ? 60 : 10;
        if (flowDist >= 0 && stuckFrames < stuckThreshold) {
            return false;
        }

        // Don't breach if a reasonable flow path exists (detour < 4x direct distance)
        if (flowDist >= 0) {
            const directCells = Math.max(1, Math.floor(distToPlayer / this.navGrid.gridSize));
            const ratio = flowDist / directCells;
            if (ratio < 4) return false;
        }

        const target = this._pickEnemyBreachTarget(enemy);
        if (!target) return false;

        const targetCenter = this._getRectCenter(target.hitbox);
        const toTargetX = targetCenter.x - enemy.x;
        const toTargetY = targetCenter.y - enemy.y;
        const toTargetDist = Math.hypot(toTargetX, toTargetY);
        const attackRange = Math.max(30, (enemy.attackRange || 24) + 8);

        enemy._breachAttackCooldown = Math.max(0, enemy._breachAttackCooldown || 0);
        if (enemy._breachAttackCooldown > 0) {
            enemy._breachAttackCooldown--;
        }

        if (toTargetDist <= attackRange) {
            enemy.state = 'attack';

            if (enemy._breachAttackCooldown <= 0) {
                const isDoor = this._isDoorObject(target.object);
                if (isDoor && enemy.canOpenDoors && target.object.interact && !target.object.isOpen) {
                    const wasOpen = !!target.object.isOpen;
                    target.object.interact();
                    if (!!target.object.isOpen !== wasOpen) {
                        this.markWorldStaticDirty();
                    }
                    enemy._breachAttackCooldown = 10;
                } else {
                    this._damageObstacleFromEnemy(enemy, target.object);
                    enemy._breachAttackCooldown = isDoor ? 20 : 26;
                }
            }
            return true;
        }

        const dirX = toTargetDist > 0 ? toTargetX / toTargetDist : 0;
        const dirY = toTargetDist > 0 ? toTargetY / toTargetDist : 0;
        const speed = enemy.getEffectiveSpeed ? enemy.getEffectiveSpeed() : (enemy.speed || 1);
        const nextX = enemy.x + dirX * speed;
        const nextY = enemy.y + dirY * speed;
        this.resolveEntityMovement(enemy, nextX, nextY, dirX, dirY, { skipOpenDoors: true });
        enemy.state = 'run';
        return true;
    }

    _resolveEnemySeparationPair(e1, e2, pushes, enemyIndex) {
        if (!e1 || !e2 || e1 === e2 || e1.hp <= 0 || e2.hp <= 0) return;

        let dx = e1.x - e2.x;
        let dy = e1.y - e2.y;
        let distSq = dx * dx + dy * dy;
        const minDist = (e1.width + e2.width) / 2;
        const minDistSq = minDist * minDist;
        if (distSq >= minDistSq) return;

        let nx = 0;
        let ny = 0;
        let dist = 0;
        if (distSq <= 1e-6) {
            // Deterministic fallback direction for near-perfect overlap.
            const i1 = enemyIndex.get(e1) || 0;
            const i2 = enemyIndex.get(e2) || 0;
            const seed = ((i1 * 73856093) ^ (i2 * 19349663)) & 1023;
            const angle = (seed / 1024) * Math.PI * 2;
            nx = Math.cos(angle);
            ny = Math.sin(angle);
            dist = 0;
        } else {
            dist = Math.sqrt(distSq);
            nx = dx / dist;
            ny = dy / dist;
        }

        const overlap = minDist - dist;
        const overlapEpsilon = 0.35;
        if (overlap <= overlapEpsilon) return;

        const maxPairPush = 1.25;
        const correction = Math.min(maxPairPush, (overlap - overlapEpsilon) * 0.5);
        if (correction <= 0) return;

        let p1 = pushes.get(e1);
        if (!p1) {
            p1 = { x: 0, y: 0 };
            pushes.set(e1, p1);
        }
        p1.x += nx * correction;
        p1.y += ny * correction;

        let p2 = pushes.get(e2);
        if (!p2) {
            p2 = { x: 0, y: 0 };
            pushes.set(e2, p2);
        }
        p2.x -= nx * correction;
        p2.y -= ny * correction;
    }

    _resolveEnemySeparationByGrid() {
        const grid = this.navGrid.enemyGrid;
        if (!grid || grid.size === 0 || this.enemies.length <= 1) return;

        const cols = this.navGrid.gridCols;
        const rows = this.navGrid.gridRows;
        const neighborOffsets = [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: -1 }
        ];

        const pushes = new Map();
        const enemyIndex = new Map();
        for (let i = 0; i < this.enemies.length; i++) {
            enemyIndex.set(this.enemies[i], i);
        }

        for (const [key, list] of grid.entries()) {
            if (!list || list.length === 0) continue;
            const cellX = key % cols;
            const cellY = (key - cellX) / cols;

            for (let i = 0; i < list.length; i++) {
                const e1 = list[i];
                for (let j = i + 1; j < list.length; j++) {
                    this._resolveEnemySeparationPair(e1, list[j], pushes, enemyIndex);
                }
            }

            for (const offset of neighborOffsets) {
                const nx = cellX + offset.x;
                const ny = cellY + offset.y;
                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
                const otherList = grid.get(nx + ny * cols);
                if (!otherList || otherList.length === 0) continue;

                for (const e1 of list) {
                    for (const e2 of otherList) {
                        this._resolveEnemySeparationPair(e1, e2, pushes, enemyIndex);
                    }
                }
            }
        }

        const relaxation = 0.6;
        const maxEnemyPush = 1.75;
        for (const [enemy, push] of pushes.entries()) {
            if (!enemy || enemy.hp <= 0) continue;

            let px = push.x * relaxation;
            let py = push.y * relaxation;
            const len = Math.hypot(px, py);
            if (len < 0.01) continue;
            if (len > maxEnemyPush) {
                const scale = maxEnemyPush / len;
                px *= scale;
                py *= scale;
            }

            this.resolveEntityMovement(
                enemy,
                enemy.x + px,
                enemy.y + py,
                px,
                py,
                { skipOpenDoors: true }
            );
        }
    }

    updateEnemies() {
        this._refreshStaticDirtyFlags();
        this.rebuildStaticCachesIfNeeded();

        // Filter dead enemies and remove them from the array
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].hp <= 0) {
                // Skip loot drops for boss segments (SnakeSegment etc.)
                if (!this.enemies[i].isSegment) {
                    if (this.enemies[i].isBoss) {
                        this._dropBossLoot(this.enemies[i]);
                    } else {
                        this._dropEnemyWeapon(this.enemies[i]);
                    }
                    this._dropEnemyRecoveryNeedle(this.enemies[i]);
                    this._dropEnemyMedkit(this.enemies[i]);
                    this._dropEnemyHamburger(this.enemies[i]);
                    this._dropEnemyCostume(this.enemies[i]);
                }
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
            this.resolveEntityMovement(enemy, nextX, nextY, intentX, intentY, { skipOpenDoors: true });
        };

        for (const e of this.enemies) {
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

            this._updateEnemyBreachBehavior(e);
        }

        // Run one stable post-update overlap resolution pass to avoid large zombie stacks.
        this.navGrid.buildEnemyGrid(this.enemies);
        this._resolveEnemySeparationByGrid();
    }

    updatePets() {
        if (!this.pets || this.pets.length === 0) return;

        const getFlowDirection = (x, y) => this.navGrid.getFlowDirection(x, y);
        const getNavDirection = (pet, desiredX, desiredY) => {
            const hbWidth = pet.hitboxWidth || pet.width;
            const hbHeight = pet.hitboxHeight || pet.height;
            const hbOffsetY = pet.hitboxOffsetY || 0;
            return this.navGrid.findNavigableDirection(
                pet.x, pet.y + hbOffsetY,
                hbWidth, hbHeight,
                desiredX, desiredY
            );
        };
        const resolvePetMove = (pet, nextX, nextY, intentX, intentY) => {
            this.resolveEntityMovement(pet, nextX, nextY, intentX, intentY, { skipOpenDoors: true });
        };

        const particles = this.combatSystem ? this.combatSystem.particles : null;
        this.pets.forEach(pet => {
            pet.update(this.player, getFlowDirection, getNavDirection, resolvePetMove, particles);
        });
    }
}
