import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Freeze Ray Generator (Cryo Beam Gun)
 * Dimensions: 28x14
 */
export function generateFreezeRay() {
    const width = 28;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#a8d8ea';        // Light blue body
    const cBodyDark = '#7fb3d3';    // Body shadow
    const cDark = '#1a5276';        // Dark blue accents
    const cGrip = '#1a1a1a';        // Grip
    const cIce = '#74b9ff';         // Ice blue
    const cIceBright = '#dfe6e9';   // Ice white/frost
    const cCryo = '#00cec9';        // Cryo tank cyan
    const cCryoDark = '#009688';    // Cryo tank shadow
    const cMetal = '#b0bec5';       // Silver metal
    const cWhite = '#ecf0f1';       // White highlight

    // -- Rear section --
    drawer.fillPath([
        {x: 0, y: 5},
        {x: 5, y: 5},
        {x: 5, y: 9},
        {x: 0, y: 8}
    ], cDark);
    drawer.hLine(1, 5, 3, cBody);
    drawer.pixel(2, 6, cMetal);

    // -- Receiver body --
    drawer.rect(5, 4, 13, 6, cBody);
    drawer.hLine(5, 4, 13, cWhite);
    drawer.hLine(5, 9, 13, cBodyDark);

    // -- Cryo tank (below receiver, like flamethrower fuel tank) --
    drawer.rect(6, 10, 8, 3, cCryo);
    drawer.hLine(6, 10, 8, cCryoDark);
    drawer.hLine(7, 12, 6, cCryoDark);
    drawer.rect(8, 10, 4, 1, cIce);
    // Frost indicator
    drawer.pixel(9, 11, cIceBright);
    drawer.pixel(11, 11, cIceBright);

    // -- Ice core chamber --
    drawer.rect(9, 5, 5, 4, cDark);
    drawer.rect(10, 5, 3, 4, cIce);
    drawer.pixel(11, 6, cIceBright);
    drawer.pixel(10, 7, cWhite);

    // -- Frost vents --
    drawer.pixel(7, 5, cMetal);
    drawer.pixel(7, 7, cMetal);
    drawer.pixel(15, 5, cMetal);
    drawer.pixel(15, 7, cMetal);

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
    ], cBodyDark);

    // -- Barrel (tube with frost line) --
    drawer.rect(18, 5, 6, 3, cBody);
    drawer.hLine(18, 5, 6, cMetal);
    drawer.hLine(19, 6, 4, cIce);

    // -- Conical nozzle with frost crystals --
    drawer.rect(24, 4, 2, 5, cDark);
    drawer.rect(26, 3, 2, 7, cMetal);
    // Ice crystals at tip
    drawer.pixel(27, 3, cIce);
    drawer.pixel(27, 4, cIceBright);
    drawer.pixel(27, 5, cIce);
    drawer.pixel(27, 6, cWhite);
    drawer.pixel(27, 7, cIce);
    drawer.pixel(27, 8, cIceBright);
    drawer.pixel(27, 9, cIce);

    // -- Top sight --
    drawer.rect(7, 3, 3, 1, cDark);
    drawer.pixel(8, 3, cIce);

    return drawer.getCanvas();
}

export const FREEZE_RAY_SPRITE = generateFreezeRay();
