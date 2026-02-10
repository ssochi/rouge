import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Katana Generator
 * Dimensions: 28x10
 * Structure: Kashira (pommel) → Tsuka (handle) → Tsuba (guard) → Blade → Kissaki (tip)
 */
export function generateKatana() {
    const width = 28;
    const height = 10;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cPommel = '#4a3520';
    const cWrap = '#5d1a1a';
    const cWrapLight = '#8b3a3a';
    const cGuard = '#c9a84c';
    const cGuardDark = '#7a6530';
    const cBlade = '#b0b8c0';
    const cBladeLight = '#e8e8e8';
    const cBladeDark = '#78838c';
    const cHamon = '#c8cfd6';

    // -- Kashira (Pommel) x=0-1 --
    drawer.rect(0, 4, 2, 3, cPommel);

    // -- Tsuka (Handle wrap) x=2-5 --
    drawer.rect(2, 4, 4, 3, cWrap);
    // Diamond wrap pattern
    drawer.pixel(2, 5, cWrapLight);
    drawer.pixel(4, 4, cWrapLight);
    drawer.pixel(3, 6, cWrapLight);
    drawer.pixel(5, 5, cWrapLight);

    // -- Tsuba (Guard) x=6-7 --
    drawer.rect(6, 3, 2, 5, cGuard);
    drawer.pixel(6, 3, cGuardDark);
    drawer.pixel(7, 7, cGuardDark);
    drawer.pixel(6, 7, cGuardDark);
    drawer.pixel(7, 3, cGuardDark);

    // -- Blade body x=8-23 --
    // Main blade (3px tall)
    drawer.rect(8, 4, 16, 3, cBlade);

    // Back edge (mune) - darker top
    drawer.hLine(8, 4, 16, cBladeDark);

    // Cutting edge (ha) - bright bottom highlight
    drawer.hLine(8, 6, 14, cBladeLight);

    // Hamon (temper line) - subtle wave pattern
    drawer.pixel(10, 5, cHamon);
    drawer.pixel(13, 6, cHamon);
    drawer.pixel(16, 5, cHamon);
    drawer.pixel(19, 6, cHamon);
    drawer.pixel(22, 5, cHamon);

    // -- Blade taper x=24-25 --
    drawer.rect(24, 4, 2, 2, cBlade);
    drawer.pixel(24, 4, cBladeDark);
    drawer.hLine(24, 5, 2, cBladeLight);

    // -- Kissaki (tip) x=26-27 --
    drawer.pixel(26, 4, cBladeLight);
    drawer.pixel(27, 4, cBladeLight);
    drawer.pixel(26, 5, cBlade);

    return drawer.getCanvas();
}

export const KATANA_SPRITE = generateKatana();
