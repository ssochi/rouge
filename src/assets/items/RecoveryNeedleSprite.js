export function createRecoveryNeedleSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Helper for pixel drawing
    const p = (x, y, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
    };

    // === Palette ===
    const cGlass = '#a8d8ea';
    const cGlassDark = '#74b9ff';
    const cLiquid = '#e74c3c'; // Red health potion
    const cLiquidLight = '#ff7675';
    const cMetal = '#b2bec3';
    const cMetalDark = '#636e72';
    const cPlunger = '#2d3436';

    // 1. Plunger (Left side)
    // Handle
    p(1, 7, cPlunger); p(1, 8, cPlunger);
    p(0, 6, cPlunger); p(0, 9, cPlunger); // Flared handle ends
    // Shaft
    p(2, 7, cMetalDark); p(2, 8, cMetalDark);
    p(3, 7, cMetal); p(3, 8, cMetal);

    // 2. Glass Chamber (Middle) - Size 6x4
    // Outline / Glass tint
    ctx.fillStyle = cGlassDark;
    ctx.fillRect(4, 6, 6, 4);
    
    // Liquid (Red, half filled or full?) -> Let's make it look like a vial
    ctx.fillStyle = cLiquid;
    ctx.fillRect(5, 7, 4, 2); // Main liquid body
    
    // Liquid highlight (bubble/shine)
    p(6, 7, cLiquidLight);
    p(7, 7, cLiquidLight);

    // Glass Reflection (Top)
    p(5, 6, '#ffffff'); 
    p(6, 6, '#ffffff');
    p(8, 6, 'rgba(255,255,255,0.5)');

    // 3. Needle Base (Right side of chamber)
    p(10, 6, cMetalDark); p(10, 9, cMetalDark); // Clips
    p(10, 7, cMetal); p(10, 8, cMetal);         // Connector

    // 4. Needle Tip
    ctx.fillStyle = '#ecf0f1'; // Bright steel
    ctx.fillRect(11, 7, 4, 1); // Long thin needle (y=7, top aligned) -> actually centered is better?
    // Let's align y=7.5 visually? Pixel art can't do 0.5. 
    // Center of 16 is 8. Our chamber is y=6..9 (height 4). Center is 7.5.
    // Let's use y=7 and y=8 for chamber center.
    // Needle at y=7 (top pixel of center 2) looks okay, or y=8.
    // Let's make needle 1px thick at y=7
    p(11, 7, cMetal); p(12, 7, cMetal); p(13, 7, cMetal); p(14, 7, cMetal);
    p(15, 7, '#ffffff'); // Sharp tip highlight

    // Add a drop of liquid at tip?
    // p(15, 8, cLiquid); 

    return canvas;
}
