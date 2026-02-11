import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createArmchairSprite() {
    // Single-seat armchair facing UP: seat at top (north), backrest at bottom (south).
    // Same steel-blue fabric as sofa. Size: 32x24.
    const w = 32;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const { cWoodDark, cShadow } = FurniturePalette;

    // Steel blue fabric palette (same as SofaSprite)
    const cFabric = '#5b7fad';
    const cFabricDark = '#3d5f85';
    const cFabricLight = '#7d9fcd';
    const cHighlight = '#9dbfe5';
    const cDeepShadow = '#2d4565';

    const armW = 5;

    // === Draw order: back-to-front for correct 2.5D overlap ===

    // 1. Front legs (top of sprite, farthest from camera)
    drawer.rect(2, 0, 2, 2, cWoodDark);
    drawer.rect(w - 4, 0, 2, 2, cWoodDark);

    // 2. Seat cushion (upper portion, behind backrest)
    const seatY = 1;
    const seatH = 10;
    const seatX = armW;
    const seatW = w - armW * 2;

    // Seat base shadow
    drawer.rect(seatX, seatY, seatW, seatH, cFabricDark);

    // Single cushion (rounded)
    drawer.fillPath([
        {x: seatX + 1, y: seatY + 1},
        {x: seatX + seatW - 1, y: seatY + 1},
        {x: seatX + seatW - 1, y: seatY + seatH - 2},
        {x: seatX + seatW - 2, y: seatY + seatH - 1},
        {x: seatX + 2, y: seatY + seatH - 1},
        {x: seatX + 1, y: seatY + seatH - 2}
    ], cFabric);
    // Cushion top highlight
    drawer.hLine(seatX + 2, seatY + 1, seatW - 4, cHighlight);
    // Cushion center crease
    drawer.hLine(seatX + 3, seatY + 5, seatW - 6, cFabricLight);
    // Center depression
    drawer.pixel(seatX + Math.floor(seatW / 2), seatY + 5, cFabricDark);

    // 3. Back legs (bottom, barely visible)
    drawer.rect(2, h - 2, 2, 2, cWoodDark);
    drawer.rect(w - 4, h - 2, 2, 2, cWoodDark);

    // 4. Backrest (bottom portion, closest to camera)
    const backY = 9;
    const backH = 13;

    // Backrest body (rounded bottom corners)
    drawer.fillPath([
        {x: 1, y: backY},
        {x: w - 1, y: backY},
        {x: w - 1, y: backY + backH - 2},
        {x: w - 2, y: backY + backH},
        {x: 2, y: backY + backH},
        {x: 1, y: backY + backH - 2}
    ], cFabricDark);

    // Backrest visible surface
    drawer.rect(2, backY + 1, w - 4, backH - 3, cFabric);

    // Top ridge highlight
    drawer.hLine(2, backY, w - 4, cFabricLight);
    drawer.hLine(3, backY + 1, w - 6, cHighlight);

    // Stitching lines
    drawer.hLine(4, backY + 4, w - 8, cFabricDark);
    drawer.hLine(4, backY + 8, w - 8, cFabricDark);

    // Bottom edge shadow
    drawer.hLine(3, backY + backH - 1, w - 6, cDeepShadow);

    // 5. Armrests (frame everything)
    const armY = 1;
    const armH = 20;

    // Left armrest
    drawer.fillPath([
        {x: 0, y: armY + 2}, {x: armW, y: armY + 2},
        {x: armW, y: armY + armH - 1},
        {x: armW - 1, y: armY + armH},
        {x: 0, y: armY + armH}
    ], cFabric);
    // Left armrest top face
    drawer.fillPath([
        {x: 1, y: armY}, {x: armW, y: armY},
        {x: armW, y: armY + 2},
        {x: 0, y: armY + 2}, {x: 0, y: armY + 1}
    ], cFabricDark);
    drawer.hLine(1, armY, armW - 1, cFabricLight);
    // Inner edge shadow
    drawer.vLine(armW - 1, armY + 2, armH - 3, cFabricDark);
    // Outer edge highlight
    drawer.vLine(0, armY + 1, armH - 1, cFabricLight);

    // Right armrest
    drawer.fillPath([
        {x: w - armW, y: armY + 2}, {x: w, y: armY + 2},
        {x: w, y: armY + armH},
        {x: w - armW + 1, y: armY + armH},
        {x: w - armW, y: armY + armH - 1}
    ], cFabric);
    // Right armrest top face
    drawer.fillPath([
        {x: w - armW, y: armY}, {x: w - 1, y: armY},
        {x: w, y: armY + 1}, {x: w, y: armY + 2},
        {x: w - armW, y: armY + 2}
    ], cFabricDark);
    drawer.hLine(w - armW, armY, armW - 1, cFabricLight);
    // Inner edge shadow
    drawer.vLine(w - armW, armY + 2, armH - 3, cFabricDark);
    // Outer edge highlight
    drawer.vLine(w - 1, armY + 1, armH - 1, cFabricLight);

    // 6. Natural edge definition
    drawer.hLine(2, backY + backH, w - 4, cDeepShadow);

    // 7. Per-component shadow overlays
    // Right armrest shadow
    drawer.fillPath([
        {x: w - 2, y: armY + 2}, {x: w - 1, y: armY + 2},
        {x: w - 1, y: armY + armH}, {x: w - 2, y: armY + armH}
    ], cShadow);
    // Backrest right shadow
    drawer.fillPath([
        {x: w - armW - 3, y: backY + 2}, {x: w - armW, y: backY + 2},
        {x: w - armW, y: backY + backH - 2}, {x: w - armW - 3, y: backY + backH - 2}
    ], cShadow);

    return drawer.getCanvas();
}
