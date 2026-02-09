import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createBookshelfSprite() {
    // Bookshelf: Tall, filled with varied books and decor.
    // Size: 32x48.
    const w = 32;
    const h = 48;
    const drawer = new PixelDraw(w, h);
    
    const { cWood, cWoodDark, cWoodLight, cGold } = FurniturePalette;
    
    // Frame with depth
    drawer.rect(0, 0, w, h, cWood);
    
    // Back Panel (Deep shadow)
    drawer.rect(2, 4, w-4, h-6, '#2d1e17'); 
    
    // Shelves (Thick)
    const shelfY = [14, 26, 38];
    shelfY.forEach(y => {
        drawer.rect(2, y, w-4, 2, cWood);
        drawer.hLine(2, y, w-4, cWoodLight); // Shelf top highlight
        drawer.hLine(2, y+2, w-4, 'rgba(0,0,0,0.3)'); // Shelf shadow underneath
    });
    
    // Top Cornice
    drawer.rect(0, 0, w, 4, cWoodDark);
    drawer.hLine(1, 1, w-2, cWoodLight);
    
    // Decor & Books
    const bookColors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#ecf0f1', '#95a5a6'];
    
    // Shelf 1 (Top): Small books + Pot
    const s1y = 4;
    const s1h = 10;
    // Plant Pot
    drawer.rect(4, s1y+s1h-4, 4, 4, '#e67e22'); // Orange pot
    drawer.pixel(5, s1y+s1h-6, '#27ae60'); // Green leaf
    drawer.pixel(7, s1y+s1h-5, '#2ecc71'); // Green leaf
    // Leaning Book
    drawer.line(12, s1y+s1h, 15, s1y+s1h-8, '#3498db');
    drawer.line(13, s1y+s1h, 16, s1y+s1h-8, '#2980b9');
    
    // Shelf 2 (Middle): Stacked books + Standing books
    const s2y = 16;
    const s2h = 10;
    // Stacked (Horizontal)
    drawer.rect(4, s2y+s2h-3, 8, 3, '#e74c3c'); // Bottom book
    drawer.rect(5, s2y+s2h-6, 6, 3, '#f1c40f'); // Top book
    // Standing row
    let bx = 16;
    while(bx < w-4) {
        const bh = Math.floor(Math.random() * 4) + 6;
        const bw = Math.floor(Math.random() * 2) + 2;
        const color = bookColors[Math.floor(Math.random() * bookColors.length)];
        drawer.rect(bx, s2y+s2h-bh, bw, bh, color);
        bx += bw + 1;
    }
    
    // Shelf 3 (Bottom): Box + Books
    const s3y = 28;
    const s3h = 10;
    // Storage Box
    drawer.rect(w-10, s3y+s3h-6, 8, 6, '#95a5a6'); // Grey box
    drawer.rect(w-9, s3y+s3h-5, 6, 1, '#7f8c8d'); // Handle/Lid
    // Tall books
    drawer.rect(4, s3y+s3h-9, 3, 9, '#8e44ad');
    drawer.rect(8, s3y+s3h-8, 3, 8, '#2c3e50');
    
    // Bottom Section (Doors/Drawers)
    drawer.rect(2, 40, w-4, 6, cWoodDark);
    drawer.vLine(w/2, 40, 6, 'rgba(0,0,0,0.3)'); // Gap
    drawer.pixel(w/2-2, 43, cGold); // Handle
    drawer.pixel(w/2+1, 43, cGold); // Handle
    
    // Side frames highlight
    drawer.vLine(0, 0, h, cWoodLight);
    drawer.vLine(w-1, 0, h, cWoodDark);
    
    return drawer.getCanvas();
}
