import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Spear Generator
 * Dimensions: 30x6
 * Structure: Metal butt cap → Wood shaft → Red leather wraps → Metal socket → Leaf-shaped spearhead
 */
export function generateSpear() {
    const drawer = new PixelDraw(30, 6);

    // Colors
    const cShaft = '#8d6e63';
    const cShaftDark = '#6d4c41';
    const cMetal = '#b0b8c0';
    const cMetalLight = '#e8e8e8';
    const cMetalDark = '#78838c';
    const cWrap = '#c0392b';
    const cWrapLight = '#e74c3c';

    // -- Butt cap x=0-1 --
    drawer.rect(0, 2, 2, 2, cMetalDark);
    drawer.pixel(0, 2, cMetal);

    // -- Shaft x=2-20 --
    drawer.rect(2, 2, 19, 2, cShaft);
    // Top shadow
    drawer.hLine(2, 2, 19, cShaftDark);

    // -- Grip wrap 1 x=3-6 --
    drawer.rect(3, 2, 4, 2, cWrap);
    drawer.pixel(4, 2, cWrapLight);
    drawer.pixel(6, 3, cWrapLight);

    // -- Grip wrap 2 x=9-11 --
    drawer.rect(9, 2, 3, 2, cWrap);
    drawer.pixel(10, 2, cWrapLight);

    // -- Socket x=21-22 --
    drawer.rect(21, 1, 2, 4, cMetalDark);
    drawer.pixel(21, 2, cMetal);
    drawer.pixel(22, 3, cMetal);

    // -- Spearhead blade x=23-28 (leaf-shaped) --
    drawer.rect(23, 2, 6, 2, cMetal);
    // Wider leaf shape
    drawer.pixel(23, 1, cMetal);
    drawer.pixel(23, 4, cMetal);
    drawer.pixel(24, 1, cMetal);
    drawer.pixel(24, 4, cMetal);
    // Spine (dark)
    drawer.hLine(23, 2, 6, cMetalDark);
    // Edge (bright)
    drawer.hLine(23, 3, 5, cMetalLight);
    // Leaf taper
    drawer.pixel(27, 2, cMetalLight);

    // -- Tip x=29 --
    drawer.pixel(29, 2, cMetalLight);

    return drawer.getCanvas();
}

export const SPEAR_SPRITE = generateSpear();
