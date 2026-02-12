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
import { FLAMETHROWER_SPRITE } from '../assets/weapons/FlamethrowerGenerator.js';
import { BLACK_HOLE_GUN_SPRITE } from '../assets/weapons/BlackHoleGunGenerator.js';
import { TELEPORT_GUN_SPRITE } from '../assets/weapons/TeleportGunGenerator.js';
import { LIGHTNING_GUN_SPRITE } from '../assets/weapons/LightningGunGenerator.js';
import { FREEZE_RAY_SPRITE } from '../assets/weapons/FreezeRayGenerator.js';
import { RICOCHET_GUN_SPRITE } from '../assets/weapons/RicochetGunGenerator.js';
import { DOG_IDLE_FRAMES } from '../assets/characters/pets/dog/DogIdle.js';
import { DOG_RUN_FRAMES } from '../assets/characters/pets/dog/DogRun.js';
import { BOOMERANG_SPRITE } from '../assets/weapons/BoomerangGenerator.js';
import { KATANA_SPRITE } from '../assets/weapons/KatanaGenerator.js';
import { DAGGER_SPRITE } from '../assets/weapons/DaggerGenerator.js';
import { GREATSWORD_SPRITE } from '../assets/weapons/GreatswordGenerator.js';
import { SPEAR_SPRITE } from '../assets/weapons/SpearGenerator.js';
import { BATTLE_AXE_SPRITE } from '../assets/weapons/BattleAxeGenerator.js';
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

import { createSuvSprite } from '../assets/vehicles/SuvSprite.js';
import { createTruckSprite } from '../assets/vehicles/TruckSprite.js';
import { createPoliceCarSprite } from '../assets/vehicles/PoliceCarSprite.js';

// Pre-generate procedural objects
const suvSprites = createSuvSprite();
const truckSprites = createTruckSprite();
const policeSprites = createPoliceCarSprite();
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
    dog: {
        idle: DOG_IDLE_FRAMES,
        run: DOG_RUN_FRAMES
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
        bookshelf_flash: PixelDraw.createSilhouette(bookshelfSprite),
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
    gun: RIFLE_SPRITE,
    hammer: hammerSprite,
    recovery_needle: recoveryNeedleSprite,
    hamburger: hamburgerSprite,
    medkit: medkitSprite,
    rocket_launcher: ROCKET_LAUNCHER_SPRITE,
    pistol: PISTOL_SPRITE,
    smg: SMG_SPRITE,
    shotgun: SHOTGUN_SPRITE,
    sniper: SNIPER_SPRITE,
    crossbow: CROSSBOW_SPRITE,
    crossbow_fired: CROSSBOW_FIRED_SPRITE,
    grenade_launcher: GRENADE_LAUNCHER_SPRITE,
    laser_gun: LASER_GUN_SPRITE,
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
        police: policeSprites
    }
};
