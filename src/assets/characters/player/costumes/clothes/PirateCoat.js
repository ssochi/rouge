/**
 * Pirate Coat (海盗大衣)
 * Style: Long swashbuckler coat with gold buttons and wide belt
 */
export const PIRATE_COAT = {
    id: 'clothes_pirate',
    name: '海盗大衣',
    slot: 'clothes',
    colors: {
        coat: '#8b0000',
        coatDark: '#5c0000',
        coatLight: '#a52a2a',
        shirt: '#ecf0f1',
        pants: '#2c1810',
        boots: '#1a0e08',
        gold: '#c9a73e',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const w = 12;
        const h = 7;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        // White undershirt (V-neck)
        drawer.fillPath([
            { x: cx - 2, y: y },
            { x: cx, y: y + 4 },
            { x: cx + 2, y: y }
        ], colors.shirt);

        // Left Panel
        drawer.fillPath([
            { x: x, y: y },
            { x: x + 4, y: y },
            { x: x + 4, y: y + h },
            { x: x - 1, y: y + h },
            { x: x - 2, y: y + 2 }
        ], colors.coat);

        // Right Panel
        drawer.fillPath([
            { x: x + w - 4, y: y },
            { x: x + w, y: y },
            { x: x + w + 2, y: y + 2 },
            { x: x + w + 1, y: y + h },
            { x: x + w - 4, y: y + h }
        ], colors.coat);

        // Wide collar/lapels
        drawer.fillPath([
            { x: x - 1, y: y },
            { x: x + 3, y: y + 3 },
            { x: x + 1, y: y }
        ], colors.coatLight);
        drawer.fillPath([
            { x: x + w + 1, y: y },
            { x: x + w - 3, y: y + 3 },
            { x: x + w - 1, y: y }
        ], colors.coatLight);

        // Gold buttons
        drawer.pixel(cx - 2, y + 2, colors.gold);
        drawer.pixel(cx - 2, y + 4, colors.gold);
        drawer.pixel(cx + 2, y + 2, colors.gold);
        drawer.pixel(cx + 2, y + 4, colors.gold);

        // Belt with buckle
        drawer.hLine(x - 1, y + h - 1, w + 2, '#2c1810');
        drawer.pixel(cx, y + h - 1, colors.gold);

        // Coat tails (swinging with movement)
        const swing = Math.sin(coatWave * Math.PI * 2) * 2;
        const flare = Math.abs(swing) * 0.5;
        const tailY = y + h;
        const tailH = 7;

        // Left Tail
        drawer.fillPath([
            { x: x - 1, y: tailY },
            { x: x + 3, y: tailY },
            { x: x + 2 + swing + flare, y: tailY + tailH },
            { x: x - 3 + swing - flare, y: tailY + tailH }
        ], colors.coat);

        // Right Tail
        drawer.fillPath([
            { x: x + w - 3, y: tailY },
            { x: x + w + 1, y: tailY },
            { x: x + w + 3 + swing + flare, y: tailY + tailH },
            { x: x + w - 2 + swing - flare, y: tailY + tailH }
        ], colors.coat);

        // Tail edge trim
        drawer.hLine(x - 3 + swing, tailY + tailH - 1, 5, colors.gold);
        drawer.hLine(x + w - 2 + swing, tailY + tailH - 1, 5, colors.gold);

        // Side shadows
        drawer.vLine(x - 2, y + 2, h - 2, colors.coatDark);
        drawer.vLine(x + w + 2, y + 2, h - 2, colors.coatDark);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;

        // Broad shoulders
        drawer.fillPath([
            { x: cx - 12, y: bodyY + 3 },
            { x: cx - 5, y: bodyY - 3 },
            { x: cx + 5, y: bodyY - 3 },
            { x: cx + 12, y: bodyY + 3 },
            { x: cx + 12, y: bodyY + 10 },
            { x: cx - 12, y: bodyY + 10 }
        ], colors.coat);

        // White shirt V-neck
        drawer.fillPath([
            { x: cx - 3, y: bodyY - 3 },
            { x: cx, y: bodyY + 3 },
            { x: cx + 3, y: bodyY - 3 }
        ], colors.shirt);

        // Lapels
        drawer.fillPath([
            { x: cx - 8, y: bodyY - 2 },
            { x: cx - 3, y: bodyY + 3 },
            { x: cx - 5, y: bodyY - 2 }
        ], colors.coatLight);
        drawer.fillPath([
            { x: cx + 8, y: bodyY - 2 },
            { x: cx + 3, y: bodyY + 3 },
            { x: cx + 5, y: bodyY - 2 }
        ], colors.coatLight);

        // Gold buttons (double-breasted)
        drawer.pixel(cx - 4, bodyY + 2, colors.gold);
        drawer.pixel(cx - 4, bodyY + 5, colors.gold);
        drawer.pixel(cx + 4, bodyY + 2, colors.gold);
        drawer.pixel(cx + 4, bodyY + 5, colors.gold);

        // Belt
        drawer.rect(cx - 11, bodyY + 8, 22, 2, '#2c1810');
        drawer.rect(cx - 1, bodyY + 8, 2, 2, colors.gold);

        // Side shadows
        drawer.rect(cx - 12, bodyY + 1, 2, 7, colors.coatDark);
        drawer.rect(cx + 10, bodyY + 1, 2, 7, colors.coatDark);
    }
};
