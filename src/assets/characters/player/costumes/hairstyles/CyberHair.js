/**
 * Cyber Mohawk (赛博莫霍克)
 * Style: Shaved sides with tall neon-highlighted central spikes
 */
export const CYBER_HAIR = {
    id: 'hair_cyber',
    name: '赛博莫霍克',
    slot: 'hairstyle',
    colors: {
        hair: '#1a1a2e',
        hairHighlight: '#00ffff',
        hairAccent: '#ff00ff',
    },
    drawBack(drawer, cx, headY, wavePhase, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;

        // Thin central strip at back
        drawer.rect(cx - 2, y + 2, 4, 6, colors.hair);
        // Neon glow at tips
        drawer.pixel(cx - 1, y + 2, colors.hairHighlight);
        drawer.pixel(cx + 1, y + 3, colors.hairAccent);
    },
    drawFront(drawer, cx, headY, wavePhase, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const wave = Math.sin(wavePhase * Math.PI * 2) * 0.8;

        // Central mohawk base
        drawer.rect(cx - 2, y + 1, 4, 5, colors.hair);

        // Spike 1 (center, tallest)
        drawer.fillPath([
            { x: cx - 1, y: y + 2 },
            { x: cx, y: y - 3 + wave },
            { x: cx + 1, y: y + 2 }
        ], colors.hair);
        drawer.pixel(cx, y - 3 + wave, colors.hairHighlight);

        // Spike 2 (left)
        drawer.fillPath([
            { x: cx - 2, y: y + 3 },
            { x: cx - 2, y: y - 1 + wave * 0.6 },
            { x: cx - 1, y: y + 2 }
        ], colors.hair);
        drawer.pixel(cx - 2, y - 1 + wave * 0.6, colors.hairAccent);

        // Spike 3 (right)
        drawer.fillPath([
            { x: cx + 1, y: y + 2 },
            { x: cx + 2, y: y - 1 - wave * 0.6 },
            { x: cx + 2, y: y + 3 }
        ], colors.hair);
        drawer.pixel(cx + 2, y - 1 - wave * 0.6, colors.hairHighlight);

        // Shaved sides — subtle stubble dots with neon tint
        drawer.pixel(x + 2, y + 4, '#2a2a3e');
        drawer.pixel(x + 3, y + 5, '#2a2a3e');
        drawer.pixel(x + w - 3, y + 4, '#2a2a3e');
        drawer.pixel(x + w - 4, y + 5, '#2a2a3e');

        // Neon glow on base
        drawer.pixel(cx - 1, y + 1, colors.hairHighlight);
        drawer.pixel(cx + 1, y + 1, colors.hairAccent);
    },
    drawAvatarBack(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        // Thin central strip
        drawer.rect(cx - 3, hy + 2, 6, 8, colors.hair);
        drawer.pixel(cx - 2, hy + 2, colors.hairHighlight);
        drawer.pixel(cx + 2, hy + 3, colors.hairAccent);
    },
    drawAvatarFront(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;

        // Central mohawk spikes
        drawer.rect(cx - 3, hy + 2, 6, 6, colors.hair);

        // Tall center spike
        drawer.fillPath([
            { x: cx - 2, y: hy + 3 },
            { x: cx, y: hy - 5 },
            { x: cx + 2, y: hy + 3 }
        ], colors.hair);
        drawer.pixel(cx, hy - 5, colors.hairHighlight);
        drawer.pixel(cx, hy - 4, colors.hairHighlight);

        // Left spike
        drawer.fillPath([
            { x: cx - 3, y: hy + 4 },
            { x: cx - 3, y: hy - 2 },
            { x: cx - 1, y: hy + 3 }
        ], colors.hair);
        drawer.pixel(cx - 3, hy - 2, colors.hairAccent);

        // Right spike
        drawer.fillPath([
            { x: cx + 1, y: hy + 3 },
            { x: cx + 3, y: hy - 2 },
            { x: cx + 3, y: hy + 4 }
        ], colors.hair);
        drawer.pixel(cx + 3, hy - 2, colors.hairHighlight);

        // Neon base highlights
        drawer.hLine(cx - 2, hy + 2, 4, colors.hairHighlight);
    }
};
