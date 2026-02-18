import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createCoatRackSprite() {
    const w = 16;
    const h = 40;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodHighlight, cWoodGrain } = FurniturePalette;

    // 1. Base (Tripod)
    const baseY = 36;
    drawer.line(8, 30, 2, baseY, cWoodDark); // Left leg
    drawer.line(8, 30, 14, baseY, cWoodDark); // Right leg
    drawer.vLine(8, 30, 8, cWoodDark); // Front leg
    
    // 2. Central Pole
    drawer.rect(7, 2, 2, 34, cWood);
    drawer.vLine(7, 2, 34, cWoodHighlight);
    drawer.vLine(8, 2, 34, cWoodDark);

    // 3. Hooks (Top)
    const hookY = 4;
    // Left Hook
    drawer.fillPath([
        {x: 7, y: hookY+2}, {x: 3, y: hookY}, {x: 3, y: hookY-1}
    ], cWoodDark);
    // Right Hook
    drawer.fillPath([
        {x: 9, y: hookY+2}, {x: 13, y: hookY}, {x: 13, y: hookY-1}
    ], cWoodDark);

    // 4. Hat (On top)
    const hatY = 0;
    const cHat = '#34495e';
    const cHatBand = '#e74c3c';
    // Brim
    drawer.fillQuadCurve(3, hatY+3, 8, hatY+5, 13, hatY+3, cHat);
    // Crown
    drawer.rect(5, hatY, 6, 3, cHat);
    // Band
    drawer.hLine(5, hatY+2, 6, cHatBand);

    // 5. Coat (Hanging on right hook)
    const cCoat = '#d35400'; // Orange/Brown coat
    const cCoatDark = '#a04000';
    
    // Shoulder part
    drawer.fillQuadCurve(9, hookY+1, 12, hookY-1, 14, hookY+3, cCoat);
    // Body hanging down
    drawer.fillPath([
        {x: 10, y: hookY+3}, {x: 14, y: hookY+3},
        {x: 15, y: 24}, {x: 9, y: 24}
    ], cCoat);
    // Collar
    drawer.line(10, hookY+3, 12, hookY+6, cCoatDark);
    // Sleeves/Folds
    drawer.vLine(12, hookY+3, 16, cCoatDark);
    
    // 6. Scarf (Hanging on left hook)
    const cScarf = '#8e44ad';
    drawer.fillPath([
        {x: 4, y: hookY}, {x: 6, y: hookY},
        {x: 5, y: 18}, {x: 3, y: 16}
    ], cScarf);
    // Tassels
    drawer.pixel(3, 17, cScarf);
    drawer.pixel(5, 19, cScarf);

    return drawer.getCanvas();
}
