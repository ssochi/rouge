import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createTableSprite() {
    // Table: Rectangular.
    // Size: 32x24 (Visual). 
    // Top surface large, legs thin.
    const w = 32;
    const h = 24;
    const drawer = new PixelDraw(w, h);
    
    const { cWood, cWoodDark, cWoodLight } = FurniturePalette;
    
    const topThick = 4;
    const legW = 3;
    
    // 1. Back Legs (Darker, shorter visually due to perspective)
    // Drawn first so they are behind
    const legH = h - topThick;
    const backLegOffset = 4; // How much "up" the back legs start
    
    drawer.rect(4, topThick + backLegOffset, legW, legH - backLegOffset, cWoodDark); // Back Left
    drawer.rect(w - 4 - legW, topThick + backLegOffset, legW, legH - backLegOffset, cWoodDark); // Back Right
    
    // 2. Front Legs
    drawer.rect(2, topThick, legW, legH, cWood); // Front Left
    drawer.vLine(2 + legW - 1, topThick, legH, cWoodDark); // Shading
    
    drawer.rect(w - 2 - legW, topThick, legW, legH, cWood); // Front Right
    drawer.vLine(w - 2 - 1, topThick, legH, cWoodDark); // Shading
    
    // 3. Table Top (Thick Slab)
    // Top Surface
    const surfaceH = 10; // Perspective depth of top
    drawer.fillPath([
        {x: 0, y: 0},
        {x: w, y: 0},
        {x: w, y: surfaceH},
        {x: 0, y: surfaceH}
    ], cWoodLight); // Lighter top
    
    // Wood grain detail on top?
    drawer.hLine(4, 3, 10, '#8d6e63');
    drawer.hLine(18, 7, 8, '#8d6e63');
    
    // Front/Side Thickness
    drawer.rect(0, surfaceH, w, topThick, cWood); // Front face
    drawer.vLine(w-1, surfaceH, topThick, cWoodDark); // Right side shading
    drawer.hLine(0, surfaceH + topThick - 1, w, cWoodDark); // Bottom edge shading
    
    // Highlight
    drawer.hLine(0, 0, w, '#a1887f'); // Top back edge highlight
    drawer.hLine(0, surfaceH, w, '#a1887f'); // Front edge highlight
    
    // Tablecloth? (Optional, let's keep it wood for now)
    
    return drawer.getCanvas();
}
