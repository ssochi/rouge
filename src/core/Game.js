import { InputHandler } from './Input.js';
import { Camera } from './Camera.js';
import { HandSystem } from './HandSystem.js';
import { UIManager } from '../ui/UIManager.js';
import { NavigationGrid } from './systems/NavigationGrid.js';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../utils/Constants.js';
import { WorldSystem } from './systems/WorldSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { PlayerSystem } from './systems/PlayerSystem.js';
import { InventorySystem } from './systems/InventorySystem.js';
import { BuildSystem } from './systems/BuildSystem.js';
import { MeleeSystem } from './systems/MeleeSystem.js';
import { ProfilerSystem } from './systems/ProfilerSystem.js';
import { CostumeSystem } from './systems/CostumeSystem.js';
import { Vehicle } from './entities/Vehicle.js';
import { Renderer } from './Renderer.js';
import { TestPanel } from '../ui/TestPanel.js';
import { PixelOS } from '../pixelOS/PixelOS.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Fullscreen and Scaling
        // Increased from 1.5 to 2.5 (approx 1.5x larger) for better visibility
        this.scale = 2.5;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.input = new InputHandler(this.canvas);
        this.camera = new Camera(this.canvas.width / this.scale, this.canvas.height / this.scale);
        this.uiManager = new UIManager();

        this.walls = [];
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.droppedItems = [];
        this.breakableObjects = [];
        this.vehicles = [];
        this.blackHoles = [];
        this.acidPuddles = [];
        this.pets = [];
        // Portals are managed by WorldSystem but need to be passed to Renderer via Game reference or directly

        const NAV_GRID_SIZE = 8;
        this.navGrid = new NavigationGrid(
            MAP_WIDTH * TILE_SIZE / NAV_GRID_SIZE,
            MAP_HEIGHT * TILE_SIZE / NAV_GRID_SIZE,
            NAV_GRID_SIZE
        );
        this.flowPlayerCellX = -1;
        this.flowPlayerCellY = -1;
        this.frameCount = 0;

        this.player = {
            x: 400,
            y: 300,
            width: 32, // Visual width
            height: 32, // Visual height
            hitboxWidth: 14, // Physical collision width
            hitboxHeight: 8, // Physical collision height
            hitboxOffsetY: 12, // Offset from center Y to feet (Center is 0, Feet is ~16)
            speed: 4,
            rollSpeed: 8,
            hp: 100,
            maxHp: 100,
            angle: 0,
            state: 'idle',
            rollDuration: 0,
            rollCooldown: 0,
            facingRight: true,
            animationTimer: 0,
            knockbackX: 0,
            knockbackY: 0,
            burnTimer: 0,
            burnDamage: 0,
            burnTickInterval: 20,
            burnTickCounter: 0,
            slowTimer: 0,
            slowAmount: 0,
            freezeStacks: 0,
            frozenTimer: 0,
            costume: {
                hairstyle: 'hair_long',
                hat: null,
                clothes: 'clothes_coat',
                glasses: 'glasses_sun',
            }
        };
        
        this.player.takeDamage = (amount, knockback) => {
            if (this.player.state === 'roll') return;
            this.player.hp -= amount;
            if (knockback) {
                this.player.knockbackX = knockback.x;
                this.player.knockbackY = knockback.y;
            }
            this.camera.x += (Math.random() - 0.5) * 5;
            this.camera.y += (Math.random() - 0.5) * 5;
        };

        // Unified player hurtbox used by enemy bullet hit detection.
        this.player.getBulletHurtbox = () => ({
            x: this.player.x - this.player.width / 2,
            y: this.player.y - this.player.height / 2,
            width: this.player.width,
            height: this.player.height
        });

        // Unified player movement hitbox used by movement collision.
        this.player.getMovementHitboxAt = (x = this.player.x, y = this.player.y) => ({
            x: x - this.player.hitboxWidth / 2,
            y: y + this.player.hitboxOffsetY - this.player.hitboxHeight / 2,
            width: this.player.hitboxWidth,
            height: this.player.hitboxHeight
        });

        this.handSystem = new HandSystem(this.player);

        this.combatSystem = new CombatSystem({
            bullets: this.bullets,
            particles: this.particles,
            enemies: this.enemies,
            breakableObjects: this.breakableObjects,
            walls: this.walls,
            camera: this.camera,
            handSystem: this.handSystem,
            player: this.player,
            vehicles: this.vehicles,
            blackHoles: this.blackHoles,
            acidPuddles: this.acidPuddles
        });

        this.inventorySystem = new InventorySystem();

        this.worldSystem = new WorldSystem({
            navGrid: this.navGrid,
            walls: this.walls,
            enemies: this.enemies,
            droppedItems: this.droppedItems,
            breakableObjects: this.breakableObjects,
            vehicles: this.vehicles,
            player: this.player,
            combatSystem: this.combatSystem,
            inventorySystem: this.inventorySystem,
            pets: this.pets
        });

        // Inject spatial index into CombatSystem for broad-phase bullet collision
        this.combatSystem.setObstacleIndex(this.worldSystem.obstacleIndex);

        this.buildSystem = new BuildSystem(this);

        this.meleeSystem = new MeleeSystem({
            owner: this.player,
            targets: this.enemies,
            breakableObjects: this.breakableObjects,
            walls: this.walls,
            particles: this.particles,
            handSystem: this.handSystem,
            particleSpawner: this.combatSystem.particleSpawner,
            statusEffects: this.combatSystem.statusEffects,
            onHit: ({ isCritical, knockback }) => {
                const shake = isCritical ? 8 : Math.min(knockback, 12) * 0.5;
                this.camera.x += (Math.random() - 0.5) * shake;
                this.camera.y += (Math.random() - 0.5) * shake;
            }
        });
        this.handSystem.setMeleeSystem(this.meleeSystem);

        // PixelOS (persistent across sessions)
        this.isComputerOpen = false;
        this.pixelOS = new PixelOS({
            onClose: () => { this.isComputerOpen = false; }
        });

        this.playerSystem = new PlayerSystem({
            player: this.player,
            input: this.input,
            handSystem: this.handSystem,
            combatSystem: this.combatSystem,
            worldSystem: this.worldSystem,
            droppedItems: this.droppedItems,
            vehicles: this.vehicles,
            inventorySystem: this.inventorySystem,
            buildSystem: this.buildSystem,
            meleeSystem: this.meleeSystem,
            particles: this.particles,
            pets: this.pets,
            onInteract: (obj) => {
                if (obj.type === 'computer_desk') {
                    this.isComputerOpen = true;
                    this.pixelOS.open();
                }
            }
        });

        this.profiler = new ProfilerSystem();
        this.costumeSystem = new CostumeSystem();
        this.iPressed = false;

        this.renderer = new Renderer({
            canvas: this.canvas,
            ctx: this.ctx,
            scale: this.scale,
            camera: this.camera,
            input: this.input,
            uiManager: this.uiManager,
            handSystem: this.handSystem,
            player: this.player,
            walls: this.walls,
            enemies: this.enemies,
            breakableObjects: this.breakableObjects,
            vehicles: this.vehicles, // Pass vehicles
            particles: this.particles,
            droppedItems: this.droppedItems,
            bullets: this.bullets,
            worldSystem: this.worldSystem, // Pass WorldSystem to access portals
            buildSystem: this.buildSystem,
            blackHoles: this.blackHoles,
            acidPuddles: this.acidPuddles,
            profiler: this.profiler,
            pets: this.pets,
            costumeSystem: this.costumeSystem
        });

        // Initial Inventory
        this.inventorySystem.add('weapon:pistol', 1);
        this.inventorySystem.selectHotbarSlot(0);

        // Bind Inventory Click
        this.uiManager.onInventorySlotClick = (index, isRight, isShift) => {
            if (this.isInventoryOpen) {
                this.uiManager.handleInventoryClick(index, this.inventorySystem, isRight, isShift);
            }
        };
        
        // Bind Hotbar Click (HUD)
        this.uiManager.onHotbarSlotClick = (index) => {
            if (this.inventorySystem.selectHotbarSlot(index)) {
                this.playerSystem.updateEquippedItem();
            }
        };
        
        this.uiManager.onDropItem = (item) => {
            if (this.playerSystem) {
                this.playerSystem.dropItem(item);
            }
        };
        
        this.uiManager.onCloseInventory = () => {
            this.isInventoryOpen = false;
            this.uiManager.toggleInventory(false);
        };
        
        // Bind Costume System to UIManager
        this.uiManager.setCostumeRefs(this.costumeSystem, this.player);

        this.isInventoryOpen = false;
        this.bPressed = false;

        this.testPanel = new TestPanel({
            inventorySystem: this.inventorySystem,
            worldSystem: this.worldSystem,
            player: this.player,
            costumeSystem: this.costumeSystem
        });
        this.lPressed = false;

        this.worldSystem.loadMap('hub'); // Start in Hub
        this.playerSystem.updateEquippedItem();
        
        const cell = this.navGrid.getCell(this.player.x, this.player.y);
        this.flowPlayerCellX = cell.x;
        this.flowPlayerCellY = cell.y;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
        
        if (this.camera) {
            this.camera.width = this.canvas.width / this.scale;
            this.camera.height = this.canvas.height / this.scale;
        }
    }

    update() {
        if (this.player.hp <= 0) {
            this.uiManager.showGameOver();
            return;
        }

        // Toggle Inventory
        if (this.input.keys.b && !this.bPressed) {
            this.bPressed = true;
            this.isInventoryOpen = !this.isInventoryOpen;
            this.uiManager.toggleInventory(this.isInventoryOpen);
            // Update UI once when opening
            if (this.isInventoryOpen) {
                this.uiManager.updateInventory(this.inventorySystem);
            }
        } else if (!this.input.keys.b) {
            this.bPressed = false;
        }

        // Toggle Test Panel
        if (this.input.keys.l && !this.lPressed) {
            this.lPressed = true;
            this.testPanel.toggle();
        } else if (!this.input.keys.l) {
            this.lPressed = false;
        }

        // Toggle Profiler
        if (this.input.keys.i && !this.iPressed) {
            this.iPressed = true;
            this.profiler.visible = !this.profiler.visible;
        } else if (!this.input.keys.i) {
            this.iPressed = false;
        }

        if (this.isComputerOpen || this.isInventoryOpen || this.testPanel.isOpen) {
            return;
        }

        // --- Vehicles ---
        this.profiler.begin('Vehicles');
        let activeVehicle = null;
        if (this.player.state === 'driving') {
             activeVehicle = this.vehicles.find(v => v.driver === this.player);
             if (this.input.keys.e && !this.player.ePressed) {
                 this.player.ePressed = true;
                 if (activeVehicle) {
                     activeVehicle.exit();
                     this.player.state = 'idle';
                     activeVehicle = null;
                 }
             } else if (!this.input.keys.e) {
                 this.player.ePressed = false;
             }
        } else {
             this.playerSystem.updatePlayerMovement();
        }
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const v = this.vehicles[i];
            if (v.isDead) {
                if (activeVehicle === v) {
                    this.player.state = 'idle';
                    activeVehicle = null;
                }
                this.vehicles.splice(i, 1);
                continue;
            }
            v.update(this.input, this.walls, this.particles, this.breakableObjects, this.enemies, this.player, this.camera, this.combatSystem, this.vehicles);
        }
        this.profiler.end('Vehicles');

        // --- Flow Field ---
        this.profiler.begin('FlowField');
        this.frameCount++;
        const flow = this.worldSystem.updateFlowFieldForPlayer(this.frameCount, this.flowPlayerCellX, this.flowPlayerCellY);
        this.flowPlayerCellX = flow.x;
        this.flowPlayerCellY = flow.y;
        this.profiler.end('FlowField');

        // --- Camera ---
        this.profiler.begin('Camera');
        if (activeVehicle) {
            this.camera.follow(activeVehicle);
        } else {
            this.camera.follow(this.player);
        }
        const scaledMouseX = this.input.mouse.x / this.scale;
        const scaledMouseY = this.input.mouse.y / this.scale;
        this.input.mouse.worldX = scaledMouseX + this.camera.x;
        this.input.mouse.worldY = scaledMouseY + this.camera.y;
        this.profiler.end('Camera');

        // --- Hand & Melee ---
        this.profiler.begin('HandSystem');
        this.handSystem.update(this.input.mouse.worldX, this.input.mouse.worldY);
        this.profiler.end('HandSystem');

        this.profiler.begin('Melee');
        this.meleeSystem.update();
        this.profiler.end('Melee');

        // --- Player ---
        this.profiler.begin('Player');
        this.playerSystem.updatePlayerAimAndAction();
        this.profiler.end('Player');

        // --- Combat ---
        this.profiler.begin('Combat');
        this.combatSystem.updateBullets();
        this.combatSystem.updateBlackHoles();
        this.combatSystem.updateBurnEffects();
        this.combatSystem.updateBleedEffects();
        this.combatSystem.updateFreezeEffects();
        this.combatSystem.updatePoisonEffects();
        this.combatSystem.updateAcidPuddles();
        this.combatSystem.updateForceEffects();
        this.combatSystem.updateNeedleEffects();
        this.combatSystem.updateBurst();
        this.combatSystem.updateEcho();
        this.profiler.end('Combat');

        // --- World Objects ---
        this.profiler.begin('Breakables');
        for (const obj of this.breakableObjects) {
            obj.update(this.player);
        }
        this.profiler.end('Breakables');

        this.profiler.begin('Particles');
        this.combatSystem.updateParticles();
        this.profiler.end('Particles');

        this.profiler.begin('EnemyUpdate');
        this.worldSystem.updateEnemies();
        this.worldSystem.updatePets();
        this.profiler.end('EnemyUpdate');

        this.profiler.begin('Portals');
        this.worldSystem.updatePortals();
        this.profiler.end('Portals');

        this.profiler.begin('DroppedItems');
        this.playerSystem.updateDroppedItems();
        this.profiler.end('DroppedItems');

        // --- Build ---
        this.profiler.begin('Build');
        this.buildSystem.update();
        this.profiler.end('Build');

        // --- UI ---
        this.profiler.begin('UI');
        this.uiManager.updateHotbar(this.inventorySystem);
        this.profiler.end('UI');
    }

    draw() {
        this.profiler.begin('Render');
        this.renderer.draw();
        this.profiler.end('Render');
    }

    start() {
        const loop = () => {
            this.profiler.beginFrame();
            this.update();
            this.draw();
            this.profiler.endFrame();
            requestAnimationFrame(loop);
        };
        loop();
    }
}
