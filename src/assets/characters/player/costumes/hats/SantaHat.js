/**
 * Santa Hat (圣诞帽)
 * Style: Classic red Santa hat with white fur trim and pompom
 */
export const SANTA_HAT = {
    id: 'hat_santa',
    name: '圣诞帽',
    slot: 'hat',
    coversHair: true,
    colors: {
        hat: '#c0392b',
        hatLight: '#e74c3c',
        hatDark: '#922b21',
        fur: '#ecf0f1',
        furDark: '#bdc3c7',
    },
    draw(drawer, cx, headY, colors) {
        const w = 18;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 2;

        // Base dome — cover hair top area (stop before eyes)
        drawer.fillQuadCurve(x, y + 5, cx, y, x + w, y + 5, colors.hat);

        // Hat body — drooping cone shape tilting right
        drawer.fillPath([
            { x: x, y: y + 3 },
            { x: cx - 2, y: y - 2 },
            { x: cx + 4, y: y - 5 },
            { x: cx + 7, y: y - 3 },
            { x: cx + 3, y: y },
            { x: x + w, y: y + 3 }
        ], colors.hat);

        // Highlight fold
        drawer.pixel(cx + 2, y - 1, colors.hatLight);
        drawer.pixel(cx + 1, y, colors.hatLight);

        // Fur trim band (at hat bottom edge)
        drawer.rect(x - 1, y + 3, w + 2, 3, colors.fur);
        // Fur texture
        drawer.pixel(x + 1, y + 4, colors.furDark);
        drawer.pixel(x + 5, y + 3, colors.furDark);
        drawer.pixel(x + 9, y + 4, colors.furDark);
        drawer.pixel(x + 13, y + 3, colors.furDark);
        drawer.pixel(x + 16, y + 4, colors.furDark);

        // Pompom at tip
        drawer.rect(cx + 5, y - 6, 4, 3, colors.fur);
        drawer.pixel(cx + 6, y - 5, colors.furDark);
        drawer.pixel(cx + 7, y - 5, colors.furDark);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const cy = hy - 1;

        // Base dome — cover hair top
        drawer.fillQuadCurve(hx - 2, cy + 7, cx, cy - 1, hx + headW + 2, cy + 7, colors.hat);

        // Hat body — large drooping cone
        drawer.fillPath([
            { x: hx - 2, y: cy + 3 },
            { x: cx - 2, y: cy - 5 },
            { x: cx + 6, y: cy - 12 },
            { x: cx + 11, y: cy - 7 },
            { x: cx + 4, y: cy - 2 },
            { x: hx + headW + 2, y: cy + 3 }
        ], colors.hat);

        // Highlight
        drawer.pixel(cx + 4, cy - 6, colors.hatLight);
        drawer.pixel(cx + 3, cy - 4, colors.hatLight);

        // Fur trim band
        drawer.rect(hx - 3, cy + 5, headW + 6, 3, colors.fur);
        drawer.pixel(hx, cy + 6, colors.furDark);
        drawer.pixel(hx + 5, cy + 5, colors.furDark);
        drawer.pixel(hx + 10, cy + 6, colors.furDark);
        drawer.pixel(hx + 15, cy + 5, colors.furDark);
        drawer.pixel(hx + 19, cy + 6, colors.furDark);

        // Pompom
        drawer.rect(cx + 9, cy - 13, 5, 4, colors.fur);
        drawer.pixel(cx + 10, cy - 12, colors.furDark);
        drawer.pixel(cx + 12, cy - 11, colors.furDark);
    }
};
