import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Grenade Launcher Generator (M79 Style)
 * Dimensions: 24x14
 * Pivot: (8, 8) - at grip area
 */
export function generateGrenadeLauncher() {
    const width = 24;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cMetal = '#546e7a';
    const cMetalDark = '#37474f';
    const cMetalLight = '#90a4ae';
    const cWood = '#5d4037';
    const cWoodLight = '#8d6e63';
    const cWoodDark = '#3e2723';
    const cGrip = '#2c3e50';
    const cBlack = '#1a1a1a';
    const cBore = '#0d1117';

    // -- Stock (angled wood) --
    drawer.fillPath([
        { x: 0, y: 5 },
        { x: 6, y: 4 },
        { x: 6, y: 8 },
        { x: 0, y: 9 }
    ], cWood);
    drawer.hLine(1, 5, 5, cWoodLight);    // Top wood grain
    drawer.hLine(2, 6, 3, cWoodLight);    // Mid grain
    drawer.vLine(0, 5, 4, cWoodDark);     // Buttpad
    drawer.pixel(0, 6, cMetalDark);       // Buttpad accent
    drawer.pixel(0, 7, cMetalDark);

    // -- Receiver (metal action body) --
    drawer.rect(6, 4, 5, 5, cMetalDark);
    drawer.hLine(6, 4, 5, cMetalLight);   // Top rail
    drawer.hLine(6, 8, 5, cBlack);        // Bottom shadow
    drawer.rect(7, 5, 3, 2, cMetal);      // Receiver detail
    drawer.pixel(8, 5, cMetalLight);      // Ejector/latch

    // -- Rear Sight --
    drawer.rect(7, 2, 2, 2, cMetalDark);
    drawer.pixel(7, 2, cMetalLight);
    drawer.pixel(8, 2, cMetalLight);

    // -- Hinge Pin --
    drawer.rect(11, 4, 1, 5, cMetalLight);
    drawer.pixel(11, 6, cBlack);          // Hinge pin center
    drawer.pixel(11, 4, cMetal);
    drawer.pixel(11, 8, cMetal);

    // -- Large Barrel (the M79's defining feature) --
    // Top barrel surface
    drawer.fillPath([
        { x: 12, y: 3 },
        { x: 22, y: 3 },
        { x: 23, y: 4 },
        { x: 12, y: 4 }
    ], cMetalLight);
    // Main barrel body
    drawer.rect(12, 4, 11, 5, cMetal);
    // Bottom barrel surface
    drawer.fillPath([
        { x: 12, y: 9 },
        { x: 23, y: 9 },
        { x: 22, y: 10 },
        { x: 12, y: 10 }
    ], cMetalDark);
    // Barrel shading (rounded appearance)
    drawer.hLine(12, 5, 10, cMetalLight); // Upper highlight
    drawer.hLine(12, 8, 10, cMetalDark);  // Lower shadow

    // -- Muzzle (large bore opening) --
    drawer.rect(23, 4, 1, 5, cMetalDark);
    drawer.pixel(23, 5, cBore);           // Bore opening
    drawer.pixel(23, 6, cBore);
    drawer.pixel(23, 7, cBore);

    // -- Front Sight --
    drawer.pixel(20, 2, cMetalDark);
    drawer.pixel(20, 3, cMetalLight);

    // -- Barrel Band (decorative ring) --
    drawer.vLine(16, 3, 7, cMetalDark);
    drawer.pixel(16, 3, cMetalLight);

    // -- Trigger Guard --
    drawer.strokePath([
        { x: 8, y: 9 },
        { x: 9, y: 11 },
        { x: 11, y: 9 }
    ], cMetal);
    drawer.pixel(9, 9, cMetalLight);      // Trigger

    // -- Pistol Grip --
    drawer.fillPath([
        { x: 7, y: 9 },
        { x: 10, y: 9 },
        { x: 9, y: 13 },
        { x: 6, y: 13 }
    ], cGrip);
    drawer.vLine(8, 10, 3, cMetalDark);   // Grip texture
    drawer.pixel(7, 12, cWoodDark);       // Grip bottom

    return drawer.getCanvas();
}

export const GRENADE_LAUNCHER_SPRITE = generateGrenadeLauncher();
