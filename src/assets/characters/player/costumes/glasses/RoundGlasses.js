/**
 * Round Glasses (圆眼镜)
 * Style: Circular wire-frame glasses, scholarly look
 */
export const ROUND_GLASSES = {
    id: 'glasses_round',
    name: '圆眼镜',
    slot: 'glasses',
    colors: {
        glasses: '#dceefb',    // Light blue lens
        glassesRim: '#8B4513', // Brown frame
    },
    draw(drawer, cx, headY, colors) {
        const w = 16;
        const h = 14;
        const x = cx - w / 2;
        const y = headY - h + 4;
        const glassesY = y + 5;

        // Colors
        const R = colors.glassesRim;
        const G = colors.glasses;

        // 1. Left Lens (Circle)
        drawer.pixel(x + 3, glassesY, R);
        drawer.pixel(x + 2, glassesY + 1, R);
        drawer.pixel(x + 2, glassesY + 2, R);
        drawer.pixel(x + 3, glassesY + 3, R);
        drawer.pixel(x + 5, glassesY + 3, R);
        drawer.pixel(x + 6, glassesY + 2, R);
        drawer.pixel(x + 6, glassesY + 1, R);
        drawer.pixel(x + 5, glassesY, R);
        
        // Fill
        drawer.rect(x + 3, glassesY + 1, 3, 2, G);

        // 2. Right Lens (Circle)
        drawer.pixel(x + 11, glassesY, R);
        drawer.pixel(x + 10, glassesY + 1, R);
        drawer.pixel(x + 10, glassesY + 2, R);
        drawer.pixel(x + 11, glassesY + 3, R);
        drawer.pixel(x + 13, glassesY + 3, R);
        drawer.pixel(x + 14, glassesY + 2, R);
        drawer.pixel(x + 14, glassesY + 1, R);
        drawer.pixel(x + 13, glassesY, R);

        // Fill
        drawer.rect(x + 11, glassesY + 1, 3, 2, G);

        // 3. Bridge
        drawer.hLine(x + 7, glassesY + 1, 2, R);

        // 4. Arms
        drawer.pixel(x + 1, glassesY + 1, R);
        drawer.pixel(x + 15, glassesY + 1, R);

        // 5. Reflections (Diagonal)
        drawer.pixel(x + 4, glassesY + 1, '#ffffff');
        drawer.pixel(x + 12, glassesY + 1, '#ffffff');
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const gy = hy + 8;
        const R = colors.glassesRim;
        const G = colors.glasses;

        // Left Circle
        drawer.fillPath([
            { x: hx + 4, y: gy },
            { x: hx + 2, y: gy + 2 },
            { x: hx + 2, y: gy + 5 },
            { x: hx + 4, y: gy + 7 },
            { x: hx + 8, y: gy + 7 },
            { x: hx + 10, y: gy + 5 },
            { x: hx + 10, y: gy + 2 },
            { x: hx + 8, y: gy }
        ], R);
        drawer.fillPath([
            { x: hx + 5, y: gy + 1 },
            { x: hx + 3, y: gy + 3 },
            { x: hx + 3, y: gy + 4 },
            { x: hx + 5, y: gy + 6 },
            { x: hx + 7, y: gy + 6 },
            { x: hx + 9, y: gy + 4 },
            { x: hx + 9, y: gy + 3 },
            { x: hx + 7, y: gy + 1 }
        ], G);

        // Right Circle
        const rx = hx + 10;
        drawer.fillPath([
            { x: rx + 4, y: gy },
            { x: rx + 2, y: gy + 2 },
            { x: rx + 2, y: gy + 5 },
            { x: rx + 4, y: gy + 7 },
            { x: rx + 8, y: gy + 7 },
            { x: rx + 10, y: gy + 5 },
            { x: rx + 10, y: gy + 2 },
            { x: rx + 8, y: gy }
        ], R);
        drawer.fillPath([
            { x: rx + 5, y: gy + 1 },
            { x: rx + 3, y: gy + 3 },
            { x: rx + 3, y: gy + 4 },
            { x: rx + 5, y: gy + 6 },
            { x: rx + 7, y: gy + 6 },
            { x: rx + 9, y: gy + 4 },
            { x: rx + 9, y: gy + 3 },
            { x: rx + 7, y: gy + 1 }
        ], G);

        // Bridge
        drawer.hLine(hx + 10, gy + 3, 2, R);

        // Arms
        drawer.hLine(hx, gy + 3, 2, R);
        drawer.hLine(hx + headW - 2, gy + 3, 2, R);

        // Highlights
        drawer.rect(hx + 4, gy + 2, 2, 2, '#ffffff');
        drawer.rect(rx + 4, gy + 2, 2, 2, '#ffffff');
    }
};
