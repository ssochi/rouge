import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

/**
 * Procedural Rifle Generator (AR-15 Style)
 * Dimensions: 32x16
 */
export function generateRifle() {
    const width = 32;
    const height = 16;
    const drawer = new PixelDraw(width, height);
    
    // Colors
    const cMetal = '#546e7a';      // Blue Grey Metal
    const cMetalDark = '#37474f';  // Darker Metal
    const cMetalLight = '#78909c'; // Highlight
    const cBlack = '#263238';      // Polymer Parts (Stock, Grip, Handguard)
    const cBlackDark = '#102027';  
    
    // Pivot Point (Trigger/Grip) approx at x=10, y=10
    
    // -- Stock --
    // Trapezoid shape
    drawer.fillPath([
        {x: 0, y: 4},
        {x: 4, y: 4},
        {x: 8, y: 6},
        {x: 8, y: 10},
        {x: 2, y: 12},
        {x: 0, y: 12}
    ], cBlack);
    drawer.rect(0, 4, 2, 8, cBlackDark); // Buttpad

    // -- Receiver (Main Body) --
    drawer.rect(8, 6, 10, 4, cMetal);
    drawer.hLine(8, 6, 10, cMetalLight); // Top highlight
    
    // -- Pistol Grip --
    drawer.fillPath([
        {x: 9, y: 10},
        {x: 12, y: 10},
        {x: 11, y: 14},
        {x: 8, y: 14}
    ], cBlack);

    // -- Magazine --
    // Curved banana mag style
    drawer.fillQuadCurve(14, 10, 15, 13, 16, 15, cMetalDark);
    drawer.fillQuadCurve(17, 10, 18, 13, 19, 15, cMetalDark);
    // Fill mag body
    drawer.fillPath([
        {x: 14, y: 10}, {x: 17, y: 10},
        {x: 19, y: 15}, {x: 16, y: 15}
    ], cMetalDark);
    // Mag ribs
    drawer.hLine(15, 12, 3, '#455a64');

    // -- Handguard / Barrel Shroud --
    drawer.rect(18, 6, 8, 3, cBlack);
    drawer.rect(18, 7, 8, 1, cBlackDark); // Vents

    // -- Barrel --
    drawer.rect(26, 7, 4, 1, cMetalDark);
    
    // -- Muzzle Device (Flash Hider) --
    drawer.rect(30, 6, 2, 3, cMetal);

    // -- Sights / Rail --
    // Top Rail
    drawer.rect(8, 5, 18, 1, cMetalDark);
    // Rear Sight (Iron)
    drawer.rect(9, 3, 2, 2, cMetal);
    // Front Sight (Triangle)
    drawer.fillPath([
        {x: 24, y: 5},
        {x: 24, y: 3},
        {x: 26, y: 5}
    ], cMetal);

    // -- Trigger Guard --
    drawer.strokePath([
        {x: 12, y: 10},
        {x: 12, y: 12},
        {x: 14, y: 10}
    ], cMetalDark);

    return drawer.getCanvas();
}

export const RIFLE_SPRITE = generateRifle();
