/**
 * Clown Hair (小丑假发)
 * Style: Bald on top with puffy colorful curls on the sides (red/orange)
 */
export const CLOWN_HAIR = {
    id: 'hair_clown',
    name: '小丑假发',
    slot: 'hairstyle',
    colors: {
        hair: '#e74c3c',
        hairHighlight: '#f39c12',
    },
    drawBack(drawer, cx, headY, wavePhase, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const wave = Math.sin(wavePhase * Math.PI * 2) * 1;

        // Left puff (behind head)
        drawer.fillPath([
            { x: x - 3 + wave, y: y + 4 },
            { x: x - 4 + wave, y: y + 8 },
            { x: x - 2 + wave, y: y + 12 },
            { x: x + 1, y: y + 10 },
            { x: x, y: y + 5 }
        ], colors.hair);

        // Right puff (behind head)
        drawer.fillPath([
            { x: x + w + 3 + wave, y: y + 4 },
            { x: x + w + 4 + wave, y: y + 8 },
            { x: x + w + 2 + wave, y: y + 12 },
            { x: x + w - 1, y: y + 10 },
            { x: x + w, y: y + 5 }
        ], colors.hair);
    },
    drawFront(drawer, cx, headY, wavePhase, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const wave = Math.sin(wavePhase * Math.PI * 2) * 0.5;

        // Left puffy curls (side of head)
        drawer.fillPath([
            { x: x - 2, y: y + 3 },
            { x: x - 4 + wave, y: y + 5 },
            { x: x - 5 + wave, y: y + 9 },
            { x: x - 3 + wave, y: y + 12 },
            { x: x - 1, y: y + 10 },
            { x: x, y: y + 5 }
        ], colors.hair);
        // Curly highlights
        drawer.pixel(x - 3, y + 6, colors.hairHighlight);
        drawer.pixel(x - 4 + wave, y + 9, colors.hairHighlight);

        // Right puffy curls (side of head)
        drawer.fillPath([
            { x: x + w + 2, y: y + 3 },
            { x: x + w + 4 + wave, y: y + 5 },
            { x: x + w + 5 + wave, y: y + 9 },
            { x: x + w + 3 + wave, y: y + 12 },
            { x: x + w + 1, y: y + 10 },
            { x: x + w, y: y + 5 }
        ], colors.hair);
        // Curly highlights
        drawer.pixel(x + w + 3, y + 6, colors.hairHighlight);
        drawer.pixel(x + w + 4 + wave, y + 9, colors.hairHighlight);

        // Bald top — skin dome (no hair on top)
        // (The face drawFace with bareHead=false won't draw dome,
        //  but we don't draw hair on top either, creating the bald-on-top look)
    },
    drawAvatarBack(drawer, hx, hy, headW, headH, colors) {
        // Puffs behind head
        drawer.fillPath([
            { x: hx - 6, y: hy + 6 },
            { x: hx - 8, y: hy + 12 },
            { x: hx - 4, y: hy + 18 },
            { x: hx, y: hy + 14 },
            { x: hx - 1, y: hy + 8 }
        ], colors.hair);

        drawer.fillPath([
            { x: hx + headW + 6, y: hy + 6 },
            { x: hx + headW + 8, y: hy + 12 },
            { x: hx + headW + 4, y: hy + 18 },
            { x: hx + headW, y: hy + 14 },
            { x: hx + headW + 1, y: hy + 8 }
        ], colors.hair);
    },
    drawAvatarFront(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;

        // Left puffy curls
        drawer.fillPath([
            { x: hx - 3, y: hy + 4 },
            { x: hx - 6, y: hy + 8 },
            { x: hx - 7, y: hy + 14 },
            { x: hx - 4, y: hy + 18 },
            { x: hx - 1, y: hy + 14 },
            { x: hx, y: hy + 6 }
        ], colors.hair);
        drawer.pixel(hx - 5, hy + 10, colors.hairHighlight);
        drawer.pixel(hx - 4, hy + 14, colors.hairHighlight);

        // Right puffy curls
        drawer.fillPath([
            { x: hx + headW + 3, y: hy + 4 },
            { x: hx + headW + 6, y: hy + 8 },
            { x: hx + headW + 7, y: hy + 14 },
            { x: hx + headW + 4, y: hy + 18 },
            { x: hx + headW + 1, y: hy + 14 },
            { x: hx + headW, y: hy + 6 }
        ], colors.hair);
        drawer.pixel(hx + headW + 5, hy + 10, colors.hairHighlight);
        drawer.pixel(hx + headW + 4, hy + 14, colors.hairHighlight);

        // Bald top — draw skin dome over the top
        drawer.fillQuadCurve(hx - 1, hy + 6, cx, hy - 4, hx + headW + 1, hy + 6, '#f5cba7');
        drawer.rect(hx, hy + 3, headW, 4, '#f5cba7');
    }
};
