import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createPianoSprite() {
    const w = 64;
    const h = 32;
    const drawer = new PixelDraw(w, h);

    // Piano Palette
    const cBlack = '#2c3e50'; // Slightly blueish black for better shading
    const cBlackDark = '#1a252f';
    const cBlackLight = '#34495e';
    const cHighlight = '#5d6d7e'; // For glossy edges
    const cWhite = '#ecf0f1';
    const cGold = '#f1c40f';
    const cGoldDark = '#b7950b';
    const cRed = '#c0392b'; // For velvet seat/felt

    // 1. Main Body Box
    const bodyH = 24;
    const topH = 8;
    
    // Left Side Panel (Curved front)
    drawer.fillPath([
        {x: 4, y: topH}, {x: 12, y: topH},
        {x: 12, y: 20}, {x: 8, y: 24}, {x: 4, y: 24}
    ], cBlackDark);

    // Right Side Panel
    drawer.fillPath([
        {x: w-12, y: topH}, {x: w-4, y: topH},
        {x: w-4, y: 24}, {x: w-8, y: 24}, {x: w-12, y: 20}
    ], cBlackDark);

    // Center Body (Front Panel)
    drawer.rect(12, topH, w-24, 12, cBlack);
    
    // Glossy Reflection on Front Panel (Diagonal)
    drawer.line(16, topH+2, 24, topH+10, cBlackLight);
    drawer.line(20, topH+2, 26, topH+8, cBlackLight);

    // 2. Top Lid
    drawer.fillPath([
        {x: 2, y: 2}, {x: w-2, y: 2},
        {x: w, y: topH}, {x: 0, y: topH}
    ], cBlackLight);
    drawer.hLine(2, 2, w-4, cHighlight); // Top edge highlight
    
    // Music Stand (On top)
    const standX = w/2 - 8;
    const standY = 1;
    drawer.rect(standX, standY, 16, 6, cBlackDark);
    // Sheet Music
    drawer.rect(standX + 2, standY + 1, 12, 4, cWhite);
    drawer.hLine(standX + 3, standY + 2, 10, '#bdc3c7'); // Notes
    drawer.hLine(standX + 3, standY + 3, 10, '#bdc3c7');

    // 3. Keyboard
    const keyY = 18;
    const keyH = 4;
    const keyX = 13;
    const keyW = w - 26;
    
    // Red Felt under keys
    drawer.hLine(keyX, keyY - 1, keyW, cRed);
    
    // White Keys
    drawer.rect(keyX, keyY, keyW, keyH, cWhite);
    
    // Black Keys (Pattern: 2, 3, 2, 3...)
    const blackKeyColor = '#000000';
    let kx = keyX + 2;
    const pattern = [1, 1, 0, 1, 1, 1, 0]; // 1=black, 0=gap
    let pIdx = 0;
    
    while(kx < keyX + keyW - 2) {
        if (pattern[pIdx % 7] === 1) {
            drawer.vLine(kx, keyY, 2, blackKeyColor);
        } else {
            drawer.vLine(kx, keyY, 4, '#bdc3c7'); // Key separator for gaps
        }
        kx += 3;
        pIdx++;
    }

    // 4. Legs
    const legY = 24;
    const legH = 8;
    // Front Legs (Tapered)
    drawer.fillPath([
        {x: 4, y: legY}, {x: 8, y: legY},
        {x: 7, y: legY + legH}, {x: 5, y: legY + legH}
    ], cBlackDark);
    drawer.fillPath([
        {x: w-8, y: legY}, {x: w-4, y: legY},
        {x: w-5, y: legY + legH}, {x: w-7, y: legY + legH}
    ], cBlackDark);

    // 5. Pedals
    const pedX = w/2;
    const pedY = 30;
    drawer.rect(pedX - 4, pedY, 8, 2, cGoldDark); // Bar
    drawer.vLine(pedX - 2, pedY - 2, 2, cGold); // Left pedal
    drawer.vLine(pedX, pedY - 2, 2, cGold);     // Middle pedal
    drawer.vLine(pedX + 2, pedY - 2, 2, cGold); // Right pedal

    return drawer.getCanvas();
}
