import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

export function createHorizontalWallSprite() {
    // Horizontal Wall: 32px wide, 12px thick (matching Adaptive), 16px high (projection)
    // Canvas: 32x48 (to match adaptive wall canvas size logic)
    // Adaptive Wall:
    // Footprint: y=10 to y=22 (Center)
    // Top Face: y=10 (Projected up? No, Top Face is drawn at y, visual base is y+16)
    
    // Let's match AdaptiveWall "Center + East + West" (Mask 10)
    // Canvas 32x48.
    // Top Face Y: 10.
    // Wall Thickness: 12.
    // Visual Base Y: 10 + 16 = 26.
    // Front Face Height: 16. (extends from 26 down to 42?)
    // No. AdaptiveWall logic:
    // "Top Face is drawn at r.y"
    // "Front Face is rect from Y = r.y + r.h (Bottom of Top Face) to Y = r.y + r.h + wallHeight"
    // If r.y=10, r.h=12. Bottom of Top Face = 22.
    // Front Face = 22 to 22+16 = 38.
    
    // Let's implement exactly that.
    
    const drawer = new PixelDraw(32, 48);
    const p = PALETTE;
    
    const cTop = '#95a5a6'; // Light Concrete
    const cFront = '#7f8c8d'; // Dark Concrete (Shadow)
    const cOutline = '#546e7a';
    const cHighlight = '#bdc3c7';
    
    const yTop = 10;
    const thickness = 12;
    const height = 16;
    
    // Front Face (y=22 to 38)
    drawer.rect(0, yTop + thickness, 32, height, cFront);
    drawer.strokeRect(0, yTop + thickness, 32, height, cOutline);
    
    // Top Face (y=10 to 22)
    drawer.rect(0, yTop, 32, thickness, cTop);
    
    // Highlights
    drawer.hLine(0, yTop, 32, cHighlight); // Top edge
    
    return drawer.getCanvas();
}

export function createVerticalWallSprite() {
    // Vertical Wall: 12px wide (matching Adaptive), 32px high, 16px projection
    // Canvas: 32x48
    // Adaptive Wall Center + North + South (Mask 5)
    // Center X: 10. Width: 12.
    // Top Face Y: 0 to 32.
    // Front Face: Only at bottom end?
    // Mask 5 has North (y=0..10), Center (y=10..22), South (y=22..32).
    // So Top Face is rect(10, 0, 12, 32).
    // Front Face: At bottom (y=32). Rect(10, 32, 12, 16).
    
    const drawer = new PixelDraw(32, 48);
    const p = PALETTE;
    
    const cTop = '#95a5a6';
    const cFront = '#7f8c8d';
    const cOutline = '#546e7a';
    const cHighlight = '#bdc3c7';
    
    const xLeft = 10;
    const width = 12;
    const height = 16;
    
    // Front Face (End Cap) at y=32..48
    drawer.rect(xLeft, 32, width, height, cFront);
    drawer.strokeRect(xLeft, 32, width, height, cOutline);
    
    // Top Face (y=0 to 32)
    drawer.rect(xLeft, 0, width, 32, cTop);
    
    // Highlights
    drawer.vLine(xLeft, 0, 32, cHighlight); // Left edge
    
    return drawer.getCanvas();
}
