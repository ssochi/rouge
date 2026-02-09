import { spriteGenerator } from '../graphics/SpriteGenerator.js';
import { PALETTE } from '../assets/Palette.js';
import { PLAYER_IDLE_FRAMES } from '../assets/characters/player/PlayerIdle.js';
import { PLAYER_RUN_FRAMES } from '../assets/characters/player/PlayerRun.js';
import { PLAYER_ROLL_FRAMES } from '../assets/characters/player/PlayerRoll.js';
import { HAND_TEMPLATE } from '../assets/characters/HandSprite.js';
import { ENEMY_TEMPLATE } from '../assets/characters/EnemySprite.js';
import { ZOMBIE_IDLE_FRAMES } from '../assets/characters/enemies/zombie/ZombieIdle.js';
import { ZOMBIE_RUN_FRAMES } from '../assets/characters/enemies/zombie/ZombieRun.js';
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
import { createAdaptiveWallSprites } from '../assets/objects/AdaptiveWallSprite.js';
import { createDoorSprites } from '../assets/objects/DoorSprite.js';
import { createCarpetSprites } from '../assets/objects/CarpetSprite.js';
import { createFloorSprites } from '../assets/floors/FloorSprites.js';
import { createTreeSprite } from '../assets/objects/nature/TreeSprite.js';
import { createTreeSmallSprite } from '../assets/objects/nature/TreeSmallSprite.js';
import { createBushSprite } from '../assets/objects/nature/BushSprite.js';
import { createGrassTuftSprite } from '../assets/objects/nature/GrassTuftSprite.js';
import { PixelDraw } from '../utils/PixelDraw.js';
import { SMG_SPRITE } from '../assets/weapons/SmgGenerator.js';
import { SHOTGUN_SPRITE } from '../assets/weapons/ShotgunGenerator.js';
import { SNIPER_SPRITE } from '../assets/weapons/SniperGenerator.js';
import { CROSSBOW_SPRITE, CROSSBOW_FIRED_SPRITE } from '../assets/weapons/CrossbowGenerator.js';
import { GRENADE_LAUNCHER_SPRITE } from '../assets/weapons/GrenadeLauncherGenerator.js';
import { ROCKET_PROJECTILE_TEMPLATE } from '../assets/weapons/RocketProjectileSprite.js';
import { EXPLOSION_FRAMES } from '../assets/fx/ExplosionSprite.js';
import { HUNTER_IDLE } from '../assets/characters/enemies/hunter/HunterIdle.js';
import { HUNTER_RUN } from '../assets/characters/enemies/hunter/HunterRun.js';
import { HUNTER_AVATAR } from '../assets/characters/enemies/hunter/HunterSprite.js';
import { ZOMBIE_FEMALE_IDLE_FRAMES } from '../assets/characters/enemies/zombie_female/ZombieFemaleIdle.js';
import { ZOMBIE_FEMALE_RUN_FRAMES } from '../assets/characters/enemies/zombie_female/ZombieFemaleRun.js';
import { ZOMBIE_BRUTE_IDLE_FRAMES } from '../assets/characters/enemies/zombie_brute/ZombieBruteIdle.js';
import { ZOMBIE_BRUTE_RUN_FRAMES } from '../assets/characters/enemies/zombie_brute/ZombieBruteRun.js';

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
const wallAdaptiveSprites = createAdaptiveWallSprites();
const doorSprites = createDoorSprites();
const carpetSprites = createCarpetSprites();
const floorSprites = createFloorSprites();
const treeSprite = createTreeSprite();
const treeSmallSprite = createTreeSmallSprite();
const bushSprite = createBushSprite();
const grassTuftSprite = createGrassTuftSprite();

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
        run: ZOMBIE_RUN_FRAMES
    },
    zombieFemale: {
        idle: ZOMBIE_FEMALE_IDLE_FRAMES,
        run: ZOMBIE_FEMALE_RUN_FRAMES
    },
    zombieBrute: {
        idle: ZOMBIE_BRUTE_IDLE_FRAMES,
        run: ZOMBIE_BRUTE_RUN_FRAMES
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
        tree: treeSprite,
        tree_flash: PixelDraw.createSilhouette(treeSprite),
        tree_small: treeSmallSprite,
        tree_small_flash: PixelDraw.createSilhouette(treeSmallSprite),
        bush: bushSprite,
        bush_flash: PixelDraw.createSilhouette(bushSprite),
        grass_tuft: grassTuftSprite,
        grass_tuft_flash: PixelDraw.createSilhouette(grassTuftSprite)
    },
    floors: floorSprites,
    // Floor tile icons for inventory (first variant of each type)
    floor_grass: floorSprites.grass[0],
    floor_wood: floorSprites.wood[0],
    floor_concrete: floorSprites.concrete[0],
    floor_dirt: floorSprites.dirt[0],
    gun: RIFLE_SPRITE,
    hammer: hammerSprite,
    rocket_launcher: ROCKET_LAUNCHER_SPRITE,
    pistol: PISTOL_SPRITE,
    smg: SMG_SPRITE,
    shotgun: SHOTGUN_SPRITE,
    sniper: SNIPER_SPRITE,
    crossbow: CROSSBOW_SPRITE,
    crossbow_fired: CROSSBOW_FIRED_SPRITE,
    grenade_launcher: GRENADE_LAUNCHER_SPRITE,
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
