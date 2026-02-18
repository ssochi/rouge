import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createDresserSprite() {
    const w = 32;
    const h = 40;
    const drawer = new PixelDraw(w, h);

    const {
        cWood, cWoodDark, cWoodLight,
        cWoodHighlight,
        cGold,
        cShadowDeep
    } = FurniturePalette;

    const cMirror = '#a8d8ea';
    const cMirrorDark = '#6fb8d4';
    const cMirrorHighlight = '#d4eef7';
    const cMirrorGlint = '#ffffff';

    // 1. Base Legs (Short & Sturdy)
    const legY = 36;
    const legH = 4;
    
    drawer.rect(2, legY, 4, legH, cWoodDark);
    drawer.rect(w-6, legY, 4, legH, cWoodDark);
    
    // 2. Main Body
    const bodyY = 18;
    const bodyH = 18;
    
    // Body Shape
    drawer.fillPath([
        {x: 1, y: bodyY}, {x: w-1, y: bodyY},
        {x: w-1, y: bodyY + bodyH}, {x: 1, y: bodyY + bodyH}
    ], cWood);
    
    // Top Surface of Body
    drawer.fillPath([
        {x: 0, y: bodyY}, {x: w, y: bodyY},
        {x: w, y: bodyY + 3}, {x: 0, y: bodyY + 3}
    ], cWoodLight);
    drawer.hLine(0, bodyY + 3, w, cWoodDark); // Lip shadow

    // Drawers
    const drawDrawer = (y, height) => {
        const mx = 3;
        const mw = w - 6;
        drawer.rect(mx, y, mw, height, cShadowDeep); // Recess
        drawer.rect(mx+1, y+1, mw-2, height-2, cWood); // Face
        
        // Highlights
        drawer.hLine(mx+1, y+1, mw-2, cWoodHighlight);
        drawer.vLine(mx+1, y+1, height-2, cWoodHighlight);
        // Shadows
        drawer.hLine(mx+1, y+height-2, mw-2, cWoodDark);
        drawer.vLine(mx+mw-2, y+1, height-2, cWoodDark);
        
        // Knobs (Two per drawer)
        const kY = y + height/2;
        drawer.pixel(mx + mw/3, kY, cGold);
        drawer.pixel(mx + 2*mw/3, kY, cGold);
    };

    drawDrawer(bodyY + 4, 6);
    drawDrawer(bodyY + 11, 6);

    // 3. Mirror Support
    drawer.rect(6, 15, 2, 4, cWoodDark);
    drawer.rect(w-8, 15, 2, 4, cWoodDark);

    // 4. Mirror (Oval)
    const mX = w/2;
    const mY = 9;
    const mRx = 10;
    const mRy = 8;

    // Frame (Dark Wood)
    drawer.ellipse(mX, mY, mRx + 1, mRy + 1, cWoodDark);
    drawer.ellipse(mX, mY, mRx, mRy, cWood);

    // Mirror Glass
    drawer.ellipse(mX, mY, mRx - 2, mRy - 2, cMirror);
    
    // Reflection / Glint
    // Diagonal streaks
    drawer.line(mX - 4, mY - 3, mX - 2, mY - 5, cMirrorGlint);
    drawer.line(mX - 3, mY - 2, mX + 1, mY - 6, cMirrorGlint);
    drawer.pixel(mX + 4, mY + 3, cMirrorDark); // Shadow reflection

    return drawer.getCanvas();
}
