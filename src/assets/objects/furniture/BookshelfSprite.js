import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createBookshelfSprite() {
    const w = 32;
    const h = 48;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodOutline, cWoodHighlight, cWoodGrain, cGold, cGoldDark, cShadow, cShadowDeep } = FurniturePalette;

    // Book colors (deterministic)
    const cRed = '#e74c3c';
    const cBlue = '#3498db';
    const cYellow = '#f1c40f';
    const cGreen = '#2ecc71';
    const cPurple = '#9b59b6';
    const cNavy = '#2c3e50';
    const cGrey = '#95a5a6';

    // 1. Outer Frame (chamfered top corners)
    drawer.fillPath([
        {x: 1, y: 0}, {x: w - 1, y: 0},
        {x: w, y: 1}, {x: w, y: h},
        {x: 0, y: h}, {x: 0, y: 1}
    ], cWood);

    // 2. Back Panel (deep shadow)
    drawer.fillPath([
        {x: 2, y: 4}, {x: w - 2, y: 4},
        {x: w - 2, y: h - 6}, {x: 2, y: h - 6}
    ], '#2d1e17');

    // 3. Cornice (top overhang, wider by 1px each side conceptually but within canvas)
    drawer.fillPath([
        {x: 0, y: 0}, {x: w, y: 0},
        {x: w, y: 4}, {x: 0, y: 4}
    ], cWoodDark);
    // Cornice front face
    drawer.fillPath([
        {x: 0, y: 2}, {x: w, y: 2},
        {x: w, y: 4}, {x: 0, y: 4}
    ], cWood);
    // Cornice bevels
    drawer.hLine(1, 0, w - 2, cWoodHighlight);
    drawer.hLine(0, 2, w, cWoodHighlight);
    drawer.hLine(0, 3, w, cWoodDark);

    // 4. Shelves with proper shading
    const shelfPositions = [14, 26, 38];
    shelfPositions.forEach(y => {
        // Shelf body
        drawer.fillPath([
            {x: 2, y: y}, {x: w - 2, y: y},
            {x: w - 2, y: y + 2}, {x: 2, y: y + 2}
        ], cWood);
        // Top highlight
        drawer.hLine(2, y, w - 4, cWoodHighlight);
        // Bottom shadow
        drawer.hLine(2, y + 2, w - 4, cShadowDeep);
    });

    // 5. Shelf 1 Contents (y: 4 to 14) - Plant pot + leaning book + small book
    // Plant pot (rounded shape)
    drawer.fillPath([
        {x: 5, y: 10}, {x: 4, y: 11},
        {x: 4, y: 14}, {x: 9, y: 14},
        {x: 9, y: 11}, {x: 8, y: 10}
    ], '#e67e22');
    drawer.hLine(4, 11, 5, '#d35400');
    // Plant leaves
    drawer.pixel(5, 8, '#27ae60');
    drawer.pixel(6, 7, '#2ecc71');
    drawer.pixel(7, 8, '#27ae60');
    drawer.pixel(6, 9, '#229954');

    // Leaning book
    drawer.line(13, 13, 16, 6, cBlue);
    drawer.line(14, 13, 17, 6, '#2980b9');
    drawer.line(15, 13, 18, 6, cBlue);

    // Small standing books
    drawer.rect(21, 7, 2, 7, cRed);
    drawer.rect(24, 8, 3, 6, cYellow);

    // 6. Shelf 2 Contents (y: 16 to 26) - Stacked + standing books (DETERMINISTIC)
    // Horizontal stacked books
    drawer.rect(4, 23, 8, 3, cRed);
    drawer.hLine(4, 23, 8, '#c0392b');
    drawer.rect(5, 20, 6, 3, cYellow);
    drawer.hLine(5, 20, 6, '#d4ac0d');

    // Standing books (pre-defined, no random)
    const shelf2Books = [
        { x: 16, w: 3, h: 8, color: cGreen },
        { x: 20, w: 2, h: 10, color: cNavy },
        { x: 23, w: 3, h: 7, color: cPurple },
        { x: 27, w: 2, h: 9, color: cRed },
    ];
    shelf2Books.forEach(b => {
        drawer.rect(b.x, 26 - b.h, b.w, b.h, b.color);
        // Spine highlight
        drawer.vLine(b.x, 26 - b.h, b.h, 'rgba(255,255,255,0.15)');
    });

    // 7. Shelf 3 Contents (y: 28 to 38) - Tall books + storage box
    // Tall books
    drawer.rect(4, 29, 3, 9, cPurple);
    drawer.vLine(4, 29, 9, 'rgba(255,255,255,0.15)');
    drawer.rect(8, 30, 2, 8, cNavy);
    drawer.rect(11, 29, 3, 9, cBlue);
    drawer.vLine(11, 29, 9, 'rgba(255,255,255,0.15)');
    drawer.rect(15, 31, 2, 7, cGreen);

    // Storage box
    drawer.fillPath([
        {x: 20, y: 32}, {x: 28, y: 32},
        {x: 28, y: 38}, {x: 20, y: 38}
    ], cGrey);
    drawer.hLine(21, 33, 6, '#7f8c8d');
    drawer.hLine(20, 32, 8, 'rgba(255,255,255,0.2)');

    // 8. Bottom Cabinet (doors with panel detail)
    drawer.fillPath([
        {x: 2, y: 40}, {x: w - 2, y: 40},
        {x: w - 2, y: h - 2}, {x: 2, y: h - 2}
    ], cWoodDark);
    // Door panels
    drawer.fillPath([
        {x: 3, y: 41}, {x: w / 2 - 1, y: 41},
        {x: w / 2 - 1, y: h - 3}, {x: 3, y: h - 3}
    ], cWood);
    drawer.fillPath([
        {x: w / 2 + 1, y: 41}, {x: w - 3, y: 41},
        {x: w - 3, y: h - 3}, {x: w / 2 + 1, y: h - 3}
    ], cWood);
    // Panel bevels (left door)
    drawer.hLine(3, 41, w / 2 - 4, cWoodHighlight);
    drawer.vLine(3, 41, 5, cWoodHighlight);
    // Panel bevels (right door)
    drawer.hLine(w / 2 + 1, 41, w / 2 - 4, cWoodHighlight);
    drawer.vLine(w / 2 + 1, 41, 5, cWoodHighlight);
    // Center gap
    drawer.vLine(w / 2, 40, 6, cShadowDeep);
    // Handles
    drawer.pixel(w / 2 - 2, 43, cGold);
    drawer.pixel(w / 2 + 1, 43, cGold);
    drawer.pixel(w / 2 - 2, 44, cGoldDark);
    drawer.pixel(w / 2 + 1, 44, cGoldDark);

    // 9. Natural edge definition (no strokePath)
    drawer.vLine(0, 1, h - 1, cWoodHighlight);
    drawer.hLine(1, 0, w - 2, cWoodHighlight);
    drawer.vLine(w - 1, 1, h - 1, cWoodDark);
    drawer.hLine(1, h - 1, w - 2, cWoodDark);

    // Per-section shadow overlay
    // Cornice shadow
    drawer.fillPath([
        {x: w - 4, y: 1}, {x: w - 1, y: 1},
        {x: w - 1, y: 3}, {x: w - 4, y: 3}
    ], cShadow);
    // Shelves area shadow (narrower)
    drawer.fillPath([
        {x: w - 3, y: 5}, {x: w - 1, y: 5},
        {x: w - 1, y: 39}, {x: w - 3, y: 39}
    ], cShadow);
    // Cabinet shadow
    drawer.fillPath([
        {x: w - 3, y: 41}, {x: w - 1, y: 41},
        {x: w - 1, y: h - 2}, {x: w - 3, y: h - 2}
    ], cShadow);

    return drawer.getCanvas();
}
