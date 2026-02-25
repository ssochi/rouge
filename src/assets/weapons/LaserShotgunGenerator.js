import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Laser Shotgun Generator (Multi-beam Spread Laser)
 * Dimensions: 28x14
 * Features: triple emitter tubes, wide barrel housing, purple energy
 */
export function generateLaserShotgun() {
    const width = 28;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // Colors — purple energy scheme
    const cBody = '#37474f';
    const cBodyLight = '#546e7a';
    const cDark = '#263238';
    const cGrip = '#1a1a1a';
    const cEnergy = '#7c4dff';        // Purple energy core
    const cEnergyDark = '#4a148c';    // Energy border
    const cEnergyBright = '#b388ff';  // Energy highlight
    const cMetal = '#78909c';         // Metal trim
    const cLens = '#6200ea';          // Purple lens
    const cBarrel = '#455a64';        // Barrel housing

    // -- Stock (compact, slightly angled) --
    drawer.fillPath([
        {x: 0, y: 5},
        {x: 5, y: 5},
        {x: 5, y: 9},
        {x: 0, y: 8}
    ], cDark);
    drawer.hLine(1, 5, 3, cBodyLight);
    drawer.pixel(2, 7, cMetal);

    // -- Receiver body (wider for multi-beam housing) --
    drawer.rect(5, 4, 12, 6, cBody);
    drawer.hLine(5, 4, 12, cBodyLight);  // Top rail
    drawer.hLine(5, 9, 12, cDark);       // Bottom shadow

    // -- Energy Core (large, central) --
    drawer.rect(9, 5, 4, 4, cEnergyDark);
    drawer.rect(10, 5, 2, 4, cEnergy);
    drawer.pixel(10, 6, cEnergyBright);
    drawer.pixel(11, 7, cEnergyBright);

    // -- Cooling vents --
    drawer.pixel(7, 5, cMetal);
    drawer.pixel(7, 8, cMetal);
    drawer.pixel(14, 5, cMetal);
    drawer.pixel(14, 8, cMetal);

    // -- Pistol Grip --
    drawer.fillPath([
        {x: 8, y: 10},
        {x: 11, y: 10},
        {x: 10, y: 14},
        {x: 7, y: 14}
    ], cGrip);

    // -- Trigger Guard --
    drawer.strokePath([
        {x: 10, y: 10},
        {x: 11, y: 11},
        {x: 13, y: 10}
    ], cBody);

    // -- Triple Barrel Housing --
    // Top tube
    drawer.rect(17, 3, 8, 2, cBarrel);
    drawer.hLine(17, 3, 8, cMetal);
    drawer.hLine(18, 4, 6, cEnergy);
    // Middle tube
    drawer.rect(17, 6, 8, 2, cBarrel);
    drawer.hLine(18, 7, 6, cEnergy);
    // Bottom tube
    drawer.rect(17, 9, 8, 2, cBarrel);
    drawer.hLine(17, 10, 8, cMetal);
    drawer.hLine(18, 9, 6, cEnergy);

    // -- Connecting plate between tubes --
    drawer.rect(17, 5, 1, 1, cBody);
    drawer.rect(17, 8, 1, 1, cBody);

    // -- Triple Lens Emitters (front) --
    // Top lens
    drawer.rect(25, 2, 3, 3, cLens);
    drawer.pixel(26, 3, cEnergyBright);
    // Middle lens
    drawer.rect(25, 6, 3, 2, cLens);
    drawer.pixel(26, 6, cEnergyBright);
    // Bottom lens
    drawer.rect(25, 9, 3, 3, cLens);
    drawer.pixel(26, 10, cEnergyBright);

    // -- Front plate (connecting lenses) --
    drawer.vLine(25, 5, 1, cMetal);
    drawer.vLine(25, 8, 1, cMetal);

    // -- Top sensor/sight --
    drawer.rect(7, 3, 3, 1, cDark);
    drawer.pixel(8, 3, cEnergy);  // Purple indicator

    return drawer.getCanvas();
}

export const LASER_SHOTGUN_SPRITE = generateLaserShotgun();
