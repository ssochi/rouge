import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Ricochet Gun Generator (Angular Bouncing Pistol)
 * Dimensions: 20x14
 */
export function generateRicochetGun() {
    const width = 20;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#27ae60';        // Green body
    const cBodyLight = '#2ecc71';   // Green highlight
    const cDark = '#1e8449';        // Dark green
    const cGrip = '#1a1a1a';        // Grip
    const cGreen = '#2ecc71';       // Bright green energy
    const cGreenBright = '#82e0aa'; // Bright green highlight
    const cMetal = '#bdc3c7';       // Silver metal
    const cMetalDark = '#95a5a6';   // Metal shadow

    // -- Body (angular compact receiver) --
    drawer.rect(3, 4, 10, 5, cBody);
    drawer.hLine(3, 4, 10, cBodyLight);
    drawer.hLine(3, 8, 10, cDark);

    // -- Angular chevron markings (bounce motif) --
    drawer.pixel(5, 5, cGreenBright);
    drawer.pixel(6, 6, cGreenBright);
    drawer.pixel(5, 7, cGreenBright);
    drawer.pixel(8, 5, cGreenBright);
    drawer.pixel(9, 6, cGreenBright);
    drawer.pixel(8, 7, cGreenBright);

    // -- Energy line --
    drawer.pixel(11, 5, cGreen);
    drawer.pixel(11, 7, cGreen);

    // -- Rear plate --
    drawer.rect(1, 5, 2, 3, cDark);
    drawer.pixel(2, 5, cMetal);
    drawer.pixel(2, 7, cMetal);

    // -- Barrel (short, angular) --
    drawer.rect(13, 5, 5, 3, cBody);
    drawer.hLine(13, 5, 5, cMetal);
    drawer.hLine(14, 6, 3, cGreen);

    // -- Muzzle --
    drawer.rect(18, 4, 2, 5, cMetalDark);
    drawer.pixel(19, 5, cGreen);
    drawer.pixel(19, 6, cGreenBright);
    drawer.pixel(19, 7, cGreen);

    // -- Pistol Grip --
    drawer.fillPath([
        {x: 5, y: 9},
        {x: 8, y: 9},
        {x: 7, y: 14},
        {x: 4, y: 14}
    ], cGrip);

    // -- Trigger guard --
    drawer.strokePath([
        {x: 8, y: 9},
        {x: 9, y: 10},
        {x: 11, y: 9}
    ], cDark);

    // -- Top sight (angular) --
    drawer.rect(5, 3, 2, 1, cMetalDark);
    drawer.pixel(6, 3, cGreen);

    return drawer.getCanvas();
}

export const RICOCHET_GUN_SPRITE = generateRicochetGun();
