import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Lightning Gun Generator (Sci-Fi Electric Arc Rifle)
 * Dimensions: 28x14
 */
export function generateLightningGun() {
    const width = 28;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#37474f';        // Main body
    const cBodyLight = '#546e7a';   // Body highlight
    const cDark = '#263238';        // Dark accents
    const cGrip = '#1a1a1a';        // Grip
    const cYellow = '#f1c40f';      // Electric yellow
    const cYellowBright = '#f9e547'; // Bright yellow
    const cCopper = '#d35400';      // Copper coils
    const cCopperLight = '#e67e22'; // Copper highlight
    const cMetal = '#78909c';       // Metal trim
    const cBlue = '#5dade2';        // Blue-white energy

    // -- Stock (angular tech stock) --
    drawer.fillPath([
        {x: 0, y: 5},
        {x: 5, y: 5},
        {x: 5, y: 9},
        {x: 0, y: 8}
    ], cDark);
    drawer.hLine(1, 5, 3, cBodyLight);
    drawer.pixel(1, 7, cMetal);

    // -- Receiver body --
    drawer.rect(5, 4, 14, 6, cBody);
    drawer.hLine(5, 4, 14, cBodyLight);
    drawer.hLine(5, 9, 14, cDark);

    // -- Capacitor chamber (yellow energy) --
    drawer.rect(9, 5, 5, 4, cDark);
    drawer.rect(10, 5, 3, 4, '#2c3e50');
    drawer.rect(10, 6, 3, 2, cYellow);
    drawer.pixel(11, 6, cYellowBright);
    drawer.pixel(12, 7, cBlue);

    // -- Copper coils (on receiver) --
    drawer.pixel(7, 5, cCopper);
    drawer.pixel(7, 7, cCopper);
    drawer.pixel(8, 6, cCopperLight);
    drawer.pixel(15, 5, cCopper);
    drawer.pixel(15, 7, cCopper);
    drawer.pixel(16, 6, cCopperLight);

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

    // -- Barrel with coil wraps --
    drawer.rect(19, 5, 6, 3, cBody);
    drawer.hLine(19, 5, 6, cMetal);
    // Coil wraps
    drawer.pixel(20, 6, cCopper);
    drawer.pixel(22, 6, cCopper);
    drawer.pixel(24, 6, cCopper);
    // Energy line
    drawer.hLine(19, 7, 6, cYellow);

    // -- Forked emitter tip --
    drawer.rect(25, 4, 3, 2, cMetal);
    drawer.rect(25, 7, 3, 2, cMetal);
    drawer.pixel(27, 4, cYellow);
    drawer.pixel(27, 5, cYellowBright);
    drawer.pixel(27, 7, cYellowBright);
    drawer.pixel(27, 8, cYellow);
    // Gap between forks (energy arc)
    drawer.pixel(27, 6, cBlue);

    // -- Top rail/sight --
    drawer.rect(7, 3, 3, 1, cDark);
    drawer.pixel(8, 3, cYellow);

    return drawer.getCanvas();
}

export const LIGHTNING_GUN_SPRITE = generateLightningGun();
