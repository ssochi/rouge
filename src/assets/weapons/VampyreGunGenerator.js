import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateVampyreGun() {
    const width = 20;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#8b0000';
    const cBodyLight = '#a00000';
    const cDark = '#4a0000';
    const cGrip = '#1a1a1a';
    const cCrystal = '#e74c3c';
    const cCrystalGlow = '#ff6b6b';
    const cMetal = '#2c2c2c';

    // Frame/body
    drawer.rect(3, 4, 10, 5, cMetal);
    drawer.hLine(3, 4, 10, cBody);
    drawer.hLine(3, 8, 10, cDark);

    // Blood crystal chamber
    drawer.rect(7, 4, 4, 5, cDark);
    drawer.rect(8, 5, 2, 3, cCrystal);
    drawer.pixel(8, 5, cCrystalGlow);
    drawer.pixel(9, 6, cCrystalGlow);

    // Grip
    drawer.fillPath([
        {x: 5, y: 9}, {x: 8, y: 9}, {x: 7, y: 13}, {x: 4, y: 13}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 8, y: 9}, {x: 9, y: 10}, {x: 11, y: 9}
    ], cBody);

    // Barrel
    drawer.rect(13, 5, 4, 3, cBody);
    drawer.hLine(13, 5, 4, cBodyLight);
    drawer.hLine(14, 6, 2, cDark);

    // Muzzle fangs
    drawer.rect(17, 4, 3, 5, cMetal);
    drawer.pixel(19, 4, cCrystal);
    drawer.pixel(19, 5, cBody);
    drawer.pixel(19, 6, cDark);
    drawer.pixel(19, 7, cBody);
    drawer.pixel(19, 8, cCrystal);

    // Top sight
    drawer.rect(5, 3, 2, 1, cDark);
    drawer.pixel(5, 3, cCrystal);

    return drawer.getCanvas();
}

export const VAMPYRE_GUN_SPRITE = generateVampyreGun();
