import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createCabinetSprite() {
    // Low wooden cabinet/sideboard with double doors and decorative items on top.
    // Size: 48x24 (2x1 tile).
    const w = 48;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodHighlight, cWoodGrain, cGold, cGoldDark, cShadow, cShadowDeep } = FurniturePalette;

    const topH = 5;
    const frontH = 15;
    const legH = 4;

    // === Draw order: back-to-front ===

    // 1. Rear legs (top of sprite, farthest from camera)
    drawer.fillPath([
        {x: 2, y: 0}, {x: 4, y: 0},
        {x: 3, y: legH}, {x: 2, y: legH}
    ], cWoodDark);
    drawer.fillPath([
        {x: w - 4, y: 0}, {x: w - 2, y: 0},
        {x: w - 2, y: legH}, {x: w - 3, y: legH}
    ], cWoodDark);

    // 2. Front legs (near bottom)
    drawer.fillPath([
        {x: 2, y: h - legH}, {x: 4, y: h - legH},
        {x: 3, y: h}, {x: 2, y: h}
    ], cWoodDark);
    drawer.pixel(2, h - legH, cWoodHighlight);
    drawer.fillPath([
        {x: w - 4, y: h - legH}, {x: w - 2, y: h - legH},
        {x: w - 2, y: h}, {x: w - 3, y: h}
    ], cWoodDark);
    drawer.pixel(w - 4, h - legH, cWoodHighlight);

    // 3. Top surface (darker, shows depth from above)
    drawer.fillPath([
        {x: 0, y: topH - 3}, {x: w, y: topH - 3},
        {x: w, y: topH}, {x: 0, y: topH}
    ], cWoodDark);
    // Top surface inner area
    drawer.fillPath([
        {x: 1, y: topH - 2}, {x: w - 1, y: topH - 2},
        {x: w - 1, y: topH - 1}, {x: 1, y: topH - 1}
    ], cWoodLight);
    // Top edge highlight
    drawer.hLine(1, topH - 3, w - 2, cWoodHighlight);

    // 4. Front face panel (main body)
    drawer.fillPath([
        {x: 0, y: topH}, {x: w, y: topH},
        {x: w, y: topH + frontH - 1},
        {x: w - 1, y: topH + frontH},
        {x: 1, y: topH + frontH},
        {x: 0, y: topH + frontH - 1}
    ], cWood);

    // Wood grain detail
    drawer.hLine(4, topH + 5, 10, cWoodGrain);
    drawer.hLine(20, topH + 8, 8, cWoodGrain);
    drawer.hLine(34, topH + 6, 10, cWoodGrain);

    // 5. Left door panel (recessed bevel)
    const doorY = topH + 2;
    const doorH = frontH - 4;
    const doorW = 19;
    // Left door recess
    drawer.fillPath([
        {x: 3, y: doorY}, {x: 3 + doorW, y: doorY},
        {x: 3 + doorW, y: doorY + doorH}, {x: 3, y: doorY + doorH}
    ], cShadowDeep);
    // Left door panel
    drawer.fillPath([
        {x: 4, y: doorY + 1}, {x: 3 + doorW - 1, y: doorY + 1},
        {x: 3 + doorW - 1, y: doorY + doorH - 1}, {x: 4, y: doorY + doorH - 1}
    ], cWood);
    // Left door bevels
    drawer.hLine(4, doorY + 1, doorW - 2, cWoodHighlight);
    drawer.vLine(4, doorY + 1, doorH - 2, cWoodHighlight);
    drawer.hLine(4, doorY + doorH - 1, doorW - 2, cWoodDark);
    drawer.vLine(3 + doorW - 1, doorY + 1, doorH - 2, cWoodDark);

    // Right door panel (recessed bevel)
    const rdX = w - 3 - doorW;
    drawer.fillPath([
        {x: rdX, y: doorY}, {x: rdX + doorW, y: doorY},
        {x: rdX + doorW, y: doorY + doorH}, {x: rdX, y: doorY + doorH}
    ], cShadowDeep);
    drawer.fillPath([
        {x: rdX + 1, y: doorY + 1}, {x: rdX + doorW - 1, y: doorY + 1},
        {x: rdX + doorW - 1, y: doorY + doorH - 1}, {x: rdX + 1, y: doorY + doorH - 1}
    ], cWood);
    // Right door bevels
    drawer.hLine(rdX + 1, doorY + 1, doorW - 2, cWoodHighlight);
    drawer.vLine(rdX + 1, doorY + 1, doorH - 2, cWoodHighlight);
    drawer.hLine(rdX + 1, doorY + doorH - 1, doorW - 2, cWoodDark);
    drawer.vLine(rdX + doorW - 1, doorY + 1, doorH - 2, cWoodDark);

    // 6. Door handles (gold)
    drawer.pixel(3 + doorW - 3, doorY + Math.floor(doorH / 2), cGold);
    drawer.pixel(3 + doorW - 3, doorY + Math.floor(doorH / 2) + 1, cGoldDark);
    drawer.pixel(rdX + 2, doorY + Math.floor(doorH / 2), cGold);
    drawer.pixel(rdX + 2, doorY + Math.floor(doorH / 2) + 1, cGoldDark);

    // 7. Center gap
    drawer.vLine(w / 2, topH + 1, frontH - 2, cShadowDeep);

    // 8. Decorative items on top surface
    // Candle (left side)
    drawer.rect(8, topH - 6, 2, 3, '#f5f5dc');  // Candle body (cream)
    drawer.pixel(8, topH - 7, '#f39c12');  // Flame
    drawer.pixel(9, topH - 7, '#e67e22');  // Flame shadow

    // Small book stack (right side)
    drawer.rect(34, topH - 5, 7, 2, '#3498db');  // Bottom book
    drawer.hLine(34, topH - 5, 7, '#2980b9');
    drawer.rect(35, topH - 7, 5, 2, '#e74c3c');  // Top book
    drawer.hLine(35, topH - 7, 5, '#c0392b');

    // 9. Natural edge definition
    drawer.vLine(0, topH, frontH, cWoodHighlight);
    drawer.vLine(w - 1, topH, frontH, cWoodDark);
    drawer.hLine(1, topH + frontH, w - 2, cWoodDark);

    // 10. Per-section shadow overlays
    // Top surface right shadow
    drawer.fillPath([
        {x: w - 4, y: topH - 2}, {x: w - 1, y: topH - 2},
        {x: w - 1, y: topH - 1}, {x: w - 4, y: topH - 1}
    ], cShadow);
    // Front face right shadow
    drawer.fillPath([
        {x: w - 3, y: topH + 1}, {x: w - 1, y: topH + 1},
        {x: w - 1, y: topH + frontH - 1}, {x: w - 3, y: topH + frontH - 1}
    ], cShadow);

    return drawer.getCanvas();
}
