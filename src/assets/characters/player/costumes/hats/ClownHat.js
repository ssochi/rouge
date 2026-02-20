/**
 * Clown Hat (小丑帽)
 * Style: Jester hat with two pointed tips, red and blue, with bells
 */
export const CLOWN_HAT = {
    id: 'hat_clown',
    name: '小丑帽',
    slot: 'hat',
    coversHair: true,
    colors: {
        red: '#e74c3c',
        redDark: '#c0392b',
        blue: '#3498db',
        blueDark: '#2980b9',
        bell: '#f1c40f',
        bellDark: '#d4ac0d',
    },
    draw(drawer, cx, headY, colors) {
        const w = 18;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 5;

        // Base dome — cover head top
        drawer.fillQuadCurve(x, y + 5, cx, y, x + w, y + 5, colors.red);

        // Left point (red) — curves left
        drawer.fillPath([
            { x: x, y: y + 4 },
            { x: cx, y: y + 2 },
            { x: cx - 1, y: y - 1 },
            { x: x - 4, y: y - 4 },
            { x: x - 3, y: y + 1 }
        ], colors.red);

        // Right point (blue) — curves right
        drawer.fillPath([
            { x: x + w, y: y + 4 },
            { x: cx, y: y + 2 },
            { x: cx + 1, y: y - 1 },
            { x: x + w + 4, y: y - 4 },
            { x: x + w + 3, y: y + 1 }
        ], colors.blue);

        // Brim band
        drawer.hLine(x, y + 4, w, colors.redDark);
        drawer.hLine(x, y + 5, w, colors.blueDark);

        // Bells at tips
        drawer.rect(x - 5, y - 5, 2, 2, colors.bell);
        drawer.pixel(x - 5, y - 4, colors.bellDark);
        drawer.rect(x + w + 3, y - 5, 2, 2, colors.bell);
        drawer.pixel(x + w + 4, y - 4, colors.bellDark);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const cy = hy + 2;

        // Base dome — cover head top
        drawer.fillQuadCurve(hx - 2, cy + 7, cx, cy, hx + headW + 2, cy + 7, colors.red);

        // Left point (red)
        drawer.fillPath([
            { x: hx - 2, y: cy + 5 },
            { x: cx, y: cy + 1 },
            { x: cx - 2, y: cy - 4 },
            { x: hx - 8, y: cy - 8 },
            { x: hx - 6, y: cy }
        ], colors.red);

        // Right point (blue)
        drawer.fillPath([
            { x: hx + headW + 2, y: cy + 5 },
            { x: cx, y: cy + 1 },
            { x: cx + 2, y: cy - 4 },
            { x: hx + headW + 8, y: cy - 8 },
            { x: hx + headW + 6, y: cy }
        ], colors.blue);

        // Brim
        drawer.rect(hx - 2, cy + 6, headW + 4, 2, colors.redDark);

        // Bells
        drawer.rect(hx - 9, cy - 9, 3, 3, colors.bell);
        drawer.pixel(hx - 8, cy - 8, colors.bellDark);
        drawer.rect(hx + headW + 7, cy - 9, 3, 3, colors.bell);
        drawer.pixel(hx + headW + 8, cy - 8, colors.bellDark);
    }
};
