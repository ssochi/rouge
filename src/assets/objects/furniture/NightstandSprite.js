import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createNightstandSprite() {
    // Nightstand: Small, 16x24 (Visual height includes top projection)
    // Fits in 1 tile loosely.
    const w = 16;
    const h = 24;
    const drawer = new PixelDraw(w, h);
    
    const { cWood, cWoodDark, cWoodLight, cGold, cGoldDark } = FurniturePalette;
    
    // Geometry
    // Top Face: 16x6 (Perspective)
    // Front Face: 16x14
    // Legs: 4px
    
    const topH = 6;
    const frontH = 14;
    const legH = 4;
    
    // 1. Rear Legs (Darker, slightly inset)
    drawer.fillPath([{x: 2, y: h-legH}, {x: 4, y: h-legH}, {x: 4, y: h}, {x: 2, y: h}], cWoodDark);
    drawer.fillPath([{x: w-4, y: h-legH}, {x: w-2, y: h-legH}, {x: w-2, y: h}, {x: w-4, y: h}], cWoodDark);
    
    // 2. Main Body (Front Face)
    const by = topH;
    drawer.rect(0, by, w, frontH, cWood);
    
    // Side Shading (Right side)
    drawer.vLine(w-1, by, frontH, cWoodDark);
    drawer.vLine(w-2, by, frontH, 'rgba(0,0,0,0.1)'); // Soft bevel
    
    // 3. Drawers (2 Drawers)
    const drawH = 5;
    const drawM = 2; // Margin
    
    // Top Drawer
    drawer.strokeRect(drawM, by + 2, w - drawM*2, drawH, cWoodDark); // Outline
    drawer.hLine(drawM + 1, by + 2 + drawH, w - drawM*2 - 2, 'rgba(255,255,255,0.1)'); // Bottom highlight (bevel)
    // Handle
    drawer.pixel(w/2 - 1, by + 4, cGold);
    drawer.pixel(w/2, by + 4, cGoldDark);
    
    // Bottom Drawer
    drawer.strokeRect(drawM, by + 2 + drawH + 1, w - drawM*2, drawH, cWoodDark);
    // Handle
    drawer.pixel(w/2 - 1, by + 4 + drawH + 1, cGold);
    drawer.pixel(w/2, by + 4 + drawH + 1, cGoldDark);
    
    // 4. Top Face (Projected Up/Back)
    // We draw a "lid" that is 1px wider/taller than body?
    // Let's make it flush but 3D.
    drawer.fillPath([
        {x: 0, y: 0},
        {x: w, y: 0},
        {x: w, y: topH},
        {x: 0, y: topH}
    ], cWoodDark); // Darker top
    
    // Top Surface Highlight (The actual flat top)
    drawer.fillPath([
        {x: 1, y: 1},
        {x: w-1, y: 1},
        {x: w-1, y: topH-1},
        {x: 1, y: topH-1}
    ], cWood); // Base color for top
    
    // Bevels for Top
    drawer.hLine(0, 0, w, cWoodLight); // Top edge
    drawer.vLine(0, 0, topH, cWoodLight); // Left edge
    
    return drawer.getCanvas();
}
