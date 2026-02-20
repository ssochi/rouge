/**
 * Short Hair (短发)
 * Style: Neat short cropped hair, no flowing parts
 */
export const SHORT_HAIR = {
    id: 'hair_short',
    name: '短发',
    slot: 'hairstyle',
    colors: {
        hair: '#5d4037',
        hairHighlight: '#795548',
    },
    drawBack(drawer, cx, headY, wavePhase, colors) {
        const w = 20; // Wider for volume
        const h = 16;
        const x = cx - w / 2;
        const y = headY - h + 5; // Shifted up slightly
        
        // Back of head coverage (Fuller)
        drawer.fillPath([
            { x: x + 2, y: y + 4 },
            { x: cx, y: y + 2 },
            { x: x + w - 2, y: y + 4 },
            { x: x + w - 1, y: y + 10 }, // Wider at bottom
            { x: cx, y: y + 12 }, // Nape
            { x: x + 1, y: y + 10 }
        ], colors.hair);
    },
    drawFront(drawer, cx, headY, wavePhase, colors) {
        const w = 20;
        const h = 16;
        const x = cx - w / 2;
        const y = headY - h + 5; // Align with back

        // Main Hair Shape (Textured top)
        drawer.fillPath([
            { x: x + 1, y: y + 6 },       // Side L start
            { x: x + 2, y: y + 2 },       // Top L
            { x: cx - 3, y: y },          // Crown L
            { x: cx + 3, y: y },          // Crown R
            { x: x + w - 2, y: y + 2 },   // Top R
            { x: x + w - 1, y: y + 6 },   // Side R start
            { x: x + w - 2, y: y + 9 },   // Sideburn R bottom
            { x: x + w - 4, y: y + 8 },   // Ear cutout R
            { x: x + w - 4, y: y + 5 },   // Temple R
            { x: cx, y: y + 4 },          // Bangs center
            { x: x + 4, y: y + 5 },       // Temple L
            { x: x + 4, y: y + 8 },       // Ear cutout L
            { x: x + 2, y: y + 9 }        // Sideburn L bottom
        ], colors.hair);

        // Highlights (Texture)
        drawer.pixel(cx - 5, y + 2, colors.hairHighlight);
        drawer.pixel(cx - 2, y + 1, colors.hairHighlight);
        drawer.pixel(cx + 3, y + 2, colors.hairHighlight);
        
        // Loose strand
        const wave = Math.sin(wavePhase * Math.PI * 2) * 1;
        drawer.pixel(cx + wave, y - 1, colors.hairHighlight);
    },
    drawAvatarBack(drawer, hx, hy, headW, headH, colors) {
        // Fuller back
        const cx = hx + headW / 2;
        drawer.fillPath([
            { x: hx, y: hy + 4 },
            { x: cx, y: hy },
            { x: hx + headW, y: hy + 4 },
            { x: hx + headW, y: hy + 12 },
            { x: cx, y: hy + 14 },
            { x: hx, y: hy + 12 }
        ], colors.hair);
    },
    drawAvatarFront(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        
        // Modern messy crop
        drawer.fillPath([
            { x: hx - 1, y: hy + 8 },
            { x: hx + 1, y: hy + 2 },
            { x: cx, y: hy - 2 },
            { x: hx + headW - 1, y: hy + 2 },
            { x: hx + headW + 1, y: hy + 8 },
            { x: hx + headW, y: hy + 11 }, // Sideburn
            { x: hx + headW - 3, y: hy + 8 }, // Ear
            { x: cx, y: hy + 4 }, // Bangs
            { x: hx + 3, y: hy + 8 }, // Ear
            { x: hx, y: hy + 11 } // Sideburn
        ], colors.hair);

        // Highlights
        drawer.hLine(cx - 4, hy + 1, 3, colors.hairHighlight);
        drawer.pixel(cx + 2, hy + 2, colors.hairHighlight);
    }
};
