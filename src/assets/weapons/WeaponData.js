// Weapon Definitions
// Defines grip types, hold points, and visual properties

export const WeaponType = {
    PISTOL: 'pistol', // One-handed
    RIFLE: 'rifle',   // Two-handed
    MELEE: 'melee'    // Melee weapon
};

export const WEAPONS = {
    default_rifle: {
        name: "Assault Rifle",
        type: WeaponType.RIFLE,
        sprite: "gun", 
        // Pivot at Rear Grip (Pixel 10, Row 9)
        // Sprite: Rear Grip @ x=10, Front Grip @ x=14. Dist=4.
        // User pointed to the two bottom protrusions (handles).
        drawOffset: { x: -10, y: -9 }, 
        // Adjusted Muzzle Offset:
        // New Sprite Width: 32.
        // Pivot: ~10 (Grip). Muzzle Tip: 32 (End of Flash Hider).
        // Distance: 32 - 10 = 22.
        // Y: Barrel is at y=7. Pivot at y=10. Offset Y = 7 - 10 = -3.
        muzzleOffset: { x: 22, y: -3 }, 
        scale: 1.5,
        
        hands: {
            right: { x: 0, y: 3 },   // Rear Grip (Pivot) - Lowered Y by 3px
            left: { x: 4, y: 3 }     // Front Grip (+4px) - Lowered Y by 3px
        },
        orbitRadius: 10, // Reduced radius to bring hands closer to body (was 16) // Increased radius for larger gun
        // Stats
        fireRate: 150, 
        damage: 10,
        bulletSpeed: 12,
        bulletLife: 60,
        bulletColor: '#f1c40f', // Yellow
        bulletSize: 5,
        // Ammo
        magazineSize: 30,
        maxReserve: 120,
        reloadTime: 2000 // 2 seconds
    },
    default_pistol: {
        name: "Pistol",
        type: WeaponType.PISTOL,
        sprite: "pistol", 
        drawOffset: { x: -5, y: -8 },
        muzzleOffset: { x: 8, y: -3 }, // Adjusted: Pivot 5, Tip ~11 -> Dist 6-8
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 } // Grip - Lowered Y by 3px
        },
        orbitRadius: 18,
        // Stats
        fireRate: 400, 
        damage: 25, 
        bulletSpeed: 10,
        bulletLife: 50,
        bulletColor: '#ecf0f1', // White
        bulletSize: 4,
        // Ammo
        magazineSize: 12,
        maxReserve: 60,
        reloadTime: 1500
    },
    rocket_launcher: {
        name: "RPG-7",
        type: WeaponType.RIFLE,
        sprite: "rocket_launcher",
        // Pivot at Rear Grip (x=14, y=11) roughly center of rear grip
        drawOffset: { x: -14, y: -11 },
        // Muzzle at tip (x=30, y=8) 
        muzzleOffset: { x: 30, y: -3 }, 
        shellEject: false, // No shell casing for RPG
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },     // Rear Grip (Trigger)
            left: { x: 8, y: 3 }       // Front Grip (Forward on the tube)
        },
        orbitRadius: 12,
        // Stats
        fireRate: 1500, // Slow
        damage: 30,     // Impact damage (plus AOE)
        bulletSpeed: 8, // Slow projectile
        bulletLife: 100,
        bulletType: 'rocket',
        blastRadius: 96, // Increased explosion radius (64x64 visual is roughly 2-3 tiles)
        knockback: 12,
        // Ammo
        magazineSize: 1,
        maxReserve: 10,
        reloadTime: 3000
    },
    hammer: {
        name: "Hammer",
        type: WeaponType.PISTOL,
        sprite: "hammer",
        // Pivot at Grip (x=7, y=13) - Lower part of handle
        drawOffset: { x: -7, y: -13 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 0 }
        },
        orbitRadius: 18,
        fireRate: 0,
        magazineSize: 0,
        maxReserve: 0
    },
    recovery_needle: {
        name: "Recovery Needle",
        type: WeaponType.PISTOL,
        sprite: "recovery_needle",
        drawOffset: { x: -5, y: -8 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 2 }
        },
        orbitRadius: 16,
        fireRate: 0,
        magazineSize: 0,
        maxReserve: 0,
        isUtility: true
    },
    medkit: {
        name: "Medkit",
        type: WeaponType.PISTOL,
        sprite: "medkit",
        drawOffset: { x: -5, y: -8 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 2 }
        },
        orbitRadius: 16,
        fireRate: 0,
        magazineSize: 0,
        maxReserve: 0,
        isUtility: true
    },
    hamburger: {
        name: "Hamburger",
        type: WeaponType.PISTOL,
        sprite: "hamburger",
        drawOffset: { x: -5, y: -8 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 2 }
        },
        orbitRadius: 16,
        fireRate: 0,
        magazineSize: 0,
        maxReserve: 0,
        isUtility: true
    },
    shotgun: {
        name: "Shotgun",
        type: WeaponType.RIFLE,
        sprite: "shotgun",
        drawOffset: { x: -10, y: -6 },
        muzzleOffset: { x: 18, y: -1 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 3 }
        },
        orbitRadius: 10,
        fireRate: 800,
        damage: 8,
        bulletSpeed: 10,
        bulletLife: 25,
        bulletColor: '#e74c3c',
        bulletSize: 3,
        pelletCount: 6,
        spread: 25,
        magazineSize: 6,
        maxReserve: 36,
        reloadTime: 2500,
        caliber: 'shotgun'
    },
    smg: {
        name: "SMG",
        type: WeaponType.PISTOL,
        sprite: "smg",
        drawOffset: { x: -6, y: -7 },
        muzzleOffset: { x: 10, y: -2 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 }
        },
        orbitRadius: 16,
        fireRate: 80,
        damage: 6,
        bulletSpeed: 11,
        bulletLife: 40,
        bulletColor: '#f39c12',
        bulletSize: 3,
        magazineSize: 40,
        maxReserve: 200,
        reloadTime: 1800,
        caliber: 'pistol'
    },
    sniper: {
        name: "Sniper Rifle",
        type: WeaponType.RIFLE,
        sprite: "sniper",
        // Pivot @ Rear Grip (10, 9)
        drawOffset: { x: -10, y: -9 },
        // Muzzle Brake center @ ~(30, 7). Offset = (30-10, 7-9) = (20, -2)
        muzzleOffset: { x: 20, y: -2 },
        // Laser Emitter @ (21, 7). Offset = (21-10, 7-9) = (11, -2)
        laserOffset: { x: 11, y: -2 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 8, y: 3 }
        },
        orbitRadius: 10,
        fireRate: 1200,
        damage: 80,
        bulletSpeed: 20,
        bulletLife: 120,
        bulletColor: '#3498db',
        bulletSize: 4,
        piercing: 1,
        laserSight: true,
        laserColor: 'rgba(255, 0, 0, 0.6)',
        magazineSize: 5,
        maxReserve: 25,
        reloadTime: 3000,
        caliber: 'rifle'
    },
    crossbow: {
        name: "Crossbow",
        type: WeaponType.RIFLE,
        sprite: "crossbow",
        fireSprite: "crossbow_fired",
        // Pivot @ Grip (8, 9). Canvas 24x16.
        drawOffset: { x: -8, y: -9 },
        // Bolt tip @ (23, 8). Offset = (23-8, 8-9) = (15, -1)
        muzzleOffset: { x: 15, y: -1 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 1 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 1000,
        damage: 45,
        bulletSpeed: 8,
        bulletLife: 80,
        bulletColor: '#95a5a6',
        bulletSize: 4,
        bulletType: 'bolt',
        magazineSize: 1,
        maxReserve: 20,
        reloadTime: 1500
    },
    grenade_launcher: {
        name: "Grenade Launcher",
        type: WeaponType.RIFLE,
        sprite: "grenade_launcher",
        // Pivot @ Grip (8, 8). Canvas 24x14.
        drawOffset: { x: -8, y: -8 },
        // Muzzle bore @ (23, 6). Offset = (23-8, 6-8) = (15, -2)
        muzzleOffset: { x: 15, y: -2 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 1000,
        damage: 20,
        bulletSpeed: 8, // Increased from 6
        bulletLife: 80,
        bulletType: 'grenade',
        blastRadius: 64,
        knockback: 8,
        // Fake 3D Parabola params
        initialZ: 12,
        vzInitial: 3,
        gravityZ: 0.15,
        magazineSize: 1,
        maxReserve: 15,
        reloadTime: 2000
    },
    laser_gun: {
        name: "Laser Gun",
        type: WeaponType.RIFLE,
        sprite: "laser_gun",
        // Pivot @ Grip (10, 6). Canvas 28x12.
        drawOffset: { x: -10, y: -6 },
        muzzleOffset: { x: 18, y: -1 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 600,
        damage: 15,
        bulletSpeed: 0,
        bulletLife: 0,
        bulletType: 'laser_beam',
        bulletColor: '#00e5ff',
        bulletSize: 0,
        laserMaxRange: 600,
        beamDuration: 10,
        magazineSize: 8,
        maxReserve: 40,
        reloadTime: 2500
    },
    flamethrower: {
        name: "Flamethrower",
        type: WeaponType.RIFLE,
        sprite: "flamethrower",
        // Pivot @ Grip (10, 7). Canvas 30x14.
        drawOffset: { x: -10, y: -7 },
        muzzleOffset: { x: 19, y: -2 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 7, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 50,
        damage: 3,
        bulletSpeed: 6,
        bulletLife: 30,
        bulletColor: '#f39c12',
        bulletSize: 8,
        bulletType: 'flame',
        spread: 25,
        burnDamage: 2,
        burnDuration: 180,
        burnTickInterval: 20,
        magazineSize: 100,
        maxReserve: 200,
        reloadTime: 3000
    },
    black_hole_gun: {
        name: "Black Hole Gun",
        type: WeaponType.RIFLE,
        sprite: "black_hole_gun",
        // Pivot @ Grip (7, 7). Canvas 26x14.
        drawOffset: { x: -7, y: -7 },
        muzzleOffset: { x: 18, y: -1 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 3000,
        damage: 5,
        bulletSpeed: 4,
        bulletLife: 100,
        bulletColor: '#9b59b6',
        bulletSize: 5,
        bulletType: 'black_hole_projectile',
        blackHoleDuration: 180,
        blackHoleRadius: 100,
        blackHoleDamageRadius: 40,
        blackHoleDamage: 5,
        blackHoleTickInterval: 15,
        blackHolePullForce: 2,
        magazineSize: 3,
        maxReserve: 9,
        reloadTime: 3500
    },
    teleport_gun: {
        name: "Teleport Gun",
        type: WeaponType.PISTOL,
        sprite: "teleport_gun",
        // Pivot @ Grip (6, 7). Canvas 22x14.
        drawOffset: { x: -6, y: -7 },
        muzzleOffset: { x: 15, y: -1 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 }
        },
        orbitRadius: 16,
        shellEject: false,
        fireRate: 1000,
        damage: 30,
        bulletSpeed: 10,
        bulletLife: 60,
        bulletColor: '#3498db',
        bulletSize: 4,
        bulletType: 'teleport',
        magazineSize: 3,
        maxReserve: 15,
        reloadTime: 2000
    },
    lightning_gun: {
        name: "Lightning Gun",
        type: WeaponType.RIFLE,
        sprite: "lightning_gun",
        drawOffset: { x: -10, y: -7 },
        muzzleOffset: { x: 18, y: -2 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 500,
        damage: 20,
        bulletSpeed: 14,
        bulletLife: 40,
        bulletColor: '#f1c40f',
        bulletSize: 4,
        bulletType: 'lightning',
        chainCount: 10,
        chainRange: 120,
        chainDamageMultiplier: 0.9,
        magazineSize: 15,
        maxReserve: 60,
        reloadTime: 2000
    },
    freeze_ray: {
        name: "Freeze Ray",
        type: WeaponType.RIFLE,
        sprite: "freeze_ray",
        drawOffset: { x: -10, y: -7 },
        muzzleOffset: { x: 18, y: -2 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 7, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 60,
        damage: 2,
        bulletSpeed: 8,
        bulletLife: 25,
        bulletColor: '#74b9ff',
        bulletSize: 6,
        bulletType: 'ice_shard',
        spread: 15,
        slowAmount: 0.5,
        slowDuration: 90,
        freezeThreshold: 5,
        freezeDuration: 120,
        frozenDamageMultiplier: 1.5,
        magazineSize: 80,
        maxReserve: 160,
        reloadTime: 2500
    },
    ricochet_gun: {
        name: "Ricochet Gun",
        type: WeaponType.PISTOL,
        sprite: "ricochet_gun",
        drawOffset: { x: -6, y: -7 },
        muzzleOffset: { x: 14, y: -2 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 }
        },
        orbitRadius: 16,
        fireRate: 350,
        damage: 18,
        bulletSpeed: 12,
        bulletLife: 80,
        bulletColor: '#2ecc71',
        bulletSize: 4,
        bulletType: 'ricochet',
        maxBounces: 3,
        magazineSize: 8,
        maxReserve: 40,
        reloadTime: 1500
    },
    katana: {
        name: "Katana",
        type: WeaponType.MELEE,
        sprite: "katana",
        drawOffset: { x: -5, y: -5 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 2 },
            left: { x: 3, y: 2 }
        },
        orbitRadius: 12,
        isMelee: true,
        // Melee stats
        fireRate: 400,
        damage: 12,
        meleeRange: 52,
        meleeArc: 120,
        knockback: 6,
        // Swing animation (frames at 60fps)
        windupFrames: 4,
        swingFrames: 8,
        recoveryFrames: 6,
        swingArcDegrees: 150,
        // No ammo
        magazineSize: 0,
        maxReserve: 0
    },
    dagger: {
        name: "Dagger",
        type: WeaponType.MELEE,
        sprite: "dagger",
        drawOffset: { x: -3, y: -4 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 2 }
        },
        orbitRadius: 14,
        isMelee: true,
        fireRate: 200,
        damage: 5,
        meleeRange: 32,
        meleeArc: 80,
        knockback: 2,
        windupFrames: 2,
        swingFrames: 4,
        recoveryFrames: 3,
        swingArcDegrees: 120,
        // Unique: critical hits
        criticalHitChance: 0.3,
        criticalMultiplier: 3,
        // VFX
        slashTrailColor: 'rgba(80, 200, 120, 0.6)',
        slashTrailWidth: 2,
        hitSparkColors: ['#2ecc71', '#27ae60', '#ffffff'],
        magazineSize: 0,
        maxReserve: 0
    },
    greatsword: {
        name: "Greatsword",
        type: WeaponType.MELEE,
        sprite: "greatsword",
        drawOffset: { x: -5, y: -6 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 2 },
            left: { x: 4, y: 2 }
        },
        orbitRadius: 12,
        isMelee: true,
        fireRate: 800,
        damage: 22,
        meleeRange: 68,
        meleeArc: 150,
        knockback: 12,
        windupFrames: 8,
        swingFrames: 12,
        recoveryFrames: 8,
        swingArcDegrees: 180,
        // Unique: cleave bonus on 3+ hits
        cleaveMultiplier: 0.5,
        cleaveThreshold: 3,
        // VFX
        slashTrailColor: 'rgba(230, 126, 34, 0.8)',
        slashTrailWidth: 6,
        hitSparkColors: ['#e67e22', '#f39c12', '#ffffff'],
        magazineSize: 0,
        maxReserve: 0
    },
    spear: {
        name: "Spear",
        type: WeaponType.MELEE,
        sprite: "spear",
        drawOffset: { x: -4, y: -3 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 2 },
            left: { x: 5, y: 2 }
        },
        orbitRadius: 10,
        isMelee: true,
        fireRate: 450,
        damage: 14,
        meleeRange: 80,
        meleeArc: 45,
        knockback: 3,
        thrustAttack: true,
        windupFrames: 3,
        swingFrames: 6,
        recoveryFrames: 5,
        swingArcDegrees: 60,
        // VFX
        slashTrailColor: 'rgba(236, 240, 241, 0.7)',
        slashTrailWidth: 3,
        hitSparkColors: ['#ecf0f1', '#bdc3c7', '#ffffff'],
        magazineSize: 0,
        maxReserve: 0
    },
    battle_axe: {
        name: "Battle Axe",
        type: WeaponType.MELEE,
        sprite: "battle_axe",
        // Pivot at Grip (x=8, y=16) - New 32x32 sprite, handle centered at y=16
        drawOffset: { x: -8, y: -16 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 2 },
            left: { x: 8, y: 2 }
        },
        orbitRadius: 12,
        isMelee: true,
        fireRate: 550,
        damage: 15,
        meleeRange: 55,
        meleeArc: 160,
        knockback: 9,
        windupFrames: 6,
        swingFrames: 10,
        recoveryFrames: 6,
        swingArcDegrees: 170,
        // Unique: bleed DOT
        bleedDamage: 3,
        bleedDuration: 180,
        bleedTickInterval: 20,
        // VFX
        slashTrailColor: 'rgba(192, 57, 43, 0.75)',
        slashTrailWidth: 5,
        hitSparkColors: ['#c0392b', '#922b21', '#e74c3c'],
        magazineSize: 0,
        maxReserve: 0
    },
    boomerang: {
        name: "Boomerang",
        type: WeaponType.PISTOL,
        sprite: "boomerang",
        drawOffset: { x: -10, y: -6 },
        muzzleOffset: { x: 10, y: 0 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 0 }
        },
        orbitRadius: 16,
        shellEject: false,
        fireRate: 800,
        damage: 25,
        bulletSpeed: 8,
        bulletLife: 150,
        bulletColor: '#8d6e63',
        bulletSize: 6,
        bulletType: 'boomerang',
        maxDistance: 200,
        returnAccel: 0.3,
        catchRadius: 16,
        magazineSize: 1,
        maxReserve: 10,
        reloadTime: 600
    },
    plasma_rifle: {
        name: "Plasma Rifle",
        type: WeaponType.RIFLE,
        sprite: "plasma_rifle",
        drawOffset: { x: -8, y: -10 },
        muzzleOffset: { x: 17, y: -4 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 500,
        damage: 15,
        bulletSpeed: 14,
        bulletLife: 50,
        bulletColor: '#00e676',
        bulletSize: 5,
        bulletType: 'plasma',
        burstCount: 3,
        burstInterval: 60,
        magazineSize: 21,
        maxReserve: 84,
        reloadTime: 2200
    },
    homing_launcher: {
        name: "Homing Launcher",
        type: WeaponType.RIFLE,
        sprite: "homing_launcher",
        drawOffset: { x: -8, y: -10 },
        muzzleOffset: { x: 19, y: -4 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 7, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 1200,
        damage: 35,
        bulletSpeed: 5,
        bulletLife: 180,
        bulletColor: '#e74c3c',
        bulletSize: 5,
        bulletType: 'homing',
        blastRadius: 48,
        knockback: 6,
        homingTurnRate: 0.06,
        homingAcquireRange: 300,
        magazineSize: 4,
        maxReserve: 16,
        reloadTime: 3000
    },
    acid_gun: {
        name: "Acid Gun",
        type: WeaponType.RIFLE,
        sprite: "acid_gun",
        drawOffset: { x: -7, y: -9 },
        muzzleOffset: { x: 16, y: -3 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 600,
        damage: 8,
        bulletSpeed: 9,
        bulletLife: 45,
        bulletColor: '#76ff03',
        bulletSize: 5,
        bulletType: 'acid',
        spread: 8,
        poisonDamage: 3,
        poisonDuration: 120,
        poisonTickInterval: 20,
        puddleRadius: 30,
        puddleDuration: 180,
        puddleDamage: 2,
        puddleTickInterval: 15,
        magazineSize: 20,
        maxReserve: 80,
        reloadTime: 2200
    },
    cluster_gun: {
        name: "Cluster Gun",
        type: WeaponType.RIFLE,
        sprite: "cluster_gun",
        drawOffset: { x: -7, y: -11 },
        muzzleOffset: { x: 16, y: -4 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 6, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 1000,
        damage: 10,
        bulletSpeed: 7,
        bulletLife: 60,
        bulletColor: '#ff9800',
        bulletSize: 6,
        bulletType: 'cluster',
        fragmentCount: 8,
        fragmentDamage: 6,
        fragmentSpeed: 8,
        fragmentLife: 20,
        fragmentSize: 3,
        magazineSize: 6,
        maxReserve: 24,
        reloadTime: 2500
    },
    force_gun: {
        name: "Force Gun",
        type: WeaponType.RIFLE,
        sprite: "force_gun",
        drawOffset: { x: -9, y: -10 },
        muzzleOffset: { x: 16, y: -4 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 7, y: 3 }
        },
        orbitRadius: 10,
        shellEject: false,
        fireRate: 700,
        damage: 5,
        bulletSpeed: 10,
        bulletLife: 15,
        bulletColor: '#42a5f5',
        bulletSize: 4,
        bulletType: 'force',
        pelletCount: 3,
        spread: 30,
        knockback: 18,
        wallSlamDamage: 15,
        magazineSize: 8,
        maxReserve: 40,
        reloadTime: 2000
    }
};
