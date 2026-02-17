import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createWorkbenchSprite() {
    const w = 64;
    const h = 32;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodGrain, cWoodHighlight } = FurniturePalette;
    const cMetal = '#7f8c8d';
    const cMetalDark = '#2c3e50';
    const cMetalLight = '#bdc3c7';

    // 1. Legs (Metal Frame)
    const legH = 20;
    const legY = 12;
    
    // Back Legs
    drawer.rect(4, legY, 2, legH, cMetalDark);
    drawer.rect(w-6, legY, 2, legH, cMetalDark);
    
    // Lower Shelf
    drawer.rect(4, legY + 12, w-8, 1, cMetalDark); // Shelf support
    drawer.rect(6, legY + 10, w-12, 2, cWoodDark); // Shelf plank

    // Toolbox on lower shelf
    drawer.rect(40, legY + 8, 10, 4, '#c0392b'); // Red box
    drawer.hLine(40, legY + 8, 10, '#e74c3c'); // Highlight
    drawer.hLine(44, legY + 7, 2, cMetalLight); // Handle

    // Front Legs
    drawer.rect(2, legY, 3, legH, cMetal);
    drawer.vLine(2, legY, legH, cMetalLight);
    drawer.vLine(4, legY, legH, cMetalDark);
    
    drawer.rect(w-5, legY, 3, legH, cMetal);
    drawer.vLine(w-5, legY, legH, cMetalLight);
    drawer.vLine(w-3, legY, legH, cMetalDark);

    // 2. Table Top (Thick Wood)
    const topH = 6;
    const topY = 6;
    
    // Main surface block
    drawer.fillPath([
        {x: 0, y: topY}, {x: w, y: topY},
        {x: w, y: topY + topH}, {x: 0, y: topY + topH}
    ], cWood);
    
    // Side shading
    drawer.vLine(0, topY, topH, cWoodLight);
    drawer.vLine(w-1, topY, topH, cWoodDark);
    drawer.hLine(0, topY + topH - 1, w, cWoodDark);

    // Top Surface
    drawer.fillPath([
        {x: 2, y: 0}, {x: w-2, y: 0},
        {x: w, y: topY}, {x: 0, y: topY}
    ], cWoodLight);
    drawer.hLine(2, 0, w-4, cWoodHighlight);

    // 3. Back Board (Pegboard)
    drawer.rect(4, -8, w-8, 8, cWoodDark); // Extending up (requires adjusting sprite origin or accept cropping if h is fixed)
    // NOTE: h=32, so we can't draw above y=0. Let's put tools on the table or attached to back edge.
    
    // Let's add a small backstop instead
    drawer.rect(2, 0, w-4, 2, cWoodDark);

    // 4. Tools & Items on Table
    // Vise (Left)
    drawer.rect(4, 2, 6, 4, cMetalDark);
    drawer.rect(5, 1, 4, 1, cMetal);
    drawer.hLine(2, 3, 4, cMetalLight); // Handle

    // Blueprint (Center)
    drawer.fillPath([
        {x: 20, y: 2}, {x: 36, y: 2},
        {x: 38, y: 5}, {x: 18, y: 5}
    ], '#3498db'); // Blue paper
    drawer.hLine(22, 3, 10, '#ecf0f1'); // Lines
    drawer.hLine(22, 4, 8, '#ecf0f1');

    // Hammer (Right)
    drawer.rect(50, 3, 8, 1, cWoodDark); // Handle
    drawer.rect(56, 1, 3, 5, cMetal); // Head

    return drawer.getCanvas();
}
