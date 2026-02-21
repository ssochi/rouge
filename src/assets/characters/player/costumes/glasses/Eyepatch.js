/**
 * Eyepatch (眼罩)
 * Style: Classic pirate eyepatch over one eye with strap
 */
export const EYEPATCH = {
    id: 'glasses_eyepatch',
    name: '眼罩',
    slot: 'glasses',
    colors: {
        glasses: '#1a1a1a',
        glassesRim: '#2c1810',
    },
    draw(drawer, cx, headY, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const eyeY = y + 5;

        // Strap (thin diagonal line across face)
        drawer.pixel(x + 1, eyeY - 1, colors.glassesRim);
        drawer.pixel(x + 2, eyeY, colors.glassesRim);
        drawer.hLine(x + 3, eyeY + 1, 3, colors.glassesRim);
        drawer.hLine(x + 9, eyeY + 1, 5, colors.glassesRim);
        drawer.pixel(x + 14, eyeY, colors.glassesRim);

        // Eyepatch over left eye (character faces left, so patch is on right side of sprite)
        drawer.rect(x + 8, eyeY, 4, 3, colors.glasses);
        // Patch edge highlight
        drawer.pixel(x + 8, eyeY, colors.glassesRim);
        drawer.pixel(x + 11, eyeY, colors.glassesRim);
        drawer.pixel(x + 8, eyeY + 2, colors.glassesRim);
        drawer.pixel(x + 11, eyeY + 2, colors.glassesRim);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const gy = hy + 8;

        // Strap across face
        drawer.hLine(hx - 1, gy + 1, 7, colors.glassesRim);
        drawer.hLine(hx + 14, gy + 1, 7, colors.glassesRim);

        // Eyepatch on one eye
        drawer.rect(hx + 10, gy - 1, 6, 5, colors.glasses);
        // Edge detail
        drawer.rect(hx + 10, gy - 1, 6, 1, colors.glassesRim);
        drawer.rect(hx + 10, gy + 3, 6, 1, colors.glassesRim);
        drawer.vLine(hx + 10, gy, 3, colors.glassesRim);
        drawer.vLine(hx + 15, gy, 3, colors.glassesRim);
    }
};
