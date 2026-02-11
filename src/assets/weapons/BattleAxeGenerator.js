import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Battle Axe Generator (Double-Headed)
 * Dimensions: 32x32
 * Structure: Reinforced shaft with heavy double-bitted axe head.
 * Style: High-fantasy / Medieval, distinct metal shading.
 */
export function generateBattleAxe() {
    const drawer = new PixelDraw(32, 32);

    // Palette
    const cOutline = '#1a1a1a';    // Almost black
    const cShaft = '#5D4037';      // Deep wood
    const cShaftLight = '#8D6E63'; // Wood highlight
    const cWrap = '#3E2723';       // Dark leather
    const cWrapLight = '#5D4037';
    
    const cMetalDark = '#37474F';  // Dark slate
    const cMetalBase = '#546E7A';  // Blue grey
    const cMetalLight = '#78909C'; // Lighter grey
    const cEdge = '#CFD8DC';       // Sharp edge
    const cHighlight = '#FFFFFF';  // Specular
    
    const cGold = '#F57F17';       // Decorative gold/brass
    const cGoldLight = '#FBC02D';

    // ==========================================
    // 1. Shaft (Handle)
    // ==========================================
    // Main rod: x=4 to x=28, y=15-17
    
    // Outline/Shadow of shaft
    drawer.rect(4, 15, 24, 3, cOutline);
    
    // Wood core
    drawer.rect(4, 16, 24, 1, cShaft);
    
    // Pommel (Bottom/Left end)
    drawer.rect(2, 14, 3, 5, cOutline);
    drawer.rect(3, 15, 1, 3, cGold);
    drawer.pixel(3, 15, cGoldLight);

    // Grip Wraps (Leather strips)
    // x=6, 9, 12
    drawer.vLine(7, 15, 3, cWrap);
    drawer.vLine(10, 15, 3, cWrap);
    drawer.vLine(13, 15, 3, cWrap);

    // Top Spike (Right end of shaft)
    drawer.rect(28, 15, 3, 3, cMetalDark);
    drawer.pixel(29, 16, cMetalBase);
    drawer.pixel(30, 16, cEdge);

    // ==========================================
    // 2. Central Hub (Where blades connect)
    // ==========================================
    // x=20-24, y=13-19
    drawer.rect(20, 13, 4, 7, cMetalDark);
    drawer.rect(21, 14, 2, 5, cMetalBase); // Inner volume
    
    // Bolts/Rivets
    drawer.pixel(21, 15, cOutline);
    drawer.pixel(21, 17, cOutline);

    // ==========================================
    // 3. Blades (Symmetrical)
    // ==========================================
    
    const drawBlade = (flipY) => {
        // Base offsets
        const yBase = flipY ? 19 : 13;
        const dir = flipY ? 1 : -1; // 1 = down, -1 = up

        // We draw the TOP blade logic, then flip Y coordinate if needed.
        // Actually easier to just draw relative to yBase using dir.

        // Helper to plot pixel with flip support
        const p = (x, dy, color) => {
            drawer.pixel(x, yBase + (dy * dir), color);
        };
        const r = (x, dy, w, h, color) => {
            // If flipping, we need to adjust y to be top-left of the rect
            // Normal: y = yBase + dy
            // Flipped: y = yBase + dy (but dy is positive)
            // However, rect draws downwards.
            // If dir is -1 (UP), dy is negative (e.g. -5). y = 13 - 5 = 8. h=3. draws 8,9,10. Correct.
            // If dir is 1 (DOWN), dy is positive (e.g. 1). y = 19 + 1 = 20. h=3. draws 20,21,22. Correct.
            let finalY = yBase + (dy * dir);
            // If drawing UP and using height, we might need to adjust if we think of dy as "top" or "bottom".
            // Let's stick to explicit rects for major blocks.
            // For simplicity, let's use the 'p' helper for complex shapes.
        };

        // --- Blade Shape Generation ---
        
        // 1. Inner Neck (Connecting to hub)
        // x=20-24
        for(let x=21; x<=23; x++) p(x, 1, cMetalDark);
        for(let x=21; x<=23; x++) p(x, 2, cMetalDark);

        // 2. Main Body (Fan shape)
        // Layer 3 (y +/- 3)
        for(let x=19; x<=25; x++) p(x, 3, cMetalBase);
        
        // Layer 4
        for(let x=18; x<=26; x++) p(x, 4, cMetalBase);
        
        // Layer 5 (Widest internal)
        for(let x=17; x<=27; x++) p(x, 5, cMetalBase);
        
        // Layer 6
        for(let x=17; x<=27; x++) p(x, 6, cMetalBase);
        
        // Layer 7
        for(let x=18; x<=26; x++) p(x, 7, cMetalBase);
        
        // Layer 8 (Tapering)
        for(let x=19; x<=25; x++) p(x, 8, cMetalBase);
        
        // Layer 9 (Tips)
        for(let x=21; x<=23; x++) p(x, 9, cMetalBase);

        // 3. Cutting Edge (Bright & Sharp)
        // We iterate layers and add edge pixels at the outer X
        // Back edge (Left)
        p(19, 3, cMetalDark); p(18, 4, cMetalDark); p(17, 5, cMetalDark); 
        p(17, 6, cMetalDark); p(18, 7, cMetalDark); p(19, 8, cMetalDark);
        
        // Front Edge (Right) - The sharp part
        // We want a curve: 25 -> 26 -> 27 -> 27 -> 26 -> 25 -> 23
        const edgeX = [25, 26, 27, 27, 26, 25, 23];
        edgeX.forEach((x, i) => {
            let dy = 3 + i;
            p(x, dy, cEdge);
            p(x+1, dy, cEdge); // Double width for sharpness feel or anti-aliasing
            // Add a highlight just inside the edge
            p(x-1, dy, cMetalLight);
        });
        
        // Specular Highlight (Shininess)
        p(20, 5, cHighlight);
        p(21, 5, cHighlight);
        p(20, 6, cHighlight);

        // Dark Shadow/Crease near hub
        p(21, 3, cMetalDark);
        p(21, 4, cMetalDark);

        // Tip Spike
        p(22, 10, cEdge);
        p(23, 9, cEdge);
    };

    // Draw Top Blade (Upwards)
    drawBlade(false);

    // Draw Bottom Blade (Downwards)
    drawBlade(true);

    return drawer.getCanvas();
}

export const BATTLE_AXE_SPRITE = generateBattleAxe();
