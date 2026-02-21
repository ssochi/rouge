/**
 * Pirate Tricorn Hat (海盗三角帽)
 * Style: Classic pirate tricorn with skull emblem and gold trim
 */
export const PIRATE_HAT = {
    id: 'hat_pirate',
    name: '海盗三角帽',
    slot: 'hat',
    coversHair: true,
    colors: {
        hat: '#2c1810',
        hatDark: '#1a0e08',
        hatLight: '#3d2214',
        gold: '#c9a73e',
        skull: '#ecf0f1',
    },
    draw(drawer, cx, headY, colors) {
        const w = 20;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 2;

        // Hat brim (wide, turned up on sides)
        drawer.fillPath([
            { x: x - 2, y: y + 6 },
            { x: x + 2, y: y + 4 },
            { x: x + w - 2, y: y + 4 },
            { x: x + w + 2, y: y + 6 },
            { x: x + w, y: y + 8 },
            { x: x, y: y + 8 }
        ], colors.hat);

        // Hat crown (dome)
        drawer.fillQuadCurve(x + 3, y + 5, cx, y - 1, x + w - 3, y + 5, colors.hat);

        // Top peak
        drawer.fillPath([
            { x: cx - 3, y: y + 2 },
            { x: cx, y: y - 2 },
            { x: cx + 3, y: y + 2 }
        ], colors.hat);

        // Gold trim along brim
        drawer.hLine(x + 1, y + 7, w - 2, colors.gold);

        // Skull emblem (tiny, center front)
        drawer.pixel(cx - 1, y + 3, colors.skull);
        drawer.pixel(cx, y + 3, colors.skull);
        drawer.pixel(cx + 1, y + 3, colors.skull);
        drawer.pixel(cx, y + 4, colors.skull);
        // Crossbones hint
        drawer.pixel(cx - 1, y + 5, colors.skull);
        drawer.pixel(cx + 1, y + 5, colors.skull);

        // Side shading
        drawer.vLine(x + 1, y + 5, 3, colors.hatDark);
        drawer.vLine(x + w - 1, y + 5, 3, colors.hatDark);

        // Highlight on crown
        drawer.pixel(cx - 1, y, colors.hatLight);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const cy = hy - 4;

        // Wide brim (turned up)
        drawer.fillPath([
            { x: hx - 6, y: cy + 10 },
            { x: hx, y: cy + 7 },
            { x: hx + headW, y: cy + 7 },
            { x: hx + headW + 6, y: cy + 10 },
            { x: hx + headW + 4, y: cy + 13 },
            { x: hx - 4, y: cy + 13 }
        ], colors.hat);

        // Crown dome
        drawer.fillQuadCurve(hx + 2, cy + 8, cx, cy, hx + headW - 2, cy + 8, colors.hat);

        // Top peak
        drawer.fillPath([
            { x: cx - 4, y: cy + 3 },
            { x: cx, y: cy - 3 },
            { x: cx + 4, y: cy + 3 }
        ], colors.hat);

        // Gold trim
        drawer.hLine(hx - 3, cy + 12, headW + 6, colors.gold);

        // Skull emblem
        drawer.rect(cx - 2, cy + 4, 4, 3, colors.skull);
        drawer.pixel(cx - 1, cy + 4, '#333');
        drawer.pixel(cx + 1, cy + 4, '#333');
        drawer.pixel(cx, cy + 6, '#333');
        // Crossbones
        drawer.pixel(cx - 2, cy + 8, colors.skull);
        drawer.pixel(cx + 2, cy + 8, colors.skull);

        // Side shading
        drawer.rect(hx - 4, cy + 9, 3, 3, colors.hatDark);
        drawer.rect(hx + headW + 1, cy + 9, 3, 3, colors.hatDark);

        // Crown highlight
        drawer.hLine(cx - 3, cy + 1, 6, colors.hatLight);
    }
};
