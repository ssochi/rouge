import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Dagger Generator
 * Dimensions: 16x8
 * Structure: Pommel → Leather grip → Small crossguard with gem → Short blade → Sharp tip
 */
export function generateDagger() {
    const drawer = new PixelDraw(16, 8);

    // Colors
    const cPommel = '#5d3a1a';
    const cWrap = '#4a3520';
    const cWrapLight = '#6b4a2a';
    const cGuard = '#c9a84c';
    const cGuardDark = '#7a6530';
    const cGem = '#2ecc71';
    const cBlade = '#b0b8c0';
    const cBladeLight = '#e8e8e8';
    const cBladeDark = '#78838c';

    // -- Pommel x=0-1 --
    drawer.rect(0, 3, 2, 2, cPommel);
    drawer.pixel(0, 3, cGuardDark);

    // -- Grip x=2-4 --
    drawer.rect(2, 3, 3, 2, cWrap);
    drawer.pixel(3, 3, cWrapLight);
    drawer.pixel(4, 4, cWrapLight);

    // -- Crossguard x=5-6 --
    drawer.rect(5, 2, 2, 4, cGuard);
    drawer.pixel(5, 2, cGuardDark);
    drawer.pixel(6, 5, cGuardDark);
    // Green gem
    drawer.pixel(5, 3, cGem);
    drawer.pixel(6, 4, cGem);

    // -- Blade x=7-13 --
    drawer.rect(7, 3, 7, 2, cBlade);
    // Spine (dark top)
    drawer.hLine(7, 3, 7, cBladeDark);
    // Edge (bright bottom)
    drawer.hLine(7, 4, 5, cBladeLight);

    // -- Tip taper x=14-15 --
    drawer.pixel(14, 3, cBlade);
    drawer.pixel(14, 4, cBladeLight);
    drawer.pixel(15, 3, cBladeLight);

    return drawer.getCanvas();
}

export const DAGGER_SPRITE = generateDagger();
