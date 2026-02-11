import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Greatsword Generator
 * Dimensions: 32x12
 * Structure: Gold pommel → Long wrapped handle → Large crossguard → Wide blade with fuller → Tapered tip
 */
export function generateGreatsword() {
    const drawer = new PixelDraw(32, 12);

    // Colors
    const cPommel = '#c9a84c';
    const cPommelDark = '#7a6530';
    const cWrap = '#4a3520';
    const cWrapLight = '#6b4a2a';
    const cGuard = '#c9a84c';
    const cGuardDark = '#7a6530';
    const cBlade = '#b0b8c0';
    const cBladeLight = '#e8e8e8';
    const cBladeDark = '#78838c';
    const cFuller = '#95a0a8';

    // -- Pommel x=0-1 --
    drawer.rect(0, 5, 2, 3, cPommel);
    drawer.pixel(0, 5, cPommelDark);
    drawer.pixel(1, 7, cPommelDark);

    // -- Long handle x=2-7 --
    drawer.rect(2, 5, 6, 3, cWrap);
    // Wrap pattern
    drawer.pixel(3, 5, cWrapLight);
    drawer.pixel(5, 6, cWrapLight);
    drawer.pixel(7, 5, cWrapLight);
    drawer.pixel(4, 7, cWrapLight);
    drawer.pixel(6, 7, cWrapLight);

    // -- Large crossguard x=8-9 --
    drawer.rect(8, 3, 2, 7, cGuard);
    drawer.pixel(8, 3, cGuardDark);
    drawer.pixel(9, 9, cGuardDark);
    drawer.pixel(8, 9, cGuardDark);
    drawer.pixel(9, 3, cGuardDark);

    // -- Wide blade x=10-27 (4px tall) --
    drawer.rect(10, 4, 18, 4, cBlade);
    // Spine (dark top)
    drawer.hLine(10, 4, 18, cBladeDark);
    // Edge (bright bottom)
    drawer.hLine(10, 7, 16, cBladeLight);
    // Fuller (central groove)
    drawer.hLine(12, 5, 12, cFuller);
    drawer.hLine(12, 6, 12, cFuller);

    // -- Taper x=28-29 --
    drawer.rect(28, 4, 2, 3, cBlade);
    drawer.pixel(28, 4, cBladeDark);
    drawer.hLine(28, 6, 2, cBladeLight);

    // -- Tip x=30-31 --
    drawer.pixel(30, 5, cBladeLight);
    drawer.pixel(31, 5, cBladeLight);
    drawer.pixel(30, 4, cBlade);
    drawer.pixel(30, 6, cBlade);

    return drawer.getCanvas();
}

export const GREATSWORD_SPRITE = generateGreatsword();
