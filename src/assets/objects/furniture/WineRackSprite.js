import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createWineRackSprite() {
    const w = 32;
    const h = 48;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodHighlight, cWoodGrain, cShadowDeep, cWoodOutline } = FurniturePalette;

    // 1. Frame
    const topH = 4;
    const botH = 4;
    const bodyY = topH;
    const bodyH = h - topH - botH;
    
    // Side walls
    drawer.rect(2, bodyY, 2, bodyH, cWoodDark);
    drawer.rect(w-4, bodyY, 2, bodyH, cWoodDark);
    
    // Top Cornice
    drawer.fillPath([
        {x: 0, y: 0}, {x: w, y: 0},
        {x: w, y: topH}, {x: w-2, y: topH},
        {x: w-2, y: 2}, {x: 2, y: 2},
        {x: 2, y: topH}, {x: 0, y: topH}
    ], cWood);
    drawer.hLine(0, 0, w, cWoodHighlight);
    drawer.hLine(0, topH-1, w, cWoodDark);

    // Bottom Base
    drawer.rect(2, h-botH, w-4, botH, cWoodDark);
    drawer.hLine(2, h-1, w-4, cWoodOutline);

    // 2. Shelves (X-pattern dividers)
    const shelfH = 10;
    const startY = bodyY;
    
    // Background
    drawer.rect(4, bodyY, w-8, bodyH, '#2c1e1a'); // Dark interior

    // Draw X-grid
    const drawXGrid = (y) => {
        // Diagonal lines
        drawer.line(4, y, w-4, y+shelfH, cWoodLight);
        drawer.line(w-4, y, 4, y+shelfH, cWoodLight);
        // Horizontal shelf line
        drawer.hLine(4, y+shelfH, w-8, cWood);
    };

    drawXGrid(startY);
    drawXGrid(startY + shelfH);
    drawXGrid(startY + shelfH * 2);
    drawXGrid(startY + shelfH * 3);

    // 3. Wine Bottles
    const bottles = [
        {x: 14, y: startY + 4, color: '#a93226'}, // Red
        {x: 6, y: startY + shelfH + 4, color: '#1e8449'}, // Green
        {x: 22, y: startY + shelfH + 4, color: '#f1c40f'}, // White
        {x: 10, y: startY + shelfH*2 + 4, color: '#a93226'}, // Red
        {x: 18, y: startY + shelfH*2 + 4, color: '#1e8449'}, // Green
        {x: 14, y: startY + shelfH*3 + 4, color: '#884ea0'}, // Purple
    ];

    bottles.forEach(b => {
        // Bottle Body
        drawer.rect(b.x, b.y, 4, 4, b.color);
        // Neck
        drawer.rect(b.x+1, b.y-2, 2, 2, b.color);
        // Cork
        drawer.pixel(b.x+1, b.y-3, '#d35400');
        drawer.pixel(b.x+2, b.y-3, '#d35400');
        // Highlight
        drawer.vLine(b.x+1, b.y, 4, 'rgba(255,255,255,0.3)');
        drawer.pixel(b.x+1, b.y-2, 'rgba(255,255,255,0.3)');
    });

    return drawer.getCanvas();
}
