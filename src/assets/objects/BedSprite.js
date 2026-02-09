import { PixelDraw } from '../../utils/PixelDraw.js';

export function createBedSprite() {
    // Vertical bed: head at top, foot at bottom. Canvas: 32x48
    const drawer = new PixelDraw(32, 48);

    const cWood = '#5d4037';
    const cWoodDark = '#3e2723';
    const cWoodHighlight = '#a1887f';
    const cWoodGrain = '#8d6e63';
    const cSheet = '#ecf0f1';
    const cSheetShadow = '#cfd8dc';
    const cSheetDark = '#b0bec5';
    const cBlanket = '#2980b9';
    const cBlanketDark = '#1f6f9f';
    const cBlanketLight = '#5dade2';
    const cBlanketHighlight = '#85c1e9';
    const cPillow = '#f5f5f5';
    const cPillowShadow = '#d5dbdb';
    const cPillowHighlight = '#ffffff';
    const cShadow = 'rgba(0,0,0,0.12)';

    const cx = 16;
    const bedW = 26;
    const L = cx - bedW / 2;  // 3
    const R = cx + bedW / 2;  // 29

    // === 1. HEADBOARD (arched top) ===
    const headTop = 0;
    const headBot = 12;
    // Arched silhouette
    drawer.fillPath([
        {x: L, y: headTop + 4},
        {x: L + 2, y: headTop + 2},
        {x: L + 5, y: headTop + 1},
        {x: cx - 3, y: headTop},
        {x: cx + 3, y: headTop},
        {x: R - 5, y: headTop + 1},
        {x: R - 2, y: headTop + 2},
        {x: R, y: headTop + 4},
        {x: R, y: headBot},
        {x: L, y: headBot}
    ], cWood);
    // Top face thickness (2px band following curve)
    drawer.fillPath([
        {x: L, y: headTop + 4},
        {x: L + 2, y: headTop + 2},
        {x: L + 5, y: headTop + 1},
        {x: cx - 3, y: headTop},
        {x: cx + 3, y: headTop},
        {x: R - 5, y: headTop + 1},
        {x: R - 2, y: headTop + 2},
        {x: R, y: headTop + 4},
        {x: R, y: headTop + 6},
        {x: R - 2, y: headTop + 4},
        {x: R - 5, y: headTop + 3},
        {x: cx + 3, y: headTop + 2},
        {x: cx - 3, y: headTop + 2},
        {x: L + 5, y: headTop + 3},
        {x: L + 2, y: headTop + 4},
        {x: L, y: headTop + 6}
    ], cWoodDark);
    // Arch top highlight
    drawer.fillPath([
        {x: L + 3, y: headTop + 2},
        {x: L + 5, y: headTop + 1},
        {x: cx - 3, y: headTop},
        {x: cx + 3, y: headTop},
        {x: R - 5, y: headTop + 1},
        {x: R - 3, y: headTop + 2},
        {x: R - 5, y: headTop + 2},
        {x: cx + 2, y: headTop + 1},
        {x: cx - 2, y: headTop + 1},
        {x: L + 5, y: headTop + 2}
    ], cWoodHighlight);
    // Plank detail
    drawer.vLine(cx - 4, headTop + 5, 5, cWoodGrain);
    drawer.vLine(cx, headTop + 4, 6, cWoodGrain);
    drawer.vLine(cx + 4, headTop + 5, 5, cWoodGrain);
    // Side edges
    drawer.vLine(R - 1, headTop + 4, headBot - headTop - 4, cWoodDark);
    drawer.vLine(L, headTop + 4, headBot - headTop - 4, cWoodHighlight);
    // Right shadow (headboard only)
    drawer.fillPath([
        {x: R - 3, y: headTop + 5}, {x: R - 1, y: headTop + 5},
        {x: R - 1, y: headBot}, {x: R - 3, y: headBot}
    ], cShadow);

    // === 2. MATTRESS ===
    const matTop = headBot;
    const matBot = 39;
    const matL = L + 1;
    const matR = R - 1;
    // Sheet/mattress body
    drawer.fillPath([
        {x: matL, y: matTop}, {x: matR, y: matTop},
        {x: matR, y: matBot}, {x: matL, y: matBot}
    ], cSheet);
    // Right side subtle shadow
    drawer.vLine(matR - 1, matTop, matBot - matTop, cSheetShadow);

    // === 3. TWO PILLOWS (small, close to headboard) ===
    const pilY = matTop + 1;
    const pilW = 8;
    const pilH = 4;
    const pilGap = 2;
    const pilL1 = cx - pilW - pilGap / 2;
    const pilL2 = cx + pilGap / 2;

    // Pillow cast shadows (below each pillow)
    drawer.fillPath([
        {x: pilL1 + 1, y: pilY + 1}, {x: pilL1 + pilW, y: pilY + 1},
        {x: pilL1 + pilW, y: pilY + pilH + 1}, {x: pilL1 + 1, y: pilY + pilH + 1}
    ], cSheetShadow);
    drawer.fillPath([
        {x: pilL2 + 1, y: pilY + 1}, {x: pilL2 + pilW, y: pilY + 1},
        {x: pilL2 + pilW, y: pilY + pilH + 1}, {x: pilL2 + 1, y: pilY + pilH + 1}
    ], cSheetShadow);

    // Left pillow (rounded corners)
    drawer.fillPath([
        {x: pilL1 + 1, y: pilY},
        {x: pilL1 + pilW - 1, y: pilY},
        {x: pilL1 + pilW, y: pilY + 1},
        {x: pilL1 + pilW, y: pilY + pilH - 1},
        {x: pilL1 + pilW - 1, y: pilY + pilH},
        {x: pilL1 + 1, y: pilY + pilH},
        {x: pilL1, y: pilY + pilH - 1},
        {x: pilL1, y: pilY + 1}
    ], cPillow);
    drawer.hLine(pilL1 + 1, pilY, pilW - 2, cPillowHighlight);
    drawer.hLine(pilL1 + 2, pilY + Math.floor(pilH / 2), pilW - 4, cPillowShadow);

    // Right pillow
    drawer.fillPath([
        {x: pilL2 + 1, y: pilY},
        {x: pilL2 + pilW - 1, y: pilY},
        {x: pilL2 + pilW, y: pilY + 1},
        {x: pilL2 + pilW, y: pilY + pilH - 1},
        {x: pilL2 + pilW - 1, y: pilY + pilH},
        {x: pilL2 + 1, y: pilY + pilH},
        {x: pilL2, y: pilY + pilH - 1},
        {x: pilL2, y: pilY + 1}
    ], cPillow);
    drawer.hLine(pilL2 + 1, pilY, pilW - 2, cPillowHighlight);
    drawer.hLine(pilL2 + 2, pilY + Math.floor(pilH / 2), pilW - 4, cPillowShadow);

    // === 4. BLANKET (organic draping) ===
    const blkTop = pilY + pilH + 2;  // 2px gap shows sheet
    const blkBot = matBot;
    const blkL = L;
    const blkR = R;

    // Main blanket body (overhangs mattress by 1px each side)
    drawer.fillPath([
        {x: blkL, y: blkTop}, {x: blkR, y: blkTop},
        {x: blkR, y: blkBot + 1},
        {x: blkR - 1, y: blkBot + 2},
        {x: blkL + 1, y: blkBot + 2},
        {x: blkL, y: blkBot + 1}
    ], cBlanket);

    // Top fold-over edge (thick wavy band)
    drawer.fillPath([
        {x: blkL, y: blkTop},
        {x: blkR, y: blkTop},
        {x: blkR, y: blkTop + 3},
        {x: blkR - 4, y: blkTop + 4},
        {x: cx + 2, y: blkTop + 3},
        {x: cx - 2, y: blkTop + 4},
        {x: blkL + 4, y: blkTop + 3},
        {x: blkL, y: blkTop + 3}
    ], cBlanketDark);
    // Fold highlight
    drawer.hLine(blkL + 1, blkTop, blkR - blkL - 2, cBlanketHighlight);

    // Left/right overhang shadow
    drawer.vLine(blkL, blkTop + 3, blkBot - blkTop - 2, cBlanketDark);
    drawer.vLine(blkR - 1, blkTop + 3, blkBot - blkTop - 2, cBlanketDark);

    // Fold ridges (subtle vertical creases)
    drawer.vLine(cx - 5, blkTop + 6, blkBot - blkTop - 10, cBlanketDark);
    drawer.vLine(cx - 6, blkTop + 7, blkBot - blkTop - 12, cBlanketLight);
    drawer.vLine(cx + 4, blkTop + 6, blkBot - blkTop - 10, cBlanketDark);
    drawer.vLine(cx + 3, blkTop + 7, blkBot - blkTop - 12, cBlanketLight);
    drawer.vLine(cx, blkTop + 7, blkBot - blkTop - 12, cBlanketLight);

    // Bottom overhang
    drawer.hLine(blkL + 1, blkBot + 1, blkR - blkL - 2, cBlanketDark);

    // Blanket right shadow (per-component)
    drawer.fillPath([
        {x: blkR - 3, y: blkTop + 4}, {x: blkR - 1, y: blkTop + 4},
        {x: blkR - 1, y: blkBot}, {x: blkR - 3, y: blkBot}
    ], cShadow);

    // === 5. FOOTBOARD ===
    const footTop = 41;
    const footBot = 47;
    // Front face
    drawer.fillPath([
        {x: L, y: footTop}, {x: R, y: footTop},
        {x: R, y: footBot}, {x: L, y: footBot}
    ], cWood);
    // Top face (thickness)
    drawer.fillPath([
        {x: L, y: footTop - 2}, {x: R, y: footTop - 2},
        {x: R, y: footTop}, {x: L, y: footTop}
    ], cWoodDark);
    drawer.hLine(L + 1, footTop - 2, bedW - 2, cWoodHighlight);
    drawer.hLine(L, footTop, bedW, cWoodHighlight);
    // Side edges
    drawer.vLine(R - 1, footTop, footBot - footTop, cWoodDark);
    drawer.vLine(L, footTop, footBot - footTop, cWoodHighlight);
    drawer.hLine(L, footBot - 1, bedW, cWoodDark);
    // Right shadow (footboard only)
    drawer.fillPath([
        {x: R - 3, y: footTop}, {x: R - 1, y: footTop},
        {x: R - 1, y: footBot - 1}, {x: R - 3, y: footBot - 1}
    ], cShadow);

    return drawer.getCanvas();
}

export function createBedHorizontalSprite() {
    // Horizontal bed: head at left, foot at right. Canvas: 48x32
    // 2.5D: camera looks from above-south, so bottom edge shows front faces
    const drawer = new PixelDraw(48, 32);

    const cWood = '#5d4037';
    const cWoodDark = '#3e2723';
    const cWoodHighlight = '#a1887f';
    const cWoodGrain = '#8d6e63';
    const cSheet = '#ecf0f1';
    const cSheetShadow = '#cfd8dc';
    const cSheetDark = '#b0bec5';
    const cBlanket = '#2980b9';
    const cBlanketDark = '#1f6f9f';
    const cBlanketLight = '#5dade2';
    const cBlanketHighlight = '#85c1e9';
    const cPillow = '#f5f5f5';
    const cPillowShadow = '#d5dbdb';
    const cPillowHighlight = '#ffffff';
    const cShadow = 'rgba(0,0,0,0.12)';

    const cy = 13;      // Shifted up to leave room for front faces
    const bedH = 22;
    const T = cy - bedH / 2;  // 2
    const B = cy + bedH / 2;  // 24

    // === 1. HEADBOARD (left, arched) ===
    const headL = 0;
    const headR = 8;
    // Arched left side
    drawer.fillPath([
        {x: headR, y: T},
        {x: headR, y: B},
        {x: headL + 4, y: B},
        {x: headL + 2, y: B - 2},
        {x: headL + 1, y: B - 4},
        {x: headL, y: cy + 3},
        {x: headL, y: cy - 3},
        {x: headL + 1, y: T + 4},
        {x: headL + 2, y: T + 2},
        {x: headL + 4, y: T}
    ], cWood);
    // Top face (y: T-2 to T)
    drawer.fillPath([
        {x: headL + 4, y: T - 2},
        {x: headR, y: T - 2},
        {x: headR, y: T},
        {x: headL + 4, y: T},
        {x: headL + 2, y: T + 2},
        {x: headL + 1, y: T + 2},
        {x: headL, y: T + 2},
        {x: headL + 1, y: T},
        {x: headL + 2, y: T - 1}
    ], cWoodDark);
    drawer.hLine(headL + 3, T - 2, headR - headL - 3, cWoodHighlight);
    // Front face (bottom visible, 2.5D depth)
    drawer.fillPath([
        {x: headL + 4, y: B},
        {x: headR, y: B},
        {x: headR, y: B + 3},
        {x: headL + 5, y: B + 3},
        {x: headL + 3, y: B + 1}
    ], cWoodDark);
    drawer.hLine(headL + 5, B + 1, headR - headL - 5, cWood);
    drawer.hLine(headL + 5, B, headR - headL - 5, cWoodHighlight);
    // Plank lines
    drawer.hLine(headL + 2, cy - 2, 4, cWoodGrain);
    drawer.hLine(headL + 2, cy + 2, 4, cWoodGrain);

    // === 2. MATTRESS ===
    const matL = headR;
    const matR = 42;
    const matT = T + 1;
    const matB = B;
    // Top surface (sheet)
    drawer.fillPath([
        {x: matL, y: matT}, {x: matR, y: matT},
        {x: matR, y: matB}, {x: matL, y: matB}
    ], cSheet);
    // Front face (mattress thickness visible from 2.5D angle, 2px)
    drawer.fillPath([
        {x: matL, y: matB}, {x: matR, y: matB},
        {x: matR, y: matB + 2}, {x: matL, y: matB + 2}
    ], cSheetShadow);
    drawer.hLine(matL, matB, matR - matL, cSheetDark);

    // === 3. TWO PILLOWS (stacked vertically, small) ===
    const pilX = matL + 2;
    const pilW = 5;
    const pilH = 6;
    const pilGap = 2;
    const pilT1 = cy - pilH - pilGap / 2;
    const pilT2 = cy + pilGap / 2;

    // Pillow cast shadows
    drawer.fillPath([
        {x: pilX + 1, y: pilT1 + 1}, {x: pilX + pilW + 1, y: pilT1 + 1},
        {x: pilX + pilW + 1, y: pilT1 + pilH}, {x: pilX + 1, y: pilT1 + pilH}
    ], cSheetShadow);
    drawer.fillPath([
        {x: pilX + 1, y: pilT2 + 1}, {x: pilX + pilW + 1, y: pilT2 + 1},
        {x: pilX + pilW + 1, y: pilT2 + pilH}, {x: pilX + 1, y: pilT2 + pilH}
    ], cSheetShadow);

    // Top pillow
    drawer.fillPath([
        {x: pilX + 1, y: pilT1},
        {x: pilX + pilW - 1, y: pilT1},
        {x: pilX + pilW, y: pilT1 + 1},
        {x: pilX + pilW, y: pilT1 + pilH - 1},
        {x: pilX + pilW - 1, y: pilT1 + pilH},
        {x: pilX + 1, y: pilT1 + pilH},
        {x: pilX, y: pilT1 + pilH - 1},
        {x: pilX, y: pilT1 + 1}
    ], cPillow);
    drawer.hLine(pilX + 1, pilT1, pilW - 2, cPillowHighlight);
    drawer.vLine(pilX + Math.floor(pilW / 2), pilT1 + 1, pilH - 2, cPillowShadow);

    // Bottom pillow
    drawer.fillPath([
        {x: pilX + 1, y: pilT2},
        {x: pilX + pilW - 1, y: pilT2},
        {x: pilX + pilW, y: pilT2 + 1},
        {x: pilX + pilW, y: pilT2 + pilH - 1},
        {x: pilX + pilW - 1, y: pilT2 + pilH},
        {x: pilX + 1, y: pilT2 + pilH},
        {x: pilX, y: pilT2 + pilH - 1},
        {x: pilX, y: pilT2 + 1}
    ], cPillow);
    drawer.hLine(pilX + 1, pilT2, pilW - 2, cPillowHighlight);
    drawer.vLine(pilX + Math.floor(pilW / 2), pilT2 + 1, pilH - 2, cPillowShadow);
    // Bottom pillow front face (shows depth)
    drawer.hLine(pilX + 1, pilT2 + pilH, pilW - 2, cPillowShadow);

    // === 4. BLANKET ===
    const blkL = matL + 12;
    const blkR = matR + 1;
    const blkT = T;
    const blkB = B;

    // Main blanket body
    drawer.fillPath([
        {x: blkL, y: blkT},
        {x: blkR, y: blkT},
        {x: blkR, y: blkB},
        {x: blkL, y: blkB}
    ], cBlanket);

    // Left fold-over edge (organic waviness)
    drawer.fillPath([
        {x: blkL, y: blkT},
        {x: blkL + 3, y: blkT},
        {x: blkL + 4, y: blkT + 3},
        {x: blkL + 3, y: cy - 2},
        {x: blkL + 4, y: cy + 2},
        {x: blkL + 3, y: blkB - 3},
        {x: blkL + 3, y: blkB},
        {x: blkL, y: blkB}
    ], cBlanketDark);
    drawer.vLine(blkL + 1, blkT + 1, blkB - blkT - 2, cBlanketHighlight);

    // Blanket front drape (hangs over front edge - KEY 2.5D element)
    drawer.fillPath([
        {x: blkL, y: blkB},
        {x: blkR, y: blkB},
        {x: blkR, y: blkB + 4},
        {x: blkR - 2, y: blkB + 5},
        {x: blkL + 2, y: blkB + 5},
        {x: blkL, y: blkB + 4}
    ], cBlanketDark);
    // Drape highlight and wrinkle lines
    drawer.hLine(blkL + 2, blkB + 1, blkR - blkL - 3, cBlanket);
    drawer.hLine(blkL + 2, blkB + 2, blkR - blkL - 3, cBlanketDark);
    drawer.hLine(blkL + 3, blkB + 4, blkR - blkL - 5, '#174f73');

    // Fold ridges on top (horizontal creases)
    drawer.hLine(blkL + 5, cy - 3, blkR - blkL - 6, cBlanketDark);
    drawer.hLine(blkL + 5, cy - 4, blkR - blkL - 6, cBlanketLight);
    drawer.hLine(blkL + 5, cy + 3, blkR - blkL - 6, cBlanketDark);
    drawer.hLine(blkL + 5, cy + 2, blkR - blkL - 6, cBlanketLight);
    drawer.hLine(blkL + 5, cy, blkR - blkL - 6, cBlanketLight);

    // Right side edge
    drawer.vLine(blkR - 1, blkT + 1, blkB - blkT - 2, cBlanketDark);

    // Blanket right shadow (follows blanket shape)
    drawer.fillPath([
        {x: blkR - 3, y: blkT + 1}, {x: blkR - 1, y: blkT + 1},
        {x: blkR - 1, y: blkB - 1}, {x: blkR - 3, y: blkB - 1}
    ], cShadow);

    // === 5. FOOTBOARD (right) ===
    const footL = 42;
    const footR = 47;
    // Main face
    drawer.fillPath([
        {x: footL, y: T}, {x: footR, y: T},
        {x: footR, y: B}, {x: footL, y: B}
    ], cWood);
    // Top face
    drawer.fillPath([
        {x: footL, y: T - 1}, {x: footR, y: T - 1},
        {x: footR, y: T + 1}, {x: footL, y: T + 1}
    ], cWoodDark);
    drawer.hLine(footL, T - 1, footR - footL, cWoodHighlight);
    // Front face (bottom, 2.5D depth)
    drawer.fillPath([
        {x: footL, y: B}, {x: footR, y: B},
        {x: footR, y: B + 3}, {x: footL, y: B + 3}
    ], cWoodDark);
    drawer.hLine(footL, B, footR - footL, cWoodHighlight);
    drawer.hLine(footL + 1, B + 1, footR - footL - 2, cWood);
    // Side edges
    drawer.vLine(footR - 1, T, B - T + 3, cWoodDark);
    drawer.hLine(footL, B + 3, footR - footL, cWoodDark);
    // Footboard right shadow
    drawer.fillPath([
        {x: footR - 2, y: T + 1}, {x: footR - 1, y: T + 1},
        {x: footR - 1, y: B + 2}, {x: footR - 2, y: B + 2}
    ], cShadow);

    // Front legs (visible below mattress front face)
    drawer.fillPath([
        {x: matL + 2, y: B + 2}, {x: matL + 4, y: B + 2},
        {x: matL + 4, y: B + 4}, {x: matL + 2, y: B + 4}
    ], cWoodDark);
    drawer.fillPath([
        {x: matR - 4, y: B + 2}, {x: matR - 2, y: B + 2},
        {x: matR - 2, y: B + 4}, {x: matR - 4, y: B + 4}
    ], cWoodDark);

    return drawer.getCanvas();
}
