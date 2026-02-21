import { PixelDraw } from '../../../utils/PixelDraw.js';

export function createWashingMachineSprite() {
    const w = 32;
    const h = 32;
    const drawer = new PixelDraw(w, h);

    // === Color Palette ===
    const cWhite = '#ffffff';
    const cLightGray = '#f1f2f6';
    const cMidGray = '#ced6e0';
    const cDarkGray = '#a4b0be';
    const cShadow = '#747d8c';
    const cDarkest = '#2f3542';

    const cGlassDark = '#1e272e';
    const cGlassMid = '#3742fa';
    const cGlassLight = '#70a1ff';
    const cReflect = '#ffffff';

    const cGreen = '#2ed573';
    const cRed = '#ff4757';
    const cYellow = '#eccc68';

    drawer.clear();

    // === 1. Volumetric Base ===
    // Top surface (faces light source directly)
    drawer.rect(5, 4, 23, 8, cLightGray);
    drawer.rect(4, 5, 25, 6, cLightGray);

    // Front surface
    drawer.rect(4, 12, 25, 17, cMidGray);

    // === 2. 2.5D Volumetric Shading / Bevels ===
    // Top surface edges
    drawer.hLine(5, 4, 23, cWhite);      // Top edge highlight
    drawer.vLine(4, 5, 6, cWhite);       // Left curve highlight
    drawer.vLine(5, 5, 6, cWhite);
    drawer.vLine(27, 5, 6, cMidGray);    // Right curve shadow
    drawer.vLine(28, 5, 6, cDarkGray);

    // Connection Ridge (y=11)
    drawer.hLine(6, 11, 21, cDarkGray);
    drawer.hLine(4, 11, 2, cWhite);      // Catch the light on left corner
    drawer.hLine(27, 11, 2, cShadow);    // Deep shadow on right corner

    // Front surface edges
    drawer.vLine(4, 12, 16, cWhite);     // Front left bevel
    drawer.vLine(5, 12, 16, cLightGray);
    drawer.vLine(27, 12, 16, cDarkGray); // Front right bevel
    drawer.vLine(28, 12, 16, cShadow);

    // Bottom gradient & curving
    drawer.hLine(6, 28, 20, cDarkGray);
    drawer.hLine(6, 29, 20, cShadow);
    drawer.pixel(4, 28, cWhite);
    drawer.pixel(5, 28, cLightGray);
    drawer.pixel(4, 29, cLightGray);
    drawer.pixel(27, 28, cShadow);
    drawer.pixel(28, 28, cDarkest);
    drawer.pixel(27, 29, cDarkest);

    // === 3. Ground Cast Shadow & Feet ===
    drawer.hLine(6, 31, 21, 'rgba(0,0,0,0.3)');

    drawer.rect(6, 30, 3, 2, cDarkGray);
    drawer.hLine(6, 31, 3, cDarkest);

    drawer.rect(24, 30, 3, 2, cDarkGray);
    drawer.hLine(24, 31, 3, cDarkest);

    // === 4. Top Surface Extrusion Detail ===
    drawer.hLine(8, 6, 17, cDarkGray);    // Inset top shadow
    drawer.hLine(8, 9, 17, cWhite);       // Inset bottom highlight
    drawer.vLine(7, 6, 4, cDarkGray);     // Inset left shadow
    drawer.vLine(25, 6, 4, cWhite);       // Inset right highlight
    drawer.rect(8, 7, 17, 2, cLightGray);

    // === 5. Control Panel ===
    drawer.rect(6, 13, 21, 5, cLightGray);
    drawer.hLine(6, 18, 21, cDarkGray);   // Separator groove

    // Detergent Drawer
    drawer.rect(7, 14, 6, 3, cWhite);
    drawer.hLine(7, 17, 6, cDarkGray);
    drawer.hLine(8, 15, 4, cLightGray);   // Finger grip indent

    // Main Dial
    drawer.circle(16, 15, 2, cShadow);    // Base shadow
    drawer.circle(16, 15, 1, cWhite);     // Knob face
    drawer.pixel(17, 15, cDarkest);       // Position indicator

    // Digital Display Screen
    drawer.rect(20, 14, 6, 3, cGlassDark);
    drawer.pixel(21, 15, cGreen);         // Operation LED
    drawer.pixel(23, 15, cRed);           // Seven-segment digits
    drawer.pixel(24, 15, cRed);
    drawer.pixel(24, 16, cRed);
    drawer.pixel(18, 16, cYellow);        // Extra option button

    // === 6. Machine Body Details ===
    // Energy Efficiency Level Sticker
    drawer.rect(23, 19, 3, 4, cWhite);
    drawer.hLine(23, 19, 2, cGreen);
    drawer.hLine(23, 20, 2, cYellow);
    drawer.hLine(23, 21, 2, cRed);
    drawer.pixel(24, 22, cDarkGray);

    // === 7. Door Mechanism (Hinge & Handle) ===
    const cx = 16, cy = 23;
    // Metallic Hinge
    drawer.rect(9, 22, 2, 3, cDarkGray);
    drawer.vLine(10, 22, 3, cShadow);
    // Door Handle
    drawer.rect(21, 22, 2, 4, cDarkest);
    drawer.vLine(22, 22, 4, cWhite);      // Sharp metallic catch

    // === 8. The Glass Loading Door ===
    drawer.circle(cx + 1, cy + 1, 6, cShadow);    // Directional drop shadow
    drawer.circle(cx, cy, 6, cDarkGray);          // Outer thick frame structure
    drawer.circle(cx, cy, 5, cLightGray);         // Main metallic seal
    drawer.circle(cx - 1, cy - 1, 5, cWhite);     // 3D Rim bevel light
    drawer.circle(cx, cy, 4, cShadow);            // Inner slope tunnel downward
    drawer.circle(cx, cy, 3, cGlassDark);         // Interior void domain

    // === 9. Washing Machine Interior Visuals ===
    // Splashing water
    drawer.hLine(14, 23, 5, cGlassMid);
    drawer.hLine(14, 24, 5, cGlassLight);

    // Tumble washing clothes
    drawer.pixel(15, 24, cRed);
    drawer.pixel(17, 25, cGreen);
    drawer.pixel(14, 25, cGlassMid);

    // Curved glass outer reflection glare
    drawer.pixel(14, 21, cReflect);
    drawer.pixel(15, 21, cReflect);
    drawer.pixel(14, 22, cReflect);
    drawer.pixel(13, 20, cReflect);       // Edge sparkle

    return drawer.getCanvas();
}
