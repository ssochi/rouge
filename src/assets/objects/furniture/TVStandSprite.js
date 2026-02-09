import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createTVStandAnimatedSprite() {
    // Returns an array of frames for the animated TV
    const frames = [];
    const frameCount = 4;
    
    // Base TV Stand dimensions
    const w = 40;
    const h = 32;
    
    const { cWood, cWoodDark, cWoodLight } = FurniturePalette;
    
    // Pre-calculate base geometry to reuse code
    // But we need to draw it fresh for each frame to bake the screen content
    
    for(let f=0; f<frameCount; f++) {
        const drawer = new PixelDraw(w, h);
        
        // --- 1. Stand (Wooden Cabinet) ---
        const standH = 12;
        const standY = h - standH;
        
        // Legs (Modern style)
        drawer.rect(2, h-2, 4, 2, cWoodDark);
        drawer.rect(w-6, h-2, 4, 2, cWoodDark);
        
        // Cabinet Body
        drawer.rect(0, standY, w, standH-2, cWood);
        // Top Surface
        drawer.rect(0, standY, w, 4, cWoodDark); 
        drawer.hLine(0, standY, w, cWoodLight); 
        
        // Glass Doors (Left/Right)
        // Recessed slightly
        const doorW = w/2 - 2;
        drawer.rect(2, standY+4, doorW, standH-6, '#4e342e'); // Darker inside
        drawer.rect(w/2, standY+4, doorW, standH-6, '#4e342e');
        // Glass reflection lines
        drawer.line(4, standY+6, 8, standY+10, 'rgba(255,255,255,0.1)');
        drawer.line(w/2+2, standY+6, w/2+6, standY+10, 'rgba(255,255,255,0.1)');
        
        // VCR in center shelf (if open style)? 
        // Let's put VCR on top of the cabinet? No, usually inside.
        // Let's stick to closed cabinet for cleaner look, but add VCR lights blinking?
        // Let's add a VCR on the shelf below TV if we had one.
        // Let's draw a VCR sitting on the cabinet top, under the TV? Or just inside.
        // Let's put a small console on the floor or shelf.
        
        // --- 2. TV (CRT Style) ---
        const tvW = 24;
        const tvH = 18;
        const tvX = (w - tvW) / 2;
        const tvY = standY - tvH + 3; 
        
        // Casing (Dark Grey with highlight)
        const cTV = '#2c3e50';
        const cTVDark = '#1a252f';
        const cTVLight = '#34495e';
        
        // Main Box
        drawer.fillPath([
            {x: tvX, y: tvY}, {x: tvX+tvW, y: tvY},
            {x: tvX+tvW, y: tvY+tvH}, {x: tvX, y: tvY+tvH}
        ], cTV);
        
        // Bevels / 3D Shape
        drawer.rect(tvX, tvY, tvW, 3, cTVLight); // Top
        drawer.vLine(tvX+tvW-1, tvY, tvH, cTVDark); // Right shadow
        drawer.hLine(tvX, tvY+tvH-1, tvW, cTVDark); // Bottom shadow
        
        // Screen (The Animated Part)
        const scrM = 2;
        const scrX = tvX + scrM;
        const scrY = tvY + scrM;
        const scrW = tvW - scrM*2;
        const scrH = tvH - scrM*2 - 2; 
        
        // Screen Base Glow
        drawer.rect(scrX, scrY, scrW, scrH, '#85c1e9'); // Light Blue Glow
        
        // Animation Content: "News Anchor" Blob
        const headX = scrX + scrW/2;
        const headY = scrY + scrH/2;
        
        // Frame 0: Center
        // Frame 1: Talk (Mouth open/move)
        // Frame 2: Move slight left
        // Frame 3: Move slight right
        
        let offsetX = 0;
        if (f === 2) offsetX = -1;
        if (f === 3) offsetX = 1;
        
        // Draw Head
        drawer.rect(headX - 2 + offsetX, headY - 3, 4, 4, '#f1c40f'); // Yellow face
        // Shoulders
        drawer.rect(headX - 4 + offsetX, headY + 1, 8, 3, '#e74c3c'); // Red suit
        
        // Static/Scanlines overlay
        for(let ly = scrY; ly < scrY + scrH; ly++) {
            if ((ly + f) % 2 === 0) {
                drawer.hLine(scrX, ly, scrW, 'rgba(0,0,0,0.1)');
            }
        }
        
        // Glare (Static)
        drawer.line(scrX+scrW-4, scrY+1, scrX+scrW-1, scrY+4, 'rgba(255,255,255,0.4)');
        
        // Power Light (Blinking?)
        const lightColor = (f % 2 === 0) ? '#e74c3c' : '#c0392b';
        drawer.pixel(tvX + tvW - 3, tvY + tvH - 2, lightColor);
        
        // Antenna
        drawer.line(tvX + 4, tvY, tvX - 2, tvY - 6, '#95a5a6');
        drawer.line(tvX + tvW - 4, tvY, tvX + tvW + 2, tvY - 6, '#95a5a6');
        
        frames.push(drawer.getCanvas());
    }
    
    return frames;
}
