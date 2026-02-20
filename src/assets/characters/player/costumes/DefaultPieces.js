/**
 * Default Costume Pieces
 * Extracted from original PlayerGenerator drawing logic
 * Style: Cool Guy (Long Hair, Sunglasses, Beard, Trench Coat)
 */

// ============================================================
// Default Hairstyle: Long Hair (长发)
// ============================================================
export const DEFAULT_HAIR = {
    id: 'hair_long',
    name: '长发',
    slot: 'hairstyle',
    colors: {
        hair: '#2c1a0e',
        hairHighlight: '#4e342e',
    },
    drawBack(drawer, cx, headY, wavePhase, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const hairY = y + 4;
        const wave = Math.sin(wavePhase * Math.PI * 2) * 1.5;

        drawer.fillPath([
            { x: x - 2 + wave, y: hairY + 8 },
            { x: x, y: y + 2 },
            { x: x + w, y: y + 2 },
            { x: x + w + 2 + wave, y: hairY + 8 },
            { x: x + w + wave, y: hairY + 12 },
            { x: x + wave, y: hairY + 12 }
        ], colors.hair);
    },
    drawFront(drawer, cx, headY, wavePhase, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;

        // Top Dome
        drawer.fillQuadCurve(
            x - 1, y + 4,
            cx, y - 4,
            x + w + 1, y + 4,
            colors.hair
        );
        // Left strand
        drawer.fillPath([
            { x: x - 1, y: y + 2 },
            { x: x + 2, y: y + 2 },
            { x: x + 1, y: y + 8 },
            { x: x - 2, y: y + 6 }
        ], colors.hair);
        // Right strand
        drawer.fillPath([
            { x: x + w + 1, y: y + 2 },
            { x: x + w - 2, y: y + 2 },
            { x: x + w - 1, y: y + 8 },
            { x: x + w + 2, y: y + 6 }
        ], colors.hair);
        // Highlight
        drawer.hLine(cx - 3, y, 6, colors.hairHighlight);
    },
    drawAvatarBack(drawer, hx, hy, headW, headH, colors) {
        drawer.fillPath([
            { x: hx - 4, y: hy + 8 },
            { x: hx, y: hy },
            { x: hx + headW, y: hy },
            { x: hx + headW + 4, y: hy + 8 },
            { x: hx + headW + 2, y: 30 },
            { x: hx - 2, y: 30 }
        ], colors.hair);
    },
    drawAvatarFront(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        // Top
        drawer.fillQuadCurve(hx - 2, hy + 6, cx, hy - 4, hx + headW + 2, hy + 6, colors.hair);
        // Left bang
        drawer.fillPath([
            { x: hx, y: hy + 2 },
            { x: hx + 4, y: hy + 6 },
            { x: hx + 2, y: hy + 12 },
            { x: hx - 2, y: hy + 8 }
        ], colors.hair);
        // Right bang
        drawer.fillPath([
            { x: hx + headW, y: hy + 2 },
            { x: hx + headW - 4, y: hy + 6 },
            { x: hx + headW - 2, y: hy + 12 },
            { x: hx + headW + 2, y: hy + 8 }
        ], colors.hair);
        // Highlight
        drawer.hLine(cx - 4, hy + 1, 8, colors.hairHighlight);
    }
};

// ============================================================
// Default Glasses: Sunglasses (墨镜)
// ============================================================
export const DEFAULT_GLASSES = {
    id: 'glasses_sun',
    name: '墨镜',
    slot: 'glasses',
    colors: {
        glasses: '#111111',
        glassesRim: '#333333',
    },
    draw(drawer, cx, headY, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const glassesY = y + 5;

        // Lenses
        drawer.rect(x + 2, glassesY, 5, 3, colors.glasses);
        drawer.rect(x + 9, glassesY, 5, 3, colors.glasses);
        // Bridge
        drawer.hLine(x + 7, glassesY + 1, 2, colors.glassesRim);
        // Frame/Arms
        drawer.pixel(x + 1, glassesY + 1, colors.glassesRim);
        drawer.pixel(x + 14, glassesY + 1, colors.glassesRim);
        // Reflection
        drawer.pixel(x + 3, glassesY, '#ffffff');
        drawer.pixel(x + 10, glassesY, '#ffffff');
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const gy = hy + 8;
        // Lenses
        drawer.rect(hx + 2, gy, 7, 5, colors.glasses);
        drawer.rect(hx + 11, gy, 7, 5, colors.glasses);
        // Bridge
        drawer.hLine(hx + 9, gy + 1, 2, colors.glassesRim);
        // Frame
        drawer.rect(hx + 1, gy, 1, 2, colors.glassesRim);
        drawer.rect(hx + 18, gy, 1, 2, colors.glassesRim);
        // Highlights
        drawer.pixel(hx + 3, gy + 1, '#ffffff');
        drawer.pixel(hx + 4, gy + 2, '#ffffff');
        drawer.pixel(hx + 12, gy + 1, '#ffffff');
        drawer.pixel(hx + 13, gy + 2, '#ffffff');
    }
};

// ============================================================
// Default Clothes: Trench Coat (风衣)
// ============================================================
export const DEFAULT_CLOTHES = {
    id: 'clothes_coat',
    name: '风衣',
    slot: 'clothes',
    colors: {
        coat: '#455a64',
        coatDark: '#263238',
        coatLight: '#607d8b',
        shirt: '#95a5a6',
        pants: '#3949ab',
        boots: '#1a1a1a',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const w = 10, h = 7;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        // Left Panel
        drawer.fillPath([
            { x: x, y: y },
            { x: x + 3, y: y },
            { x: x + 3, y: y + h },
            { x: x - 1, y: y + h },
            { x: x - 2, y: y + 2 }
        ], colors.coat);

        // Right Panel
        drawer.fillPath([
            { x: x + w, y: y },
            { x: x + w - 3, y: y },
            { x: x + w - 3, y: y + h },
            { x: x + w + 1, y: y + h },
            { x: x + w + 2, y: y + 2 }
        ], colors.coat);

        // Collar
        drawer.fillPath([
            { x: x - 1, y: y + 2 },
            { x: x + 2, y: y + 4 },
            { x: x, y: y }
        ], colors.coatLight);
        drawer.fillPath([
            { x: x + w + 1, y: y + 2 },
            { x: x + w - 2, y: y + 4 },
            { x: x + w, y: y }
        ], colors.coatLight);

        // Coat Tails
        const swing = Math.sin(coatWave * Math.PI * 2) * 2;
        const flare = Math.abs(swing) * 0.5;
        const tailY = y + h;
        const tailH = 6;

        // Left Tail
        drawer.fillPath([
            { x: x - 1, y: tailY },
            { x: x + 2, y: tailY },
            { x: x + 1 + swing + flare, y: tailY + tailH },
            { x: x - 3 + swing - flare, y: tailY + tailH }
        ], colors.coat);

        // Right Tail
        drawer.fillPath([
            { x: x + w + 1, y: tailY },
            { x: x + w - 2, y: tailY },
            { x: x + w - 1 + swing - flare, y: tailY + tailH },
            { x: x + w + 3 + swing + flare, y: tailY + tailH }
        ], colors.coat);
    },
    drawAvatar(drawer, cx, colors) {
        // Coat Collar (shoulders)
        drawer.fillPath([
            { x: 2, y: 32 },
            { x: 6, y: 24 },
            { x: 12, y: 26 },
            { x: 20, y: 26 },
            { x: 26, y: 24 },
            { x: 30, y: 32 }
        ], colors.coat);
        // Shirt (V-neck)
        drawer.fillPath([
            { x: 12, y: 26 },
            { x: 16, y: 32 },
            { x: 20, y: 26 }
        ], colors.shirt);
    }
};

// ============================================================
// Default Beard (大胡子)
// ============================================================
export const DEFAULT_BEARD = {
    id: 'beard_full',
    name: '大胡子',
    slot: 'beard',
    colors: {
        beard: '#2c1a0e',
    },
    draw(drawer, cx, headY, colors) {
        const w = 16, h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;

        // Beard
        drawer.fillPath([
            { x: x + 1, y: y + h - 5 },
            { x: x + 1, y: y + h - 1 },
            { x: cx, y: y + h + 1 },
            { x: x + w - 1, y: y + h - 1 },
            { x: x + w - 1, y: y + h - 5 },
            { x: x + w - 3, y: y + h - 3 },
            { x: x + 3, y: y + h - 3 }
        ], colors.beard);
        // Mustache
        drawer.rect(cx - 3, y + h - 4, 6, 2, colors.beard);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = hx + headW / 2;
        drawer.fillPath([
            { x: hx + 1, y: hy + headH - 10 },
            { x: hx + 2, y: hy + headH - 2 },
            { x: cx, y: hy + headH + 2 },
            { x: hx + headW - 2, y: hy + headH - 2 },
            { x: hx + headW - 1, y: hy + headH - 10 },
            { x: hx + headW - 4, y: hy + headH - 6 },
            { x: hx + 4, y: hy + headH - 6 }
        ], colors.beard);
        drawer.rect(cx - 5, hy + headH - 8, 10, 3, colors.beard);
    }
};

// ============================================================
// Combined Default Costume
// ============================================================
export const DEFAULT_COSTUME = {
    hairstyle: DEFAULT_HAIR,
    hat: null,
    clothes: DEFAULT_CLOTHES,
    glasses: DEFAULT_GLASSES,
    beard: DEFAULT_BEARD,
};
