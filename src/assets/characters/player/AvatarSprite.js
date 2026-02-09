import { PixelDraw } from '../../../utils/PixelDraw.js';
import { PALETTE } from '../../Palette.js';

/**
 * Procedural Avatar Generator (Face Close-up)
 * Dimensions: 32x32
 * Style: High detail, matching PlayerGenerator "Cool Guy" look
 */
export function generateAvatar() {
    const drawer = new PixelDraw(32, 32);
    const cx = 16;
    const cy = 16;

    // Colors (Synced with PlayerGenerator)
    const cSkin = PALETTE['s'];
    const cSkinShadow = PALETTE['S'];
    const cHair = '#2c1a0e';
    const cHairHighlight = '#4e342e';
    const cBeard = '#2c1a0e';
    const cGlasses = '#111111';
    const cGlassesRim = '#333333';
    const cCoat = '#455a64';
    const cShirt = '#95a5a6';

    // -- Background (Optional, or transparent) --
    // drawer.rect(0, 0, 32, 32, '#2c3e50');

    // -- Shoulders/Collar (Bottom) --
    // Coat Collar
    drawer.fillPath([
        {x: 2, y: 32},
        {x: 6, y: 24},
        {x: 12, y: 26}, // V-neck start
        {x: 20, y: 26},
        {x: 26, y: 24},
        {x: 30, y: 32}
    ], cCoat);
    
    // Shirt (Under)
    drawer.fillPath([
        {x: 12, y: 26},
        {x: 16, y: 32}, // V-neck point
        {x: 20, y: 26}
    ], cShirt);

    // -- Neck --
    drawer.rect(12, 22, 8, 6, cSkin);
    drawer.rect(12, 23, 8, 2, cSkinShadow); // Neck shadow

    // -- Head Base --
    // Bigger head for avatar (approx 20px wide)
    const headW = 20;
    const headH = 22;
    const hx = cx - headW/2;
    const hy = 4;

    // -- Back Hair (Long) --
    drawer.fillPath([
        {x: hx - 4, y: hy + 8},
        {x: hx, y: hy},
        {x: hx + headW, y: hy},
        {x: hx + headW + 4, y: hy + 8},
        {x: hx + headW + 2, y: 30},
        {x: hx - 2, y: 30}
    ], cHair);

    // -- Face --
    drawer.fillQuadCurve(hx, hy + 4, hx - 2, hy + headH - 4, cx, hy + headH, cSkin);
    drawer.fillQuadCurve(hx + headW, hy + 4, hx + headW + 2, hy + headH - 4, cx, hy + headH, cSkin);
    drawer.rect(hx + 1, hy + 4, headW - 2, headH - 5, cSkin);

    // -- Beard --
    // Full beard
    drawer.fillPath([
        {x: hx + 1, y: hy + headH - 10}, // Sideburn L
        {x: hx + 2, y: hy + headH - 2},  // Jaw L
        {x: cx, y: hy + headH + 2},      // Chin
        {x: hx + headW - 2, y: hy + headH - 2}, // Jaw R
        {x: hx + headW - 1, y: hy + headH - 10}, // Sideburn R
        {x: hx + headW - 4, y: hy + headH - 6}, // Cheek R
        {x: hx + 4, y: hy + headH - 6}          // Cheek L
    ], cBeard);
    
    // Mustache
    drawer.rect(cx - 5, hy + headH - 8, 10, 3, cBeard);

    // -- Sunglasses --
    const gy = hy + 8;
    // Lenses (Larger)
    drawer.rect(hx + 2, gy, 7, 5, cGlasses);
    drawer.rect(hx + 11, gy, 7, 5, cGlasses);
    // Bridge
    drawer.hLine(hx + 9, gy + 1, 2, cGlassesRim);
    // Frame
    drawer.rect(hx + 1, gy, 1, 2, cGlassesRim);
    drawer.rect(hx + 18, gy, 1, 2, cGlassesRim);
    
    // Highlights (White)
    drawer.pixel(hx + 3, gy + 1, '#ffffff');
    drawer.pixel(hx + 4, gy + 2, '#ffffff');
    
    drawer.pixel(hx + 12, gy + 1, '#ffffff');
    drawer.pixel(hx + 13, gy + 2, '#ffffff');

    // -- Front Hair --
    // Top
    drawer.fillQuadCurve(hx - 2, hy + 6, cx, hy - 4, hx + headW + 2, hy + 6, cHair);
    // Bangs
    drawer.fillPath([
        {x: hx, y: hy + 2},
        {x: hx + 4, y: hy + 6},
        {x: hx + 2, y: hy + 12}, // Strand L
        {x: hx - 2, y: hy + 8}
    ], cHair);
    drawer.fillPath([
        {x: hx + headW, y: hy + 2},
        {x: hx + headW - 4, y: hy + 6},
        {x: hx + headW - 2, y: hy + 12}, // Strand R
        {x: hx + headW + 2, y: hy + 8}
    ], cHair);
    
    // Highlights
    drawer.hLine(cx - 4, hy + 1, 8, cHairHighlight);

    return drawer.getCanvas();
}

export const AVATAR_SPRITE = generateAvatar();
