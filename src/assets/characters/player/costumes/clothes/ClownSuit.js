/**
 * Clown Suit (小丑服)
 * Style: Colorful baggy outfit with ruffled collar and big buttons
 */
export const CLOWN_SUIT = {
    id: 'clothes_clown',
    name: '小丑服',
    slot: 'clothes',
    colors: {
        coat: '#e74c3c',
        coatDark: '#c0392b',
        coatLight: '#f1948a',
        blue: '#3498db',
        blueDark: '#2980b9',
        blueLight: '#85c1e9',
        ruffle: '#ecf0f1',
        ruffleWhite: '#ffffff',
        ruffleDark: '#bdc3c7',
        ruffleShadow: '#7f8c8d',
        button: '#f1c40f',
        buttonLight: '#fcf3cf',
        buttonDark: '#b7950b',
        shirt: '#e74c3c',
        pants: '#3498db',
        boots: '#f1c40f',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        const coatL = colors.coatLight || '#f1948a';
        const blueL = colors.blueLight || '#85c1e9';
        const ruffW = colors.ruffleWhite || '#ffffff';
        const ruffS = colors.ruffleShadow || '#7f8c8d';
        const btnL  = colors.buttonLight || '#fcf3cf';
        const btnD  = colors.buttonDark || '#b7950b';

        const w = 12;
        const h = 8;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        // Base shading/volume for left coat (Red)
        drawer.fillPath([
            { x: cx, y: y }, { x: cx, y: y + h },
            { x: x - 1, y: y + h }, { x: x - 3, y: y + 4 }, { x: x - 1, y: y }
        ], colors.coat);
        drawer.vLine(cx, y, h, colors.coatDark);
        drawer.hLine(x - 1, y + h - 1, cx - x, colors.coatDark);
        drawer.fillPath([
            { x: x - 1, y: y + 2 }, { x: x - 2, y: y + 4 }, { x: x - 1, y: y + h - 2 }
        ], coatL);

        // Base shading/volume for right coat (Blue)
        drawer.fillPath([
            { x: cx + 1, y: y }, { x: x + w + 1, y: y },
            { x: x + w + 3, y: y + 4 }, { x: x + w + 1, y: y + h }, { x: cx + 1, y: y + h }
        ], colors.blue);
        drawer.vLine(cx + 1, y, h, colors.blueDark);
        drawer.hLine(cx + 2, y + h - 1, w / 2 + 1, colors.blueDark);
        drawer.fillPath([
            { x: x + w + 1, y: y + 2 }, { x: x + w + 2, y: y + 4 }, { x: x + w + 1, y: y + h - 2 }
        ], blueL);

        // Baggy animated ruffled bottom
        const swing = Math.round(Math.sin(coatWave * Math.PI * 2) * 1.5);
        const tailY = y + h;

        // Left Red tail
        drawer.fillPath([
            { x: x - 1, y: tailY }, { x: cx, y: tailY },
            { x: cx - 1 + swing, y: tailY + 3 }, { x: x - 2 + swing, y: tailY + 3 }
        ], colors.coat);
        drawer.line(x - 2 + swing, tailY + 2, cx - 1 + swing, tailY + 2, colors.coatDark);
        drawer.pixel(cx - 1 + swing, tailY + 3, colors.coatDark);

        // Right Blue tail
        drawer.fillPath([
            { x: cx + 1, y: tailY }, { x: x + w + 1, y: tailY },
            { x: x + w + 2 + swing, y: tailY + 3 }, { x: cx + 2 + swing, y: tailY + 3 }
        ], colors.blue);
        drawer.line(cx + 2 + swing, tailY + 2, x + w + 2 + swing, tailY + 2, colors.blueDark);
        drawer.pixel(cx + 2 + swing, tailY + 3, colors.blueDark);

        // Intricate layered ruffle collar
        drawer.fillPath([
            { x: x - 2, y: y - 2 }, { x: x + w + 2, y: y - 2 },
            { x: x + w + 3, y: y + 1 }, { x: x - 3, y: y + 1 }
        ], ruffS);

        drawer.fillPath([
            { x: x - 1, y: y - 3 }, { x: x + w + 1, y: y - 3 },
            { x: x + w + 2, y: y }, { x: x - 2, y: y }
        ], ruffW);

        const pointsUpper = [x - 2, x + 1, cx, cx + 3, x + w + 2];
        pointsUpper.forEach(px => {
            drawer.rect(px - 1, y + 1, 3, 2, ruffW);
            drawer.hLine(px - 1, y + 3, 3, colors.ruffleDark);
            drawer.pixel(px, y + 1, '#ffffff');
            drawer.pixel(px, y + 2, '#ffffff');
        });

        // Vertical collar creases
        drawer.vLine(x, y - 2, 2, colors.ruffleDark);
        drawer.vLine(cx - 2, y - 2, 2, colors.ruffleDark);
        drawer.vLine(cx + 2, y - 2, 2, colors.ruffleDark);
        drawer.vLine(x + w, y - 2, 2, colors.ruffleDark);

        // 3D Metallic Buttons
        [y + 2, y + 4, y + 6].forEach(by => {
            drawer.pixel(cx, by, btnL);
            drawer.pixel(cx + 1, by, colors.button);
            drawer.pixel(cx, by + 1, colors.button);
            drawer.pixel(cx + 1, by + 1, btnD);
        });
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const coatL = colors.coatLight || '#f1948a';
        const blueL = colors.blueLight || '#85c1e9';
        const ruffW = colors.ruffleWhite || '#ffffff';
        const ruffS = colors.ruffleShadow || '#7f8c8d';
        const btnL  = colors.buttonLight || '#fcf3cf';
        const btnD  = colors.buttonDark || '#b7950b';

        const cx = hx + headW / 2;
        const bodyY = hy + headH + 2;

        // Left Shoulder Bubble (Red)
        drawer.fillPath([
            { x: cx, y: bodyY - 2 }, { x: cx - 8, y: bodyY - 2 },
            { x: cx - 14, y: bodyY + 4 }, { x: cx - 15, y: bodyY + 12 }, { x: cx, y: bodyY + 12 }
        ], colors.coat);

        drawer.fillPath([
            { x: cx, y: bodyY + 10 }, { x: cx - 13, y: bodyY + 10 },
            { x: cx - 14, y: bodyY + 12 }, { x: cx, y: bodyY + 12 }
        ], colors.coatDark);
        drawer.vLine(cx - 1, bodyY - 1, 13, colors.coatDark);
        drawer.fillQuadCurve(cx - 12, bodyY + 2, cx - 14, bodyY + 6, cx - 12, bodyY + 10, coatL);

        // Right Shoulder Bubble (Blue)
        drawer.fillPath([
            { x: cx + 1, y: bodyY - 2 }, { x: cx + 9, y: bodyY - 2 },
            { x: cx + 15, y: bodyY + 4 }, { x: cx + 16, y: bodyY + 12 }, { x: cx + 1, y: bodyY + 12 }
        ], colors.blue);

        drawer.fillPath([
            { x: cx + 1, y: bodyY + 10 }, { x: cx + 14, y: bodyY + 10 },
            { x: cx + 15, y: bodyY + 12 }, { x: cx + 1, y: bodyY + 12 }
        ], colors.blueDark);
        drawer.vLine(cx + 1, bodyY - 1, 13, colors.blueDark);
        drawer.fillQuadCurve(cx + 13, bodyY + 2, cx + 15, bodyY + 6, cx + 13, bodyY + 10, blueL);

        // Huge ruffled collar base shadow
        drawer.fillPath([
            { x: cx - 10, y: bodyY - 3 }, { x: cx + 11, y: bodyY - 3 },
            { x: cx + 14, y: bodyY + 4 }, { x: cx - 13, y: bodyY + 4 }
        ], ruffS);

        // Main white layer for ruffle
        drawer.fillPath([
            { x: cx - 9, y: bodyY - 4 }, { x: cx + 10, y: bodyY - 4 },
            { x: cx + 12, y: bodyY + 3 }, { x: cx - 11, y: bodyY + 3 }
        ], ruffW);

        // Detail layered zag-shaped collar edges
        const rufflePoints = [cx - 10, cx - 6, cx - 2, cx + 2, cx + 6, cx + 10];
        rufflePoints.forEach(px => {
            drawer.fillPath([
                { x: px - 1, y: bodyY + 3 }, { x: px + 2, y: bodyY + 3 },
                { x: px + 1, y: bodyY + 6 }, { x: px, y: bodyY + 6 }
            ], ruffW);
            drawer.line(px, bodyY + 6, px + 1, bodyY + 6, colors.ruffleDark);
            drawer.pixel(px + 1, bodyY + 4, '#ffffff');
        });

        // Collar interior fabric creases
        drawer.hLine(cx - 8, bodyY - 3, 17, colors.ruffle);
        [cx - 8, cx - 4, cx, cx + 4, cx + 8].forEach(px => {
            drawer.vLine(px, bodyY - 3, 4, colors.ruffleDark);
        });

        // Large 3D Metallic Cartoon Buttons
        [bodyY + 5, bodyY + 10].forEach(by => {
            drawer.rect(cx - 1, by, 3, 3, btnD);
            drawer.hLine(cx - 1, by - 1, 2, btnL);
            drawer.pixel(cx - 2, by, btnL);
            drawer.rect(cx - 1, by, 2, 2, colors.button);
        });
    }
};
