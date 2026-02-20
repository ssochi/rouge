/**
 * Bandana (头巾)
 * Style: Tied cloth headband/bandana
 */
export const BANDANA_HAT = {
    id: 'hat_bandana',
    name: '头巾',
    slot: 'hat',
    colors: {
        hat: '#1a5276',
        hatLight: '#2980b9',
        hatDark: '#0e3d56',
    },
    draw(drawer, cx, headY, colors) {
        const w = 16;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 5;

        // 1. Headband Main Strip (Curved across forehead)
        drawer.fillPath([
            { x: x - 1, y: y + 2 },
            { x: cx, y: y + 1 },
            { x: x + w + 1, y: y + 2 },
            { x: x + w + 1, y: y + 5 },
            { x: cx, y: y + 4 },
            { x: x - 1, y: y + 5 }
        ], colors.hat);

        // 2. Knot (Side)
        const kx = x + w;
        const ky = y + 3;
        drawer.rect(kx, ky, 3, 3, colors.hatDark);

        // 3. Tails (Flowing back)
        // Tail 1 (Upper)
        drawer.fillPath([
            { x: kx + 2, y: ky + 1 },
            { x: kx + 5, y: ky - 1 },
            { x: kx + 6, y: ky + 2 },
            { x: kx + 2, y: ky + 3 }
        ], colors.hat);

        // Tail 2 (Lower)
        drawer.fillPath([
            { x: kx + 1, y: ky + 3 },
            { x: kx + 4, y: ky + 5 },
            { x: kx + 3, y: ky + 7 },
            { x: kx, y: ky + 4 }
        ], colors.hatDark);

        // Highlights
        drawer.hLine(cx - 3, y + 2, 6, colors.hatLight);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const cy = hy + 6;
        
        // Band
        drawer.fillPath([
            { x: hx - 2, y: cy },
            { x: cx, y: cy - 2 },
            { x: hx + headW + 2, y: cy },
            { x: hx + headW + 2, y: cy + 5 },
            { x: cx, y: cy + 3 },
            { x: hx - 2, y: cy + 5 }
        ], colors.hat);
        
        // Knot
        const kx = hx + headW + 1;
        drawer.rect(kx, cy + 1, 4, 4, colors.hatDark);

        // Tails
        drawer.fillPath([
            { x: kx + 3, y: cy + 2 },
            { x: kx + 8, y: cy - 1 },
            { x: kx + 10, y: cy + 4 },
            { x: kx + 4, y: cy + 5 }
        ], colors.hat);
        
        drawer.fillPath([
            { x: kx + 2, y: cy + 5 },
            { x: kx + 6, y: cy + 9 },
            { x: kx + 4, y: cy + 12 },
            { x: kx + 1, y: cy + 7 }
        ], colors.hatDark);
    }
};
