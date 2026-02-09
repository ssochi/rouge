import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createSofaSprite() {
    // Sofa facing UP: seat at top (north), backrest at bottom (south, toward camera).
    // In 2.5D top-down view, we see the back surface of the backrest
    // and the seat cushions peeking above it.
    // Size: 48x24.
    const w = 48;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const { cWoodDark, cShadow } = FurniturePalette;

    // Steel blue modern palette
    const cFabric = '#5b7fad';
    const cFabricDark = '#3d5f85';
    const cFabricLight = '#7d9fcd';
    const cHighlight = '#9dbfe5';
    const cDeepShadow = '#2d4565';
    const cOutline = '#1d3250';

    const armW = 7;

    // === Draw order: back-to-front for correct 2.5D overlap ===

    // 1. Front legs (top of sprite, farthest from camera)
    drawer.rect(3, 0, 3, 2, cWoodDark);
    drawer.rect(w - 6, 0, 3, 2, cWoodDark);

    // 2. Seat cushions (upper portion, behind backrest from camera)
    const seatY = 1;
    const seatH = 11;
    const seatX = armW;
    const seatW = w - armW * 2;
    const cushionW = Math.floor(seatW / 2) - 1;

    // Seat base shadow
    drawer.rect(seatX, seatY, seatW, seatH, cFabricDark);

    // Left cushion (rounded shape)
    drawer.fillPath([
        {x: seatX + 1, y: seatY + 1},
        {x: seatX + cushionW, y: seatY + 1},
        {x: seatX + cushionW, y: seatY + seatH - 2},
        {x: seatX + cushionW - 1, y: seatY + seatH - 1},
        {x: seatX + 2, y: seatY + seatH - 1},
        {x: seatX + 1, y: seatY + seatH - 2}
    ], cFabric);
    drawer.hLine(seatX + 2, seatY + 1, cushionW - 3, cHighlight);
    // Cushion center crease
    drawer.hLine(seatX + 3, seatY + 5, cushionW - 5, cFabricLight);
    // Cushion center depression
    drawer.pixel(seatX + Math.floor(cushionW / 2), seatY + 5, cFabricDark);

    // Right cushion (rounded shape)
    const cx2 = seatX + cushionW + 2;
    drawer.fillPath([
        {x: cx2, y: seatY + 1},
        {x: cx2 + cushionW - 1, y: seatY + 1},
        {x: cx2 + cushionW - 1, y: seatY + seatH - 2},
        {x: cx2 + cushionW - 2, y: seatY + seatH - 1},
        {x: cx2 + 1, y: seatY + seatH - 1},
        {x: cx2, y: seatY + seatH - 2}
    ], cFabric);
    drawer.hLine(cx2 + 1, seatY + 1, cushionW - 3, cHighlight);
    // Cushion center crease
    drawer.hLine(cx2 + 2, seatY + 5, cushionW - 5, cFabricLight);
    // Cushion center depression
    drawer.pixel(cx2 + Math.floor(cushionW / 2), seatY + 5, cFabricDark);

    // 3. Back legs (behind backrest, barely visible)
    drawer.rect(3, h - 2, 3, 2, cWoodDark);
    drawer.rect(w - 6, h - 2, 3, 2, cWoodDark);

    // 4. Backrest (bottom portion, closest to camera - back surface visible)
    const backY = 10;
    const backH = 12;

    // Backrest main body (with rounded bottom corners)
    drawer.fillPath([
        {x: 1, y: backY},
        {x: w - 1, y: backY},
        {x: w - 1, y: backY + backH - 2},
        {x: w - 3, y: backY + backH},
        {x: 3, y: backY + backH},
        {x: 1, y: backY + backH - 2}
    ], cFabricDark);

    // Backrest visible surface
    drawer.rect(2, backY + 1, w - 4, backH - 3, cFabric);

    // Top edge of backrest (the ridge seen from above - bright highlight)
    drawer.hLine(2, backY, w - 4, cFabricLight);
    drawer.hLine(3, backY + 1, w - 6, cHighlight);

    // Horizontal stitching lines on the back surface
    drawer.hLine(4, backY + 4, w - 8, cFabricDark);
    drawer.hLine(4, backY + 8, w - 8, cFabricDark);

    // Bottom edge deep shadow
    drawer.hLine(4, backY + backH - 1, w - 8, cDeepShadow);

    // 5. Armrests (drawn last to frame everything)
    const armY = 1;
    const armH = 20;

    // Left armrest body (chamfered bottom corner)
    drawer.fillPath([
        {x: 0, y: armY + 3}, {x: armW, y: armY + 3},
        {x: armW, y: armY + armH - 1},
        {x: armW - 1, y: armY + armH},
        {x: 0, y: armY + armH}
    ], cFabric);
    // Left armrest top face (with chamfer)
    drawer.fillPath([
        {x: 1, y: armY}, {x: armW, y: armY},
        {x: armW, y: armY + 3},
        {x: 0, y: armY + 3}, {x: 0, y: armY + 1}
    ], cFabricDark);
    drawer.hLine(1, armY, armW - 1, cFabricLight);
    drawer.pixel(0, armY + 1, cHighlight);
    // Inner edge shadow
    drawer.vLine(armW - 1, armY + 3, armH - 4, cFabricDark);
    // Outer edge highlight
    drawer.vLine(0, armY + 1, armH - 1, cFabricLight);

    // Right armrest body (chamfered bottom corner)
    drawer.fillPath([
        {x: w - armW, y: armY + 3}, {x: w, y: armY + 3},
        {x: w, y: armY + armH},
        {x: w - armW + 1, y: armY + armH},
        {x: w - armW, y: armY + armH - 1}
    ], cFabric);
    // Right armrest top face (with chamfer)
    drawer.fillPath([
        {x: w - armW, y: armY}, {x: w - 1, y: armY},
        {x: w, y: armY + 1}, {x: w, y: armY + 3},
        {x: w - armW, y: armY + 3}
    ], cFabricDark);
    drawer.hLine(w - armW, armY, armW - 1, cFabricLight);
    // Inner edge shadow
    drawer.vLine(w - armW, armY + 3, armH - 4, cFabricDark);
    // Outer edge highlight
    drawer.vLine(w - 1, armY + 1, armH - 1, cFabricLight);

    // 6. Natural edge definition (subtle, not full outline)
    drawer.hLine(3, backY + backH, w - 6, cDeepShadow);
    drawer.hLine(1, armY, w - 2, cHighlight);

    // 7. Per-component shadow overlays (follows structure, not one flat rectangle)
    // Right armrest shadow (only on armrest body)
    drawer.fillPath([
        {x: w - 3, y: armY + 3}, {x: w - 1, y: armY + 3},
        {x: w - 1, y: armY + armH}, {x: w - 3, y: armY + armH}
    ], cShadow);
    // Backrest right shadow (between armrests, separate plane)
    drawer.fillPath([
        {x: w - armW - 4, y: backY + 2}, {x: w - armW, y: backY + 2},
        {x: w - armW, y: backY + backH - 2}, {x: w - armW - 4, y: backY + backH - 2}
    ], cShadow);

    return drawer.getCanvas();
}
