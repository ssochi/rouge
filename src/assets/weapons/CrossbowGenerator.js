import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Crossbow Generator (Modern Tactical Crossbow)
 * Dimensions: 20x16
 */
export function generateCrossbow() {
    const width = 20;
    const height = 16;
    const drawer = new PixelDraw(width, height);

    const cMetal = '#455a64';      // Dark Blue Grey
    const cMetalDark = '#263238';  // Very Dark
    const cMetalLight = '#78909c'; // Highlight
    const cString = '#bdc3c7';     // String
    const cGrip = '#1a1a1a';       // Black Grip
    const cBolt = '#424242';       // Bolt Shaft
    const cFletch = '#e74c3c';     // Red Fletching (High Vis)
    const cCamo = '#5d4037';       // Camo brown accent

    // -- Limbs (Curved forward) --
    // Top Limb
    drawer.fillPath([
        { x: 3, y: 3 },
        { x: 6, y: 5 },
        { x: 8, y: 7 },
        { x: 6, y: 4 } // Thickness
    ], cCamo);
    
    // Bottom Limb
    drawer.fillPath([
        { x: 3, y: 13 },
        { x: 6, y: 11 },
        { x: 8, y: 9 },
        { x: 6, y: 12 } // Thickness
    ], cCamo);

    // Limb Tips (Pulleys)
    drawer.pixel(3, 3, cMetalLight);
    drawer.pixel(3, 13, cMetalLight);

    // -- String (Taut) --
    drawer.line(3, 3, 8, 8, cString);
    drawer.line(3, 13, 8, 8, cString);

    // -- Body / Rail --
    drawer.rect(8, 7, 10, 3, cMetalDark);
    drawer.hLine(8, 7, 10, cMetalLight); // Top rail highlight
    
    // -- Stirrup (Foot loop at front) --
    drawer.rect(7, 7, 1, 3, cMetalLight);

    // -- Loaded Bolt --
    drawer.hLine(8, 8, 10, cBolt);
    drawer.pixel(18, 8, cMetal); // Bolt tip
    drawer.pixel(9, 7, cFletch); // Fletching
    drawer.pixel(9, 9, cFletch);

    // -- Scope / Sight --
    drawer.rect(11, 5, 4, 2, cMetalDark); // Scope Body
    drawer.pixel(11, 6, cMetalLight); // Lens

    // -- Trigger & Grip --
    drawer.fillPath([
        { x: 12, y: 10 },
        { x: 14, y: 10 },
        { x: 13, y: 14 },
        { x: 11, y: 14 }
    ], cGrip);
    drawer.pixel(13, 10, cMetalLight); // Trigger

    // -- Stock (Skeletonized) --
    drawer.fillPath([
        { x: 18, y: 7 },
        { x: 20, y: 7 }, // Buttpad
        { x: 20, y: 11 },
        { x: 18, y: 10 },
        { x: 16, y: 10 } // Connect to body
    ], cGrip);
    drawer.vLine(19, 7, 4, cMetalDark); // Buttpad detail

    return drawer.getCanvas();
}

export const CROSSBOW_SPRITE = generateCrossbow();