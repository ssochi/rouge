import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateClusterGun() {
    const width = 24;
    const height = 16;
    const drawer = new PixelDraw(width, height);

    const cBody = '#795548';
    const cBodyLight = '#8d6e63';
    const cDark = '#4e342e';
    const cGrip = '#1a1a1a';
    const cOrange = '#ff9800';
    const cOrangeBright = '#ffb74d';
    const cRed = '#f44336';
    const cMetal = '#9e9e9e';
    const cMetalDark = '#757575';

    // Receiver body
    drawer.rect(3, 4, 11, 7, cBody);
    drawer.hLine(3, 4, 11, cBodyLight);
    drawer.hLine(3, 10, 11, cDark);

    // Cluster chamber
    drawer.rect(6, 5, 5, 5, cDark);
    drawer.rect(7, 5, 3, 5, cMetalDark);
    // Sub-munitions visible
    drawer.pixel(7, 6, cOrange);
    drawer.pixel(9, 6, cOrange);
    drawer.pixel(8, 7, cOrangeBright);
    drawer.pixel(7, 8, cOrange);
    drawer.pixel(9, 8, cOrange);

    // Warning marking
    drawer.pixel(4, 5, cRed);
    drawer.pixel(4, 7, cRed);

    // Rear plate
    drawer.rect(1, 5, 2, 4, cDark);
    drawer.pixel(2, 6, cMetal);

    // Pistol Grip
    drawer.fillPath([
        {x: 6, y: 11}, {x: 9, y: 11}, {x: 8, y: 15}, {x: 5, y: 15}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 9, y: 11}, {x: 10, y: 12}, {x: 12, y: 11}
    ], cBody);

    // Wide barrel
    drawer.rect(14, 4, 6, 7, cBody);
    drawer.rect(15, 5, 4, 5, cDark);
    drawer.hLine(14, 4, 6, cMetal);

    // Muzzle
    drawer.rect(20, 3, 4, 9, cMetalDark);
    drawer.rect(21, 4, 2, 7, cDark);
    // Orange ring
    drawer.pixel(23, 4, cOrange);
    drawer.pixel(23, 7, cOrangeBright);
    drawer.pixel(23, 10, cOrange);

    // Top rail
    drawer.rect(5, 3, 3, 1, cMetal);
    drawer.pixel(6, 3, cOrange);

    return drawer.getCanvas();
}

export const CLUSTER_GUN_SPRITE = generateClusterGun();
