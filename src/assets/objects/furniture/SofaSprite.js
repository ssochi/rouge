import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createSofaSprite() {
    // Sofa: Wide, comfortable, tufted.
    // Size: 48x24.
    const w = 48;
    const h = 24;
    const drawer = new PixelDraw(w, h);
    
    const { cWoodDark } = FurniturePalette;
    
    const cFabric = '#c0392b'; // Deep Red
    const cFabricDark = '#922b21';
    const cFabricLight = '#e74c3c';
    const cTuftShadow = 'rgba(0,0,0,0.2)';
    
    const armW = 8;
    const armH = 14; // Visual height
    const backH = 20; // Backrest visual height
    const seatH = 10; // Seat visual height
    
    // 1. Backrest (Rounded top)
    const backY = 0;
    // Main Body
    drawer.fillPath([
        {x: 4, y: backY}, {x: w-4, y: backY},
        {x: w-2, y: backY+2}, {x: w-2, y: backY+backH},
        {x: 2, y: backY+backH}, {x: 2, y: backY+2}
    ], cFabric);
    
    // Top Face (Thickness)
    drawer.fillPath([
        {x: 4, y: backY}, {x: w-4, y: backY},
        {x: w-4, y: backY+3}, {x: 4, y: backY+3}
    ], cFabricDark);
    drawer.hLine(4, backY, w-8, cFabricLight); // Top highlight
    
    // Tufting (Buttons on backrest)
    const tuftY = backY + 8;
    for(let tx = 10; tx < w-8; tx += 8) {
        drawer.pixel(tx, tuftY, cFabricDark);
        drawer.pixel(tx+1, tuftY+1, cFabricLight); // Highlight under button
    }
    
    // 2. Armrests (Rounded)
    const armY = 8;
    // Left Arm
    drawer.fillPath([
        {x: 1, y: armY+2}, {x: armW-1, y: armY+2},
        {x: armW, y: armY+4}, {x: armW, y: armY+armH},
        {x: 0, y: armY+armH}, {x: 0, y: armY+4}
    ], cFabric);
    // Arm Top (Darker)
    drawer.fillPath([
        {x: 1, y: armY}, {x: armW-1, y: armY},
        {x: armW, y: armY+3}, {x: 0, y: armY+3}
    ], cFabricDark);
    drawer.hLine(2, armY, armW-3, cFabricLight);
    
    // Right Arm
    drawer.fillPath([
        {x: w-armW+1, y: armY+2}, {x: w-2, y: armY+2},
        {x: w, y: armY+4}, {x: w, y: armY+armH},
        {x: w-armW, y: armY+armH}, {x: w-armW, y: armY+4}
    ], cFabric);
    // Arm Top
    drawer.fillPath([
        {x: w-armW+1, y: armY}, {x: w-2, y: armY},
        {x: w, y: armY+3}, {x: w-armW, y: armY+3}
    ], cFabricDark);
    drawer.hLine(w-armW+2, armY, armW-3, cFabricLight);
    
    // 3. Seat (Cushions with rounded front)
    const seatY = 12;
    const seatW = w - armW*2;
    const seatX = armW;
    
    // Seat Shadow under backrest
    drawer.rect(seatX, seatY, seatW, seatH, cFabricDark);
    
    // Left Cushion
    const cushionW = seatW / 2 - 1;
    drawer.fillPath([
        {x: seatX, y: seatY+2}, {x: seatX+cushionW, y: seatY+2},
        {x: seatX+cushionW, y: seatY+seatH-1}, 
        {x: seatX+cushionW-2, y: seatY+seatH+1}, // Rounded corner
        {x: seatX+2, y: seatY+seatH+1}, // Rounded corner
        {x: seatX, y: seatY+seatH-1}
    ], cFabric);
    drawer.hLine(seatX+1, seatY+2, cushionW-2, cFabricLight); // Top edge highlight
    
    // Right Cushion
    const seatX2 = seatX + cushionW + 2;
    drawer.fillPath([
        {x: seatX2, y: seatY+2}, {x: seatX2+cushionW, y: seatY+2},
        {x: seatX2+cushionW, y: seatY+seatH-1}, 
        {x: seatX2+cushionW-2, y: seatY+seatH+1}, 
        {x: seatX2+2, y: seatY+seatH+1}, 
        {x: seatX2, y: seatY+seatH-1}
    ], cFabric);
    drawer.hLine(seatX2+1, seatY+2, cushionW-2, cFabricLight);
    
    // 4. Base/Legs (Wooden feet)
    drawer.rect(3, h-2, 4, 2, cWoodDark);
    drawer.rect(w-7, h-2, 4, 2, cWoodDark);
    
    return drawer.getCanvas();
}
