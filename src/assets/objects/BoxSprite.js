import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

export function createBoxSprite() {
    const drawer = new PixelDraw(32, 32);
    const p = PALETTE;
    
    // Colors
    const cBase = p['8']; // Light Wood
    const cDark = p['7']; // Dark Wood
    const cBorder = '#3e2723'; // Darker Brown
    const cNail = p['9']; // Metal
    const cWear = 'rgba(0,0,0,0.15)';

    // Dimensions
    const topH = 8;
    const totalH = 24;
    const w = 24;
    const x = 4; // Centered
    const y = 6; 

    // Use Paths for slightly irregular shape (Hand-drawn feel)
    // Front Face Path
    // Randomize slight offsets for "organic" feel? Maybe just defined points.
    const frontFace = [
        {x: x, y: y + topH}, // Top Left
        {x: x + w, y: y + topH}, // Top Right
        {x: x + w, y: y + totalH}, // Bottom Right
        {x: x, y: y + totalH} // Bottom Left
    ];
    drawer.fillPath(frontFace, cDark);

    // Top Face Path (Perspective)
    const topFace = [
        {x: x, y: y + topH}, // Bottom Left
        {x: x, y: y}, // Top Left
        {x: x + w, y: y}, // Top Right
        {x: x + w, y: y + topH} // Bottom Right
    ];
    drawer.fillPath(topFace, cBase);

    // Side Borders (Irregular)
    // Left
    drawer.fillPath([
        {x: x, y: y + topH}, 
        {x: x + 2, y: y + topH}, 
        {x: x + 2, y: y + totalH}, 
        {x: x, y: y + totalH - 1} // Cut corner
    ], cBorder);
    
    // Right
    drawer.fillPath([
        {x: x + w - 2, y: y + topH}, 
        {x: x + w, y: y + topH}, 
        {x: x + w, y: y + totalH - 1}, 
        {x: x + w - 2, y: y + totalH} 
    ], cBorder);
    
    // Bottom
    drawer.fillPath([
        {x: x, y: y + totalH - 2},
        {x: x + w, y: y + totalH - 2},
        {x: x + w - 1, y: y + totalH},
        {x: x + 1, y: y + totalH}
    ], cBorder);

    // Inner X Brace (Diagonal Paths!)
    // Top-Left to Bottom-Right
    drawer.fillPath([
        {x: x + 3, y: y + topH + 3},
        {x: x + 5, y: y + topH + 3},
        {x: x + w - 3, y: y + totalH - 4},
        {x: x + w - 5, y: y + totalH - 4}
    ], cBorder);
    
    // Top-Right to Bottom-Left
    drawer.fillPath([
        {x: x + w - 3, y: y + topH + 3},
        {x: x + w - 5, y: y + topH + 3},
        {x: x + 3, y: y + totalH - 4},
        {x: x + 5, y: y + totalH - 4}
    ], cBorder);

    // Top Surface Details (Planks)
    drawer.vLine(x + 8, y + 1, topH - 1, cDark);
    drawer.vLine(x + 16, y + 1, topH - 1, cDark);

    // Nails
    const drawNail = (nx, ny) => drawer.pixel(nx, ny, cNail);
    drawNail(x + 1, y + 2);
    drawNail(x + w - 2, y + 2);
    drawNail(x + 1, y + topH - 2);
    drawNail(x + w - 2, y + topH - 2);
    
    // Front Nails
    drawNail(x + 1, y + topH + 2);
    drawNail(x + w - 2, y + topH + 2);
    drawNail(x + 1, y + totalH - 3);
    drawNail(x + w - 2, y + totalH - 3);

    // Highlights
    drawer.strokePath([
        {x: x, y: y + topH},
        {x: x + w, y: y + topH}
    ], 'rgba(255,255,255,0.3)');

    return drawer.getCanvas();
}
