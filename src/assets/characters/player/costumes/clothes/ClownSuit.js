/**
 * Clown Suit (小丑服)
 * Style: Colorful baggy outfit with ruffled collar and big buttons
 */
export const CLOWN_SUIT = {
    id: 'clothes_clown',
    name: '小丑服',
    slot: 'clothes',
    colors: {
        coat: '#e74c3c',
        coatDark: '#c0392b',
        coatLight: '#f1948a',
        blue: '#3498db',
        blueDark: '#2980b9',
        ruffle: '#ecf0f1',
        ruffleDark: '#bdc3c7',
        button: '#f1c40f',
        shirt: '#e74c3c',
        pants: '#3498db',
        boots: '#f1c40f',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const w = 12;
        const h = 7;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        // Left half (red)
        drawer.fillPath([
            { x: x, y: y },
            { x: cx, y: y },
            { x: cx, y: y + h },
            { x: x - 1, y: y + h },
            { x: x - 2, y: y + 2 }
        ], colors.coat);

        // Right half (blue)
        drawer.fillPath([
            { x: cx, y: y },
            { x: x + w, y: y },
            { x: x + w + 2, y: y + 2 },
            { x: x + w + 1, y: y + h },
            { x: cx, y: y + h }
        ], colors.blue);

        // Ruffled collar
        drawer.fillPath([
            { x: x - 1, y: y - 1 },
            { x: cx - 1, y: y + 2 },
            { x: cx, y: y - 2 },
            { x: cx + 1, y: y + 2 },
            { x: x + w + 1, y: y - 1 }
        ], colors.ruffle);
        // Ruffle texture
        drawer.pixel(cx - 3, y, colors.ruffleDark);
        drawer.pixel(cx + 3, y, colors.ruffleDark);

        // Big buttons down the center
        drawer.pixel(cx, y + 2, colors.button);
        drawer.pixel(cx, y + 4, colors.button);
        drawer.pixel(cx, y + 6, colors.button);

        // Baggy bottom with slight animation
        const swing = Math.sin(coatWave * Math.PI * 2) * 1;
        const tailY = y + h;

        // Left ruffle bottom (red)
        drawer.fillPath([
            { x: x - 1, y: tailY },
            { x: cx, y: tailY },
            { x: cx - 1 + swing, y: tailY + 3 },
            { x: x - 2 + swing, y: tailY + 3 }
        ], colors.coat);

        // Right ruffle bottom (blue)
        drawer.fillPath([
            { x: cx, y: tailY },
            { x: x + w + 1, y: tailY },
            { x: x + w + 2 + swing, y: tailY + 3 },
            { x: cx + 1 + swing, y: tailY + 3 }
        ], colors.blue);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;

        // Left shoulder (red)
        drawer.fillPath([
            { x: cx - 11, y: bodyY + 4 },
            { x: cx - 6, y: bodyY - 2 },
            { x: cx, y: bodyY - 2 },
            { x: cx, y: bodyY + 10 },
            { x: cx - 12, y: bodyY + 10 }
        ], colors.coat);

        // Right shoulder (blue)
        drawer.fillPath([
            { x: cx, y: bodyY - 2 },
            { x: cx + 6, y: bodyY - 2 },
            { x: cx + 11, y: bodyY + 4 },
            { x: cx + 12, y: bodyY + 10 },
            { x: cx, y: bodyY + 10 }
        ], colors.blue);

        // Ruffled collar
        drawer.fillPath([
            { x: cx - 8, y: bodyY - 2 },
            { x: cx - 3, y: bodyY + 2 },
            { x: cx, y: bodyY - 4 },
            { x: cx + 3, y: bodyY + 2 },
            { x: cx + 8, y: bodyY - 2 }
        ], colors.ruffle);
        drawer.pixel(cx - 4, bodyY, colors.ruffleDark);
        drawer.pixel(cx + 4, bodyY, colors.ruffleDark);

        // Buttons
        drawer.pixel(cx, bodyY + 3, colors.button);
        drawer.pixel(cx, bodyY + 5, colors.button);
        drawer.pixel(cx, bodyY + 7, colors.button);
    }
};
