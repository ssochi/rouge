import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Boomerang Generator (Sleek Curved Throwing Weapon)
 * Dimensions: 20x12
 */
export function generateBoomerang() {
    const width = 20;
    const height = 12;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#6d4c41';        // Dark wood body
    const cBodyLight = '#8d6e63';   // Wood highlight
    const cEdge = '#4e342e';        // Dark edge
    const cBlade = '#a1887f';       // Blade highlight
    const cAccent = '#e74c3c';      // Red accent stripe
    const cAccentDark = '#c0392b';  // Red dark
    const cMetal = '#90a4ae';       // Metal reinforcement

    // -- Main curved body (boomerang arc shape) --
    // Upper curve
    drawer.fillPath([
        {x: 2, y: 5},
        {x: 4, y: 3},
        {x: 8, y: 2},
        {x: 12, y: 2},
        {x: 16, y: 3},
        {x: 19, y: 5},
        {x: 18, y: 6},
        {x: 15, y: 5},
        {x: 12, y: 4},
        {x: 8, y: 4},
        {x: 5, y: 5},
        {x: 3, y: 6}
    ], cBody);

    // Lower belly curve
    drawer.fillPath([
        {x: 3, y: 6},
        {x: 5, y: 5},
        {x: 8, y: 4},
        {x: 12, y: 4},
        {x: 15, y: 5},
        {x: 18, y: 6},
        {x: 17, y: 8},
        {x: 14, y: 7},
        {x: 10, y: 6},
        {x: 6, y: 7},
        {x: 3, y: 8}
    ], cBodyLight);

    // Top edge highlight
    drawer.pixel(6, 2, cBlade);
    drawer.pixel(7, 2, cBlade);
    drawer.pixel(9, 2, cBlade);
    drawer.pixel(10, 2, cBlade);
    drawer.pixel(13, 2, cBlade);
    drawer.pixel(14, 3, cBlade);

    // Bottom edge shadow
    drawer.pixel(5, 7, cEdge);
    drawer.pixel(7, 7, cEdge);
    drawer.pixel(9, 6, cEdge);
    drawer.pixel(14, 7, cEdge);
    drawer.pixel(16, 8, cEdge);

    // -- Left tip (bladed) --
    drawer.pixel(1, 5, cMetal);
    drawer.pixel(1, 6, cMetal);
    drawer.pixel(2, 7, cEdge);

    // -- Right tip (bladed) --
    drawer.pixel(19, 4, cMetal);
    drawer.pixel(19, 5, cMetal);
    drawer.pixel(18, 7, cEdge);

    // -- Red accent stripe along body --
    drawer.pixel(7, 3, cAccent);
    drawer.pixel(8, 3, cAccent);
    drawer.pixel(9, 3, cAccentDark);
    drawer.pixel(11, 3, cAccent);
    drawer.pixel(12, 3, cAccent);
    drawer.pixel(13, 3, cAccentDark);

    // -- Grip area (center) --
    drawer.rect(9, 4, 3, 3, cEdge);
    drawer.pixel(9, 5, cBody);
    drawer.pixel(11, 5, cBody);
    drawer.pixel(10, 4, cMetal);

    return drawer.getCanvas();
}

export const BOOMERANG_SPRITE = generateBoomerang();
