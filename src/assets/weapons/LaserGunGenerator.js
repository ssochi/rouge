import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Laser Gun Generator (Sci-Fi Energy Rifle)
 * Dimensions: 28x12
 */
export function generateLaserGun() {
    const width = 28;
    const height = 12;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#37474f';        // Main body
    const cBodyLight = '#546e7a';   // Body highlight
    const cDark = '#263238';        // Dark accents
    const cGrip = '#1a1a1a';        // Grip
    const cEnergy = '#00e5ff';      // Cyan energy core
    const cEnergyDark = '#006064';  // Energy border
    const cEnergyBright = '#80ffff'; // Energy highlight
    const cMetal = '#78909c';       // Metal trim
    const cLens = '#00bcd4';        // Lens emitter

    // -- Stock (Compact tech stock) --
    drawer.fillPath([
        {x: 0, y: 5},
        {x: 5, y: 5},
        {x: 5, y: 8},
        {x: 0, y: 7}
    ], cDark);
    drawer.hLine(1, 5, 3, cBodyLight);
    drawer.pixel(1, 6, cMetal);

    // -- Receiver body --
    drawer.rect(5, 4, 14, 5, cBody);
    drawer.hLine(5, 4, 14, cBodyLight); // Top rail
    drawer.hLine(5, 8, 14, cDark);      // Bottom shadow

    // -- Energy Core (glowing center) --
    drawer.rect(10, 5, 4, 3, cEnergyDark);
    drawer.rect(11, 5, 2, 3, cEnergy);
    drawer.pixel(11, 6, cEnergyBright); // Bright highlight

    // -- Cooling vents --
    drawer.pixel(8, 5, cMetal);
    drawer.pixel(8, 7, cMetal);
    drawer.pixel(15, 5, cMetal);
    drawer.pixel(15, 7, cMetal);

    // -- Pistol Grip --
    drawer.fillPath([
        {x: 8, y: 9},
        {x: 11, y: 9},
        {x: 10, y: 12},
        {x: 7, y: 12}
    ], cGrip);

    // -- Trigger Guard --
    drawer.strokePath([
        {x: 10, y: 9},
        {x: 11, y: 10},
        {x: 13, y: 9}
    ], cBody);

    // -- Barrel (thin energy conduit) --
    drawer.rect(19, 5, 7, 2, cBody);
    drawer.hLine(19, 5, 7, cMetal);
    // Energy line along barrel
    drawer.hLine(20, 6, 5, cEnergy);

    // -- Lens Emitter (front) --
    drawer.rect(26, 4, 2, 4, cLens);
    drawer.pixel(27, 5, cEnergyBright);
    drawer.pixel(27, 6, cEnergyBright);

    // -- Top sight/sensor --
    drawer.rect(7, 3, 3, 1, cDark);
    drawer.pixel(8, 3, cEnergy); // Small energy indicator

    return drawer.getCanvas();
}

export const LASER_GUN_SPRITE = generateLaserGun();
