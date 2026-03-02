import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateGaleShotgun() {
    const width = 26;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#607d8b';
    const cBodyLight = '#90a4ae';
    const cDark = '#37474f';
    const cGrip = '#1a1a1a';
    const cMetal = '#b0bec5';
    const cWind = '#81d4fa';
    const cWindBright = '#b3e5fc';
    const cAccent = '#4fc3f7';

    // Stock (angular, aerodynamic shape)
    drawer.fillPath([
        {x: 0, y: 5}, {x: 4, y: 4}, {x: 4, y: 9}, {x: 0, y: 8}
    ], cBody);
    drawer.hLine(0, 5, 4, cBodyLight);

    // Receiver body
    drawer.rect(4, 3, 10, 7, cBody);
    drawer.hLine(4, 3, 10, cBodyLight);
    drawer.hLine(4, 9, 10, cDark);

    // Wind turbine chamber (unique feature)
    drawer.rect(7, 4, 4, 5, cDark);
    drawer.ellipse(9, 6, 1.5, 1.5, cAccent);
    drawer.pixel(9, 5, cWindBright);
    drawer.pixel(8, 6, cWind);
    drawer.pixel(10, 7, cWind);

    // Grip
    drawer.fillPath([
        {x: 6, y: 10}, {x: 9, y: 10}, {x: 8, y: 13}, {x: 5, y: 13}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 9, y: 10}, {x: 10, y: 11}, {x: 12, y: 10}
    ], cBody);

    // Wide barrel (multi-bore shotgun)
    drawer.rect(14, 3, 8, 8, cBody);
    drawer.rect(15, 4, 6, 6, cDark);
    // 4 bore holes
    drawer.pixel(16, 5, cMetal);
    drawer.pixel(19, 5, cMetal);
    drawer.pixel(16, 8, cMetal);
    drawer.pixel(19, 8, cMetal);
    drawer.hLine(14, 3, 8, cMetal);

    // Muzzle flare tips
    drawer.rect(22, 2, 4, 10, cMetal);
    drawer.rect(23, 3, 2, 8, cDark);
    // Wind streaks at muzzle
    drawer.pixel(25, 4, cWind);
    drawer.pixel(25, 6, cAccent);
    drawer.pixel(25, 9, cWind);

    // Top sight with wind indicator
    drawer.rect(5, 2, 3, 1, cDark);
    drawer.pixel(6, 2, cAccent);

    return drawer.getCanvas();
}

export const GALE_SHOTGUN_SPRITE = generateGaleShotgun();
