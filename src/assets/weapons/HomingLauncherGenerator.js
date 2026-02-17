import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateHomingLauncher() {
    const width = 28;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#37474f';
    const cBodyLight = '#546e7a';
    const cDark = '#263238';
    const cGrip = '#1a1a1a';
    const cRed = '#e74c3c';
    const cRedBright = '#ff6b6b';
    const cOrange = '#e67e22';
    const cMetal = '#78909c';
    const cScreen = '#2ecc71';

    // Stock
    drawer.fillPath([
        {x: 0, y: 5}, {x: 4, y: 5}, {x: 4, y: 9}, {x: 0, y: 8}
    ], cDark);
    drawer.hLine(1, 5, 3, cBodyLight);

    // Receiver body
    drawer.rect(4, 3, 14, 7, cBody);
    drawer.hLine(4, 3, 14, cBodyLight);
    drawer.hLine(4, 9, 14, cDark);

    // Targeting computer
    drawer.rect(6, 1, 5, 2, cDark);
    drawer.rect(7, 1, 3, 2, cScreen);
    drawer.pixel(8, 1, '#ffffff');

    // Missile tube housing
    drawer.rect(8, 4, 8, 5, cDark);
    drawer.rect(9, 4, 6, 5, cMetal);
    // Missile visible inside
    drawer.rect(10, 5, 4, 3, cRed);
    drawer.pixel(13, 6, cRedBright);

    // Pistol Grip
    drawer.fillPath([
        {x: 7, y: 10}, {x: 10, y: 10}, {x: 9, y: 13}, {x: 6, y: 13}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 9, y: 10}, {x: 10, y: 11}, {x: 12, y: 10}
    ], cBody);

    // Launch tube
    drawer.rect(18, 3, 8, 7, cBody);
    drawer.rect(19, 4, 6, 5, cDark);
    // Open bore
    drawer.rect(24, 4, 4, 5, cMetal);
    drawer.rect(25, 5, 2, 3, cDark);
    // Red ring at muzzle
    drawer.pixel(27, 4, cRed);
    drawer.pixel(27, 8, cRed);

    // Side detail
    drawer.pixel(5, 5, cOrange);
    drawer.pixel(5, 7, cOrange);

    return drawer.getCanvas();
}

export const HOMING_LAUNCHER_SPRITE = generateHomingLauncher();
