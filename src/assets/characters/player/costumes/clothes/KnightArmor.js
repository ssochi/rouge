/**
 * Knight Armor (骑士铠甲)
 * Style: Plate armor with chainmail underlay and shoulder pauldrons
 */
export const KNIGHT_ARMOR = {
    id: 'clothes_knight',
    name: '骑士铠甲',
    slot: 'clothes',
    colors: {
        coat: '#8e8e8e',
        coatDark: '#4a4a4a',
        coatLight: '#b0b0b0',
        shirt: '#6b6b6b',
        pants: '#4a4a4a',
        boots: '#3a3a3a',
        gold: '#c9a73e',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const w = 12;
        const h = 8;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        // Chainmail underlay (visible at neck)
        drawer.rect(cx - 2, y - 1, 4, 3, colors.shirt);
        // Chainmail texture dots
        drawer.pixel(cx - 1, y, '#7a7a7a');
        drawer.pixel(cx + 1, y, '#5e5e5e');

        // Chest plate — left panel
        drawer.fillPath([
            { x: x, y: y },
            { x: cx, y: y + 1 },
            { x: cx, y: y + h },
            { x: x, y: y + h },
            { x: x - 1, y: y + 2 }
        ], colors.coat);

        // Chest plate — right panel
        drawer.fillPath([
            { x: cx, y: y + 1 },
            { x: x + w, y: y },
            { x: x + w + 1, y: y + 2 },
            { x: x + w, y: y + h },
            { x: cx, y: y + h }
        ], colors.coat);

        // Shoulder pauldrons (extend beyond body)
        // Left pauldron
        drawer.fillPath([
            { x: x - 3, y: y + 1 },
            { x: x - 1, y: y - 1 },
            { x: x + 2, y: y - 1 },
            { x: x + 2, y: y + 3 },
            { x: x - 2, y: y + 3 }
        ], colors.coat);
        drawer.hLine(x - 3, y + 1, 5, colors.coatLight);

        // Right pauldron
        drawer.fillPath([
            { x: x + w + 3, y: y + 1 },
            { x: x + w + 1, y: y - 1 },
            { x: x + w - 2, y: y - 1 },
            { x: x + w - 2, y: y + 3 },
            { x: x + w + 2, y: y + 3 }
        ], colors.coat);
        drawer.hLine(x + w - 2, y + 1, 5, colors.coatLight);

        // Center ridge / breastplate seam
        drawer.vLine(cx, y + 2, h - 2, colors.coatDark);

        // Gold belt / waist trim
        drawer.hLine(x, y + h - 1, w, colors.gold);
        drawer.pixel(cx, y + h - 1, colors.coatLight);

        // Gold chest cross emblem
        drawer.pixel(cx, y + 3, colors.gold);
        drawer.pixel(cx - 1, y + 4, colors.gold);
        drawer.pixel(cx, y + 4, colors.gold);
        drawer.pixel(cx + 1, y + 4, colors.gold);
        drawer.pixel(cx, y + 5, colors.gold);

        // Metallic highlights
        drawer.pixel(x + 2, y + 2, colors.coatLight);
        drawer.pixel(x + w - 3, y + 2, colors.coatLight);

        // Side shadows
        drawer.vLine(x - 1, y + 3, 4, colors.coatDark);
        drawer.vLine(x + w + 1, y + 3, 4, colors.coatDark);

        // Tasset (short skirt armor) — rigid, no coatWave animation
        const tailY = y + h;
        drawer.rect(x, tailY, w, 2, colors.coatDark);
        drawer.hLine(x, tailY, w, colors.coat);
        drawer.pixel(cx - 3, tailY + 1, colors.coatLight);
        drawer.pixel(cx + 3, tailY + 1, colors.coatLight);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;

        // Broad armored shoulders with pauldrons
        drawer.fillPath([
            { x: cx - 13, y: bodyY + 2 },
            { x: cx - 7, y: bodyY - 4 },
            { x: cx + 7, y: bodyY - 4 },
            { x: cx + 13, y: bodyY + 2 },
            { x: cx + 12, y: bodyY + 10 },
            { x: cx - 12, y: bodyY + 10 }
        ], colors.coat);

        // Pauldron highlight lines
        drawer.hLine(cx - 12, bodyY, 7, colors.coatLight);
        drawer.hLine(cx + 5, bodyY, 7, colors.coatLight);

        // Chainmail neckline
        drawer.fillPath([
            { x: cx - 5, y: bodyY - 4 },
            { x: cx, y: bodyY },
            { x: cx + 5, y: bodyY - 4 }
        ], colors.shirt);
        // Chainmail texture
        drawer.pixel(cx - 2, bodyY - 2, '#7a7a7a');
        drawer.pixel(cx + 1, bodyY - 1, '#5e5e5e');

        // Center seam
        drawer.vLine(cx, bodyY + 2, 6, colors.coatDark);

        // Gold cross emblem
        drawer.pixel(cx, bodyY + 3, colors.gold);
        drawer.hLine(cx - 2, bodyY + 4, 5, colors.gold);
        drawer.pixel(cx, bodyY + 5, colors.gold);
        drawer.pixel(cx, bodyY + 6, colors.gold);

        // Gold belt
        drawer.hLine(cx - 10, bodyY + 8, 20, colors.gold);

        // Shoulder shadow/depth
        drawer.rect(cx - 12, bodyY - 2, 4, 3, colors.coatDark);
        drawer.rect(cx + 8, bodyY - 2, 4, 3, colors.coatDark);

        // Metallic highlights
        drawer.pixel(cx - 6, bodyY + 3, colors.coatLight);
        drawer.pixel(cx + 6, bodyY + 3, colors.coatLight);
    }
};
