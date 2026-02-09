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
    }
};
