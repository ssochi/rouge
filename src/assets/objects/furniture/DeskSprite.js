import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createDeskSprite() {
    const w = 32;
    const h = 32;
    const drawer = new PixelDraw(w, h);

    const { 
        cWood, cWoodDark, cWoodLight, 
        cWoodHighlight, cWoodGrain, 
        cGold, cGoldDark, 
        cShadowDeep 
    } = FurniturePalette;

    // Perspective: Top-down 35 degrees
    // Top surface height
    const topH = 8; 
    
    // 1. Legs (Curved/Styled)
    // Back legs (Darker)
    const legY = 20;
    const legH = 12;
    
    // Back Left
    drawer.fillPath([
        {x: 4, y: legY}, {x: 7, y: legY},
        {x: 6, y: legY + legH - 2}, {x: 4, y: legY + legH - 2}
    ], cWoodDark);
    
    // Back Right
    drawer.fillPath([
        {x: w-7, y: legY}, {x: w-4, y: legY},
        {x: w-4, y: legY + legH - 2}, {x: w-6, y: legY + legH - 2}
    ], cWoodDark);

    // Front legs (Lighter)
    // Front Left
    drawer.fillPath([
        {x: 2, y: legY}, {x: 6, y: legY},
        {x: 5, y: legY + legH}, {x: 2, y: legY + legH}
    ], cWood);
    drawer.vLine(2, legY, legH, cWoodHighlight); // Highlight
    drawer.vLine(5, legY, legH, cWoodDark); // Shadow

    // Front Right
    drawer.fillPath([
        {x: w-6, y: legY}, {x: w-2, y: legY},
        {x: w-2, y: legY + legH}, {x: w-5, y: legY + legH}
    ], cWood);
    drawer.vLine(w-6, legY, legH, cWoodHighlight);
    drawer.vLine(w-2, legY, legH, cWoodDark);

    // 2. Main Body (Drawer housing)
    const bodyY = topH;
    const bodyH = 12;
    
    // Body Shape
    drawer.fillPath([
        {x: 1, y: bodyY}, {x: w-1, y: bodyY},
        {x: w-1, y: bodyY + bodyH}, {x: 1, y: bodyY + bodyH}
    ], cWood);

    // Side Shading
    drawer.vLine(w-1, bodyY, bodyH, cWoodDark);
    drawer.vLine(1, bodyY, bodyH, cWoodHighlight);

    // 3. Drawers
    // Left Drawer
    const dY = bodyY + 2;
    const dH = 8;
    const dW = 12;
    
    const drawDrawer = (dx) => {
        // Recess
        drawer.rect(dx, dY, dW, dH, cShadowDeep);
        // Face
        drawer.rect(dx+1, dY+1, dW-2, dH-2, cWood);
        // Bevels
        drawer.hLine(dx+1, dY+1, dW-2, cWoodHighlight);
        drawer.vLine(dx+1, dY+1, dH-2, cWoodHighlight);
        drawer.hLine(dx+1, dY+dH-2, dW-2, cWoodDark);
        drawer.vLine(dx+dW-2, dY+1, dH-2, cWoodDark);
        
        // Gold Handle
        const hx = dx + dW/2;
        const hy = dY + dH/2;
        drawer.rect(hx-2, hy, 4, 1, cGold);
        drawer.pixel(hx-2, hy, cGoldDark);
        drawer.pixel(hx+1, hy, cGoldDark);
    };

    drawDrawer(3); // Left
    drawDrawer(w - 3 - dW); // Right

    // 4. Desktop Surface (The most visible part)
    // Main surface
    drawer.fillPath([
        {x: 1, y: 0}, {x: w-1, y: 0},
        {x: w, y: 1}, {x: w, y: topH-1},
        {x: w-1, y: topH}, {x: 1, y: topH},
        {x: 0, y: topH-1}, {x: 0, y: 1}
    ], cWoodLight);

    // Edge highlight/shadow
    drawer.hLine(1, 0, w-2, cWoodHighlight); // Back edge
    drawer.hLine(1, topH, w-2, cWoodDark);   // Front edge
    drawer.vLine(0, 1, topH-2, cWoodHighlight); // Left edge
    drawer.vLine(w, 1, topH-2, cWoodDark); // Right edge

    // Wood Grain details on top
    drawer.hLine(4, 2, 6, cWoodGrain);
    drawer.hLine(15, 5, 8, cWoodGrain);
    drawer.hLine(22, 3, 4, cWoodGrain);
    drawer.hLine(6, 6, 5, cWoodGrain);

    // Papers/Items on desk (Optional decoration)
    // White paper
    drawer.rect(20, 2, 6, 4, '#f5f5f5');
    drawer.hLine(21, 3, 4, '#bdc3c7'); // Text lines
    drawer.hLine(21, 4, 3, '#bdc3c7');

    return drawer.getCanvas();
}
