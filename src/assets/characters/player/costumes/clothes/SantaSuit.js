/**
 * Santa Suit (圣诞服)
 * Style: Classic red Santa coat with white fur trim, black belt
 */
export const SANTA_SUIT = {
    id: 'clothes_santa',
    name: '圣诞服',
    slot: 'clothes',
    colors: {
        coat: '#c0392b',
        coatDark: '#922b21',
        coatLight: '#e74c3c',
        fur: '#ecf0f1',
        furDark: '#bdc3c7',
        belt: '#1a1a1a',
        buckle: '#f1c40f',
        shirt: '#c0392b',
        pants: '#c0392b',
        boots: '#1a1a1a',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const w = 12;
        const h = 7;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        const C = colors.coat;
        const D = colors.coatDark;

        // Main coat body (wide)
        drawer.fillPath([
            { x: x, y: y },
            { x: x + w, y: y },
            { x: x + w + 1, y: y + h },
            { x: x - 1, y: y + h }
        ], C);

        // Collar fur trim
        drawer.fillPath([
            { x: x - 1, y: y - 1 },
            { x: x + 2, y: y - 1 },
            { x: x + 1, y: y + 2 },
            { x: x - 2, y: y + 1 }
        ], colors.fur);
        drawer.fillPath([
            { x: x + w + 1, y: y - 1 },
            { x: x + w - 2, y: y - 1 },
            { x: x + w - 1, y: y + 2 },
            { x: x + w + 2, y: y + 1 }
        ], colors.fur);

        // Center seam buttons
        drawer.pixel(cx, y + 2, colors.buckle);
        drawer.pixel(cx, y + 4, colors.buckle);

        // Belt
        drawer.hLine(x, y + h - 2, w, colors.belt);
        drawer.hLine(x, y + h - 1, w, colors.belt);
        // Buckle
        drawer.rect(cx - 1, y + h - 2, 2, 2, colors.buckle);

        // Coat tail / skirt
        const swing = Math.sin(coatWave * Math.PI * 2) * 1;
        const tailY = y + h;
        const tailH = 4;

        // Left tail
        drawer.fillPath([
            { x: x - 1, y: tailY },
            { x: x + 3, y: tailY },
            { x: x + 2 + swing, y: tailY + tailH },
            { x: x - 2 + swing, y: tailY + tailH }
        ], C);

        // Right tail
        drawer.fillPath([
            { x: x + w + 1, y: tailY },
            { x: x + w - 3, y: tailY },
            { x: x + w - 2 + swing, y: tailY + tailH },
            { x: x + w + 2 + swing, y: tailY + tailH }
        ], C);

        // Bottom fur trim
        drawer.hLine(x - 2 + swing, tailY + tailH, 3, colors.fur);
        drawer.hLine(x + w - 1 + swing, tailY + tailH, 3, colors.fur);

        // Shadow on sides
        drawer.vLine(x, y + 1, h - 2, D);
        drawer.vLine(x + w - 1, y + 1, h - 2, D);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;

        // Shoulders
        drawer.fillPath([
            { x: cx - 11, y: bodyY + 4 },
            { x: cx - 6, y: bodyY - 2 },
            { x: cx + 6, y: bodyY - 2 },
            { x: cx + 11, y: bodyY + 4 },
            { x: cx + 12, y: bodyY + 10 },
            { x: cx - 12, y: bodyY + 10 }
        ], colors.coat);

        // Fur collar
        drawer.fillPath([
            { x: cx - 7, y: bodyY - 2 },
            { x: cx - 3, y: bodyY },
            { x: cx - 3, y: bodyY + 4 },
            { x: cx - 8, y: bodyY + 2 }
        ], colors.fur);
        drawer.fillPath([
            { x: cx + 7, y: bodyY - 2 },
            { x: cx + 3, y: bodyY },
            { x: cx + 3, y: bodyY + 4 },
            { x: cx + 8, y: bodyY + 2 }
        ], colors.fur);

        // Belt
        drawer.rect(cx - 10, bodyY + 6, 20, 2, colors.belt);
        drawer.rect(cx - 2, bodyY + 6, 4, 2, colors.buckle);

        // Buttons
        drawer.pixel(cx, bodyY + 2, colors.buckle);
        drawer.pixel(cx, bodyY + 4, colors.buckle);
    }
};
