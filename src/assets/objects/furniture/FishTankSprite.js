import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createFishTankSprite() {
    const w = 32;
    const h = 48; // Increased height for 2.5D perspective
    
    // Colors
    const cWaterTop = '#85c1e9'; // Light blue (Top)
    const cWaterMid = '#5dade2'; // Mid blue
    const cWaterDeep = '#2e86c1'; // Deep blue (Bottom)
    const cGlassFrame = '#1a5276'; // Dark blue frame
    const cSand = '#f9e79f';
    const cCabinetDark = '#4a235a'; // Dark purple/wood
    const cCabinetLight = '#6c3483'; // Lighter cabinet
    const cCabinetTop = '#884ea0'; // Top face of cabinet

    const drawer = new PixelDraw(w, h);
    
    // --- 1. Cabinet (Bottom Part) ---
    const cabY = 32;
    const cabH = 16;
    
    // Cabinet Body (Front Face)
    drawer.rect(0, cabY, w, cabH, cCabinetDark);
    
    // Cabinet Doors Detail
    drawer.rect(2, cabY + 2, w/2 - 3, cabH - 4, cCabinetLight); // Left Door
    drawer.rect(w/2 + 1, cabY + 2, w/2 - 3, cabH - 4, cCabinetLight); // Right Door
    
    // Knobs
    drawer.pixel(w/2 - 4, cabY + cabH/2 - 1, '#f1c40f');
    drawer.pixel(w/2 + 3, cabY + cabH/2 - 1, '#f1c40f');
    
    // Cabinet Feet
    drawer.rect(0, h-2, 2, 2, '#2c3e50');
    drawer.rect(w-2, h-2, 2, 2, '#2c3e50');

    // --- 2. Fish Tank (Top Part) ---
    const tankX = 2;
    const tankY = 4; // Start a bit down to leave room for lid/light
    const tankW = w - 4;
    const tankH = 28; // Tank height
    
    // Glass/Water Body (Gradient approximation)
    // We'll draw 3 bands for gradient
    const bandH = Math.floor(tankH / 3);
    drawer.rect(tankX, tankY, tankW, bandH, cWaterTop);
    drawer.rect(tankX, tankY + bandH, tankW, bandH, cWaterMid);
    drawer.rect(tankX, tankY + bandH * 2, tankW, tankH - bandH * 2, cWaterDeep);
    
    // Sand at bottom of tank
    drawer.rect(tankX, tankY + tankH - 4, tankW, 4, cSand);

    // --- 3. Tank Top / Lid (Perspective) ---
    // Top Lid (Light/Cover)
    const lidH = 4;
    drawer.rect(0, 0, w, lidH, '#2c3e50'); // Dark plastic/metal lid
    drawer.hLine(0, 0, w, '#566573'); // Highlight on lid top edge
    
    // Frame Columns (Vertical supports)
    drawer.rect(0, lidH, 2, tankH, cGlassFrame); // Left pillar
    drawer.rect(w-2, lidH, 2, tankH, cGlassFrame); // Right pillar
    
    // Cabinet Top Face (Visible rim around tank base where it sits on cabinet)
    // Actually the tank sits ON the cabinet.
    // Let's draw the Cabinet Top surface that projects slightly
    // Since we are 2.5D, we see the top of the cabinet in front of the tank? No, tank is on top.
    // But maybe the cabinet is wider than the tank?
    // Let's keep tank width same as cabinet for sleek look, but maybe add a rim.
    
    // Bottom Rim of Tank
    drawer.rect(0, cabY - 2, w, 2, cCabinetTop);

    // --- 4. Glass Highlights ---
    // Vertical glare
    drawer.vLine(tankX + 4, tankY + 2, tankH - 4, 'rgba(255, 255, 255, 0.3)');
    drawer.vLine(tankX + 5, tankY + 2, tankH - 4, 'rgba(255, 255, 255, 0.1)');

    return drawer.getCanvas();
}
