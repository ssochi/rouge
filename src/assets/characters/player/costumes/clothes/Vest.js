/**
 * Tactical Vest (战术背心)
 * Style: Military/tactical vest with pouches and straps
 */
export const VEST_CLOTHES = {
    id: 'clothes_vest',
    name: '战术背心',
    slot: 'clothes',
    colors: {
        coat: '#2c3e50',       // Dark tactical
        coatDark: '#1a252f',
        coatLight: '#7f8c8d',  // Straps/buckles
        shirt: '#556b2f',      // OD green undershirt
        pants: '#3d5c3a',      // Olive drab pants
        boots: '#1a1a1a',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        // Body parameters
        const w = 12; // Slightly wider for bulk
        const h = 8;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        // Colors
        const C = colors.coat;
        const D = colors.coatDark;
        const L = colors.coatLight;
        const S = colors.shirt;

        // 1. Undershirt (visible at neck/center)
        drawer.rect(cx - 2, y - 1, 4, 3, S);

        // 2. Vest Body (Main Shape)
        // Left Panel
        drawer.fillPath([
            { x: x, y: y },              // Shoulder out
            { x: cx - 1, y: y + 2 },     // V-neck bottom
            { x: cx - 1, y: y + h },     // Center bottom
            { x: x, y: y + h - 1 },      // Side bottom
            { x: x - 1, y: y + 3 }       // Armhole bottom
        ], C);

        // Right Panel
        drawer.fillPath([
            { x: x + w, y: y },          // Shoulder out
            { x: cx + 1, y: y + 2 },     // V-neck bottom
            { x: cx + 1, y: y + h },     // Center bottom
            { x: x + w, y: y + h - 1 },  // Side bottom
            { x: x + w + 1, y: y + 3 }   // Armhole bottom
        ], C);

        // 3. Details (Pouches & Straps)
        // Shoulder Pads/Straps
        drawer.rect(x, y, 3, 2, D);
        drawer.rect(x + w - 3, y, 3, 2, D);

        // Chest Pouches (Tactical look)
        drawer.rect(x + 1, y + 3, 3, 2, L);
        drawer.rect(x + w - 4, y + 3, 3, 2, L);

        // Waist Belt/Pouches
        drawer.rect(x, y + h - 2, w, 2, D); // Belt line
        drawer.rect(cx - 1, y + h - 2, 2, 2, L); // Buckle

        // 4. Shading/Depth
        // Side shadows
        drawer.vLine(x - 1, y + 3, 4, D);
        drawer.vLine(x + w + 1, y + 3, 4, D);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;
        
        // Shoulders (Broad)
        drawer.fillPath([
            { x: cx - 10, y: bodyY },
            { x: cx - 4, y: bodyY - 4 }, // Neck
            { x: cx + 4, y: bodyY - 4 },
            { x: cx + 10, y: bodyY },
            { x: cx + 12, y: bodyY + 8 },
            { x: cx - 12, y: bodyY + 8 }
        ], colors.coat);

        // Undershirt
        drawer.fillPath([
            { x: cx - 4, y: bodyY - 4 },
            { x: cx, y: bodyY },
            { x: cx + 4, y: bodyY - 4 }
        ], colors.shirt);

        // Pouches/Details
        drawer.rect(cx - 8, bodyY + 2, 6, 4, colors.coatLight); // Left Pouch
        drawer.rect(cx + 2, bodyY + 2, 6, 4, colors.coatLight); // Right Pouch
        
        // Straps
        drawer.rect(cx - 9, bodyY - 2, 4, 2, colors.coatDark);
        drawer.rect(cx + 5, bodyY - 2, 4, 2, colors.coatDark);
    }
};
