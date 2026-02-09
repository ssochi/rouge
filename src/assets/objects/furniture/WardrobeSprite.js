import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createWardrobeSprite() {
    // Wardrobe: Tall, Double Door.
    // Size: 32x56.
    const w = 32;
    const h = 56;
    const drawer = new PixelDraw(w, h);
    
    const { cWood, cWoodDark, cWoodLight, cGold } = FurniturePalette;
    
    const topH = 6; // Cornice height
    const baseH = 4; // Plinth height
    const bodyH = h - topH - baseH;
    
    // 1. Main Body
    drawer.rect(2, topH, w-4, bodyH, cWood);
    
    // Side Shading (Depth)
    drawer.vLine(w-3, topH, bodyH, cWoodDark);
    
    // 2. Doors (Split in middle)
    const doorW = (w - 6) / 2;
    const doorH = bodyH - 2;
    const doorY = topH + 1;
    const midX = w/2;
    
    // Left Door
    drawer.strokeRect(3, doorY, doorW, doorH, cWoodDark);
    // Inner bevel
    drawer.vLine(3+1, doorY+1, doorH-2, cWoodLight);
    drawer.hLine(3+1, doorY+1, doorW-2, cWoodLight);
    
    // Right Door
    drawer.strokeRect(midX, doorY, doorW, doorH, cWoodDark);
    // Inner bevel
    drawer.vLine(midX+1, doorY+1, doorH-2, cWoodLight);
    drawer.hLine(midX+1, doorY+1, doorW-2, cWoodLight);
    
    // Handles
    drawer.pixel(midX - 2, doorY + doorH/2, cGold);
    drawer.pixel(midX + 1, doorY + doorH/2, cGold);
    
    // 3. Cornice (Top Overhang) - 3D Box
    // Wider than body
    drawer.rect(0, 0, w, topH, cWoodDark);
    // Front face of cornice
    drawer.rect(0, 2, w, topH-2, cWood);
    // Bevels
    drawer.hLine(0, 2, w, cWoodLight);
    drawer.vLine(0, 2, topH-2, cWoodLight);
    drawer.vLine(w-1, 2, topH-2, cWoodDark);
    drawer.hLine(0, topH-1, w, cWoodDark); // Shadow under cornice
    
    // 4. Plinth (Base)
    const baseY = h - baseH;
    drawer.rect(1, baseY, w-2, baseH, cWoodDark);
    // Detail
    drawer.hLine(2, baseY+1, w-4, cWood);
    
    return drawer.getCanvas();
}
