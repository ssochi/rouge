import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Laser Rifle Generator (Continuous Red Beam Rifle)
 * Dimensions: 30x12
 * Features: dual energy cores, heat vents, extended barrel
 */
export function generateLaserRifle() {
    const width = 30;
    const height = 12;
    const drawer = new PixelDraw(width, height);

    // Colors — red energy scheme
    const cBody = '#37474f';
    const cBodyLight = '#546e7a';
    const cDark = '#263238';
    const cGrip = '#1a1a1a';
    const cEnergy = '#ff1744';       // Red energy core
    const cEnergyDark = '#b71c1c';   // Energy border
    const cEnergyBright = '#ff8a80'; // Energy highlight
    const cMetal = '#78909c';        // Metal trim
    const cLens = '#d50000';         // Red lens emitter
    const cHeat = '#ff6e40';         // Heat glow accent

    // -- Stock (extended tech stock for rifle feel) --
    drawer.fillPath([
        {x: 0, y: 4},
        {x: 6, y: 4},
        {x: 6, y: 8},
        {x: 0, y: 7}
    ], cDark);
    drawer.hLine(1, 4, 4, cBodyLight);
    drawer.pixel(1, 5, cMetal);
    drawer.pixel(3, 6, cMetal);

    // -- Receiver body --
    drawer.rect(6, 3, 15, 6, cBody);
    drawer.hLine(6, 3, 15, cBodyLight);  // Top rail
    drawer.hLine(6, 8, 15, cDark);       // Bottom shadow

    // -- Dual Energy Cores (indicating sustained power) --
    // Core 1
    drawer.rect(9, 4, 3, 3, cEnergyDark);
    drawer.rect(10, 4, 1, 3, cEnergy);
    drawer.pixel(10, 5, cEnergyBright);
    // Core 2
    drawer.rect(13, 4, 3, 3, cEnergyDark);
    drawer.rect(14, 4, 1, 3, cEnergy);
    drawer.pixel(14, 5, cEnergyBright);

    // -- Cooling vents (heat dissipation for sustained fire) --
    drawer.pixel(8, 4, cMetal);
    drawer.pixel(8, 6, cMetal);
    drawer.pixel(12, 4, cHeat);
    drawer.pixel(12, 6, cHeat);
    drawer.pixel(17, 4, cMetal);
    drawer.pixel(17, 6, cMetal);

    // -- Pistol Grip --
    drawer.fillPath([
        {x: 9, y: 9},
        {x: 12, y: 9},
        {x: 11, y: 12},
        {x: 8, y: 12}
    ], cGrip);

    // -- Trigger Guard --
    drawer.strokePath([
        {x: 11, y: 9},
        {x: 12, y: 10},
        {x: 14, y: 9}
    ], cBody);

    // -- Barrel (extended energy conduit) --
    drawer.rect(21, 4, 7, 3, cBody);
    drawer.hLine(21, 4, 7, cMetal);
    // Red energy line along barrel
    drawer.hLine(22, 5, 5, cEnergy);
    // Heat glow along lower barrel
    drawer.pixel(23, 6, cHeat);
    drawer.pixel(25, 6, cHeat);

    // -- Lens Emitter (front, wide red) --
    drawer.rect(28, 3, 2, 5, cLens);
    drawer.pixel(29, 4, cEnergyBright);
    drawer.pixel(29, 5, cEnergyBright);
    drawer.pixel(29, 6, cEnergyBright);

    // -- Top heat sink fins --
    drawer.rect(7, 2, 2, 1, cDark);
    drawer.pixel(8, 2, cEnergy);  // Red indicator LED
    drawer.rect(18, 2, 3, 1, cMetal);

    return drawer.getCanvas();
}

export const LASER_RIFLE_SPRITE = generateLaserRifle();
