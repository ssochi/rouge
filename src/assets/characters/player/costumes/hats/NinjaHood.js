/**
 * Ninja Hood (忍者头巾)
 * Style: Dark wrapped hood/mask covering the head, only eyes visible
 */
export const NINJA_HOOD = {
    id: 'hat_ninja',
    name: '忍者头巾',
    slot: 'hat',
    coversHair: true,
    colors: {
        cloth: '#1a1a1a',
        clothDark: '#0d0d0d',
        clothLight: '#2d2d2d',
        band: '#8b0000',
    },
    draw(drawer, cx, headY, colors) {
        const w = 18;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 2;

        // Hood dome (covers top of head)
        drawer.fillQuadCurve(x + 1, y + 5, cx, y - 1, x + w - 1, y + 5, colors.cloth);

        // Hood body (wraps around face)
        drawer.rect(x + 2, y + 3, w - 4, h - 2, colors.cloth);

        // Lower mask (covers chin/mouth)
        drawer.rect(x + 3, y + h - 4, w - 6, 4, colors.cloth);

        // Eye slit opening (leave a gap for eyes to show through)
        drawer.rect(x + 3, y + 5, w - 6, 3, colors.clothLight);

        // Side wrapping shadows
        drawer.vLine(x + 2, y + 4, h - 3, colors.clothDark);
        drawer.vLine(x + w - 3, y + 4, h - 3, colors.clothDark);

        // Red headband/band across forehead
        drawer.hLine(x + 2, y + 4, w - 4, colors.band);
        drawer.hLine(x + 2, y + 5, w - 4, colors.band);

        // Trailing band tails (right side)
        drawer.fillPath([
            { x: x + w - 3, y: y + 4 },
            { x: x + w, y: y + 3 },
            { x: x + w + 2, y: y + 5 },
            { x: x + w - 1, y: y + 6 },
            { x: x + w - 3, y: y + 6 }
        ], colors.band);

        // Fold detail on top
        drawer.pixel(cx - 2, y + 1, colors.clothDark);
        drawer.pixel(cx + 1, y + 2, colors.clothDark);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const cy = hy - 2;

        // Hood dome
        drawer.fillQuadCurve(hx - 2, cy + 7, cx, cy - 2, hx + headW + 2, cy + 7, colors.cloth);

        // Hood body
        drawer.rect(hx - 1, cy + 5, headW + 2, headH, colors.cloth);

        // Lower mask
        drawer.rect(hx + 2, cy + headH, headW - 4, 5, colors.cloth);

        // Eye slit
        drawer.rect(hx + 2, cy + 9, headW - 4, 4, colors.clothLight);

        // Side shadows
        drawer.rect(hx - 1, cy + 6, 2, headH - 2, colors.clothDark);
        drawer.rect(hx + headW - 1, cy + 6, 2, headH - 2, colors.clothDark);

        // Red headband
        drawer.rect(hx - 1, cy + 7, headW + 2, 3, colors.band);

        // Trailing tails
        drawer.fillPath([
            { x: hx + headW + 1, y: cy + 7 },
            { x: hx + headW + 5, y: cy + 6 },
            { x: hx + headW + 7, y: cy + 9 },
            { x: hx + headW + 3, y: cy + 10 },
            { x: hx + headW + 1, y: cy + 10 }
        ], colors.band);

        // Fold details
        drawer.pixel(cx - 3, cy + 3, colors.clothDark);
        drawer.pixel(cx + 2, cy + 4, colors.clothDark);
    }
};
