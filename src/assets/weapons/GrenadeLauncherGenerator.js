import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Grenade Launcher Generator (M79 Style)
 * Dimensions: 24x14
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
    const cGrip = '#2c3e50';
    const cBlack = '#1a1a1a';

    // Stock
    drawer.fillPath([
        { x: 0, y: 5 },
        { x: 6, y: 4 },
        { x: 6, y: 8 },
        { x: 1, y: 9 }
    ], cWood);
    drawer.hLine(1, 5, 4, cWoodLight);
    drawer.vLine(0, 5, 4, cMetalDark);

    // Receiver
    drawer.rect(6, 5, 6, 4, cMetalDark);
    drawer.hLine(6, 5, 6, cMetalLight);
    drawer.rect(8, 6, 2, 1, cBlack);

    // Hinge
    drawer.rect(12, 5, 1, 4, cMetalLight);
    drawer.pixel(12, 7, cBlack);

    // Large barrel
    drawer.fillPath([
        { x: 13, y: 4 },
        { x: 22, y: 4 },
        { x: 23, y: 5 },
        { x: 23, y: 8 },
        { x: 22, y: 9 },
        { x: 13, y: 9 }
    ], cMetal);
    drawer.hLine(14, 4, 8, cMetalLight);
    drawer.hLine(14, 9, 8, cMetalDark);
    drawer.pixel(23, 6, cBlack);
    drawer.pixel(23, 7, cBlack);

    // Trigger group
    drawer.fillPath([
        { x: 8, y: 9 },
        { x: 11, y: 9 },
        { x: 10, y: 11 },
        { x: 7, y: 11 }
    ], cGrip);
    drawer.pixel(9, 9, cMetalLight);

    // Grip
    drawer.fillPath([
        { x: 8, y: 11 },
        { x: 11, y: 11 },
        { x: 10, y: 13 },
        { x: 7, y: 13 }
    ], cGrip);
    drawer.vLine(9, 11, 2, cMetalDark);

    return drawer.getCanvas();
}

export const GRENADE_LAUNCHER_SPRITE = generateGrenadeLauncher();
