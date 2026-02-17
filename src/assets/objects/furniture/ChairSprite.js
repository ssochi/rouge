import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createChairSprite() {
    const w = 16;
    const h = 20;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodHighlight, cWoodGrain, cShadow, cShadowDeep } = FurniturePalette;

    // 1. Back Legs (Darker)
    const legH = 8;
    drawer.rect(3, 12, 2, legH, cWoodDark);
    drawer.rect(11, 12, 2, legH, cWoodDark);

    // 2. Front Legs
    drawer.rect(2, 12, 2, legH, cWood);
    drawer.rect(12, 12, 2, legH, cWood);
    // Highlights on front legs
    drawer.vLine(2, 12, legH, cWoodHighlight);
    drawer.vLine(12, 12, legH, cWoodHighlight);

    // 3. Seat
    const seatY = 9;
    const seatH = 4;
    
    // Seat Shadow
    drawer.rect(2, seatY + seatH, 12, 1, cShadowDeep);

    // Seat Body
    drawer.fillPath([
        {x: 1, y: seatY}, {x: 15, y: seatY}, // Top
        {x: 15, y: seatY + seatH - 1}, {x: 14, y: seatY + seatH}, // Right side
        {x: 2, y: seatY + seatH}, {x: 1, y: seatY + seatH - 1} // Bottom & Left
    ], cWoodLight);

    // Seat Highlights/Shadows
    drawer.hLine(2, seatY, 12, cWoodHighlight);
    drawer.hLine(2, seatY + seatH, 12, cWoodDark);
    
    // 4. Backrest
    const backY = 0;
    const backH = 10;
    
    // Main Backrest Shape (Rounded top)
    drawer.fillQuadCurve(2, backY + 2, 8, backY - 2, 14, backY + 2, cWood);
    drawer.rect(2, backY + 2, 12, backH - 2, cWood);
    
    // Vertical Slats (Grid)
    const slatColor = cWoodDark;
    drawer.vLine(5, backY + 2, 6, slatColor);
    drawer.vLine(8, backY + 1, 7, slatColor);
    drawer.vLine(11, backY + 2, 6, slatColor);

    // Backrest Frame Highlight
    drawer.strokePath([
        {x: 2, y: backY + backH}, 
        {x: 2, y: backY + 2},
        {x: 8, y: backY}, // Approx top center
        {x: 14, y: backY + 2},
        {x: 14, y: backY + backH}
    ], cWoodHighlight);

    return drawer.getCanvas();
}
