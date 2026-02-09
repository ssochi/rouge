import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Shotgun Generator (Remington 870 Style)
 * Dimensions: 28x12
 */
export function generateShotgun() {
    const width = 28;
    const height = 12;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cMetal = '#546e7a';       // Receiver
    const cMetalDark = '#37474f';   // Barrel / Shadow
    const cHighlight = '#78909c';   // Metal Highlight
    const cWood = '#6d4c41';        // Fore-end / Stock
    const cWoodLight = '#8d6e63';   // Wood Highlight
    const cWoodDark = '#4e342e';    // Wood Shadow
    const cBlack = '#263238';       // Sights / Details

    // -- Stock (angled slightly down) --
    drawer.fillPath([
        {x: 0, y: 5},
        {x: 6, y: 4},
        {x: 6, y: 7},
        {x: 1, y: 8}
    ], cWood);
    // Stock highlight
    drawer.hLine(1, 5, 4, cWoodLight);
    // Buttpad
    drawer.vLine(0, 5, 3, cWoodDark);

    // -- Receiver --
    drawer.rect(6, 3, 10, 5, cMetal);
    // Top highlight
    drawer.hLine(6, 3, 10, cHighlight);
    // Bottom shadow
    drawer.hLine(6, 7, 10, cMetalDark);
    // Ejection port
    drawer.rect(10, 4, 3, 1, cHighlight);
    // Loading port (bottom)
    drawer.rect(9, 7, 4, 1, cMetalDark);

    // -- Trigger Guard --
    drawer.strokePath([
        {x: 9, y: 8},
        {x: 10, y: 9},
        {x: 12, y: 8}
    ], cMetalDark);
    // Trigger
    drawer.pixel(10, 8, cBlack);

    // -- Grip (pistol-style, back of receiver) --
    drawer.fillPath([
        {x: 6, y: 7},
        {x: 9, y: 7},
        {x: 8, y: 11},
        {x: 5, y: 11}
    ], cWood);
    drawer.vLine(7, 8, 2, cWoodDark);

    // -- Barrel (long, thin, on top) --
    drawer.rect(16, 4, 10, 2, cMetalDark);
    // Barrel top highlight
    drawer.hLine(16, 4, 10, cMetal);

    // -- Fore-end / Pump (wood) --
    drawer.rect(16, 6, 7, 2, cWood);
    // Wood grain highlights
    drawer.hLine(17, 6, 5, cWoodLight);
    drawer.hLine(18, 7, 3, cWoodDark);

    // -- Muzzle --
    drawer.pixel(26, 4, cBlack);
    drawer.pixel(26, 5, cBlack);
    drawer.pixel(27, 4, cBlack);
    drawer.pixel(27, 5, cBlack);

    // -- Sights --
    drawer.pixel(8, 2, cBlack);   // Rear bead
    drawer.pixel(25, 3, cBlack);  // Front bead

    // -- Magazine Tube (under barrel) --
    drawer.hLine(16, 6, 6, cMetalDark);

    return drawer.getCanvas();
}

export const SHOTGUN_SPRITE = generateShotgun();
