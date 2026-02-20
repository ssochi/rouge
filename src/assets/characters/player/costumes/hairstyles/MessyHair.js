/**
 * Messy Hair (蓬松乱发)
 * Style: Wild, unkempt, voluminous hair. "Bed head" look.
 */
export const MESSY_HAIR = {
    id: 'hair_messy',
    name: '蓬松乱发',
    slot: 'hairstyle',
    colors: {
        hair: '#4a3b2a',       // Darker messy brown
        hairHighlight: '#8d6e63', // Lighter messy highlights
    },
    drawBack(drawer, cx, headY, wavePhase, colors) {
        const w = 22;
        const h = 18;
        const x = cx - w / 2;
        const y = headY - h + 6;

        // Wild back hair
        drawer.fillPath([
            { x: x + 2, y: y + 4 },
            { x: cx, y: y + 2 },
            { x: x + w - 2, y: y + 4 },
            { x: x + w, y: y + 8 },
            { x: x + w - 2, y: y + 12 },
            { x: cx, y: y + 14 },
            { x: x + 2, y: y + 12 },
            { x: x, y: y + 8 }
        ], colors.hair);

        // Stray pixels
        const wave = Math.sin(wavePhase * Math.PI * 2) * 1;
        if (Math.abs(wave) > 0.5) {
            drawer.pixel(x + w, y + 6, colors.hair);
            drawer.pixel(x - 1, y + 9, colors.hair);
        }
    },
    drawFront(drawer, cx, headY, wavePhase, colors) {
        const w = 22;
        const h = 18;
        const x = cx - w / 2;
        const y = headY - h + 6;
        const wave = Math.sin(wavePhase * Math.PI * 2) * 1;

        // Messy Top Volume
        drawer.fillPath([
            { x: x + 1, y: y + 6 },
            { x: x + 3, y: y + 2 }, // Spiky top L
            { x: cx - 4, y: y - 1 },
            { x: cx, y: y - 3 + wave * 0.5 }, // Top peak
            { x: cx + 4, y: y - 1 },
            { x: x + w - 3, y: y + 2 }, // Spiky top R
            { x: x + w - 1, y: y + 6 },
            { x: x + w - 2, y: y + 10 },
            { x: x + w - 4, y: y + 8 }, // Ear gap
            { x: x + w - 4, y: y + 5 },
            { x: cx + 2, y: y + 4 },    // Messy bangs R
            { x: cx - 2, y: y + 5 },    // Messy bangs L
            { x: x + 4, y: y + 5 },
            { x: x + 4, y: y + 8 },     // Ear gap
            { x: x + 2, y: y + 10 }
        ], colors.hair);

        // Highlights (Random-ish placement)
        drawer.pixel(cx - 3, y + 2, colors.hairHighlight);
        drawer.pixel(cx + 4, y + 1, colors.hairHighlight);
        drawer.pixel(cx, y, colors.hairHighlight);
        
        // Loose strands (Dynamic)
        drawer.pixel(cx - 5 + wave, y + 3, colors.hairHighlight);
        drawer.pixel(cx + 5 - wave, y + 4, colors.hairHighlight);
    },
    drawAvatarBack(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        // Big messy back
        drawer.fillPath([
            { x: hx - 2, y: hy + 4 },
            { x: cx, y: hy - 2 },
            { x: hx + headW + 2, y: hy + 4 },
            { x: hx + headW + 1, y: hy + 12 },
            { x: cx, y: hy + 15 },
            { x: hx - 1, y: hy + 12 }
        ], colors.hair);
    },
    drawAvatarFront(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        
        // Messy front
        drawer.fillPath([
            { x: hx - 2, y: hy + 8 },
            { x: hx + 2, y: hy },
            { x: cx, y: hy - 4 },
            { x: hx + headW - 2, y: hy },
            { x: hx + headW + 2, y: hy + 8 },
            { x: hx + headW, y: hy + 12 },
            { x: cx + 3, y: hy + 6 }, // Bangs
            { x: cx - 3, y: hy + 5 }, // Bangs
            { x: hx, y: hy + 12 }
        ], colors.hair);

        // Highlights
        drawer.pixel(cx - 4, hy, colors.hairHighlight);
        drawer.pixel(cx + 2, hy - 1, colors.hairHighlight);
    }
};
