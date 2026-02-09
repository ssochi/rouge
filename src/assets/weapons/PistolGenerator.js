import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

/**
 * Procedural Pistol Generator (M1911 Style)
 * Dimensions: 16x16
 */
export function generatePistol() {
    const width = 16;
    const height = 16;
    const drawer = new PixelDraw(width, height);
    
    // Colors
    const cMetal = '#78909c';      // Slide (Silver/Grey)
    const cMetalDark = '#455a64';  // Frame (Darker)
    const cGrip = '#3e2723';       // Wood Grip
    const cBlack = '#263238';      // Sights/Trigger
    
    // Pivot Point approx x=6, y=8
    
    // -- Grip --
    // Angled handle
    drawer.fillPath([
        {x: 4, y: 8},
        {x: 7, y: 8},
        {x: 6, y: 13},
        {x: 3, y: 13}
    ], cMetalDark);
    
    // Wood Panel
    drawer.fillPath([
        {x: 5, y: 9},
        {x: 6, y: 9},
        {x: 5, y: 12},
        {x: 4, y: 12}
    ], cGrip);

    // -- Frame (Lower) --
    drawer.rect(4, 7, 8, 2, cMetalDark);
    
    // -- Slide (Upper) --
    drawer.rect(3, 5, 10, 3, cMetal);
    // Ejection Port
    drawer.rect(7, 5, 3, 1, '#b0bec5');
    // Serrations (Rear)
    drawer.vLine(4, 6, 2, cMetalDark);
    drawer.vLine(5, 6, 2, cMetalDark);

    // -- Barrel Tip --
    drawer.pixel(13, 6, '#37474f');

    // -- Trigger Guard --
    drawer.strokePath([
        {x: 7, y: 9},
        {x: 8, y: 10},
        {x: 9, y: 9}
    ], cMetalDark);
    
    // Trigger
    drawer.pixel(8, 9, cBlack);

    // -- Sights --
    // Rear
    drawer.pixel(3, 4, cBlack);
    // Front
    drawer.pixel(12, 4, cBlack);
    
    // -- Hammer --
    drawer.pixel(2, 6, cBlack);

    return drawer.getCanvas();
}

export const PISTOL_SPRITE = generatePistol();
