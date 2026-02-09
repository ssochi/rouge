import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createNightstandSprite() {
    const w = 16;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodHighlight, cWoodGrain, cGold, cGoldDark, cShadow, cShadowDeep } = FurniturePalette;

    const topH = 6;
    const frontH = 14;
    const legH = 4;

    // 1. Rear Legs (darker, tapered)
    drawer.fillPath([
        {x: 2, y: h - legH}, {x: 4, y: h - legH},
        {x: 3, y: h}, {x: 2, y: h}
    ], cWoodDark);
    drawer.fillPath([
        {x: w - 4, y: h - legH}, {x: w - 2, y: h - legH},
        {x: w - 2, y: h}, {x: w - 3, y: h}
    ], cWoodDark);

    // 2. Main Body Front Face (chamfered bottom corners)
    const by = topH;
    drawer.fillPath([
        {x: 0, y: by}, {x: w, y: by},
        {x: w, y: by + frontH - 1},
        {x: w - 1, y: by + frontH},
        {x: 1, y: by + frontH},
        {x: 0, y: by + frontH - 1}
    ], cWood);

    // Wood grain
    drawer.hLine(2, by + 5, 5, cWoodGrain);
    drawer.hLine(8, by + 10, 4, cWoodGrain);

    // 3. Drawer recesses
    const drawH = 5;
    const drawM = 2;
    const drawW = w - drawM * 2;

    // Top Drawer
    drawer.fillPath([
        {x: drawM, y: by + 2}, {x: drawM + drawW, y: by + 2},
        {x: drawM + drawW, y: by + 2 + drawH}, {x: drawM, y: by + 2 + drawH}
    ], cShadowDeep);
    drawer.fillPath([
        {x: drawM + 1, y: by + 3}, {x: drawM + drawW - 1, y: by + 3},
        {x: drawM + drawW - 1, y: by + 2 + drawH - 1}, {x: drawM + 1, y: by + 2 + drawH - 1}
    ], cWood);
    drawer.hLine(drawM + 1, by + 3, drawW - 2, cWoodHighlight);
    drawer.vLine(drawM + 1, by + 3, drawH - 2, cWoodHighlight);
    drawer.hLine(drawM + 1, by + 2 + drawH - 1, drawW - 2, cWoodDark);
    drawer.vLine(drawM + drawW - 1, by + 3, drawH - 2, cWoodDark);
    drawer.pixel(w / 2 - 1, by + 4, cGold);
    drawer.pixel(w / 2, by + 4, cGoldDark);

    // Bottom Drawer
    const d2y = by + 2 + drawH + 1;
    drawer.fillPath([
        {x: drawM, y: d2y}, {x: drawM + drawW, y: d2y},
        {x: drawM + drawW, y: d2y + drawH}, {x: drawM, y: d2y + drawH}
    ], cShadowDeep);
    drawer.fillPath([
        {x: drawM + 1, y: d2y + 1}, {x: drawM + drawW - 1, y: d2y + 1},
        {x: drawM + drawW - 1, y: d2y + drawH - 1}, {x: drawM + 1, y: d2y + drawH - 1}
    ], cWood);
    drawer.hLine(drawM + 1, d2y + 1, drawW - 2, cWoodHighlight);
    drawer.vLine(drawM + 1, d2y + 1, drawH - 2, cWoodHighlight);
    drawer.hLine(drawM + 1, d2y + drawH - 1, drawW - 2, cWoodDark);
    drawer.vLine(drawM + drawW - 1, d2y + 1, drawH - 2, cWoodDark);
    drawer.pixel(w / 2 - 1, d2y + 2, cGold);
    drawer.pixel(w / 2, d2y + 2, cGoldDark);

    // 4. Top Face
    drawer.fillPath([
        {x: 0, y: 0}, {x: w, y: 0},
        {x: w, y: topH}, {x: 0, y: topH}
    ], cWoodDark);
    drawer.fillPath([
        {x: 1, y: 1}, {x: w - 1, y: 1},
        {x: w - 1, y: topH - 1}, {x: 1, y: topH - 1}
    ], cWood);

    // 5. Natural edges (not strokePath)
    drawer.hLine(1, 0, w - 2, cWoodHighlight);
    drawer.vLine(0, 1, topH + frontH - 2, cWoodHighlight);
    drawer.vLine(w - 1, 1, topH + frontH - 2, cWoodDark);
    drawer.hLine(1, by + frontH, w - 2, cWoodDark);

    // 6. Per-section shadow overlays
    // Top face shadow
    drawer.fillPath([
        {x: w - 3, y: 1}, {x: w - 1, y: 1},
        {x: w - 1, y: topH - 1}, {x: w - 3, y: topH - 1}
    ], cShadow);
    // Front face shadow (narrower, different plane)
    drawer.fillPath([
        {x: w - 2, y: topH + 1}, {x: w - 1, y: topH + 1},
        {x: w - 1, y: by + frontH - 1}, {x: w - 2, y: by + frontH - 1}
    ], cShadow);

    return drawer.getCanvas();
}
