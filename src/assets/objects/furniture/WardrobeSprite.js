import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createWardrobeSprite() {
    const w = 32;
    const h = 56;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodOutline, cWoodHighlight, cWoodGrain, cGold, cGoldDark, cShadow, cShadowDeep } = FurniturePalette;

    const topH = 6;
    const baseH = 4;
    const bodyTop = topH;
    const bodyBot = h - baseH;
    const bodyH = bodyBot - bodyTop;

    // 1. Main Body (flush with plinth, chamfered bottom corners)
    drawer.fillPath([
        {x: 1, y: bodyTop}, {x: w - 1, y: bodyTop},
        {x: w - 1, y: bodyBot - 1},
        {x: w - 2, y: bodyBot},
        {x: 2, y: bodyBot},
        {x: 1, y: bodyBot - 1}
    ], cWood);

    // 2. Door panels
    const doorW = Math.floor((w - 6) / 2);
    const doorH = bodyH - 4;
    const doorY = bodyTop + 2;
    const midX = Math.floor(w / 2);

    // Left Door panel
    drawer.fillPath([
        {x: 3, y: doorY}, {x: midX - 1, y: doorY},
        {x: midX - 1, y: doorY + doorH}, {x: 3, y: doorY + doorH}
    ], cWoodDark);
    // Left door inner face
    drawer.fillPath([
        {x: 4, y: doorY + 1}, {x: midX - 2, y: doorY + 1},
        {x: midX - 2, y: doorY + doorH - 1}, {x: 4, y: doorY + doorH - 1}
    ], cWood);
    // Left door bevel (top-left light)
    drawer.hLine(4, doorY + 1, midX - 6, cWoodHighlight);
    drawer.vLine(4, doorY + 1, doorH - 2, cWoodHighlight);
    // Left door bevel (bottom-right dark)
    drawer.hLine(4, doorY + doorH - 1, midX - 6, cWoodDark);
    drawer.vLine(midX - 2, doorY + 1, doorH - 2, cWoodDark);
    // Left door wood grain
    drawer.vLine(8, doorY + 6, 16, cWoodGrain);
    drawer.vLine(12, doorY + 10, 12, cWoodGrain);

    // Right Door panel
    drawer.fillPath([
        {x: midX + 1, y: doorY}, {x: w - 3, y: doorY},
        {x: w - 3, y: doorY + doorH}, {x: midX + 1, y: doorY + doorH}
    ], cWoodDark);
    // Right door inner face
    drawer.fillPath([
        {x: midX + 2, y: doorY + 1}, {x: w - 4, y: doorY + 1},
        {x: w - 4, y: doorY + doorH - 1}, {x: midX + 2, y: doorY + doorH - 1}
    ], cWood);
    // Right door bevel
    drawer.hLine(midX + 2, doorY + 1, w - midX - 6, cWoodHighlight);
    drawer.vLine(midX + 2, doorY + 1, doorH - 2, cWoodHighlight);
    drawer.hLine(midX + 2, doorY + doorH - 1, w - midX - 6, cWoodDark);
    drawer.vLine(w - 4, doorY + 1, doorH - 2, cWoodDark);
    // Right door wood grain
    drawer.vLine(midX + 6, doorY + 8, 14, cWoodGrain);
    drawer.vLine(midX + 10, doorY + 4, 18, cWoodGrain);

    // 3. Center gap (deep shadow)
    drawer.vLine(midX, doorY, doorH, cShadowDeep);

    // 4. Handles (gold + shadow)
    const handleY = doorY + Math.floor(doorH / 2);
    drawer.pixel(midX - 2, handleY, cGold);
    drawer.pixel(midX - 2, handleY + 1, cGoldDark);
    drawer.pixel(midX + 1, handleY, cGold);
    drawer.pixel(midX + 1, handleY + 1, cGoldDark);

    // 5. Cornice (top molding with 3D bevel)
    // Top face (darker)
    drawer.fillPath([
        {x: 0, y: 0}, {x: w, y: 0},
        {x: w, y: 2}, {x: 0, y: 2}
    ], cWoodDark);
    // Front face
    drawer.fillPath([
        {x: 0, y: 2}, {x: w, y: 2},
        {x: w, y: topH}, {x: 0, y: topH}
    ], cWood);
    // Cornice bevels
    drawer.hLine(0, 0, w, cWoodHighlight);
    drawer.hLine(0, 2, w, cWoodHighlight);
    drawer.vLine(0, 0, topH, cWoodHighlight);
    drawer.vLine(w - 1, 0, topH, cWoodDark);
    // Shadow under cornice overhang
    drawer.hLine(2, topH, w - 4, cShadowDeep);

    // 6. Plinth (base molding)
    const baseY = bodyBot;
    drawer.fillPath([
        {x: 1, y: baseY}, {x: w - 1, y: baseY},
        {x: w - 1, y: h - 1}, {x: w, y: h},
        {x: 0, y: h}, {x: 1, y: h - 1}
    ], cWoodDark);
    // Front face highlight
    drawer.hLine(2, baseY + 1, w - 4, cWood);
    drawer.hLine(2, baseY, w - 4, cWoodHighlight);

    // 7. Natural edge definition (no strokePath)
    drawer.hLine(0, 0, w, cWoodHighlight);
    drawer.vLine(0, 1, h - 2, cWoodHighlight);
    drawer.vLine(w - 1, topH, h - topH, cWoodDark);
    drawer.hLine(1, h - 1, w - 2, cWoodDark);

    // 8. Per-section shadow overlays
    // Cornice shadow
    drawer.fillPath([
        {x: w - 4, y: 1}, {x: w - 1, y: 1},
        {x: w - 1, y: topH - 1}, {x: w - 4, y: topH - 1}
    ], cShadow);
    // Door/body shadow (follows narrower body)
    drawer.fillPath([
        {x: w - 4, y: bodyTop + 1}, {x: w - 2, y: bodyTop + 1},
        {x: w - 2, y: bodyBot - 1}, {x: w - 4, y: bodyBot - 1}
    ], cShadow);
    // Plinth shadow
    drawer.fillPath([
        {x: w - 3, y: baseY + 1}, {x: w - 1, y: baseY + 1},
        {x: w - 1, y: h - 1}, {x: w - 3, y: h - 1}
    ], cShadow);

    return drawer.getCanvas();
}
