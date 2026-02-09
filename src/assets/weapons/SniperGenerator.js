import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Sniper Rifle Generator (Tactical Marksman Rifle)
 * Dimensions: 32x12
 */
export function generateSniper() {
    const width = 32;
    const height = 12;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#37474f';        // Receiver (Dark)
    const cBodyLight = '#546e7a';   // Receiver Highlight
    const cBarrel = '#455a64';      // Barrel
    const cScope = '#263238';       // Scope body
    const cScopeLight = '#546e7a';  // Scope highlight
    const cLens = '#e74c3c';        // Red Lens (Reflective)
    const cStock = '#263238';       // Stock
    const cGrip = '#1a1a1a';        // Grip
    const cMetal = '#90a4ae';       // Metal accents
    const cBlack = '#000000';       // Dark details

    // -- Stock (Adjustable Tactical Stock) --
    drawer.fillPath([
        {x: 0, y: 5},
        {x: 6, y: 5},
        {x: 6, y: 9},
        {x: 0, y: 8}
    ], cStock);
    drawer.vLine(0, 5, 4, cGrip); // Buttpad
    drawer.hLine(1, 6, 3, cBodyLight); // Cheek rest

    // -- Receiver --
    drawer.rect(6, 5, 12, 4, cBody);
    drawer.hLine(6, 5, 12, cBodyLight); // Top rail
    drawer.hLine(6, 8, 12, cBlack);     // Lower receiver shadow

    // -- Pistol Grip --
    drawer.fillPath([
        {x: 8, y: 9},
        {x: 11, y: 9},
        {x: 10, y: 12},
        {x: 7, y: 12}
    ], cGrip);

    // -- Magazine (Short, 10-round style) --
    drawer.fillPath([
        {x: 12, y: 9},
        {x: 15, y: 9},
        {x: 14, y: 11},
        {x: 12, y: 11}
    ], cBody);
    drawer.vLine(13, 9, 2, cBlack);

    // -- Barrel --
    drawer.rect(18, 6, 10, 2, cBarrel);
    drawer.hLine(18, 6, 10, cMetal); // Highlight

    // -- Muzzle Brake (Detailed) --
    drawer.rect(28, 5, 4, 4, cBarrel);
    drawer.rect(29, 5, 2, 1, cMetal);
    drawer.rect(29, 8, 2, 1, cMetal);
    drawer.pixel(29, 6, cBlack); // Vents
    drawer.pixel(29, 7, cBlack);

    // -- Red Dot Sight (Instead of huge scope) --
    // Mount
    drawer.rect(10, 3, 6, 2, cBlack); 
    // Sight Body
    drawer.rect(9, 2, 8, 2, cScope);
    // Lens (Red tint)
    drawer.pixel(9, 2, cLens);
    drawer.pixel(9, 3, cLens);
    drawer.pixel(16, 2, cLens);
    drawer.pixel(16, 3, cLens);
    
    // -- Laser Module (Side mounted) --
    drawer.rect(19, 7, 3, 2, cBlack);
    drawer.pixel(21, 7, '#ff0000'); // Laser emitter point

    // -- Trigger Guard --
    drawer.strokePath([
        {x: 10, y: 9},
        {x: 11, y: 10},
        {x: 13, y: 9}
    ], cBody);

    return drawer.getCanvas();
}

export const SNIPER_SPRITE = generateSniper();