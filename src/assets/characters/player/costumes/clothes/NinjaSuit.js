/**
 * Ninja Suit (忍者装)
 * Style: Dark fitted stealth suit with wrapped cloth and utility belt
 */
export const NINJA_SUIT = {
    id: 'clothes_ninja',
    name: '忍者装',
    slot: 'clothes',
    colors: {
        coat: '#1a1a1a',
        coatDark: '#0d0d0d',
        coatLight: '#2d2d2d',
        shirt: '#1a1a1a',
        pants: '#111111',
        boots: '#0d0d0d',
        band: '#8b0000',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const w = 11;
        const h = 8;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        // Fitted body suit
        drawer.fillPath([
            { x: x + 1, y: y },
            { x: x + w - 1, y: y },
            { x: x + w, y: y + 3 },
            { x: x + w, y: y + h },
            { x: x, y: y + h },
            { x: x, y: y + 3 }
        ], colors.coat);

        // Wrapped chest cloth (cross wrap)
        drawer.fillPath([
            { x: x + 1, y: y },
            { x: x + w - 1, y: y + 4 },
            { x: x + w - 1, y: y + 5 },
            { x: x + 1, y: y + 1 }
        ], colors.coatLight);
        drawer.fillPath([
            { x: x + w - 1, y: y },
            { x: x + 1, y: y + 4 },
            { x: x + 1, y: y + 5 },
            { x: x + w - 1, y: y + 1 }
        ], colors.coatLight);

        // Utility belt / sash
        drawer.hLine(x, y + h - 2, w, colors.band);
        drawer.hLine(x, y + h - 1, w, colors.band);

        // Belt knot detail
        drawer.pixel(cx + 2, y + h - 2, '#a00000');
        drawer.pixel(cx + 3, y + h - 1, '#a00000');

        // Side arm wrappings
        drawer.pixel(x - 1, y + 2, colors.coatLight);
        drawer.pixel(x + w, y + 2, colors.coatLight);

        // Side shadows
        drawer.vLine(x, y + 1, h - 1, colors.coatDark);
        drawer.vLine(x + w - 1, y + 1, h - 1, colors.coatDark);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;

        // Fitted shoulders
        drawer.fillPath([
            { x: cx - 10, y: bodyY + 2 },
            { x: cx - 5, y: bodyY - 3 },
            { x: cx + 5, y: bodyY - 3 },
            { x: cx + 10, y: bodyY + 2 },
            { x: cx + 10, y: bodyY + 10 },
            { x: cx - 10, y: bodyY + 10 }
        ], colors.coat);

        // Cross wrap
        drawer.fillPath([
            { x: cx - 6, y: bodyY - 2 },
            { x: cx + 6, y: bodyY + 6 },
            { x: cx + 6, y: bodyY + 7 },
            { x: cx - 6, y: bodyY - 1 }
        ], colors.coatLight);
        drawer.fillPath([
            { x: cx + 6, y: bodyY - 2 },
            { x: cx - 6, y: bodyY + 6 },
            { x: cx - 6, y: bodyY + 7 },
            { x: cx + 6, y: bodyY - 1 }
        ], colors.coatLight);

        // Red sash/belt
        drawer.rect(cx - 9, bodyY + 7, 18, 2, colors.band);
        drawer.pixel(cx + 4, bodyY + 7, '#a00000');
        drawer.pixel(cx + 5, bodyY + 8, '#a00000');

        // Side shadows
        drawer.rect(cx - 10, bodyY + 1, 2, 8, colors.coatDark);
        drawer.rect(cx + 8, bodyY + 1, 2, 8, colors.coatDark);
    }
};
