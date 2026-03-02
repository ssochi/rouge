import { PixelDraw } from '../../utils/PixelDraw.js';

export function generatePhantomPistol() {
    const width = 20;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#1a237e';
    const cBodyLight = '#283593';
    const cDark = '#0d1b3e';
    const cGrip = '#1a1a1a';
    const cGhost = '#b388ff';
    const cGhostBright = '#d1c4e9';
    const cCyan = '#18ffff';
    const cMetal = '#546e7a';

    // Frame body (sleek, angular)
    drawer.rect(3, 4, 10, 5, cBody);
    drawer.hLine(3, 4, 10, cBodyLight);
    drawer.hLine(3, 8, 10, cDark);

    // Phase crystal chamber
    drawer.rect(6, 4, 4, 5, cDark);
    drawer.rect(7, 5, 2, 3, cGhost);
    drawer.pixel(7, 5, cGhostBright);
    drawer.pixel(8, 6, cCyan);
    drawer.pixel(7, 7, cGhost);

    // Grip
    drawer.fillPath([
        {x: 5, y: 9}, {x: 8, y: 9}, {x: 7, y: 13}, {x: 4, y: 13}
    ], cGrip);
    // Grip accent
    drawer.vLine(6, 10, 2, cGhost);

    // Trigger guard
    drawer.strokePath([
        {x: 8, y: 9}, {x: 9, y: 10}, {x: 11, y: 9}
    ], cBody);

    // Barrel (ethereal design)
    drawer.rect(13, 5, 4, 3, cBody);
    drawer.hLine(13, 5, 4, cBodyLight);
    drawer.hLine(14, 6, 2, cDark);

    // Muzzle with phase emitter
    drawer.rect(17, 4, 3, 5, cMetal);
    drawer.pixel(19, 4, cGhost);
    drawer.pixel(19, 5, cCyan);
    drawer.pixel(19, 6, cGhostBright);
    drawer.pixel(19, 7, cCyan);
    drawer.pixel(19, 8, cGhost);

    // Spectral wisps on body
    drawer.pixel(4, 4, cGhost);
    drawer.pixel(11, 4, cCyan);

    // Top sight
    drawer.rect(5, 3, 2, 1, cDark);
    drawer.pixel(5, 3, cCyan);

    // Hammer
    drawer.rect(2, 3, 2, 2, cBody);
    drawer.pixel(2, 3, cGhostBright);

    return drawer.getCanvas();
}

export const PHANTOM_PISTOL_SPRITE = generatePhantomPistol();
