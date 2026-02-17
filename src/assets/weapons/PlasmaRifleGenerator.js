import { PixelDraw } from '../../utils/PixelDraw.js';

export function generatePlasmaRifle() {
    const width = 26;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#2c3e50';
    const cBodyLight = '#34495e';
    const cDark = '#1a252f';
    const cGrip = '#1a1a1a';
    const cPlasma = '#00e676';
    const cPlasmaGlow = '#69f0ae';
    const cPlasmaDark = '#00c853';
    const cCyan = '#00e5ff';
    const cMetal = '#78909c';

    // Stock
    drawer.fillPath([
        {x: 0, y: 5}, {x: 4, y: 5}, {x: 4, y: 9}, {x: 0, y: 8}
    ], cBody);
    drawer.hLine(1, 5, 3, cBodyLight);
    drawer.pixel(1, 7, cPlasma);

    // Receiver body
    drawer.rect(4, 4, 12, 6, cBody);
    drawer.hLine(4, 4, 12, cBodyLight);
    drawer.hLine(4, 9, 12, cDark);

    // Plasma chamber
    drawer.rect(8, 5, 5, 4, cDark);
    drawer.rect(9, 5, 3, 4, cPlasmaDark);
    drawer.rect(9, 6, 3, 2, cPlasma);
    drawer.pixel(10, 6, cPlasmaGlow);
    drawer.pixel(11, 7, cCyan);

    // Heat vents
    drawer.pixel(6, 5, cMetal);
    drawer.pixel(6, 7, cMetal);
    drawer.pixel(14, 5, cMetal);
    drawer.pixel(14, 7, cMetal);

    // Pistol Grip
    drawer.fillPath([
        {x: 7, y: 10}, {x: 10, y: 10}, {x: 9, y: 13}, {x: 6, y: 13}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 10, y: 10}, {x: 11, y: 11}, {x: 13, y: 10}
    ], cBody);

    // Barrel with plasma conduit
    drawer.rect(16, 5, 6, 3, cBody);
    drawer.hLine(16, 5, 6, cMetal);
    drawer.hLine(17, 6, 4, cPlasma);

    // Emitter nozzle
    drawer.rect(22, 4, 4, 5, cDark);
    drawer.rect(23, 4, 2, 5, cBody);
    drawer.pixel(25, 5, cPlasma);
    drawer.pixel(25, 6, cPlasmaGlow);
    drawer.pixel(25, 7, cPlasma);
    drawer.pixel(25, 8, cCyan);

    // Top rail/sight
    drawer.rect(6, 3, 3, 1, cDark);
    drawer.pixel(7, 3, cPlasma);

    return drawer.getCanvas();
}

export const PLASMA_RIFLE_SPRITE = generatePlasmaRifle();
