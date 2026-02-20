/**
 * Hoodie (帽衫)
 * Style: Casual hooded sweatshirt with front pocket
 */
export const HOODIE_CLOTHES = {
    id: 'clothes_hoodie',
    name: '帽衫',
    slot: 'clothes',
    colors: {
        coat: '#e67e22',       // Orange hoodie
        coatDark: '#d35400',
        coatLight: '#f39c12',
        shirt: '#e67e22',      // Same as hoodie (no visible shirt)
        pants: '#2c3e50',      // Dark jeans
        boots: '#1a1a1a',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const w = 12; // Baggy fit
        const h = 7;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        const C = colors.coat;
        const D = colors.coatDark;
        const L = colors.coatLight;

        // 1. Main Hoodie Body (Rounded shoulders)
        drawer.fillPath([
            { x: x, y: y + 1 },              // Shoulder L
            { x: x + 2, y: y - 1 },          // Neck L
            { x: x + w - 2, y: y - 1 },      // Neck R
            { x: x + w, y: y + 1 },          // Shoulder R
            { x: x + w + 1, y: y + h },      // Side R
            { x: x - 1, y: y + h }           // Side L
        ], C);

        // 2. Hood (Back)
        // Drawn slightly higher to show it's a hood
        drawer.fillPath([
            { x: x + 1, y: y - 1 },
            { x: cx, y: y - 3 },
            { x: x + w - 1, y: y - 1 }
        ], D);

        // 3. Front Pocket (Kangaroo pouch)
        drawer.fillPath([
            { x: x + 2, y: y + h - 1 },
            { x: x + 3, y: y + h - 3 },
            { x: x + w - 3, y: y + h - 3 },
            { x: x + w - 2, y: y + h - 1 }
        ], D);

        // 4. Drawstrings
        const swing = Math.sin(coatWave * Math.PI * 2) * 1;
        drawer.pixel(cx - 2 + swing * 0.5, y + 2, L);
        drawer.pixel(cx - 2 + swing, y + 3, L);
        
        drawer.pixel(cx + 2 + swing * 0.5, y + 2, L);
        drawer.pixel(cx + 2 + swing, y + 3, L);

        // 5. Waistband (Ribbed)
        const tailY = y + h;
        drawer.rect(x, tailY, w, 2, D);
        // Ribbed texture
        drawer.pixel(x + 2, tailY, C);
        drawer.pixel(x + 5, tailY, C);
        drawer.pixel(x + 8, tailY, C);
        drawer.pixel(x + 10, tailY, C);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;
        
        // Hood (Back layer behind head)
        drawer.fillPath([
            { x: cx - 6, y: bodyY - 6 },
            { x: cx, y: bodyY - 9 },
            { x: cx + 6, y: bodyY - 6 },
            { x: cx + 8, y: bodyY },
            { x: cx - 8, y: bodyY }
        ], colors.coatDark);

        // Shoulders
        drawer.fillPath([
            { x: cx - 11, y: bodyY + 4 },
            { x: cx - 6, y: bodyY - 2 },
            { x: cx + 6, y: bodyY - 2 },
            { x: cx + 11, y: bodyY + 4 },
            { x: cx + 12, y: bodyY + 10 },
            { x: cx - 12, y: bodyY + 10 }
        ], colors.coat);

        // Strings
        drawer.vLine(cx - 4, bodyY + 2, 6, colors.coatLight);
        drawer.vLine(cx + 4, bodyY + 2, 6, colors.coatLight);
        
        // Zipper/Seam
        drawer.vLine(cx, bodyY + 4, 6, colors.coatDark);
    }
};
