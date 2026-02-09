// Weapon Definitions
// Defines grip types, hold points, and visual properties

export const WeaponType = {
    PISTOL: 'pistol', // One-handed
    RIFLE: 'rifle'    // Two-handed
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
        drawOffset: { x: -12, y: -6 },
        muzzleOffset: { x: 28, y: -1 },
        // Laser Origin Offset relative to Pivot
        // Pivot @ 10,9. Laser Emitter @ 21,7 (from SniperGenerator)
        // Offset X = 21 - 10 = 11
        // Offset Y = 7 - 9 = -2
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
        drawOffset: { x: -8, y: -8 },
        muzzleOffset: { x: 12, y: 0 },
        scale: 1.5,
        hands: {
            right: { x: 0, y: 3 },
            left: { x: 5, y: 1 }
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
        drawOffset: { x: -10, y: -7 },
        muzzleOffset: { x: 16, y: -1 },
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
    }
};
