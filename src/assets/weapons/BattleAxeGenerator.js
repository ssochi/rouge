import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Battle Axe Generator (Double-Headed)
 * Dimensions: 24x14
 * Structure: Leather-wrapped wooden shaft with symmetrical double axe blades (top & bottom)
 * Two mirrored crescent blades with dark red cutting edges
 */
export function generateBattleAxe() {
    const drawer = new PixelDraw(24, 14);

    // Colors
    const cShaft = '#8d6e63';
    const cShaftDark = '#6d4c41';
    const cWrap = '#4a3520';
    const cWrapLight = '#5d3a1a';
    const cMetal = '#78838c';
    const cMetalLight = '#b0b8c0';
    const cMetalDark = '#5c6670';
    const cEdge = '#c0392b';
    const cEdgeLight = '#e74c3c';

    // -- Pommel (x=0-1) --
    drawer.rect(0, 6, 2, 2, cMetalDark);
    drawer.pixel(0, 6, cMetalLight);

    // -- Shaft (x=2-11) --
    drawer.rect(2, 6, 10, 2, cShaft);
    drawer.hLine(2, 6, 10, cShaftDark);

    // -- Grip wrap (x=3-6) --
    drawer.rect(3, 6, 4, 2, cWrap);
    drawer.pixel(4, 6, cWrapLight);
    drawer.pixel(6, 7, cWrapLight);

    // -- Central mount (where blades meet shaft) x=12-13 --
    drawer.rect(12, 3, 2, 8, cMetal);
    drawer.vLine(12, 3, 8, cMetalDark);

    // ===== TOP BLADE (y=0-5) =====
    // Main blade body
    drawer.rect(14, 2, 5, 3, cMetal);       // y=2-4 core
    drawer.rect(14, 1, 4, 1, cMetal);        // y=1 upper taper
    drawer.rect(14, 5, 3, 1, cMetal);        // y=5 lower taper (towards center)
    drawer.pixel(19, 3, cMetal);             // widest point

    // Dark spine near mount
    drawer.vLine(14, 1, 5, cMetalDark);

    // Surface highlight
    drawer.pixel(15, 2, cMetalLight);
    drawer.pixel(16, 3, cMetalLight);

    // Top cutting edge (curved crescent)
    drawer.pixel(17, 0, cEdge);
    drawer.pixel(18, 1, cEdgeLight);
    drawer.pixel(19, 2, cEdgeLight);
    drawer.pixel(20, 3, cEdgeLight);         // widest reach
    drawer.pixel(19, 4, cEdge);
    drawer.pixel(18, 5, cEdge);

    // Top spike
    drawer.pixel(16, 0, cMetal);

    // ===== BOTTOM BLADE (y=8-13, mirrored) =====
    // Main blade body
    drawer.rect(14, 9, 5, 3, cMetal);       // y=9-11 core
    drawer.rect(14, 12, 4, 1, cMetal);       // y=12 lower taper
    drawer.rect(14, 8, 3, 1, cMetal);        // y=8 upper taper (towards center)

    drawer.pixel(19, 10, cMetal);            // widest point

    // Dark spine near mount
    drawer.vLine(14, 8, 5, cMetalDark);

    // Surface highlight
    drawer.pixel(15, 11, cMetalLight);
    drawer.pixel(16, 10, cMetalLight);

    // Bottom cutting edge (curved crescent, mirrored)
    drawer.pixel(18, 8, cEdge);
    drawer.pixel(19, 9, cEdge);
    drawer.pixel(20, 10, cEdgeLight);        // widest reach
    drawer.pixel(19, 11, cEdgeLight);
    drawer.pixel(18, 12, cEdgeLight);
    drawer.pixel(17, 13, cEdge);

    // Bottom spike
    drawer.pixel(16, 13, cMetal);

    return drawer.getCanvas();
}

export const BATTLE_AXE_SPRITE = generateBattleAxe();
