/**
 * Cyber Visor (全息护目镜)
 * Style: Single-lens holographic HUD visor with neon glow
 */
export const CYBER_VISOR = {
    id: 'glasses_cyber',
    name: '全息护目镜',
    slot: 'glasses',
    colors: {
        glasses: '#00ffff',
        glassesRim: '#1a1a2e',
    },
    draw(drawer, cx, headY, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const glassesY = y + 4;

        // Dark frame band (full width visor)
        drawer.rect(x + 1, glassesY, w - 2, 4, colors.glassesRim);

        // Cyan holographic lens (single continuous band)
        drawer.rect(x + 2, glassesY + 1, w - 4, 2, colors.glasses);

        // White reflection highlights
        drawer.pixel(x + 3, glassesY + 1, '#ffffff');
        drawer.pixel(x + 4, glassesY + 1, '#ffffff');

        // Magenta glow line at bottom edge
        drawer.hLine(x + 2, glassesY + 3, w - 4, '#ff00ff');

        // Side frame arms
        drawer.pixel(x, glassesY + 1, colors.glassesRim);
        drawer.pixel(x + w - 1, glassesY + 1, colors.glassesRim);

        // HUD dot accents
        drawer.pixel(x + w - 4, glassesY + 1, '#ffffff');
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const gy = hy + 7;

        // Dark frame band
        drawer.rect(hx - 1, gy, headW + 2, 6, colors.glassesRim);

        // Cyan holographic lens
        drawer.rect(hx + 1, gy + 1, headW - 2, 4, colors.glasses);

        // White reflection highlights
        drawer.rect(hx + 2, gy + 1, 3, 2, '#ffffff');
        drawer.pixel(hx + 14, gy + 2, '#ffffff');

        // Magenta glow line at bottom
        drawer.hLine(hx + 1, gy + 5, headW - 2, '#ff00ff');

        // Side frame
        drawer.rect(hx - 2, gy + 1, 1, 4, colors.glassesRim);
        drawer.rect(hx + headW + 1, gy + 1, 1, 4, colors.glassesRim);
    }
};
