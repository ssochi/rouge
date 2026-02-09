import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createTableSprite() {
    const w = 32;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodHighlight, cWoodGrain, cShadow } = FurniturePalette;

    const topThick = 4;
    const surfaceH = 10;
    const legW = 3;
    const legH = h - topThick - surfaceH;

    // 1. Back Legs (darker, perspective-shortened)
    const backLegTop = surfaceH + topThick + 2;
    drawer.fillPath([
        {x: 4, y: backLegTop}, {x: 4 + legW, y: backLegTop},
        {x: 4 + legW - 1, y: h}, {x: 4 + 1, y: h}
    ], cWoodDark);
    drawer.fillPath([
        {x: w - 4 - legW, y: backLegTop}, {x: w - 4, y: backLegTop},
        {x: w - 4 - 1, y: h}, {x: w - 4 - legW + 1, y: h}
    ], cWoodDark);

    // 2. Front Legs (tapered, lighter)
    const frontLegTop = surfaceH + topThick;
    // Front Left
    drawer.fillPath([
        {x: 2, y: frontLegTop}, {x: 2 + legW, y: frontLegTop},
        {x: 2 + legW - 1, y: h}, {x: 2 + 1, y: h}
    ], cWood);
    drawer.vLine(2 + legW - 1, frontLegTop, legH, cWoodDark);
    drawer.vLine(2, frontLegTop, legH, cWoodHighlight);

    // Front Right
    drawer.fillPath([
        {x: w - 2 - legW, y: frontLegTop}, {x: w - 2, y: frontLegTop},
        {x: w - 2 - 1, y: h}, {x: w - 2 - legW + 1, y: h}
    ], cWood);
    drawer.vLine(w - 2 - 1, frontLegTop, legH, cWoodDark);

    // 3. Table Top - Top Surface (with chamfered corners)
    drawer.fillPath([
        {x: 1, y: 0}, {x: w - 1, y: 0},
        {x: w, y: 1}, {x: w, y: surfaceH},
        {x: 0, y: surfaceH}, {x: 0, y: 1}
    ], cWoodLight);

    // Wood grain on top surface
    drawer.hLine(3, 3, 8, cWoodGrain);
    drawer.hLine(14, 5, 10, cWoodGrain);
    drawer.hLine(5, 7, 6, cWoodGrain);
    drawer.hLine(20, 2, 7, cWoodGrain);

    // 4. Table Top - Front Face (thickness, chamfered bottom corners)
    drawer.fillPath([
        {x: 0, y: surfaceH}, {x: w, y: surfaceH},
        {x: w, y: surfaceH + topThick - 1},
        {x: w - 1, y: surfaceH + topThick},
        {x: 1, y: surfaceH + topThick},
        {x: 0, y: surfaceH + topThick - 1}
    ], cWood);

    // 5. Edge definition through color (not outline)
    // Bottom edge (darkest)
    drawer.hLine(1, surfaceH + topThick, w - 2, cWoodDark);
    // Right edge
    drawer.vLine(w - 1, 1, surfaceH + topThick - 2, cWoodDark);
    // Top edge highlight
    drawer.hLine(1, 0, w - 2, cWoodHighlight);
    // Left edge highlight
    drawer.vLine(0, 1, surfaceH + topThick - 2, cWoodHighlight);
    // Front/top junction highlight
    drawer.hLine(1, surfaceH, w - 2, cWoodHighlight);

    // 6. Per-surface shadow overlays
    // Top surface shadow
    drawer.fillPath([
        {x: w - 6, y: 1}, {x: w - 1, y: 1},
        {x: w - 1, y: surfaceH - 1}, {x: w - 6, y: surfaceH - 1}
    ], cShadow);
    // Front face shadow (separate plane)
    drawer.fillPath([
        {x: w - 5, y: surfaceH + 1}, {x: w - 1, y: surfaceH + 1},
        {x: w - 1, y: surfaceH + topThick - 1}, {x: w - 5, y: surfaceH + topThick - 1}
    ], cShadow);

    return drawer.getCanvas();
}
