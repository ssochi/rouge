import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

export function createBedSprite() {
    // Bed: 28px wide, 48px tall (1.5 tiles long)
    // Canvas: 32x48
    const drawer = new PixelDraw(32, 48);
    const p = PALETTE;

    // Colors
    const cWood = '#5d4037'; // Dark Wood Frame
    const cWoodDark = '#3e2723';
    const cWoodLight = '#795548'; // Highlight for wood
    const cMattress = '#ecf0f1'; // White Sheet
    const cMattressShadow = '#cfd8dc';
    const cBlanket = '#3498db'; // Blue Blanket
    const cBlanketDark = '#2980b9';
    const cBlanketLight = '#5dade2'; // Highlight for blanket
    const cPillow = '#ffffff';
    const cPillowShadow = '#bdc3c7';
    
    const cx = 16;
    const w = 26; // Bed Width
    const headY = 2; // Headboard Top
    const footY = 44; // Footboard Bottom
    const matY = 10; // Mattress Start
    const bedLen = 34; // Mattress Length

    // 1. Headboard (Tall) - 3D Bevels
    // Front Face
    drawer.fillPath([
        {x: cx - w/2, y: headY + 2},
        {x: cx + w/2, y: headY + 2},
        {x: cx + w/2, y: matY + 4},
        {x: cx - w/2, y: matY + 4}
    ], cWood);
    // Top Face (Thickness)
    drawer.fillPath([
        {x: cx - w/2, y: headY},
        {x: cx + w/2, y: headY},
        {x: cx + w/2, y: headY + 2},
        {x: cx - w/2, y: headY + 2}
    ], cWoodDark);
    // Bevel/Highlight on Top Edge
    drawer.line(cx - w/2 + 1, headY, cx + w/2 - 1, headY, cWoodLight);
    // Side Shading (Right)
    drawer.vLine(cx + w/2 - 1, headY + 2, matY + 4 - (headY + 2), cWoodDark);
    // Detail: Vertical Planks with Highlights
    drawer.vLine(cx - 5, headY + 2, 8, cWoodDark);
    drawer.pixel(cx - 4, headY + 3, cWoodLight);
    drawer.vLine(cx + 5, headY + 2, 8, cWoodDark);
    drawer.pixel(cx + 6, headY + 3, cWoodLight);

    // 2. Footboard (Short) - 3D Bevels
    const footH = 6;
    drawer.fillPath([
        {x: cx - w/2, y: footY - footH},
        {x: cx + w/2, y: footY - footH},
        {x: cx + w/2, y: footY},
        {x: cx - w/2, y: footY}
    ], cWood);
    // Top Face
    drawer.fillPath([
        {x: cx - w/2, y: footY - footH - 2},
        {x: cx + w/2, y: footY - footH - 2},
        {x: cx + w/2, y: footY - footH},
        {x: cx - w/2, y: footY - footH}
    ], cWoodDark);
    // Highlight
    drawer.line(cx - w/2 + 1, footY - footH - 2, cx + w/2 - 1, footY - footH - 2, cWoodLight);
    // Side Shading
    drawer.vLine(cx + w/2 - 1, footY - footH, footH, cWoodDark);

    // 3. Mattress (White Sheet) - Thickness
    const matW = w - 2;
    // Draw Mattress Thickness (Side)
    drawer.fillPath([
        {x: cx - matW/2, y: matY},
        {x: cx + matW/2, y: matY},
        {x: cx + matW/2, y: footY - footH},
        {x: cx - matW/2, y: footY - footH}
    ], cMattress);
    // Mattress Top Surface (Slightly lighter or just use main color)
    // Mattress Right Side Shadow (Thickness)
    drawer.fillPath([
        {x: cx + matW/2 - 2, y: matY + 1},
        {x: cx + matW/2, y: matY + 1},
        {x: cx + matW/2, y: footY - footH - 1},
        {x: cx + matW/2 - 2, y: footY - footH - 1}
    ], cMattressShadow);

    // 4. Pillow (Soft Shape) - 3D Shading
    // Using fillPath to approximate a rounded rect
    const px = cx;
    const py = matY + 4;
    const pw = 14;
    const ph = 8;
    // Shadow under pillow
    drawer.fillPath([
        {x: px - pw/2 + 3, y: py + 2}, 
        {x: px + pw/2 - 1, y: py + 2},
        {x: px + pw/2 - 1, y: py + ph + 1},
        {x: px - pw/2 + 3, y: py + ph + 1}
    ], cMattressShadow);
    
    // Pillow Body
    drawer.fillPath([
        {x: px - pw/2 + 2, y: py}, 
        {x: px + pw/2 - 2, y: py},
        {x: px + pw/2, y: py + 2},
        {x: px + pw/2, y: py + ph - 2},
        {x: px + pw/2 - 2, y: py + ph},
        {x: px - pw/2 + 2, y: py + ph},
        {x: px - pw/2, y: py + ph - 2},
        {x: px - pw/2, y: py + 2}
    ], cPillow);
    // Pillow Indent/Fold
    drawer.pixel(px, py + ph/2, cPillowShadow); 
    // Pillow Right Side Shading
    drawer.vLine(px + pw/2 - 1, py + 2, ph - 4, cPillowShadow);

    // 5. Blanket (Organic Shape) - Volumetric Folds
    // Covers bottom 2/3
    const blankY = matY + 14;
    const blankH = (footY - footH) - blankY;
    
    // Draw blanket with slight overhang on sides
    const blankW = matW + 2;
    
    // Main Body
    drawer.fillPath([
        {x: cx - blankW/2, y: blankY},
        {x: cx + blankW/2, y: blankY},
        {x: cx + blankW/2, y: blankY + blankH}, // Bottom Right
        {x: cx - blankW/2, y: blankY + blankH}  // Bottom Left
    ], cBlanket);
    
    // Side Overhang Shading (Thickness)
    drawer.vLine(cx + blankW/2 - 1, blankY, blankH, cBlanketDark);
    drawer.vLine(cx - blankW/2, blankY, blankH, cBlanketDark);
    
    // Fold/Top Edge (Curved & Thick)
    // Draw a lighter strip at the top to simulate the fold-over thickness
    drawer.fillPath([
        {x: cx - blankW/2, y: blankY},
        {x: cx + blankW/2, y: blankY},
        {x: cx + blankW/2, y: blankY + 4},
        {x: cx - blankW/2, y: blankY + 4}
    ], cBlanketDark);
    
    // Top Edge Highlight
    drawer.line(cx - blankW/2 + 1, blankY, cx + blankW/2 - 1, blankY, cBlanketLight);

    // Volumetric Folds (Light & Dark)
    // Left Fold
    drawer.vLine(cx - 6, blankY + 4, blankH - 4, cBlanketDark); // Shadow
    drawer.vLine(cx - 7, blankY + 4, blankH - 4, cBlanketLight); // Highlight
    // Right Fold
    drawer.vLine(cx + 6, blankY + 4, blankH - 4, cBlanketDark); // Shadow
    drawer.vLine(cx + 5, blankY + 4, blankH - 4, cBlanketLight); // Highlight

    return drawer.getCanvas();
}

export function createBedHorizontalSprite() {
    // Horizontal Bed: 48px wide, 28px tall
    // Canvas: 48x32
    // Headboard on LEFT side (for variety, or default)
    // Let's assume Head is on Left.
    
    const drawer = new PixelDraw(48, 32);
    const p = PALETTE;

    // Colors (Same as Vertical)
    const cWood = '#5d4037'; 
    const cWoodDark = '#3e2723';
    const cWoodLight = '#795548'; 
    const cMattress = '#ecf0f1'; 
    const cMattressShadow = '#cfd8dc';
    const cBlanket = '#3498db'; 
    const cBlanketDark = '#2980b9';
    const cBlanketLight = '#5dade2';
    const cPillow = '#ffffff';
    const cPillowShadow = '#bdc3c7';
    
    // Geometry
    // Width = 48 (Length of bed), Height = 32 (Width of bed)
    // Headboard Left: x=2 to x=4
    // Footboard Right: x=44 to x=46
    // Bed Width (y): 26px (Centered: y=3 to y=29)
    
    const headX = 2;
    const footX = 44;
    const bedTopY = 3;
    const bedBotY = 29;
    const bedH = bedBotY - bedTopY; // 26
    
    // 1. Headboard (Left)
    // It's tall, so it should project UP? 
    // In Top-Down, vertical surfaces are foreshortened.
    // A tall headboard seen from top-down might look like a thick bar.
    // Let's draw it as a block at the left end.
    const headW = 4;
    // Front Face (Right side of the board)
    drawer.fillPath([
        {x: headX + headW, y: bedTopY},
        {x: headX + headW, y: bedBotY},
        {x: headX + headW - 2, y: bedBotY}, // Thickness
        {x: headX + headW - 2, y: bedTopY}
    ], cWood);
    // Top Face (Top edge of the board)
    drawer.fillPath([
        {x: headX, y: bedTopY - 2}, // Project up
        {x: headX + headW, y: bedTopY - 2},
        {x: headX + headW, y: bedTopY},
        {x: headX, y: bedTopY}
    ], cWoodDark);
    // Main Body
    drawer.fillPath([
        {x: headX, y: bedTopY},
        {x: headX + headW, y: bedTopY},
        {x: headX + headW, y: bedBotY},
        {x: headX, y: bedBotY}
    ], cWood);
    // Highlights
    drawer.line(headX, bedTopY, headX + headW, bedTopY, cWoodLight);

    // 2. Footboard (Right)
    const footW = 2;
    drawer.fillPath([
        {x: footX, y: bedTopY},
        {x: footX + footW, y: bedTopY},
        {x: footX + footW, y: bedBotY},
        {x: footX, y: bedBotY}
    ], cWood);
    // Top Face
    drawer.fillPath([
        {x: footX, y: bedTopY - 1},
        {x: footX + footW, y: bedTopY - 1},
        {x: footX + footW, y: bedTopY},
        {x: footX, y: bedTopY}
    ], cWoodDark);

    // 3. Mattress
    const matX = headX + headW;
    const matW = footX - matX;
    drawer.fillPath([
        {x: matX, y: bedTopY + 1},
        {x: matX + matW, y: bedTopY + 1},
        {x: matX + matW, y: bedBotY - 1},
        {x: matX, y: bedBotY - 1}
    ], cMattress);
    // Front Side Shadow (Bottom edge)
    drawer.fillPath([
        {x: matX, y: bedBotY - 1},
        {x: matX + matW, y: bedBotY - 1},
        {x: matX + matW, y: bedBotY},
        {x: matX, y: bedBotY}
    ], cMattressShadow);

    // 4. Pillow (Left side)
    const pilX = matX + 2;
    const pilY = bedTopY + 4;
    const pilW = 10;
    const pilH = 18;
    drawer.fillPath([
        {x: pilX, y: pilY + 2},
        {x: pilX + 2, y: pilY},
        {x: pilX + pilW - 2, y: pilY},
        {x: pilX + pilW, y: pilY + 2},
        {x: pilX + pilW, y: pilY + pilH - 2},
        {x: pilX + pilW - 2, y: pilY + pilH},
        {x: pilX + 2, y: pilY + pilH},
        {x: pilX, y: pilY + pilH - 2}
    ], cPillow);
    // Pillow Shadow (Right & Bottom)
    drawer.vLine(pilX + pilW, pilY + 2, pilH - 4, cPillowShadow);
    drawer.hLine(pilX + 2, pilY + pilH, pilW - 4, cPillowShadow);

    // 5. Blanket (Right 2/3)
    const blankX = matX + 14;
    const blankW_ = (footX) - blankX;
    const blankY = bedTopY;
    const blankH_ = bedBotY - bedTopY;
    
    // Main
    drawer.fillPath([
        {x: blankX, y: blankY},
        {x: blankX + blankW_ + 1, y: blankY}, // Overhang right
        {x: blankX + blankW_ + 1, y: blankY + blankH_ + 1}, // Overhang bottom
        {x: blankX, y: blankY + blankH_ + 1}
    ], cBlanket);
    
    // Fold (Left Edge of Blanket)
    drawer.fillPath([
        {x: blankX, y: blankY},
        {x: blankX + 3, y: blankY},
        {x: blankX + 3, y: blankY + blankH_ + 1},
        {x: blankX, y: blankY + blankH_ + 1}
    ], cBlanketDark);
    drawer.vLine(blankX + 1, blankY, blankH_ + 1, cBlanketLight); // Highlight
    
    // Bottom Thickness
    drawer.hLine(blankX, blankY + blankH_, blankW_ + 1, cBlanketDark);

    // Folds (Horizontal lines)
    drawer.hLine(blankX + 4, blankY + 8, blankW_ - 4, cBlanketDark);
    drawer.hLine(blankX + 4, blankY + 7, blankW_ - 4, cBlanketLight);
    
    drawer.hLine(blankX + 4, blankY + 18, blankW_ - 4, cBlanketDark);
    drawer.hLine(blankX + 4, blankY + 17, blankW_ - 4, cBlanketLight);

    return drawer.getCanvas();
}
