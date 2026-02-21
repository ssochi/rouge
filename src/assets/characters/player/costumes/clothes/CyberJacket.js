/**
 * Cyber Jacket (赛博夹克)
 * Style: Dark fitted jacket with neon LED trim lines
 */
export const CYBER_JACKET = {
    id: 'clothes_cyber',
    name: '赛博夹克',
    slot: 'clothes',
    colors: {
        coat: '#1a1a2e',
        coatDark: '#0d0d1a',
        coatLight: '#00ffff',
        shirt: '#2d2d44',
        pants: '#1a1a2e',
        boots: '#0d0d1a',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const w = 12;
        const h = 8;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        // Undershirt (neck area)
        drawer.rect(cx - 2, y - 1, 4, 3, colors.shirt);

        // Left Panel
        drawer.fillPath([
            { x: x, y: y },
            { x: cx - 1, y: y + 1 },
            { x: cx - 1, y: y + h },
            { x: x, y: y + h },
            { x: x - 1, y: y + 3 }
        ], colors.coat);

        // Right Panel
        drawer.fillPath([
            { x: x + w, y: y },
            { x: cx + 1, y: y + 1 },
            { x: cx + 1, y: y + h },
            { x: x + w, y: y + h },
            { x: x + w + 1, y: y + 3 }
        ], colors.coat);

        // High-tech standing collar
        drawer.rect(x + 1, y - 1, 3, 2, colors.coatDark);
        drawer.rect(x + w - 4, y - 1, 3, 2, colors.coatDark);
        drawer.pixel(x + 1, y - 1, colors.coatLight);
        drawer.pixel(x + w - 2, y - 1, colors.coatLight);

        // Neon LED lines — shoulder seams
        drawer.hLine(x - 1, y + 1, 3, colors.coatLight);
        drawer.hLine(x + w - 2, y + 1, 3, colors.coatLight);

        // Neon side seam lines
        drawer.vLine(x - 1, y + 3, 4, colors.coatLight);
        drawer.vLine(x + w + 1, y + 3, 4, colors.coatLight);

        // Center circuit detail
        drawer.vLine(cx, y + 2, 4, '#ff00ff');

        // Bottom edge neon trim
        drawer.hLine(x, y + h, w, colors.coatLight);

        // Chest tech details
        drawer.pixel(cx - 3, y + 3, '#ff00ff');
        drawer.pixel(cx + 3, y + 4, colors.coatLight);

        // Side shadows
        drawer.vLine(x, y + 2, h - 2, colors.coatDark);
        drawer.vLine(x + w - 1, y + 2, h - 2, colors.coatDark);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;

        // Shoulders
        drawer.fillPath([
            { x: cx - 11, y: bodyY + 2 },
            { x: cx - 5, y: bodyY - 3 },
            { x: cx + 5, y: bodyY - 3 },
            { x: cx + 11, y: bodyY + 2 },
            { x: cx + 12, y: bodyY + 10 },
            { x: cx - 12, y: bodyY + 10 }
        ], colors.coat);

        // High collar
        drawer.rect(cx - 5, bodyY - 5, 3, 3, colors.coatDark);
        drawer.rect(cx + 2, bodyY - 5, 3, 3, colors.coatDark);

        // Undershirt V-neck
        drawer.fillPath([
            { x: cx - 3, y: bodyY - 3 },
            { x: cx, y: bodyY + 1 },
            { x: cx + 3, y: bodyY - 3 }
        ], colors.shirt);

        // Neon shoulder lines
        drawer.hLine(cx - 10, bodyY, 6, colors.coatLight);
        drawer.hLine(cx + 4, bodyY, 6, colors.coatLight);

        // Neon side lines
        drawer.vLine(cx - 11, bodyY + 3, 6, colors.coatLight);
        drawer.vLine(cx + 11, bodyY + 3, 6, colors.coatLight);

        // Center circuit
        drawer.vLine(cx, bodyY + 2, 6, '#ff00ff');

        // Bottom neon trim
        drawer.hLine(cx - 10, bodyY + 10, 20, colors.coatLight);

        // Tech details
        drawer.pixel(cx - 5, bodyY + 4, '#ff00ff');
        drawer.pixel(cx + 5, bodyY + 5, colors.coatLight);
    }
};
