/**
 * Santa Beard (圣诞白胡子)
 * Style: Big fluffy white beard like Santa Claus
 */
export const SANTA_BEARD = {
    id: 'beard_santa',
    name: '圣诞白胡子',
    slot: 'beard',
    colors: {
        beard: '#ecf0f1',
        beardDark: '#bdc3c7',
    },
    draw(drawer, cx, headY, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;

        // Big fluffy white beard — wider and longer than default
        drawer.fillPath([
            { x: x, y: y + h - 6 },
            { x: x, y: y + h },
            { x: x + 2, y: y + h + 2 },
            { x: cx, y: y + h + 3 },
            { x: x + w - 2, y: y + h + 2 },
            { x: x + w, y: y + h },
            { x: x + w, y: y + h - 6 },
            { x: x + w - 2, y: y + h - 4 },
            { x: x + 2, y: y + h - 4 }
        ], colors.beard);

        // Beard shadow/texture
        drawer.pixel(x + 3, y + h - 2, colors.beardDark);
        drawer.pixel(x + 6, y + h, colors.beardDark);
        drawer.pixel(x + w - 3, y + h - 2, colors.beardDark);
        drawer.pixel(x + w - 6, y + h, colors.beardDark);
        drawer.pixel(cx, y + h + 1, colors.beardDark);

        // Mustache (white)
        drawer.rect(cx - 4, y + h - 5, 8, 2, colors.beard);
        drawer.pixel(cx - 4, y + h - 4, colors.beardDark);
        drawer.pixel(cx + 4, y + h - 4, colors.beardDark);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;

        // Large fluffy white beard
        drawer.fillPath([
            { x: hx, y: hy + headH - 10 },
            { x: hx, y: hy + headH },
            { x: hx + 3, y: hy + headH + 4 },
            { x: cx, y: hy + headH + 6 },
            { x: hx + headW - 3, y: hy + headH + 4 },
            { x: hx + headW, y: hy + headH },
            { x: hx + headW, y: hy + headH - 10 },
            { x: hx + headW - 4, y: hy + headH - 6 },
            { x: hx + 4, y: hy + headH - 6 }
        ], colors.beard);

        // Texture shadows
        drawer.pixel(hx + 4, hy + headH - 3, colors.beardDark);
        drawer.pixel(hx + 8, hy + headH, colors.beardDark);
        drawer.pixel(hx + headW - 4, hy + headH - 3, colors.beardDark);
        drawer.pixel(hx + headW - 8, hy + headH, colors.beardDark);
        drawer.pixel(cx, hy + headH + 3, colors.beardDark);

        // Mustache
        drawer.rect(cx - 6, hy + headH - 8, 12, 3, colors.beard);
        drawer.pixel(cx - 6, hy + headH - 6, colors.beardDark);
        drawer.pixel(cx + 6, hy + headH - 6, colors.beardDark);
    }
};
