/**
 * Knight Helmet (骑士头盔)
 * Style: Medieval full-face helmet with T-shaped visor slit
 */
export const KNIGHT_HELMET = {
    id: 'hat_knight',
    name: '骑士头盔',
    slot: 'hat',
    coversHair: true,
    colors: {
        helmet: '#8e8e8e',
        helmetDark: '#4a4a4a',
        helmetLight: '#b0b0b0',
        visor: '#2a2a2a',
        gold: '#c9a73e',
    },
    draw(drawer, cx, headY, colors) {
        const w = 18;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 2;

        // Helmet dome (covers entire top of head)
        drawer.fillQuadCurve(x, y + 4, cx, y - 2, x + w, y + 4, colors.helmet);

        // Helmet body (covers down to chin)
        drawer.rect(x + 1, y + 3, w - 2, h - 2, colors.helmet);

        // Rounded chin guard
        drawer.fillQuadCurve(x + 2, y + h - 2, cx, y + h + 1, x + w - 2, y + h - 2, colors.helmet);

        // Side shading (depth)
        drawer.vLine(x + 1, y + 4, h - 3, colors.helmetDark);
        drawer.vLine(x + 2, y + 4, h - 3, colors.helmetDark);
        drawer.vLine(x + w - 2, y + 4, h - 3, colors.helmetDark);
        drawer.vLine(x + w - 3, y + 4, h - 3, colors.helmetDark);

        // Highlight on top (metallic sheen)
        drawer.hLine(cx - 2, y + 1, 4, colors.helmetLight);
        drawer.pixel(cx - 1, y, colors.helmetLight);

        // T-visor slit (horizontal eye slit)
        drawer.rect(x + 3, y + 6, w - 6, 2, colors.visor);
        // T-visor vertical (nose guard)
        drawer.rect(cx - 1, y + 5, 2, 5, colors.visor);

        // Gold brow trim
        drawer.hLine(x + 3, y + 5, w - 6, colors.gold);

        // Small crest ridge on top
        drawer.vLine(cx, y - 1, 3, colors.helmetDark);
        drawer.pixel(cx, y - 1, colors.helmetLight);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const cy = hy - 2;

        // Helmet dome
        drawer.fillQuadCurve(hx - 3, cy + 6, cx, cy - 4, hx + headW + 3, cy + 6, colors.helmet);

        // Helmet body (full face coverage)
        drawer.rect(hx - 2, cy + 4, headW + 4, headH, colors.helmet);

        // Rounded chin
        drawer.fillQuadCurve(hx, cy + headH + 2, cx, cy + headH + 5, hx + headW, cy + headH + 2, colors.helmet);

        // Side shading
        drawer.rect(hx - 2, cy + 5, 3, headH - 2, colors.helmetDark);
        drawer.rect(hx + headW - 1, cy + 5, 3, headH - 2, colors.helmetDark);

        // Top highlight
        drawer.hLine(cx - 4, cy + 1, 8, colors.helmetLight);
        drawer.hLine(cx - 2, cy, 4, colors.helmetLight);

        // T-visor slit (horizontal)
        drawer.rect(hx + 3, cy + 10, headW - 6, 3, colors.visor);
        // T-visor vertical (nose guard)
        drawer.rect(cx - 1, cy + 9, 2, 8, colors.visor);

        // Gold brow trim
        drawer.hLine(hx + 3, cy + 9, headW - 6, colors.gold);

        // Crest ridge
        drawer.vLine(cx, cy - 3, 4, colors.helmetDark);
        drawer.pixel(cx, cy - 3, colors.helmetLight);
    }
};
