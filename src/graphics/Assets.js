import { spriteGenerator } from '../graphics/SpriteGenerator.js';
import { PALETTE } from '../assets/Palette.js';
import { PLAYER_IDLE_FRAMES } from '../assets/characters/player/PlayerIdle.js';
import { PLAYER_RUN_FRAMES } from '../assets/characters/player/PlayerRun.js';
import { PLAYER_ROLL_FRAMES } from '../assets/characters/player/PlayerRoll.js';
import { HAND_TEMPLATE } from '../assets/characters/HandSprite.js';
import { ENEMY_TEMPLATE } from '../assets/characters/EnemySprite.js';
import { ZOMBIE_IDLE_FRAMES } from '../assets/characters/enemies/zombie/ZombieIdle.js';
import { ZOMBIE_RUN_FRAMES } from '../assets/characters/enemies/zombie/ZombieRun.js';
import { ZOMBIE_ATTACK_FRAMES } from '../assets/characters/enemies/zombie/ZombieAttack.js';
import { RIFLE_SPRITE } from '../assets/weapons/RifleGenerator.js';
import { PISTOL_SPRITE } from '../assets/weapons/PistolGenerator.js';
import { ROCKET_LAUNCHER_SPRITE } from '../assets/weapons/RocketLauncherGenerator.js';
import { MUZZLE_FLASH_TEMPLATE } from '../assets/weapons/MuzzleFlashSprite.js';
import { AVATAR_SPRITE } from '../assets/characters/player/AvatarSprite.js';
import { PlayerGenerator } from '../assets/characters/player/PlayerGenerator.js';
import { createBoxSprite } from '../assets/objects/BoxSprite.js';
import { createBarrelSprite } from '../assets/objects/BarrelSprite.js';
import { createVaseSprite } from '../assets/objects/VaseSprite.js';
import { createExplosiveBarrelSprite } from '../assets/objects/ExplosiveBarrelSprite.js';
import { createHorizontalWallSprite, createVerticalWallSprite } from '../assets/objects/WallSprite.js';
import { createBedSprite, createBedHorizontalSprite } from '../assets/objects/BedSprite.js';
import { createNightstandSprite } from '../assets/objects/furniture/NightstandSprite.js';
import { createWardrobeSprite } from '../assets/objects/furniture/WardrobeSprite.js';
import { createTableSprite } from '../assets/objects/furniture/TableSprite.js';
import { createSofaSprite } from '../assets/objects/furniture/SofaSprite.js';
import { createBookshelfSprite } from '../assets/objects/furniture/BookshelfSprite.js';
import { createTVStandAnimatedSprite } from '../assets/objects/furniture/TVStandSprite.js';
import { createToiletSprite } from '../assets/objects/furniture/ToiletSprite.js';
import { createBathtubSprite } from '../assets/objects/furniture/BathtubSprite.js';
import { createSinkSprite } from '../assets/objects/furniture/SinkSprite.js';
import { createArmchairSprite } from '../assets/objects/furniture/ArmchairSprite.js';
import { createFloorLampSprite } from '../assets/objects/furniture/FloorLampSprite.js';
import { createPottedPlantSprite } from '../assets/objects/furniture/PottedPlantSprite.js';
import { createCabinetSprite } from '../assets/objects/furniture/CabinetSprite.js';
import { createFridgeSprite } from '../assets/objects/furniture/FridgeSprite.js';
import { createStoveSprite } from '../assets/objects/furniture/StoveSprite.js';
import { createKitchenCounterSprite } from '../assets/objects/furniture/KitchenCounterSprite.js';
import { createKitchenSinkSprite } from '../assets/objects/furniture/KitchenSinkSprite.js';
import { createDeskSprite } from '../assets/objects/furniture/DeskSprite.js';
import { createChairSprite } from '../assets/objects/furniture/ChairSprite.js';
import { createDresserSprite } from '../assets/objects/furniture/DresserSprite.js';
import { createWashingMachineSprite } from '../assets/objects/furniture/WashingMachineSprite.js';
import { createGrandfatherClockSprite } from '../assets/objects/furniture/GrandfatherClockSprite.js';
import { createPianoSprite } from '../assets/objects/furniture/PianoSprite.js';
import { createWineRackSprite } from '../assets/objects/furniture/WineRackSprite.js';
import { createCoatRackSprite } from '../assets/objects/furniture/CoatRackSprite.js';
import { createFishTankSprite } from '../assets/objects/furniture/FishTankSprite.js';
import { createWorkbenchSprite } from '../assets/objects/furniture/WorkbenchSprite.js';
import { createComputerDeskSprite } from '../assets/objects/furniture/ComputerDeskSprite.js';
import { createDungeonRubbleSprite } from '../assets/objects/dungeon/DungeonRubbleSprite.js';
import { createDungeonIronCageSprite } from '../assets/objects/dungeon/DungeonIronCageSprite.js';
import { createDungeonBonePileSprite } from '../assets/objects/dungeon/DungeonBonePileSprite.js';
import { createCoinSprite, createKeySprite } from '../assets/dungeon/PickupSprites.js';
import { createChestSprite, CHEST_TIER_NAMES } from '../assets/dungeon/ChestSprites.js';
import { createAdaptiveWallSprites } from '../assets/objects/AdaptiveWallSprite.js';
import { createDoorSprites } from '../assets/objects/DoorSprite.js';
import { createCarpetSprites } from '../assets/objects/CarpetSprite.js';
import { createFloorSprites } from '../assets/floors/FloorSprites.js';
import { createTreeSprite } from '../assets/objects/nature/TreeSprite.js';
import { createTreeSmallSprite } from '../assets/objects/nature/TreeSmallSprite.js';
import { createBushSprites } from '../assets/objects/nature/BushSprite.js';
import { createGrassTuftSprites } from '../assets/objects/nature/GrassTuftSprite.js';
import { createRecoveryNeedleSprite } from '../assets/items/RecoveryNeedleSprite.js';
import { createHamburgerSprite } from '../assets/items/HamburgerSprite.js';
import { createMedkitSprite } from '../assets/items/MedkitSprite.js';
import { PixelDraw } from '../utils/PixelDraw.js';
import { SMG_SPRITE } from '../assets/weapons/SmgGenerator.js';
import { SHOTGUN_SPRITE } from '../assets/weapons/ShotgunGenerator.js';
import { SNIPER_SPRITE } from '../assets/weapons/SniperGenerator.js';
import { CROSSBOW_SPRITE, CROSSBOW_FIRED_SPRITE } from '../assets/weapons/CrossbowGenerator.js';
import { GRENADE_LAUNCHER_SPRITE } from '../assets/weapons/GrenadeLauncherGenerator.js';
import { LASER_GUN_SPRITE } from '../assets/weapons/LaserGunGenerator.js';
import { LASER_RIFLE_SPRITE } from '../assets/weapons/LaserRifleGenerator.js';
import { LASER_SHOTGUN_SPRITE } from '../assets/weapons/LaserShotgunGenerator.js';
import { FLAMETHROWER_SPRITE } from '../assets/weapons/FlamethrowerGenerator.js';
import { BLACK_HOLE_GUN_SPRITE } from '../assets/weapons/BlackHoleGunGenerator.js';
import { TELEPORT_GUN_SPRITE } from '../assets/weapons/TeleportGunGenerator.js';
import { LIGHTNING_GUN_SPRITE } from '../assets/weapons/LightningGunGenerator.js';
import { FREEZE_RAY_SPRITE } from '../assets/weapons/FreezeRayGenerator.js';
import { RICOCHET_GUN_SPRITE } from '../assets/weapons/RicochetGunGenerator.js';
import { DOG_IDLE_FRAMES } from '../assets/characters/pets/dog/DogIdle.js';
import { DOG_RUN_FRAMES } from '../assets/characters/pets/dog/DogRun.js';
import { CAT_IDLE_FRAMES } from '../assets/characters/pets/cat/CatIdle.js';
import { CAT_RUN_FRAMES } from '../assets/characters/pets/cat/CatRun.js';
import { createPetDogItemSprite } from '../assets/items/PetDogItemSprite.js';
import { createPetCatItemSprite } from '../assets/items/PetCatItemSprite.js';
import { NIER2B_IDLE_FRAMES } from '../assets/characters/pets/nier2b/Nier2bIdle.js';
import { NIER2B_RUN_FRAMES } from '../assets/characters/pets/nier2b/Nier2bRun.js';
import { createPet2BItemSprite } from '../assets/items/Pet2BItemSprite.js';
import { BOOMERANG_SPRITE } from '../assets/weapons/BoomerangGenerator.js';
import { KATANA_SPRITE } from '../assets/weapons/KatanaGenerator.js';
import { DAGGER_SPRITE } from '../assets/weapons/DaggerGenerator.js';
import { GREATSWORD_SPRITE } from '../assets/weapons/GreatswordGenerator.js';
import { SPEAR_SPRITE } from '../assets/weapons/SpearGenerator.js';
import { BATTLE_AXE_SPRITE } from '../assets/weapons/BattleAxeGenerator.js';
import { PLASMA_RIFLE_SPRITE } from '../assets/weapons/PlasmaRifleGenerator.js';
import { HOMING_LAUNCHER_SPRITE } from '../assets/weapons/HomingLauncherGenerator.js';
import { ACID_GUN_SPRITE } from '../assets/weapons/AcidGunGenerator.js';
import { CLUSTER_GUN_SPRITE } from '../assets/weapons/ClusterGunGenerator.js';
import { FORCE_GUN_SPRITE } from '../assets/weapons/ForceGunGenerator.js';
import { VAMPYRE_GUN_SPRITE } from '../assets/weapons/VampyreGunGenerator.js';
import { NEEDLE_GUN_SPRITE } from '../assets/weapons/NeedleGunGenerator.js';
import { RAILGUN_SPRITE } from '../assets/weapons/RailgunGenerator.js';
import { generateTurretDeployer } from '../assets/weapons/TurretDeployerGenerator.js';
import { GALE_SHOTGUN_SPRITE } from '../assets/weapons/GaleShotgunGenerator.js';
import { VENOM_SPRAYER_SPRITE } from '../assets/weapons/VenomSprayerGenerator.js';
import { STORM_REVOLVER_SPRITE } from '../assets/weapons/StormRevolverGenerator.js';
import { METEOR_CANNON_SPRITE } from '../assets/weapons/MeteorCannonGenerator.js';
import { PHANTOM_PISTOL_SPRITE } from '../assets/weapons/PhantomPistolGenerator.js';
import { createTurretSprite } from '../assets/objects/TurretSprite.js';
import {
    generateHairLongIcon, generateMessyHairIcon, generateShortHairIcon,
    generateBeretIcon, generateBandanaIcon,
    generateCoatIcon, generateHoodieIcon, generateVestIcon,
    generateSunglassesIcon, generateRoundGlassesIcon, generateGogglesIcon,
    generateNoGlassesIcon,
    generateBeardFullIcon,
    generateSantaHatIcon, generateSantaSuitIcon, generateSantaBeardIcon,
    generateClownHatIcon, generateClownSuitIcon, generateClownHairIcon,
    generateCyberHairIcon, generateCyberJacketIcon, generateCyberVisorIcon,
    generateKnightHelmetIcon, generateKnightArmorIcon,
    generateNinjaHoodIcon, generateNinjaSuitIcon,
    generatePirateHatIcon, generatePirateCoatIcon, generateEyepatchIcon
} from '../assets/characters/player/costumes/CostumeIcons.js';
import { ROCKET_PROJECTILE_TEMPLATE } from '../assets/weapons/RocketProjectileSprite.js';
import { EXPLOSION_FRAMES } from '../assets/fx/ExplosionSprite.js';
import { HUNTER_IDLE } from '../assets/characters/enemies/hunter/HunterIdle.js';
import { HUNTER_RUN } from '../assets/characters/enemies/hunter/HunterRun.js';
import { HUNTER_AVATAR } from '../assets/characters/enemies/hunter/HunterSprite.js';
import { ZOMBIE_FEMALE_IDLE_FRAMES } from '../assets/characters/enemies/zombie_female/ZombieFemaleIdle.js';
import { ZOMBIE_FEMALE_RUN_FRAMES } from '../assets/characters/enemies/zombie_female/ZombieFemaleRun.js';
import { ZOMBIE_FEMALE_ATTACK_FRAMES } from '../assets/characters/enemies/zombie_female/ZombieFemaleAttack.js';
import { ZOMBIE_BRUTE_IDLE_FRAMES } from '../assets/characters/enemies/zombie_brute/ZombieBruteIdle.js';
import { SOLDIER_IDLE_FRAMES } from '../assets/characters/enemies/soldier/SoldierIdle.js';
import { SOLDIER_RUN_FRAMES } from '../assets/characters/enemies/soldier/SoldierRun.js';
import { ZOMBIE_BRUTE_RUN_FRAMES } from '../assets/characters/enemies/zombie_brute/ZombieBruteRun.js';
import { ZOMBIE_BRUTE_ATTACK_FRAMES } from '../assets/characters/enemies/zombie_brute/ZombieBruteAttack.js';
import { MECHA_GOLEM_IDLE_PHASE1, MECHA_GOLEM_IDLE_PHASE2 } from '../assets/characters/enemies/mecha_golem/MechaGolemIdle.js';
import { MECHA_GOLEM_RUN_PHASE1, MECHA_GOLEM_RUN_PHASE2 } from '../assets/characters/enemies/mecha_golem/MechaGolemRun.js';
import {
    MECHA_GOLEM_GATLING_PHASE1, MECHA_GOLEM_RING_PHASE1, MECHA_GOLEM_AIMED_PHASE1, MECHA_GOLEM_ROCKET_PHASE1,
    MECHA_GOLEM_GATLING_PHASE2, MECHA_GOLEM_RING_PHASE2, MECHA_GOLEM_AIMED_PHASE2, MECHA_GOLEM_ROCKET_PHASE2,
    MECHA_GOLEM_SPIRAL_PHASE2, MECHA_GOLEM_CROSS_PHASE2, MECHA_GOLEM_DESPERATION_PHASE2,
    MECHA_GOLEM_TRANSITION_PHASE2
} from '../assets/characters/enemies/mecha_golem/MechaGolemAttack.js';
import { SNAKE_BOSS_HEAD_IDLE_PHASE1, SNAKE_BOSS_HEAD_IDLE_PHASE2 } from '../assets/characters/enemies/snake_boss/SnakeBossHeadIdle.js';
import { SNAKE_BOSS_HEAD_RUN_PHASE1, SNAKE_BOSS_HEAD_RUN_PHASE2 } from '../assets/characters/enemies/snake_boss/SnakeBossHeadRun.js';
import { SNAKE_BOSS_HEAD_ATTACK_PHASE1, SNAKE_BOSS_HEAD_ATTACK_PHASE2 } from '../assets/characters/enemies/snake_boss/SnakeBossHeadAttack.js';
import { SNAKE_BOSS_BODY_PHASE1, SNAKE_BOSS_BODY_PHASE2, SNAKE_BOSS_TAIL_PHASE1, SNAKE_BOSS_TAIL_PHASE2 } from '../assets/characters/enemies/snake_boss/SnakeSegmentSprite.js';
import { MUTANT_BEAST_IDLE_PHASE1, MUTANT_BEAST_IDLE_PHASE2, MUTANT_BEAST_IDLE_PHASE3 } from '../assets/characters/enemies/mutant_beast/MutantBeastIdle.js';
import { MUTANT_BEAST_RUN_PHASE1, MUTANT_BEAST_RUN_PHASE2, MUTANT_BEAST_RUN_PHASE3 } from '../assets/characters/enemies/mutant_beast/MutantBeastRun.js';
import {
    MUTANT_BEAST_SMASH_PHASE1, MUTANT_BEAST_SWEEP_PHASE1, MUTANT_BEAST_STOMP_PHASE1, MUTANT_BEAST_ROAR_PHASE1,
    MUTANT_BEAST_SMASH_PHASE2, MUTANT_BEAST_SWEEP_PHASE2, MUTANT_BEAST_STOMP_PHASE2,
    MUTANT_BEAST_CHARGE_PHASE2, MUTANT_BEAST_LEAP_PHASE2, MUTANT_BEAST_ROAR_PHASE2,
    MUTANT_BEAST_SMASH_PHASE3, MUTANT_BEAST_SWEEP_PHASE3, MUTANT_BEAST_STOMP_PHASE3,
    MUTANT_BEAST_CHARGE_PHASE3, MUTANT_BEAST_LEAP_PHASE3, MUTANT_BEAST_ROAR_PHASE3
} from '../assets/characters/enemies/mutant_beast/MutantBeastAttack.js';

import { createSuvSprite } from '../assets/vehicles/SuvSprite.js';
import { createTruckSprite } from '../assets/vehicles/TruckSprite.js';
import { createPoliceCarSprite } from '../assets/vehicles/PoliceCarSprite.js';
import { createTankSprite } from '../assets/vehicles/TankSprite.js';
import { createSpiderSprite } from '../assets/vehicles/SpiderSprite.js';

// Pre-generate procedural objects
const suvSprites = createSuvSprite();
const truckSprites = createTruckSprite();
const policeSprites = createPoliceCarSprite();
const tankSprites = createTankSprite();
const spiderSprites = createSpiderSprite();
const boxSprite = createBoxSprite();
const barrelSprite = createBarrelSprite();
const vaseSprite = createVaseSprite();
const explosiveBarrelSprite = createExplosiveBarrelSprite();
const wallHorizontalSprite = createHorizontalWallSprite();
const wallVerticalSprite = createVerticalWallSprite();
const bedSprite = createBedSprite();
const bedHorizontalSprite = createBedHorizontalSprite();
const nightstandSprite = createNightstandSprite();
const wardrobeSprite = createWardrobeSprite();
const tableSprite = createTableSprite();
const sofaSprite = createSofaSprite();
const bookshelfSprite = createBookshelfSprite();
const tvStandSprite = createTVStandAnimatedSprite();
const toiletSprite = createToiletSprite();
const bathtubSprite = createBathtubSprite();
const sinkSprite = createSinkSprite();
const armchairSprite = createArmchairSprite();
const floorLampSprite = createFloorLampSprite();
const pottedPlantSprite = createPottedPlantSprite();
const cabinetSprite = createCabinetSprite();
const fridgeSprite = createFridgeSprite();
const stoveSprite = createStoveSprite();
const kitchenCounterSprite = createKitchenCounterSprite();
const kitchenSinkSprite = createKitchenSinkSprite();
const deskSprite = createDeskSprite();
const chairSprite = createChairSprite();
const dresserSprite = createDresserSprite();
const washingMachineSprite = createWashingMachineSprite();
const grandfatherClockSprite = createGrandfatherClockSprite();
const pianoSprite = createPianoSprite();
const wineRackSprite = createWineRackSprite();
const coatRackSprite = createCoatRackSprite();
const fishTankSprite = createFishTankSprite();
const workbenchSprite = createWorkbenchSprite();
const computerDeskSprite = createComputerDeskSprite();
const dungeonRubbleSprite = createDungeonRubbleSprite();
const dungeonIronCageSprite = createDungeonIronCageSprite();
const dungeonBonePileSprite = createDungeonBonePileSprite();
const dungeonCoinFrames = createCoinSprite();
const dungeonKeySprite = createKeySprite();
const dungeonChestSprites = Object.fromEntries(
    CHEST_TIER_NAMES.map(tier => [tier, {
        closed: createChestSprite(tier, false),
        open: createChestSprite(tier, true),
    }])
);
const wallAdaptiveSprites = createAdaptiveWallSprites();
const doorSprites = createDoorSprites();
const carpetSprites = createCarpetSprites();
const floorSprites = createFloorSprites();
const treeSprite = createTreeSprite();
const treeSmallSprite = createTreeSmallSprite();
const bushSprites = createBushSprites();
const grassTuftSprites = createGrassTuftSprites();
const recoveryNeedleSprite = createRecoveryNeedleSprite();
const hamburgerSprite = createHamburgerSprite();
const medkitSprite = createMedkitSprite();
const petDogItemSprite = createPetDogItemSprite();
const petCatItemSprite = createPetCatItemSprite();
const pet2BItemSprite = createPet2BItemSprite();

const hammerSprite = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    // Handle
    ctx.fillStyle = '#d35400';
    ctx.fillRect(7, 6, 2, 10);
    // Head
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(4, 3, 8, 4);
    // Shine
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(5, 3, 2, 1);
    return canvas;
})();

// Generate Assets
export const Assets = {
    player: {
        // Use the new procedural High Standard Idle Animation
        idle: PLAYER_IDLE_FRAMES,
        // Use the new procedural Run Animation
        run: PLAYER_RUN_FRAMES, 
        // Temporary: Use static frame for Roll until refactored
        roll: [PLAYER_IDLE_FRAMES[0]]
    },
    avatar: AVATAR_SPRITE,
    hand: spriteGenerator.generate(HAND_TEMPLATE, PALETTE),
    enemy: spriteGenerator.generate(ENEMY_TEMPLATE, PALETTE),
    zombie: {
        idle: ZOMBIE_IDLE_FRAMES,
        run: ZOMBIE_RUN_FRAMES,
        attack: ZOMBIE_ATTACK_FRAMES
    },
    zombieFemale: {
        idle: ZOMBIE_FEMALE_IDLE_FRAMES,
        run: ZOMBIE_FEMALE_RUN_FRAMES,
        attack: ZOMBIE_FEMALE_ATTACK_FRAMES
    },
    zombieBrute: {
        idle: ZOMBIE_BRUTE_IDLE_FRAMES,
        run: ZOMBIE_BRUTE_RUN_FRAMES,
        attack: ZOMBIE_BRUTE_ATTACK_FRAMES
    },
    soldier: {
        idle: SOLDIER_IDLE_FRAMES,
        run: SOLDIER_RUN_FRAMES
    },
    mutantBeast: {
        phase1: {
            idle: MUTANT_BEAST_IDLE_PHASE1,
            run: MUTANT_BEAST_RUN_PHASE1,
            smash: MUTANT_BEAST_SMASH_PHASE1,
            sweep: MUTANT_BEAST_SWEEP_PHASE1,
            stomp: MUTANT_BEAST_STOMP_PHASE1,
            roar: MUTANT_BEAST_ROAR_PHASE1
        },
        phase2: {
            idle: MUTANT_BEAST_IDLE_PHASE2,
            run: MUTANT_BEAST_RUN_PHASE2,
            smash: MUTANT_BEAST_SMASH_PHASE2,
            sweep: MUTANT_BEAST_SWEEP_PHASE2,
            stomp: MUTANT_BEAST_STOMP_PHASE2,
            charge: MUTANT_BEAST_CHARGE_PHASE2,
            leap_slam: MUTANT_BEAST_LEAP_PHASE2,
            roar: MUTANT_BEAST_ROAR_PHASE2
        },
        phase3: {
            idle: MUTANT_BEAST_IDLE_PHASE3,
            run: MUTANT_BEAST_RUN_PHASE3,
            smash: MUTANT_BEAST_SMASH_PHASE3,
            sweep: MUTANT_BEAST_SWEEP_PHASE3,
            stomp: MUTANT_BEAST_STOMP_PHASE3,
            charge: MUTANT_BEAST_CHARGE_PHASE3,
            leap_slam: MUTANT_BEAST_LEAP_PHASE3,
            roar: MUTANT_BEAST_ROAR_PHASE3
        }
    },
    mechaGolem: {
        phase1: {
            idle: MECHA_GOLEM_IDLE_PHASE1,
            run: MECHA_GOLEM_RUN_PHASE1,
            gatling_sweep: MECHA_GOLEM_GATLING_PHASE1,
            ring_burst: MECHA_GOLEM_RING_PHASE1,
            aimed_triple: MECHA_GOLEM_AIMED_PHASE1,
            rocket_salvo: MECHA_GOLEM_ROCKET_PHASE1
        },
        phase2: {
            idle: MECHA_GOLEM_IDLE_PHASE2,
            run: MECHA_GOLEM_RUN_PHASE2,
            gatling_sweep: MECHA_GOLEM_GATLING_PHASE2,
            ring_burst: MECHA_GOLEM_RING_PHASE2,
            aimed_triple: MECHA_GOLEM_AIMED_PHASE2,
            rocket_salvo: MECHA_GOLEM_ROCKET_PHASE2,
            spiral_storm: MECHA_GOLEM_SPIRAL_PHASE2,
            cross_fire: MECHA_GOLEM_CROSS_PHASE2,
            desperation: MECHA_GOLEM_DESPERATION_PHASE2,
            transition: MECHA_GOLEM_TRANSITION_PHASE2
        }
    },
    snakeBoss: {
        phase1: {
            head: {
                idle: SNAKE_BOSS_HEAD_IDLE_PHASE1,
                run: SNAKE_BOSS_HEAD_RUN_PHASE1,
                attack: SNAKE_BOSS_HEAD_ATTACK_PHASE1
            },
            body: SNAKE_BOSS_BODY_PHASE1,
            tail: SNAKE_BOSS_TAIL_PHASE1
        },
        phase2: {
            head: {
                idle: SNAKE_BOSS_HEAD_IDLE_PHASE2,
                run: SNAKE_BOSS_HEAD_RUN_PHASE2,
                attack: SNAKE_BOSS_HEAD_ATTACK_PHASE2
            },
            body: SNAKE_BOSS_BODY_PHASE2,
            tail: SNAKE_BOSS_TAIL_PHASE2
        }
    },
    dog: {
        idle: DOG_IDLE_FRAMES,
        run: DOG_RUN_FRAMES
    },
    cat: {
        idle: CAT_IDLE_FRAMES,
        run: CAT_RUN_FRAMES
    },
    nier2b: {
        idle: NIER2B_IDLE_FRAMES,
        run: NIER2B_RUN_FRAMES
    },
    objects: {
        box: boxSprite,
        box_flash: PixelDraw.createSilhouette(boxSprite),
        barrel: barrelSprite,
        barrel_flash: PixelDraw.createSilhouette(barrelSprite),
        vase: vaseSprite,
        vase_flash: PixelDraw.createSilhouette(vaseSprite),
        explosive_barrel: explosiveBarrelSprite,
        explosive_barrel_flash: PixelDraw.createSilhouette(explosiveBarrelSprite),
        wall: wallAdaptiveSprites,
        wall_flash: wallAdaptiveSprites.map(s => PixelDraw.createSilhouette(s)),
        wall_h: wallHorizontalSprite,
        wall_h_flash: PixelDraw.createSilhouette(wallHorizontalSprite),
        wall_v: wallVerticalSprite,
        wall_v_flash: PixelDraw.createSilhouette(wallVerticalSprite),
        door_h_frame: doorSprites.door_h_frame,
        door_h_panel: doorSprites.door_h_panel,
        door_v_frame: doorSprites.door_v_frame,
        door_v_panel: doorSprites.door_v_panel,
        // Carpets
        carpet_rug_large: carpetSprites.rug_large,
        carpet_rug_round: carpetSprites.rug_round,
        carpet_doormat: carpetSprites.doormat,
        carpet_tutorial_r: carpetSprites.tutorial_r,
        carpet_tutorial_b: carpetSprites.tutorial_b,
        carpet_tutorial_e: carpetSprites.tutorial_e,
        // Furniture
        bed: bedSprite,
        bed_flash: PixelDraw.createSilhouette(bedSprite),
        bed_h: bedHorizontalSprite,
        bed_h_flash: PixelDraw.createSilhouette(bedHorizontalSprite),
        nightstand: nightstandSprite,
        nightstand_flash: PixelDraw.createSilhouette(nightstandSprite),
        wardrobe: wardrobeSprite,
        wardrobe_flash: PixelDraw.createSilhouette(wardrobeSprite),
        table: tableSprite,
        table_flash: PixelDraw.createSilhouette(tableSprite),
        sofa: sofaSprite,
        sofa_flash: PixelDraw.createSilhouette(sofaSprite),
        bookshelf: bookshelfSprite,
        bookshelf_flash: Array.isArray(bookshelfSprite)
            ? bookshelfSprite.map(s => PixelDraw.createSilhouette(s))
            : PixelDraw.createSilhouette(bookshelfSprite),
        tv_stand: tvStandSprite,
        tv_stand_flash: Array.isArray(tvStandSprite)
            ? tvStandSprite.map(s => PixelDraw.createSilhouette(s))
            : PixelDraw.createSilhouette(tvStandSprite),
        // Bathroom furniture
        toilet: toiletSprite,
        toilet_flash: PixelDraw.createSilhouette(toiletSprite),
        bathtub: bathtubSprite,
        bathtub_flash: PixelDraw.createSilhouette(bathtubSprite),
        sink: sinkSprite,
        sink_flash: PixelDraw.createSilhouette(sinkSprite),
        armchair: armchairSprite,
        armchair_flash: PixelDraw.createSilhouette(armchairSprite),
        floor_lamp: floorLampSprite,
        floor_lamp_flash: PixelDraw.createSilhouette(floorLampSprite),
        floor_lamp_warm: floorLampSprite,
        floor_lamp_warm_flash: PixelDraw.createSilhouette(floorLampSprite),
        floor_lamp_cool: floorLampSprite,
        floor_lamp_cool_flash: PixelDraw.createSilhouette(floorLampSprite),
        floor_lamp_mint: floorLampSprite,
        floor_lamp_mint_flash: PixelDraw.createSilhouette(floorLampSprite),
        floor_lamp_rose: floorLampSprite,
        floor_lamp_rose_flash: PixelDraw.createSilhouette(floorLampSprite),
        potted_plant: pottedPlantSprite,
        potted_plant_flash: PixelDraw.createSilhouette(pottedPlantSprite),
        cabinet: cabinetSprite,
        cabinet_flash: PixelDraw.createSilhouette(cabinetSprite),
        // Kitchen furniture
        fridge: fridgeSprite,
        fridge_flash: PixelDraw.createSilhouette(fridgeSprite),
        stove: stoveSprite,
        stove_flash: PixelDraw.createSilhouette(stoveSprite),
        kitchen_counter: kitchenCounterSprite,
        kitchen_counter_flash: PixelDraw.createSilhouette(kitchenCounterSprite),
        kitchen_sink: kitchenSinkSprite,
        kitchen_sink_flash: PixelDraw.createSilhouette(kitchenSinkSprite),
        // New furniture
        desk: deskSprite,
        desk_flash: PixelDraw.createSilhouette(deskSprite),
        chair: chairSprite,
        chair_flash: PixelDraw.createSilhouette(chairSprite),
        dresser: dresserSprite,
        dresser_flash: PixelDraw.createSilhouette(dresserSprite),
        washing_machine: washingMachineSprite,
        washing_machine_flash: PixelDraw.createSilhouette(washingMachineSprite),
        grandfather_clock: grandfatherClockSprite,
        grandfather_clock_flash: PixelDraw.createSilhouette(grandfatherClockSprite),
        piano: pianoSprite,
        piano_flash: PixelDraw.createSilhouette(pianoSprite),
        wine_rack: wineRackSprite,
        wine_rack_flash: PixelDraw.createSilhouette(wineRackSprite),
        coat_rack: coatRackSprite,
        coat_rack_flash: PixelDraw.createSilhouette(coatRackSprite),
        fish_tank: fishTankSprite,
        fish_tank_flash: Array.isArray(fishTankSprite)
            ? fishTankSprite.map(s => PixelDraw.createSilhouette(s))
            : PixelDraw.createSilhouette(fishTankSprite),
        workbench: workbenchSprite,
        workbench_flash: PixelDraw.createSilhouette(workbenchSprite),
        computer_desk: computerDeskSprite,
        computer_desk_flash: PixelDraw.createSilhouette(computerDeskSprite),
        dungeon_rubble: dungeonRubbleSprite,
        dungeon_rubble_flash: PixelDraw.createSilhouette(dungeonRubbleSprite),
        dungeon_iron_cage: dungeonIronCageSprite,
        dungeon_iron_cage_flash: PixelDraw.createSilhouette(dungeonIronCageSprite),
        dungeon_bone_pile: dungeonBonePileSprite,
        dungeon_bone_pile_flash: PixelDraw.createSilhouette(dungeonBonePileSprite),
        tree: treeSprite,
        tree_flash: PixelDraw.createSilhouette(treeSprite),
        tree_small: treeSmallSprite,
        tree_small_flash: PixelDraw.createSilhouette(treeSmallSprite),
        // Bushes
        bush: bushSprites.bush,
        bush_flash: PixelDraw.createSilhouette(bushSprites.bush),
        bush_spiky: bushSprites.bush_spiky,
        bush_spiky_flash: PixelDraw.createSilhouette(bushSprites.bush_spiky),
        bush_berry: bushSprites.bush_berry,
        bush_berry_flash: PixelDraw.createSilhouette(bushSprites.bush_berry),
        // Grass
        grass_tuft: grassTuftSprites.grass_tuft,
        grass_tuft_flash: PixelDraw.createSilhouette(grassTuftSprites.grass_tuft),
        grass_tall: grassTuftSprites.grass_tall,
        grass_tall_flash: PixelDraw.createSilhouette(grassTuftSprites.grass_tall),
        grass_flower: grassTuftSprites.grass_flower,
        grass_flower_flash: PixelDraw.createSilhouette(grassTuftSprites.grass_flower)
    },
    floors: floorSprites,
    // Floor tile icons for inventory (first variant of each type)
    floor_grass: floorSprites.grass[0],
    floor_wood: floorSprites.wood[0],
    floor_concrete: floorSprites.concrete[0],
    floor_dirt: floorSprites.dirt[0],
    floor_stone: floorSprites.stone[0],
    gun: RIFLE_SPRITE,
    hammer: hammerSprite,
    recovery_needle: recoveryNeedleSprite,
    hamburger: hamburgerSprite,
    medkit: medkitSprite,
    pet_dog_item: petDogItemSprite,
    pet_cat_item: petCatItemSprite,
    pet_2b_item: pet2BItemSprite,
    rocket_launcher: ROCKET_LAUNCHER_SPRITE,
    pistol: PISTOL_SPRITE,
    smg: SMG_SPRITE,
    shotgun: SHOTGUN_SPRITE,
    sniper: SNIPER_SPRITE,
    crossbow: CROSSBOW_SPRITE,
    crossbow_fired: CROSSBOW_FIRED_SPRITE,
    grenade_launcher: GRENADE_LAUNCHER_SPRITE,
    laser_gun: LASER_GUN_SPRITE,
    laser_rifle: LASER_RIFLE_SPRITE,
    laser_shotgun: LASER_SHOTGUN_SPRITE,
    flamethrower: FLAMETHROWER_SPRITE,
    black_hole_gun: BLACK_HOLE_GUN_SPRITE,
    teleport_gun: TELEPORT_GUN_SPRITE,
    lightning_gun: LIGHTNING_GUN_SPRITE,
    freeze_ray: FREEZE_RAY_SPRITE,
    ricochet_gun: RICOCHET_GUN_SPRITE,
    boomerang: BOOMERANG_SPRITE,
    katana: KATANA_SPRITE,
    dagger: DAGGER_SPRITE,
    greatsword: GREATSWORD_SPRITE,
    spear: SPEAR_SPRITE,
    battle_axe: BATTLE_AXE_SPRITE,
    plasma_rifle: PLASMA_RIFLE_SPRITE,
    homing_launcher: HOMING_LAUNCHER_SPRITE,
    acid_gun: ACID_GUN_SPRITE,
    cluster_gun: CLUSTER_GUN_SPRITE,
    force_gun: FORCE_GUN_SPRITE,
    vampyre_gun: VAMPYRE_GUN_SPRITE,
    needle_gun: NEEDLE_GUN_SPRITE,
    railgun: RAILGUN_SPRITE,
    turret_deployer: generateTurretDeployer(),
    gale_shotgun: GALE_SHOTGUN_SPRITE,
    venom_sprayer: VENOM_SPRAYER_SPRITE,
    storm_revolver: STORM_REVOLVER_SPRITE,
    meteor_cannon: METEOR_CANNON_SPRITE,
    phantom_pistol: PHANTOM_PISTOL_SPRITE,

    // Dungeon pickups (P1-4)
    dungeonCoin: dungeonCoinFrames, // 两帧微闪金币
    dungeonKey: dungeonKeySprite,   // 古铜色钥匙
    dungeonChests: dungeonChestSprites, // 四档宝箱 {tier: {closed, open}}

    // Costume Icons
    costume_hair_long: generateHairLongIcon(),
    costume_hair_messy: generateMessyHairIcon(),
    costume_hair_short: generateShortHairIcon(),
    costume_hat_beret: generateBeretIcon(),
    costume_hat_bandana: generateBandanaIcon(),
    costume_clothes_coat: generateCoatIcon(),
    costume_clothes_hoodie: generateHoodieIcon(),
    costume_clothes_vest: generateVestIcon(),
    costume_glasses_sun: generateSunglassesIcon(),
    costume_glasses_round: generateRoundGlassesIcon(),
    costume_glasses_goggles: generateGogglesIcon(),
    costume_glasses_none: generateNoGlassesIcon(),
    costume_beard_full: generateBeardFullIcon(),
    costume_hat_santa: generateSantaHatIcon(),
    costume_clothes_santa: generateSantaSuitIcon(),
    costume_beard_santa: generateSantaBeardIcon(),
    costume_hat_clown: generateClownHatIcon(),
    costume_clothes_clown: generateClownSuitIcon(),
    costume_hair_clown: generateClownHairIcon(),
    costume_hair_cyber: generateCyberHairIcon(),
    costume_clothes_cyber: generateCyberJacketIcon(),
    costume_glasses_cyber: generateCyberVisorIcon(),
    costume_hat_knight: generateKnightHelmetIcon(),
    costume_clothes_knight: generateKnightArmorIcon(),
    costume_hat_ninja: generateNinjaHoodIcon(),
    costume_clothes_ninja: generateNinjaSuitIcon(),
    costume_hat_pirate: generatePirateHatIcon(),
    costume_clothes_pirate: generatePirateCoatIcon(),
    costume_glasses_eyepatch: generateEyepatchIcon(),
    rocket_projectile: spriteGenerator.generate(ROCKET_PROJECTILE_TEMPLATE, PALETTE),
    muzzleFlash: spriteGenerator.generate(MUZZLE_FLASH_TEMPLATE, PALETTE),
    explosion: EXPLOSION_FRAMES.map(t => spriteGenerator.generate(t, PALETTE)),
    // Hunter
    hunter: {
        idle: HUNTER_IDLE,
        run: HUNTER_RUN,
        avatar: HUNTER_AVATAR
    },
    vehicle: {
        suv: suvSprites,
        truck: truckSprites,
        police: policeSprites,
        tank: tankSprites,
        spider: spiderSprites
    },
    turret: createTurretSprite()
};
