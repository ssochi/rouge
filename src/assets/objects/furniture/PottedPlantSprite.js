import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createPottedPlantSprite() {
    // Terracotta pot with green leafy plant. Size: 16x24.
    const w = 16;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const { cShadow } = FurniturePalette;

    // Terracotta pot palette
    const cPot = '#c0392b';
    const cPotDark = '#a93226';
    const cPotLight = '#e74c3c';
    const cPotRim = '#d35400';

    // Soil
    const cSoil = '#5d4037';
    const cSoilDark = '#3e2723';

    // Leaf palette
    const cLeaf = '#27ae60';
    const cLeafLight = '#2ecc71';
    const cLeafDark = '#229954';
    const cLeafDeep = '#1e8449';

    // === Draw order: pot bottom up, then plant ===

    // 1. Pot body (tapered: wider at top, narrower at bottom)
    drawer.fillPath([
        {x: 3, y: 14},
        {x: w - 3, y: 14},
        {x: w - 4, y: h - 2},
        {x: w - 5, y: h - 1},
        {x: 5, y: h - 1},
        {x: 4, y: h - 2},
    ], cPot);

    // Pot front face highlight band
    drawer.fillPath([
        {x: 4, y: 16},
        {x: 6, y: 16},
        {x: 5, y: h - 2},
        {x: 5, y: h - 2}
    ], cPotLight);

    // Pot right shadow
    drawer.fillPath([
        {x: w - 5, y: 15},
        {x: w - 3, y: 15},
        {x: w - 4, y: h - 2},
        {x: w - 5, y: h - 2}
    ], cPotDark);

    // 2. Pot rim (wider than body)
    drawer.fillPath([
        {x: 2, y: 12},
        {x: w - 2, y: 12},
        {x: w - 2, y: 14},
        {x: 2, y: 14}
    ], cPotRim);
    // Rim top highlight
    drawer.hLine(3, 12, w - 6, cPotLight);
    // Rim bottom edge
    drawer.hLine(2, 14, w - 4, cPotDark);

    // 3. Soil visible inside pot
    drawer.fillPath([
        {x: 4, y: 13},
        {x: w - 4, y: 13},
        {x: w - 4, y: 15},
        {x: 4, y: 15}
    ], cSoil);
    drawer.hLine(5, 13, w - 10, cSoilDark);

    // 4. Plant leaves (organic shapes spreading upward from soil)
    // Center stem area
    drawer.vLine(7, 7, 6, cLeafDark);
    drawer.vLine(8, 6, 7, cLeafDark);

    // Left leaf cluster
    drawer.fillPath([
        {x: 4, y: 6},
        {x: 7, y: 4},
        {x: 8, y: 6},
        {x: 6, y: 8}
    ], cLeaf);
    drawer.pixel(5, 5, cLeafLight);

    // Right leaf cluster
    drawer.fillPath([
        {x: 8, y: 5},
        {x: 11, y: 3},
        {x: 12, y: 5},
        {x: 9, y: 7}
    ], cLeaf);
    drawer.pixel(10, 4, cLeafLight);

    // Top leaf
    drawer.fillPath([
        {x: 6, y: 2},
        {x: 8, y: 0},
        {x: 10, y: 2},
        {x: 8, y: 5}
    ], cLeafLight);
    drawer.pixel(8, 1, cLeafDeep);

    // Lower left leaf
    drawer.fillPath([
        {x: 2, y: 9},
        {x: 5, y: 7},
        {x: 7, y: 9},
        {x: 4, y: 11}
    ], cLeafDark);
    drawer.pixel(3, 8, cLeaf);

    // Lower right leaf
    drawer.fillPath([
        {x: 9, y: 8},
        {x: 12, y: 6},
        {x: 13, y: 8},
        {x: 11, y: 10}
    ], cLeafDark);
    drawer.pixel(11, 7, cLeaf);

    // 5. Pot shadow overlay (right side)
    drawer.fillPath([
        {x: w - 4, y: 15},
        {x: w - 3, y: 15},
        {x: w - 4, y: h - 2},
        {x: w - 5, y: h - 2}
    ], cShadow);

    return drawer.getCanvas();
}
