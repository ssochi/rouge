/**
 * Beret Hat (贝雷帽)
 * Style: French-style beret sitting on top of head, slightly tilted
 */
export const BERET_HAT = {
    id: 'hat_beret',
    name: '贝雷帽',
    slot: 'hat',
    coversHair: true,
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

        // Base dome — cover hair top area (stop before eyes)
        drawer.fillQuadCurve(x, y + 4, cx, y - 1, x + w, y + 4, colors.hat);

        // Beret body — Asymmetric flop to the right
        drawer.fillPath([
            { x: x - 1, y: y + 1 },
            { x: cx - 4, y: y - 3 },
            { x: cx + 6, y: y - 2 },
            { x: x + w + 3, y: y + 2 },
            { x: x + w + 1, y: y + 5 },
            { x: x + 1, y: y + 4 }
        ], colors.hat);

        // Brim/Band
        drawer.hLine(x, y + 4, w, colors.hatDark);
        drawer.hLine(x + 1, y + 5, w - 2, colors.hatDark);

        // Pip/nub on top
        drawer.pixel(cx, y - 2, colors.hatLight);
        drawer.pixel(cx + 1, y - 2, colors.hatLight);

        // Highlights for fold
        drawer.pixel(cx + 4, y, colors.hatLight);
        drawer.pixel(cx + 5, y + 1, colors.hatLight);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const cy = hy + 2;

        // Base dome — cover hair top
        drawer.fillQuadCurve(hx - 2, cy + 7, cx, cy - 2, hx + headW + 2, cy + 7, colors.hat);

        // Large floppy shape
        drawer.fillPath([
            { x: hx - 4, y: cy + 3 },
            { x: cx - 6, y: cy - 7 },
            { x: cx + 8, y: cy - 5 },
            { x: hx + headW + 7, y: cy + 5 },
            { x: hx + headW + 1, y: cy + 8 },
            { x: hx - 1, y: cy + 6 }
        ], colors.hat);

        // Band
        drawer.rect(hx - 1, cy + 6, headW + 2, 2, colors.hatDark);

        // Pip
        drawer.rect(cx - 1, cy - 6, 3, 2, colors.hatLight);
    }
};
