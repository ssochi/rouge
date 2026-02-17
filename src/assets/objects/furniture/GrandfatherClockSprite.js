import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

export function createGrandfatherClockSprite() {
    const w = 16;
    const h = 48;
    const drawer = new PixelDraw(w, h);

    const { cWood, cWoodDark, cWoodLight, cWoodHighlight, cWoodGrain, cGold, cGoldDark, cShadow, cShadowDeep } = FurniturePalette;

    // 1. Base (y: 40-48)
    const baseY = 40;
    drawer.fillPath([
        {x: 1, y: baseY}, {x: w-1, y: baseY},
        {x: w, y: baseY + 2}, {x: w, y: h},
        {x: 0, y: h}, {x: 0, y: baseY + 2}
    ], cWoodDark);
    drawer.rect(2, baseY + 2, w-4, h - baseY - 3, cWood);
    // Base decoration
    drawer.hLine(3, h-2, w-6, cWoodHighlight);

    // 2. Middle Body (Waist) (y: 16-40)
    const midY = 16;
    const midW = 10; // Narrower than base/top
    const midX = (w - midW) / 2;
    
    drawer.rect(midX, midY, midW, baseY - midY, cWood);
    drawer.vLine(midX, midY, baseY - midY, cWoodHighlight); // Left edge
    drawer.vLine(midX + midW - 1, midY, baseY - midY, cWoodDark); // Right edge

    // Glass Door for Pendulum
    const glassX = midX + 2;
    const glassY = midY + 4;
    const glassW = midW - 4;
    const glassH = 16;
    
    drawer.rect(glassX, glassY, glassW, glassH, cShadowDeep); // Dark interior
    
    // Pendulum
    const penX = w / 2;
    const penY = glassY + 2;
    // Rod
    drawer.vLine(penX, penY, 10, cGoldDark);
    // Bob (Round weight)
    drawer.circle(penX, penY + 10, 2, cGold);
    drawer.pixel(penX, penY + 10, '#ffffff'); // Glint

    // Glass Reflection
    drawer.line(glassX, glassY + glassH - 4, glassX + 2, glassY + glassH - 2, 'rgba(255,255,255,0.3)');

    // 3. Head (Clock Face) (y: 0-16)
    const headH = 16;
    // Arch shape top
    drawer.fillQuadCurve(0, 6, w/2, -2, w, 6, cWoodDark); // Top arch
    drawer.rect(0, 6, w, 10, cWoodDark); // Head block
    
    // Inner Face Panel
    drawer.rect(2, 4, w-4, 12, cWood);
    
    // Clock Face
    const faceCx = w / 2;
    const faceCy = 10;
    const faceR = 4;
    
    drawer.circle(faceCx, faceCy, faceR, '#ffffff'); // White face
    drawer.circle(faceCx, faceCy, faceR + 1, cGold); // Gold rim
    
    // Hands (Time: 10:10)
    drawer.line(faceCx, faceCy, faceCx - 2, faceCy - 2, '#000000');
    drawer.line(faceCx, faceCy, faceCx + 2, faceCy - 2, '#000000');

    // 4. Details / Molding
    drawer.hLine(midX - 1, midY, midW + 2, cWoodHighlight); // Waist molding
    drawer.hLine(midX - 1, baseY, midW + 2, cWoodDark); // Base molding

    return drawer.getCanvas();
}
