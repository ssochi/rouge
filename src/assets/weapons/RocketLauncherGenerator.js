import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

/**
 * Procedural Rocket Launcher Generator (RPG-7 Style)
 * Dimensions: 36x14
 */
export function generateRocketLauncher() {
    const width = 36;
    const height = 14;
    const drawer = new PixelDraw(width, height);
    
    // Colors - Improved Palette
    const cCamoBase = '#7cb342';   // Light Green (Brighter)
    const cCamoShadow = '#33691e'; // Dark Green (Contrast)
    const cWood = '#8d6e63';       // Medium Wood (More natural)
    const cWoodLight = '#bcaaa4';  // Light Wood
    const cMetal = '#546e7a';      // Blue Grey
    const cGrip = '#263238';       // Dark Grey
    
    // -- Rear Tube (Venturi) --
    // Flared end
    drawer.fillPath([
        {x: 0, y: 4},
        {x: 4, y: 5},
        {x: 12, y: 5},
        {x: 12, y: 9},
        {x: 4, y: 9},
        {x: 0, y: 10}
    ], cCamoBase);
    // Shadow detail
    drawer.rect(0, 4, 2, 6, cCamoShadow);

    // -- Heat Shield (Wood) --
    // The iconic bulge in the middle
    drawer.fillQuadCurve(12, 5, 18, 4, 24, 5, cWood); // Top curve
    drawer.fillQuadCurve(12, 9, 18, 10, 24, 9, cWood); // Bottom curve
    drawer.rect(12, 5, 12, 4, cWood); // Fill center
    // Wood texture/highlight
    drawer.hLine(14, 6, 8, cWoodLight);
    drawer.pixel(16, 8, cWoodLight);

    // -- Front Tube --
    drawer.rect(24, 6, 8, 2, cCamoBase);
    
    // -- Muzzle --
    drawer.rect(32, 5, 2, 4, cCamoShadow);

    // -- Sights --
    // Rear Optical Sight (PGO-7 style box)
    drawer.rect(10, 2, 4, 3, cMetal);
    drawer.pixel(11, 3, '#90a4ae'); // Lens
    // Front Iron Sight
    drawer.pixel(30, 5, cMetal);

    // -- Grips --
    // Rear Grip (Trigger) - near Heat Shield rear
    drawer.fillPath([
        {x: 13, y: 9},
        {x: 15, y: 9},
        {x: 14, y: 13},
        {x: 12, y: 13}
    ], cGrip);
    
    // Front Grip - near Heat Shield front
    drawer.fillPath([
        {x: 21, y: 9},
        {x: 23, y: 9},
        {x: 22, y: 13},
        {x: 20, y: 13}
    ], cGrip);

    // -- Trigger --
    drawer.pixel(14, 10, '#000000');

    return drawer.getCanvas();
}

export const ROCKET_LAUNCHER_SPRITE = generateRocketLauncher();
