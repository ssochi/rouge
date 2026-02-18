import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateNeedleGun() {
    const width = 26;
    const height = 12;
    const drawer = new PixelDraw(width, height);

    const cBody = '#546e7a';
    const cBodyLight = '#78909c';
    const cDark = '#37474f';
    const cGrip = '#1a1a1a';
    const cChrome = '#b0bec5';
    const cNeedle = '#e0e0e0';
    const cGauge = '#fdd835';

    // Stock
    drawer.fillPath([
        {x: 0, y: 4}, {x: 3, y: 4}, {x: 3, y: 8}, {x: 0, y: 7}
    ], cBody);
    drawer.hLine(0, 4, 3, cBodyLight);

    // Receiver body
    drawer.rect(3, 3, 10, 6, cBody);
    drawer.hLine(3, 3, 10, cBodyLight);
    drawer.hLine(3, 8, 10, cDark);

    // Ammo drum (cylindrical)
    drawer.rect(6, 4, 5, 4, cDark);
    drawer.rect(7, 4, 3, 4, cBody);
    // Needle tips visible
    drawer.pixel(7, 4, cNeedle);
    drawer.pixel(9, 4, cNeedle);
    drawer.pixel(8, 7, cNeedle);

    // Pressure gauge
    drawer.pixel(5, 5, cGauge);
    drawer.pixel(5, 6, cGauge);

    // Grip
    drawer.fillPath([
        {x: 6, y: 9}, {x: 9, y: 9}, {x: 8, y: 11}, {x: 5, y: 11}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 9, y: 9}, {x: 10, y: 10}, {x: 12, y: 9}
    ], cBody);

    // Pneumatic barrel (long thin)
    drawer.rect(13, 4, 10, 3, cChrome);
    drawer.hLine(13, 4, 10, cNeedle);
    drawer.hLine(13, 6, 10, cDark);

    // Barrel inner channel
    drawer.hLine(15, 5, 6, cBody);

    // Needle tip at muzzle
    drawer.rect(23, 4, 3, 3, cChrome);
    drawer.pixel(25, 5, cNeedle);

    // Top rail
    drawer.rect(4, 2, 3, 1, cDark);
    drawer.pixel(5, 2, cChrome);

    return drawer.getCanvas();
}

export const NEEDLE_GUN_SPRITE = generateNeedleGun();
