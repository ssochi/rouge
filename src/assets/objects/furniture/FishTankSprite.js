import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createFishTankSprite() {
    const w = 32;
    const h = 32;
    const frames = [];

    // Colors
    const cWater = '#85c1e9'; // Light blue
    const cWaterDeep = '#3498db'; // Deep blue
    const cGlass = '#aed6f1'; // Glass tint
    const cSand = '#f9e79f';
    const cWeed = '#2ecc71';
    const cWeedDark = '#27ae60';
    const cCabinet = '#5d4037'; // Wood cabinet
    
    // Fish colors
    const cFish1 = '#e67e22'; // Goldfish
    const cFish2 = '#e74c3c'; // Red fish

    for (let f = 0; f < 4; f++) {
        const drawer = new PixelDraw(w, h);
        
        // 1. Cabinet Base
        const cabY = 22;
        drawer.rect(2, cabY, w-4, h-cabY, cCabinet);
        // Cabinet doors
        drawer.vLine(w/2, cabY+1, h-cabY-2, '#3e2723');
        drawer.pixel(w/2-2, cabY+4, '#f1c40f'); // Knob
        drawer.pixel(w/2+1, cabY+4, '#f1c40f'); // Knob

        // 2. Tank Glass Outline
        const tY = 2;
        const tH = 20;
        drawer.rect(2, tY, w-4, tH, cWaterDeep); // Background water
        
        // Sand bottom
        drawer.rect(2, tY + tH - 4, w-4, 4, cSand);
        
        // 3. Water Surface
        drawer.hLine(2, tY + 1, w-4, '#d6eaf8'); // Surface reflection

        // 4. Animated Seaweed
        const weedX = 6;
        const weedY = tY + tH - 4;
        const sway = Math.sin(f * Math.PI / 2) * 2;
        drawer.fillQuadCurve(weedX, weedY, weedX + sway, weedY - 6, weedX, weedY - 12, cWeed);
        
        const weedX2 = 24;
        const sway2 = Math.cos(f * Math.PI / 2) * 2;
        drawer.fillQuadCurve(weedX2, weedY, weedX2 - sway2, weedY - 5, weedX2, weedY - 10, cWeedDark);

        // 5. Animated Fish
        // Fish 1 (Swimming right)
        const f1x = 8 + (f * 2) % 16;
        const f1y = 10;
        drawer.rect(f1x, f1y, 4, 2, cFish1);
        drawer.pixel(f1x-1, f1y+1, cFish1); // Tail
        
        // Fish 2 (Swimming left)
        const f2x = 24 - (f * 3) % 18;
        const f2y = 15;
        drawer.rect(f2x, f2y, 3, 2, cFish2);
        drawer.pixel(f2x+3, f2y+1, cFish2); // Tail

        // 6. Bubbles
        const bubX = 14;
        const bubY = 18 - (f * 3) % 14;
        if (bubY > tY + 2) drawer.pixel(bubX, bubY, '#ffffff');
        
        const bubX2 = 20;
        const bubY2 = 18 - ((f+2) * 3) % 14;
        if (bubY2 > tY + 2) drawer.pixel(bubX2, bubY2, '#ffffff');

        // 7. Glass Highlights (Static)
        drawer.strokeRect(2, tY, w-4, tH, '#ffffff'); // Frame
        drawer.line(w-8, tY+2, w-4, tY+6, 'rgba(255,255,255,0.4)'); // Glint

        frames.push(drawer.getCanvas());
    }

    return frames;
}
