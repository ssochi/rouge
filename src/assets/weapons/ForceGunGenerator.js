import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateForceGun() {
    const width = 26;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#455a64';
    const cBodyLight = '#607d8b';
    const cDark = '#263238';
    const cGrip = '#1a1a1a';
    const cBlue = '#42a5f5';
    const cBlueBright = '#90caf9';
    const cBlueDark = '#1565c0';
    const cWhite = '#ecf0f1';
    const cMetal = '#b0bec5';

    // Stock
    drawer.fillPath([
        {x: 0, y: 4}, {x: 5, y: 4}, {x: 5, y: 9}, {x: 0, y: 8}
    ], cBody);
    drawer.hLine(1, 4, 4, cBodyLight);
    drawer.pixel(2, 6, cBlue);
    drawer.rect(0, 5, 1, 3, cDark);

    // Receiver body
    drawer.rect(5, 3, 12, 7, cBody);
    drawer.hLine(5, 3, 12, cBodyLight);
    drawer.hLine(5, 9, 12, cDark);

    // Force capacitor
    drawer.rect(8, 4, 5, 5, cDark);
    drawer.rect(9, 4, 3, 5, cBlueDark);
    drawer.rect(9, 5, 3, 3, cBlue);
    drawer.pixel(10, 5, cBlueBright);
    drawer.pixel(11, 6, cWhite);

    // Conduit lines
    drawer.pixel(6, 5, cBlue);
    drawer.pixel(6, 7, cBlue);
    drawer.pixel(14, 5, cBlue);
    drawer.pixel(14, 7, cBlue);

    // Pistol Grip
    drawer.fillPath([
        {x: 8, y: 10}, {x: 11, y: 10}, {x: 10, y: 13}, {x: 7, y: 13}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 10, y: 10}, {x: 11, y: 11}, {x: 13, y: 10}
    ], cBody);

    // Wide barrel
    drawer.rect(17, 3, 5, 7, cBody);
    drawer.hLine(17, 3, 5, cMetal);
    drawer.hLine(18, 5, 3, cBlue);
    drawer.hLine(18, 7, 3, cBlue);

    // Flared emitter
    drawer.rect(22, 1, 4, 11, cDark);
    drawer.rect(23, 2, 2, 9, cMetal);
    drawer.pixel(25, 3, cBlue);
    drawer.pixel(25, 5, cBlueBright);
    drawer.pixel(25, 6, cWhite);
    drawer.pixel(25, 7, cBlueBright);
    drawer.pixel(25, 9, cBlue);

    // Top rail
    drawer.rect(7, 2, 3, 1, cMetal);
    drawer.pixel(8, 2, cBlue);

    return drawer.getCanvas();
}

export const FORCE_GUN_SPRITE = generateForceGun();
