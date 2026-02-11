import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createFloorLampSprite() {
    // Standing floor lamp: circular base, thin pole, trapezoid lampshade.
    // Size: 16x40 (small footprint, tall).
    const w = 16;
    const h = 40;
    const drawer = new PixelDraw(w, h);

    const { cWoodDark, cWood, cGold, cGoldDark, cShadow } = FurniturePalette;

    // Lampshade warm palette
    const cShade = '#f5d76e';
    const cShadeDark = '#d4a017';
    const cShadeLight = '#f9e79f';
    const cShadeHighlight = '#fcf3cf';
    const cGlow = '#fef9e7';

    // === Draw order: base up to shade ===

    // 1. Base (flat ellipse at bottom)
    drawer.fillPath([
        {x: 4, y: h - 4}, {x: w - 4, y: h - 4},
        {x: w - 3, y: h - 3}, {x: w - 3, y: h - 2},
        {x: w - 4, y: h - 1}, {x: 4, y: h - 1},
        {x: 3, y: h - 2}, {x: 3, y: h - 3}
    ], cWoodDark);
    // Base top face
    drawer.hLine(5, h - 4, 6, cWood);
    // Base highlight
    drawer.hLine(5, h - 4, 4, FurniturePalette.cWoodHighlight);

    // 2. Pole (2px wide, centered)
    const poleX = 7;
    const poleTop = 12;
    const poleBottom = h - 4;
    drawer.rect(poleX, poleTop, 2, poleBottom - poleTop, cWoodDark);
    // Pole left highlight
    drawer.vLine(poleX, poleTop, poleBottom - poleTop, cWood);

    // 3. Gold joint ring at top of pole
    drawer.rect(6, poleTop, 4, 2, cGold);
    drawer.hLine(6, poleTop, 4, cGoldDark);

    // 4. Lampshade (trapezoid: narrower at top, wider at bottom)
    const shadeTop = 1;
    const shadeBottom = 12;
    const shadeH = shadeBottom - shadeTop;

    // Shade body (trapezoid shape)
    drawer.fillPath([
        {x: 5, y: shadeTop},
        {x: w - 5, y: shadeTop},
        {x: w - 2, y: shadeBottom},
        {x: 2, y: shadeBottom}
    ], cShade);

    // Shade left highlight strip
    drawer.fillPath([
        {x: 5, y: shadeTop + 1},
        {x: 7, y: shadeTop + 1},
        {x: 5, y: shadeBottom - 1},
        {x: 3, y: shadeBottom - 1}
    ], cShadeLight);

    // Shade right shadow strip
    drawer.fillPath([
        {x: w - 7, y: shadeTop + 1},
        {x: w - 5, y: shadeTop + 1},
        {x: w - 2, y: shadeBottom - 1},
        {x: w - 5, y: shadeBottom - 1}
    ], cShadeDark);

    // Shade top edge highlight
    drawer.hLine(5, shadeTop, w - 10, cShadeHighlight);

    // Shade bottom rim (slightly wider, darker)
    drawer.hLine(2, shadeBottom, w - 4, cShadeDark);
    drawer.hLine(3, shadeBottom + 1, w - 6, cGoldDark);

    // 5. Glow hint pixels above shade
    drawer.pixel(7, 0, cGlow);
    drawer.pixel(8, 0, cGlow);

    // 6. Shadow overlay on right side of shade
    drawer.fillPath([
        {x: w - 4, y: shadeTop + 2}, {x: w - 3, y: shadeTop + 2},
        {x: w - 2, y: shadeBottom - 1}, {x: w - 4, y: shadeBottom - 1}
    ], cShadow);

    return drawer.getCanvas();
}
