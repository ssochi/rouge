import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createWashingMachineSprite() {
    const w = 32;
    const h = 32;
    const drawer = new PixelDraw(w, h);

    // Palette
    const cWhite = '#ecf0f1';
    const cGray = '#bdc3c7';
    const cDark = '#7f8c8d';
    const cGlass = '#3498db';
    const cGlassDark = '#2980b9';
    const cGlassLight = '#85c1e9';
    const cShadow = 'rgba(0,0,0,0.15)';

    // 1. Body
    const topH = 6;
    const bodyH = 24;
    const legH = 2;

    // Main Body
    drawer.fillPath([
        {x: 1, y: topH}, {x: w-1, y: topH},
        {x: w-1, y: topH + bodyH}, {x: 1, y: topH + bodyH}
    ], cWhite);
    
    // Side Shading
    drawer.vLine(w-1, topH, bodyH, cGray);
    drawer.vLine(1, topH, bodyH, '#ffffff');

    // Top Surface
    drawer.fillPath([
        {x: 1, y: 1}, {x: w-1, y: 1},
        {x: w, y: 2}, {x: w, y: topH},
        {x: w-1, y: topH+1}, {x: 1, y: topH+1},
        {x: 0, y: topH}, {x: 0, y: 2}
    ], '#ffffff');
    drawer.hLine(1, topH+1, w-2, cGray); // Lip shadow

    // 2. Control Panel (Top section of front)
    const panelH = 6;
    drawer.rect(2, topH + 2, w-4, panelH, '#f4f6f7');
    drawer.hLine(2, topH + 2 + panelH, w-4, cGray); // Separator

    // Knob
    drawer.circle(6, topH + 5, 2, cDark);
    drawer.pixel(6, topH + 5, '#ffffff');

    // Buttons
    drawer.rect(12, topH + 4, 2, 2, '#e74c3c'); // Red
    drawer.rect(15, topH + 4, 2, 2, '#2ecc71'); // Green
    
    // Digital Display
    drawer.rect(22, topH + 4, 6, 3, '#2c3e50');
    drawer.pixel(23, topH + 5, '#e74c3c'); // Digits
    drawer.pixel(25, topH + 5, '#e74c3c');

    // 3. Door (The main feature)
    const doorCx = w / 2;
    const doorCy = topH + panelH + (bodyH - panelH) / 2 + 1;
    const doorR = 9;

    // Door Frame (White/Gray ring)
    drawer.circle(doorCx, doorCy, doorR + 1, cGray);
    drawer.circle(doorCx, doorCy, doorR, cWhite);
    
    // Door Glass (Blue with reflection)
    drawer.circle(doorCx, doorCy, doorR - 2, cGlassDark); // Base dark blue
    drawer.fillQuadCurve(doorCx - 5, doorCy, doorCx, doorCy + 5, doorCx + 5, doorCy, cGlass); // Water/Light effect
    
    // Glass Reflection (Diagonal)
    drawer.line(doorCx - 3, doorCy - 4, doorCx - 1, doorCy - 6, cGlassLight);
    drawer.line(doorCx - 2, doorCy - 2, doorCx + 2, doorCy - 6, cGlassLight);

    // Door Handle
    drawer.rect(doorCx + doorR - 1, doorCy - 2, 2, 4, cDark);

    // 4. Feet
    drawer.rect(2, 30, 3, 2, cDark);
    drawer.rect(w-5, 30, 3, 2, cDark);

    return drawer.getCanvas();
}
