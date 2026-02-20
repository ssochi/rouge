/**
 * Beret Hat (贝雷帽)
 * Style: French-style beret sitting on top of head, slightly tilted
 */
export const BERET_HAT = {
    id: 'hat_beret',
    name: '贝雷帽',
    slot: 'hat',
    colors: {
        hat: '#8b0000',
        hatLight: '#a52a2a',
        hatDark: '#6b0000',
    },
    draw(drawer, cx, headY, colors) {
        const w = 18;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 5;

        // Beret body - Asymmetric flop to the right
        drawer.fillPath([
            { x: x, y: y + 2 },
            { x: cx - 4, y: y - 2 },    // High left
            { x: cx + 6, y: y - 1 },    // High right
            { x: x + w + 2, y: y + 3 }, // Flop overhang
            { x: x + w, y: y + 5 },
            { x: x + 2, y: y + 4 }
        ], colors.hat);

        // Brim/Band
        drawer.fillPath([
            { x: x + 1, y: y + 3 },
            { x: x + w - 2, y: y + 4 }, // Slight curve
            { x: x + w - 2, y: y + 5 },
            { x: x + 1, y: y + 4 }
        ], colors.hatDark);

        // Pip/nub on top
        drawer.pixel(cx, y - 1, colors.hatLight);
        
        // Highlights for fold
        drawer.pixel(cx + 4, y + 1, colors.hatLight);
        drawer.pixel(cx + 5, y + 2, colors.hatLight);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const cy = hy + 4;
        
        // Large floppy shape
        drawer.fillPath([
            { x: hx - 4, y: cy + 4 },
            { x: cx - 6, y: cy - 6 },
            { x: cx + 8, y: cy - 4 },
            { x: hx + headW + 6, y: cy + 6 }, // Flop
            { x: hx + headW, y: cy + 8 },
            { x: hx, y: cy + 6 }
        ], colors.hat);

        // Band
        drawer.fillPath([
            { x: hx - 1, y: cy + 5 },
            { x: hx + headW + 1, y: cy + 6 },
            { x: hx + headW + 1, y: cy + 9 },
            { x: hx - 1, y: cy + 8 }
        ], colors.hatDark);

        // Pip
        drawer.rect(cx - 1, cy - 5, 3, 2, colors.hatLight);
    }
};
