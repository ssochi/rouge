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
import { LightSystem } from './lighting/LightSystem.js';
import { getMapProfile } from './maps/MapProfiles.js';
import { DungeonRunState } from './dungeon/DungeonRunState.js';
import { RelicSystem } from './dungeon/RelicSystem.js';
import { MobileControls, isMobileMode } from '../ui/MobileControls.js';
import { SoundSystem } from './audio/SoundSystem.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 移动端检测：真实触摸设备或 ?mobile=1。移动模式用更小缩放以扩大视野。
        this.isMobile = isMobileMode();

        // Fullscreen and Scaling
        // Increased from 1.5 to 2.5 (approx 1.5x larger) for better visibility
        this.scale = this.isMobile ? 2 : 2.5;
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

        const initialProfile = getMapProfile('hub');
        const NAV_GRID_SIZE = initialProfile.navGridSize || 8;
        this.navGrid = new NavigationGrid(
            Math.ceil((initialProfile.tileWidth * TILE_SIZE) / NAV_GRID_SIZE),
            Math.ceil((initialProfile.tileHeight * TILE_SIZE) / NAV_GRID_SIZE),
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
            blocksLight: true,
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
            if (this.player.state === 'roll' || this.player.state === 'driving') return;
            // 遗物减伤/护罩抵挡（石肤护符、能量护罩）：返回实际扣血量
            const dealt = this.relicSystem ? this.relicSystem.mitigateDamage(amount) : amount;
            this.player.hp -= dealt;
            if (this.relicSystem) this.relicSystem.onPlayerHit();
            if (knockback) {
                this.player.knockbackX = knockback.x;
                this.player.knockbackY = knockback.y;
            }
            this.camera.x += (Math.random() - 0.5) * 5;
            this.camera.y += (Math.random() - 0.5) * 5;
            this.soundSystem?.play('player_hurt'); // [audio-p1] 受击音（玩家中心，无需定位）
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

        // [audio-p1] 音频系统：懒创建 + 手势解锁；下方统一注入需要它的子系统。
        this.soundSystem = new SoundSystem({ player: this.player });

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

        // 单局地牢运行状态（金币/钥匙/圣物/楼层/种子）。
        // 传给 WorldSystem（loadMap 进出地牢钩子 + 生成种子）与 UIManager（HUD 显示，Task 9 接线）。
        this.dungeonRunState = new DungeonRunState();
        this.uiManager.dungeonRunState = this.dungeonRunState;

        // 遗物系统：以 runState.relicIds 为事实源；三挂载点分别注入 CombatSystem（弹道）、
        // PlayerSystem（移速，经 worldSystem 引用）、WorldSystem（磁吸/击杀事件/清算）。
        this.relicSystem = new RelicSystem({ runState: this.dungeonRunState, player: this.player });
        this.combatSystem.relicSystem = this.relicSystem;
        // 弹道命中钩子（血牙冠冕暴击回血）需 BulletSystem 直接持有遗物系统引用
        this.combatSystem.bulletSystem.relicSystem = this.relicSystem;
        this.uiManager.relicSystem = this.relicSystem;
        // 受击冲击波：击退玩家周围敌人 + 冲击环粒子
        this.relicSystem.setShockwaveHandler((conf) => {
            for (const e of this.enemies) {
                const dx = e.x - this.player.x;
                const dy = e.y - this.player.y;
                const d = Math.hypot(dx, dy);
                if (d < conf.radius && d > 0.001) {
                    e.knockbackX = (e.knockbackX || 0) + (dx / d) * conf.knockback;
                    e.knockbackY = (e.knockbackY || 0) + (dy / d) * conf.knockback;
                }
            }
            for (let i = 0; i < 16; i++) {
                const a = (Math.PI * 2 * i) / 16;
                this.particles.push({
                    x: this.player.x + Math.cos(a) * 8,
                    y: this.player.y + Math.sin(a) * 8,
                    vx: Math.cos(a) * 4,
                    vy: Math.sin(a) * 4,
                    life: 18,
                    color: '#74b9ff',
                    size: 3,
                    friction: 0.9
                });
            }
        });
        // 击杀爆炸（爆裂火药）
        this.relicSystem.setKillExplosionHandler((x, y, conf) => {
            this.combatSystem.spawnExplosion(x, y, conf.damage, conf.radius, 4);
        });
        // 拾取 toast
        this.relicSystem.setPickupHandler((relic) => {
            this.uiManager.showRelicToast(relic);
        });
        // 能量护罩：抵挡瞬间的青色护罩闪光环
        this.relicSystem.setBarrierBlockHandler(() => {
            for (let i = 0; i < 14; i++) {
                const a = (Math.PI * 2 * i) / 14;
                this.particles.push({
                    x: this.player.x + Math.cos(a) * 10,
                    y: this.player.y + Math.sin(a) * 10,
                    vx: Math.cos(a) * 2.5,
                    vy: Math.sin(a) * 2.5,
                    life: 16,
                    color: '#74d0f0',
                    size: 3,
                    friction: 0.88
                });
            }
        });
        // 荆棘胸甲：受击时向 8 方向发射玩家阵营荆棘小刺弹
        this.relicSystem.setThornBurstHandler((conf) => {
            for (let i = 0; i < conf.count; i++) {
                const a = (Math.PI * 2 * i) / conf.count;
                this.bullets.push({
                    x: this.player.x,
                    y: this.player.y,
                    vx: Math.cos(a) * conf.speed,
                    vy: Math.sin(a) * conf.speed,
                    life: conf.life,
                    maxLife: conf.life,
                    damage: conf.damage,
                    color: conf.color,
                    size: conf.size,
                    type: 'standard',
                    source: 'player',
                    owner: null,
                    team: null,
                    hitList: []
                });
            }
        });

        // [depth-batch:relics] P9 机制型遗物副作用接线
        // 金币护盾：在玩家脚下散落金币（可捡回）
        this.relicSystem.setCoinDropHandler((amount) => {
            this.worldSystem.spawnCoinBurst(this.player.x, this.player.y, amount);
        });
        // 磁暴线圈：对最近敌人放电（伤害 + 链状电弧视觉）
        this.relicSystem.setTeslaHandler((conf) => {
            let nearest = null;
            let bestD = conf.range * conf.range;
            for (const e of this.enemies) {
                if (!e || e.hp <= 0) continue;
                const dx = e.x - this.player.x;
                const dy = e.y - this.player.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < bestD) { bestD = d2; nearest = e; }
            }
            if (!nearest) return;
            if (nearest.takeDamage) nearest.takeDamage(conf.damage, { x: 0, y: 0 });
            else nearest.hp -= conf.damage;
            this.particles.push({
                type: 'lightning_arc',
                x1: this.player.x, y1: this.player.y - 8,
                x2: nearest.x, y2: nearest.y,
                life: 12, maxLife: 12, color: '#74d0f0'
            });
        });
        // 收割回响：从尸体迸发亡魂弹，射向附近敌人（不足则径向散射）
        this.relicSystem.setSoulBurstHandler((x, y, conf) => {
            const targets = [];
            for (const e of this.enemies) {
                if (!e || e.hp <= 0) continue;
                const dx = e.x - x, dy = e.y - y;
                const d2 = dx * dx + dy * dy;
                if (d2 <= conf.range * conf.range) targets.push({ tx: e.x, ty: e.y, d2 });
            }
            targets.sort((a, b) => a.d2 - b.d2);
            for (let i = 0; i < conf.boltCount; i++) {
                let vx, vy;
                if (i < targets.length) {
                    const a = Math.atan2(targets[i].ty - y, targets[i].tx - x);
                    vx = Math.cos(a) * conf.speed;
                    vy = Math.sin(a) * conf.speed;
                } else {
                    const a = (Math.PI * 2 * i) / conf.boltCount;
                    vx = Math.cos(a) * conf.speed;
                    vy = Math.sin(a) * conf.speed;
                }
                this.bullets.push({
                    x, y, vx, vy,
                    life: conf.life, maxLife: conf.life,
                    damage: conf.damage, color: '#a29bfe', size: 4,
                    type: 'standard', source: 'player', owner: null, team: null, hitList: []
                });
            }
        });
        // 弹壳回收：返还当前弹匣 1 发（非满、有弹匣时）
        this.relicSystem.setAmmoRefundHandler((amount = 1) => {
            const st = this.handSystem && this.handSystem.currentWeaponState;
            if (!st || !Number.isFinite(st.currentAmmo) || !Number.isFinite(st.maxAmmo)) return;
            if (st.maxAmmo <= 0) return;
            st.currentAmmo = Math.min(st.maxAmmo, st.currentAmmo + amount);
        });
        // 保险柜：复活瞬间金色护环
        this.relicSystem.setReviveHandler(() => {
            for (let i = 0; i < 20; i++) {
                const a = (Math.PI * 2 * i) / 20;
                this.particles.push({
                    x: this.player.x + Math.cos(a) * 10,
                    y: this.player.y + Math.sin(a) * 10,
                    vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5,
                    life: 30, color: '#f1c40f', size: 4, friction: 0.9
                });
            }
        });
        // 血肉契约 / 命运骰子 / 深渊之契：toast 提示（复用遗物 toast）
        this.relicSystem.setBloodPactHandler((hpCost) => {
            this.uiManager.showRelicToast({ id: 'blood_pact', name: '血肉契约', desc: `以 ${hpCost} 点生命完成交易` });
        });
        this.relicSystem.setFateHandler((label) => {
            this.uiManager.showRelicToast({ id: 'fate_dice', name: '命运骰子', desc: `本房增益：${label}` });
        });
        this.relicSystem.setSacrificeHandler((victim) => {
            this.uiManager.showRelicToast({ id: 'abyss_pact', name: '深渊之契', desc: `献祭了「${victim.name}」` });
        });

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
            pets: this.pets,
            dungeonRunState: this.dungeonRunState
        });
        this.worldSystem.relicSystem = this.relicSystem;
        this.worldSystem.onWorldProfileChanged = ({ worldPixelWidth, worldPixelHeight }) => {
            this.camera.setWorldBounds(worldPixelWidth, worldPixelHeight);
        };

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
            costumeSystem: null, // 构造顺序在 CostumeSystem 之前，下方回填
            onInteract: (obj) => {
                if (obj.type === 'computer_desk') {
                    this.isComputerOpen = true;
                    this.pixelOS.open();
                }
            }
        });

        this.profiler = new ProfilerSystem();
        this.costumeSystem = new CostumeSystem();
        this.playerSystem.costumeSystem = this.costumeSystem;
        this.iPressed = false;
        this.lightSystem = new LightSystem({
            player: this.player,
            handSystem: this.handSystem,
            enemies: this.enemies,
            vehicles: this.vehicles,
            bullets: this.bullets,
            particles: this.particles,
            breakableObjects: this.breakableObjects,
            worldSystem: this.worldSystem,
            costumeSystem: this.costumeSystem,
            blackHoles: this.blackHoles,
            acidPuddles: this.acidPuddles,
            quality: 'high'
        });

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
            costumeSystem: this.costumeSystem,
            lightSystem: this.lightSystem
        });
        // [depth-batch:relics] 环绕护刃需在世界空间绘制旋转刀刃
        this.renderer.relicSystem = this.relicSystem;

        // [audio-p1] 音频依赖注入：各子系统在事件点单行调用 soundSystem。
        // 实体（Chest/SlotMachine/Portal/DungeonPickup/机关/gate）经 worldSystem.soundSystem 访问。
        this.combatSystem.soundSystem = this.soundSystem;
        this.combatSystem.bulletSystem.soundSystem = this.soundSystem;
        this.combatSystem.statusEffects.soundSystem = this.soundSystem;
        this.handSystem.soundSystem = this.soundSystem;
        this.worldSystem.soundSystem = this.soundSystem;
        this.playerSystem.soundSystem = this.soundSystem;
        this.meleeSystem.soundSystem = this.soundSystem;
        this.uiManager.soundSystem = this.soundSystem;

        // Initial Inventory
        this.inventorySystem.add('weapon:pistol', 1);
        this.inventorySystem.selectHotbarSlot(0);

        // Bind Inventory Click
        this.uiManager.onInventorySlotClick = (index, isRight, isShift) => {
            if (this.isInventoryOpen) {
                this.uiManager.handleInventoryClick(index, this.inventorySystem, isRight, isShift);
            }
        };
        
        // 服装自动穿戴提示（名称+属性）
        this.playerSystem.onCostumeEquipped = (name, statsDesc) => {
            this.uiManager.showCostumeToast(name, statsDesc);
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

        this.isMenuOpen = false;
        this.mPressed = false;

        this.testPanel = new TestPanel({
            inventorySystem: this.inventorySystem,
            worldSystem: this.worldSystem,
            player: this.player,
            costumeSystem: this.costumeSystem
        });
        this.lPressed = false;

        // Shortcut Menu Items
        this.uiManager.setShortcutMenuItems([
            { key: 'B', label: '背包', desc: '打开/关闭背包', action: () => {
                this.isInventoryOpen = true;
                this.uiManager.toggleInventory(true);
                this.uiManager.updateInventory(this.inventorySystem);
            }},
            { key: 'R', label: '换弹', desc: '重新装填弹药', action: () => {
                this.handSystem.startReload();
            }},
            { key: 'O', label: '召唤载具', desc: '在附近生成载具', action: () => {
                this.worldSystem.spawnVehicleNearPlayer();
            }},
            { key: 'I', label: '性能面板', desc: '显示/隐藏性能监控', action: () => {
                this.profiler.visible = !this.profiler.visible;
            }},
            { key: 'L', label: '调试面板', desc: '显示/隐藏测试面板', action: () => {
                this.testPanel.toggle();
            }},
            { key: 'P', label: '碰撞显示', desc: '切换碰撞框显示', action: () => {
                this.renderer.debugMode = (this.renderer.debugMode + 1) % 4;
            }},
            { key: '?', label: '按键说明', desc: '查看所有快捷键', action: 'showKeybinds' },
        ]);
        this.uiManager.onCloseShortcutMenu = () => {
            this.isMenuOpen = false;
            this.uiManager.toggleShortcutMenu(false);
        };

        // 调试直达参数：?map=dungeon&seed=42&gates=1（截图自查/复现布局用）
        const debugParams = new URLSearchParams(window.location.search);
        const debugMap = debugParams.get('map');
        const debugSeed = parseInt(debugParams.get('seed'), 10);
        if (Number.isFinite(debugSeed)) {
            this.worldSystem.debugDungeonSeed = debugSeed;
        }
        if (debugParams.get('gates') === '1') {
            this.worldSystem.debugActivateGates = true;
        }
        const debugRoom = parseInt(debugParams.get('room'), 10);
        if (Number.isFinite(debugRoom)) {
            this.worldSystem.debugSpawnRoomIndex = debugRoom;
        }
        if (debugParams.get('peace') === '1') {
            this.worldSystem.debugPeaceMode = true; // 房间不激活不出怪（布景审视用）
        }
        this.worldSystem.loadMap(debugMap || 'hub'); // Start in Hub
        this.playerSystem.updateEquippedItem();
        
        const cell = this.navGrid.getCell(this.player.x, this.player.y);
        this.flowPlayerCellX = cell.x;
        this.flowPlayerCellY = cell.y;

        // 移动端触摸操作层（双摇杆 + 动作按钮 + 竖屏遮罩 + 触屏 UI 桥）。
        // 仅移动模式实例化，桌面路径零改动零开销。
        this.mobileControls = this.isMobile
            ? new MobileControls({
                input: this.input,
                player: this.player,
                camera: this.camera,
                canvas: this.canvas
            })
            : null;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
        
        if (this.camera) {
            this.camera.width = this.canvas.width / this.scale;
            this.camera.height = this.canvas.height / this.scale;
            this.camera.setWorldBounds(
                this.worldSystem?.getWorldPixelWidth?.() || (MAP_WIDTH * TILE_SIZE),
                this.worldSystem?.getWorldPixelHeight?.() || (MAP_HEIGHT * TILE_SIZE)
            );
        }
    }

    _isWorldRectNearCamera(x, y, width, height, pad = 0) {
        const left = this.camera.x - pad;
        const top = this.camera.y - pad;
        const right = this.camera.x + this.camera.width + pad;
        const bottom = this.camera.y + this.camera.height + pad;
        return (
            x < right &&
            x + width > left &&
            y < bottom &&
            y + height > top
        );
    }

    _isBreakableNearCamera(obj, pad = 0) {
        if (!obj || obj.isBroken) return false;
        const drawOffsetX = obj.drawOffset?.x || 0;
        const drawOffsetY = obj.drawOffset?.y || 0;
        const minX = obj.x + Math.min(0, drawOffsetX);
        const minY = obj.y + Math.min(0, drawOffsetY);
        const width = (obj.width || TILE_SIZE) + Math.abs(drawOffsetX);
        const height = (obj.height || TILE_SIZE) + Math.abs(drawOffsetY);
        return this._isWorldRectNearCamera(minX, minY, width, height, pad);
    }

    // [depth-batch:relics] 环绕护刃：按 relicSystem 提供的旋转角计算刀刃世界坐标，
    // 对触碰到的敌人结算伤害（同一敌人 0.5s 内不重复，冷却由 relicSystem 记账）。
    _updateOrbitBlade() {
        if (!this.relicSystem || !this.relicSystem.has('orbit_blade')) return;
        const conf = this.relicSystem.orbitBladeConfig();
        const angle = this.relicSystem.orbitBladeAngle();
        const bx = this.player.x + Math.cos(angle) * conf.radius;
        const by = this.player.y + Math.sin(angle) * conf.radius;
        for (const e of this.enemies) {
            if (!e || e.hp <= 0) continue;
            const reach = (e.width ? e.width / 2 : 12) + 6;
            const dx = e.x - bx;
            const dy = e.y - by;
            if (dx * dx + dy * dy > reach * reach) continue;
            if (!this.relicSystem.orbitBladeCanHit(e)) continue;
            const a = Math.atan2(e.y - this.player.y, e.x - this.player.x);
            const kb = 3;
            if (e.takeDamage) e.takeDamage(conf.damage, { x: Math.cos(a) * kb, y: Math.sin(a) * kb });
            else e.hp -= conf.damage;
        }
    }

    update() {
        if (this.player.hp <= 0) {
            // [depth-batch:relics] 保险柜：每局一次死亡时半血复活并保留金币
            if (!(this.relicSystem && this.relicSystem.tryRevive())) {
                this.uiManager.showGameOver();
                return;
            }
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

        // Toggle Shortcut Menu
        if (this.input.keys.m && !this.mPressed) {
            this.mPressed = true;
            this.isMenuOpen = !this.isMenuOpen;
            this.uiManager.toggleShortcutMenu(this.isMenuOpen);
        } else if (!this.input.keys.m) {
            this.mPressed = false;
        }

        // [audio-p1] Toggle Mute（N 键）
        if (this.input.keys.n && !this.nPressed) {
            this.nPressed = true;
            const muted = this.soundSystem.toggleMute();
            this.uiManager.log?.(muted ? '🔇 静音' : '🔊 音效开');
        } else if (!this.input.keys.n) {
            this.nPressed = false;
        }

        // Toggle 全屏大地图（Tab）：仅地牢内有意义；不暂停游戏，玩家仍可移动 [depth-batch:minimap]
        if (this.input.keys.tab && !this.tabPressed) {
            this.tabPressed = true;
            if (this.worldSystem.dungeonManager) {
                this.input.bigMapOpen = !this.input.bigMapOpen;
            }
        } else if (!this.input.keys.tab) {
            this.tabPressed = false;
        }

        if (this.isComputerOpen || this.isInventoryOpen || this.testPanel.isOpen || this.isMenuOpen) {
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
        // 移动端：摇杆覆写移动向量/自动瞄准最近敌人/开火，须在相机换算之后、瞄准消费之前。
        // this.enemies 与 worldSystem.enemies 同引用（就地 push/splice），恒为当前存活敌人数组。
        if (this.mobileControls) this.mobileControls.update(this.player, this.enemies);
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
            if (!this._isBreakableNearCamera(obj, 192)) continue;
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

        this.profiler.begin('Dungeon');
        this.worldSystem.updateDungeon();
        this.relicSystem.tick();
        this._updateOrbitBlade(); // [depth-batch:relics] 环绕护刃碰撞结算
        this.profiler.end('Dungeon');

        // --- Lighting ---
        this.profiler.begin('LightingUpdate');
        this.lightSystem.update({
            camera: this.camera,
            viewportWidth: this.canvas.width / this.scale,
            viewportHeight: this.canvas.height / this.scale,
            now: performance.now()
        });
        this.profiler.end('LightingUpdate');

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
