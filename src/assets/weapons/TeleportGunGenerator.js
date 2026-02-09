import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Teleport Gun Generator (Sci-Fi Pistol)
 * Dimensions: 22x14
 */
export function generateTeleportGun() {
    const width = 22;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#546e7a';        // Medium grey body
    const cBodyLight = '#78909c';   // Body highlight
    const cDark = '#37474f';        // Dark accents
    const cGrip = '#1a1a1a';        // Grip
    const cBlue = '#3498db';        // Blue energy
    const cBlueDark = '#1a5276';    // Dark blue
    const cBlueBright = '#5dade2';  // Bright blue
    const cWhite = '#ecf0f1';       // White highlight
    const cMetal = '#90a4ae';       // Metal trim

    // -- Body (compact receiver) --
    drawer.rect(3, 4, 12, 5, cBody);
    drawer.hLine(3, 4, 12, cBodyLight); // Top highlight
    drawer.hLine(3, 8, 12, cDark);      // Bottom shadow

    // -- Energy Chamber (blue core) --
    drawer.rect(7, 4, 4, 5, cBlueDark);
    drawer.rect(8, 5, 2, 3, cBlue);
    drawer.pixel(8, 6, cBlueBright); // Bright center
    drawer.pixel(9, 5, cBlueBright);

    // -- LED indicators --
    drawer.pixel(5, 5, cBlue);
    drawer.pixel(5, 7, cBlue);
    drawer.pixel(13, 5, cBlue);

    // -- Rear plate --
    drawer.rect(1, 5, 2, 3, cDark);
    drawer.pixel(2, 5, cMetal);
    drawer.pixel(2, 7, cMetal);

    // -- Barrel (short) --
    drawer.rect(15, 5, 5, 3, cBody);
    drawer.hLine(15, 5, 5, cMetal);
    // Blue energy line
    drawer.hLine(16, 6, 3, cBlue);

    // -- Emitter ring (blue glow at tip) --
    drawer.rect(20, 4, 2, 5, cDark);
    drawer.pixel(21, 5, cBlue);
    drawer.pixel(21, 6, cBlueBright);
    drawer.pixel(21, 7, cBlue);

    // -- Pistol Grip --
    drawer.fillPath([
        {x: 6, y: 9},
        {x: 9, y: 9},
        {x: 8, y: 14},
        {x: 5, y: 14}
    ], cGrip);

    // -- Trigger guard --
    drawer.strokePath([
        {x: 9, y: 9},
        {x: 10, y: 10},
        {x: 12, y: 9}
    ], cBody);

    // -- Top sight --
    drawer.rect(5, 3, 2, 1, cDark);
    drawer.pixel(6, 3, cWhite); // Sight dot

    return drawer.getCanvas();
}

export const TELEPORT_GUN_SPRITE = generateTeleportGun();
