/**
 * Goggles (护目镜)
 * Style: Industrial/steampunk goggles with strap
 */
export const GOGGLES = {
    id: 'glasses_goggles',
    name: '护目镜',
    slot: 'glasses',
    colors: {
        glasses: '#f39c12',    // Amber lens
        glassesRim: '#2c3e50', // Dark frame/strap
    },
    draw(drawer, cx, headY, colors) {
        const w = 16;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const glassesY = y + 4;

        // Colors
        const R = colors.glassesRim;
        const G = colors.glasses;

        // Strap (behind everything, wide)
        drawer.rect(x, glassesY, w, 4, R);

        // Lens Frames (Hexagonal/Industrial)
        // Left Frame
        drawer.fillPath([
            { x: x + 1, y: glassesY + 1 },
            { x: x + 2, y: glassesY },
            { x: x + 6, y: glassesY },
            { x: x + 7, y: glassesY + 1 },
            { x: x + 7, y: glassesY + 3 },
            { x: x + 6, y: glassesY + 4 },
            { x: x + 2, y: glassesY + 4 },
            { x: x + 1, y: glassesY + 3 }
        ], R);

        // Right Frame
        drawer.fillPath([
            { x: x + 9, y: glassesY + 1 },
            { x: x + 10, y: glassesY },
            { x: x + 14, y: glassesY },
            { x: x + 15, y: glassesY + 1 },
            { x: x + 15, y: glassesY + 3 },
            { x: x + 14, y: glassesY + 4 },
            { x: x + 10, y: glassesY + 4 },
            { x: x + 9, y: glassesY + 3 }
        ], R);

        // Lenses (Inner)
        drawer.rect(x + 2, glassesY + 1, 4, 3, G);
        drawer.rect(x + 10, glassesY + 1, 4, 3, G);

        // Center bridge
        drawer.rect(x + 7, glassesY + 1, 2, 2, '#333333');

        // Lens border highlight (Glow)
        drawer.pixel(x + 3, glassesY + 1, '#ffffff');
        drawer.pixel(x + 11, glassesY + 1, '#ffffff');
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const gy = hy + 7;
        const R = colors.glassesRim;
        const G = colors.glasses;

        // Strap
        drawer.rect(hx - 1, gy + 1, headW + 2, 6, R);

        // Left Frame
        drawer.fillPath([
            { x: hx + 1, y: gy + 1 },
            { x: hx + 3, y: gy - 1 },
            { x: hx + 7, y: gy - 1 },
            { x: hx + 9, y: gy + 1 },
            { x: hx + 9, y: gy + 7 },
            { x: hx + 7, y: gy + 9 },
            { x: hx + 3, y: gy + 9 },
            { x: hx + 1, y: gy + 7 }
        ], R);

        // Right Frame
        const rx = hx + 10;
        drawer.fillPath([
            { x: rx + 1, y: gy + 1 },
            { x: rx + 3, y: gy - 1 },
            { x: rx + 7, y: gy - 1 },
            { x: rx + 9, y: gy + 1 },
            { x: rx + 9, y: gy + 7 },
            { x: rx + 7, y: gy + 9 },
            { x: rx + 3, y: gy + 9 },
            { x: rx + 1, y: gy + 7 }
        ], R);

        // Lenses
        drawer.rect(hx + 3, gy + 1, 4, 6, G);
        drawer.rect(rx + 3, gy + 1, 4, 6, G);

        // Highlights
        drawer.rect(hx + 4, gy + 2, 2, 2, '#ffffff');
        drawer.rect(rx + 4, gy + 2, 2, 2, '#ffffff');

        // Center bridge
        drawer.rect(hx + 9, gy + 2, 2, 4, '#555555');
    }
};
