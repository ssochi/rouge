import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateAcidGun() {
    const width = 24;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#2e7d32';
    const cBodyLight = '#388e3c';
    const cDark = '#1b5e20';
    const cGrip = '#1a1a1a';
    const cAcid = '#76ff03';
    const cAcidGlow = '#ccff90';
    const cAcidDark = '#64dd17';
    const cTank = '#33691e';
    const cMetal = '#757575';
    const cYellow = '#fdd835';

    // Receiver body
    drawer.rect(3, 4, 11, 5, cBody);
    drawer.hLine(3, 4, 11, cBodyLight);
    drawer.hLine(3, 8, 11, cDark);

    // Acid tank
    drawer.rect(4, 9, 7, 3, cTank);
    drawer.hLine(4, 9, 7, cDark);
    drawer.rect(6, 9, 3, 1, cAcid);
    drawer.pixel(7, 10, cAcidGlow);
    drawer.pixel(5, 11, cAcidDark);

    // Acid chamber
    drawer.rect(6, 5, 4, 3, cDark);
    drawer.rect(7, 5, 2, 3, cAcid);
    drawer.pixel(7, 6, cAcidGlow);

    // Warning stripe
    drawer.pixel(4, 5, cYellow);
    drawer.pixel(4, 7, cYellow);

    // Rear plate
    drawer.rect(1, 5, 2, 3, cDark);
    drawer.pixel(2, 6, cMetal);

    // Pistol Grip
    drawer.fillPath([
        {x: 6, y: 9}, {x: 9, y: 9}, {x: 8, y: 13}, {x: 5, y: 13}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 8, y: 9}, {x: 9, y: 10}, {x: 11, y: 9}
    ], cBody);

    // Barrel
    drawer.rect(14, 5, 6, 3, cBody);
    drawer.hLine(14, 5, 6, cMetal);
    drawer.hLine(15, 6, 4, cAcidDark);

    // Nozzle
    drawer.rect(20, 4, 4, 5, cDark);
    drawer.rect(21, 4, 2, 5, cMetal);
    drawer.pixel(23, 5, cAcid);
    drawer.pixel(23, 6, cAcidGlow);
    drawer.pixel(23, 7, cAcid);
    // Drip detail
    drawer.pixel(22, 9, cAcid);

    return drawer.getCanvas();
}

export const ACID_GUN_SPRITE = generateAcidGun();
