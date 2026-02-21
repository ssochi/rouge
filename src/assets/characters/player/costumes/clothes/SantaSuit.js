/**
 * Santa Suit (圣诞服)
 * Style: Classic red Santa coat with white fur trim, black belt
 */
export const SANTA_SUIT = {
    id: 'clothes_santa',
    name: '圣诞服',
    slot: 'clothes',
    colors: {
        coat: '#d32f2f',
        coatDark: '#9b0000',
        coatLight: '#f44336',
        coatHighlight: '#ff8a80',
        fur: '#f5f5f5',
        furDark: '#bdbdbd',
        furLight: '#ffffff',
        belt: '#212121',
        beltLight: '#424242',
        buckle: '#fbc02d',
        buckleLight: '#fff59d',
        buckleDark: '#f57f17',
        shirt: '#d32f2f',
        pants: '#d32f2f',
        boots: '#1a1a1a',
    },
    drawUpper(drawer, cx, bodyY, coatWave, colors) {
        cx = Math.floor(cx);
        bodyY = Math.floor(bodyY);
        const w = 12;
        const h = 8;
        const x = cx - w / 2;
        const y = bodyY - h + 2;

        const C = colors.coat;
        const D = colors.coatDark;
        const L = colors.coatLight;
        const HL = colors.coatHighlight;

        // Main coat body
        drawer.fillPath([
            { x: x + 1, y: y },
            { x: x + w - 1, y: y },
            { x: x + w + 1, y: y + h },
            { x: x - 1, y: y + h }
        ], C);

        // Coat side shadows
        drawer.line(x, y + 1, x - 1, y + h - 1, D);
        drawer.line(x + w, y + 1, x + w + 1, y + h - 1, D);
        drawer.rect(x + 1, y + 1, 2, h - 3, D);
        drawer.rect(x + w - 3, y + 1, 2, h - 3, D);

        // Chest/front volume highlights
        drawer.rect(cx - 3, y, 6, 2, L);
        drawer.rect(cx - 2, y + 2, 4, h - 4, L);
        drawer.vLine(cx - 1, y + 1, h - 4, HL);
        drawer.vLine(cx + 1, y + 1, h - 4, HL);

        // Fluffy fur collar
        const drawFurCollar = (fx, fy, dir) => {
            drawer.rect(fx, fy - 1, 4 * dir, 2, colors.furDark);
            drawer.rect(fx, fy, 5 * dir, 3, colors.fur);
            drawer.line(fx + dir, fy - 1, fx + 3 * dir, fy - 1, colors.furLight);

            // Fluffy loose pixels
            drawer.pixel(fx + 2 * dir, fy + 3, colors.furLight);
            drawer.pixel(fx + 4 * dir, fy + 2, colors.fur);
            drawer.pixel(fx + 5 * dir, fy + 1, colors.furLight);
            drawer.pixel(fx + dir, fy + 1, colors.furLight);
        };
        drawFurCollar(cx - 1, y - 1, -1);
        drawFurCollar(cx + 1, y - 1, 1);

        // Center fur trim
        drawer.vLine(cx, y + 2, h - 3, colors.fur);
        drawer.vLine(cx - 1, y + 2, h - 3, colors.furLight);
        drawer.vLine(cx + 1, y + 2, h - 3, colors.furDark);

        // Half-hidden gold buttons on chest
        drawer.rect(cx - 1, y + 2, 2, 1, colors.buckle);
        drawer.pixel(cx, y + 2, colors.buckleLight);
        drawer.rect(cx - 1, y + 4, 2, 1, colors.buckle);
        drawer.pixel(cx, y + 4, colors.buckleLight);

        // Belt wrapper
        const beltY = y + h - 2;
        const beltW = w + 2;
        const beltX = x - 1;
        drawer.rect(beltX, beltY, beltW, 2, colors.belt);
        drawer.hLine(beltX + 1, beltY, beltW - 2, colors.beltLight);

        // Metallic Buckle
        drawer.rect(cx - 2, beltY - 1, 4, 4, colors.buckleDark);
        drawer.rect(cx - 1, beltY, 2, 2, colors.belt);
        drawer.hLine(cx - 2, beltY - 1, 3, colors.buckleLight);
        drawer.vLine(cx - 2, beltY, 2, colors.buckleLight);
        drawer.pixel(cx + 1, beltY + 2, colors.buckle);

        // Flowing Skirt/Tail
        const swing = Math.round(Math.sin(coatWave * Math.PI * 2) * 1.5);
        const tailY = y + h;
        const tailH = 5;

        const drawTail = (tx, width, swingOffset, isLeft) => {
            const bx = tx + swingOffset;
            drawer.fillPath([
                { x: tx, y: tailY },
                { x: tx + width, y: tailY },
                { x: bx + width, y: tailY + tailH - 1 },
                { x: bx, y: tailY + tailH - 1 }
            ], C);

            // Tail shadow and shading for depth
            const darkSide = isLeft ? tx : tx + width - 1;
            const darkBottomX = isLeft ? bx : bx + width - 1;
            drawer.line(darkSide, tailY, darkBottomX, tailY + tailH - 2, D);

            const lightSide = isLeft ? tx + width - 1 : tx;
            const lightBottomX = isLeft ? bx + width - 1 : bx;
            drawer.line(lightSide, tailY, lightBottomX, tailY + tailH - 2, L);

            // Bottom thick fur trim with organic edges
            const furY = tailY + tailH - 1;
            drawer.hLine(bx - 1, furY, width + 2, colors.furDark);
            drawer.hLine(bx, furY + 1, width, colors.fur);
            drawer.hLine(bx + 1, furY + 2, width - 2, colors.furLight);

            // Bottom fluffy pixels
            drawer.pixel(bx - 1, furY + 1, colors.furLight);
            drawer.pixel(bx + width, furY + 1, colors.furLight);
        };

        // Inner shadow between legs if exposed
        drawer.rect(cx - 1, tailY, 2, 2, D);

        drawTail(x - 1, 4, swing, true);
        drawTail(x + w - 3, 4, swing, false);
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = Math.floor(hx + headW / 2);
        const bodyY = Math.floor(hy + headH + 2);

        const C = colors.coat;
        const D = colors.coatDark;
        const L = colors.coatLight;
        const HL = colors.coatHighlight;

        // Broad avatar shoulders with layered shading
        drawer.fillPath([
            { x: cx - 13, y: bodyY + 6 },
            { x: cx - 8, y: bodyY - 1 },
            { x: cx + 8, y: bodyY - 1 },
            { x: cx + 13, y: bodyY + 6 },
            { x: cx + 14, y: bodyY + 12 },
            { x: cx - 14, y: bodyY + 12 }
        ], C);

        // Shoulder slope highlights
        drawer.line(cx - 7, bodyY, cx - 12, bodyY + 6, L);
        drawer.line(cx - 6, bodyY + 1, cx - 11, bodyY + 7, HL);
        drawer.line(cx + 7, bodyY, cx + 12, bodyY + 6, L);
        drawer.line(cx + 6, bodyY + 1, cx + 11, bodyY + 7, HL);

        // Deep arm/side shadows
        drawer.fillPath([
            { x: cx - 14, y: bodyY + 12 },
            { x: cx - 12, y: bodyY + 6 },
            { x: cx - 9, y: bodyY + 10 },
            { x: cx - 11, y: bodyY + 12 }
        ], D);
        drawer.fillPath([
            { x: cx + 14, y: bodyY + 12 },
            { x: cx + 12, y: bodyY + 6 },
            { x: cx + 9, y: bodyY + 10 },
            { x: cx + 11, y: bodyY + 12 }
        ], D);

        // Center chest bright highlight
        drawer.rect(cx - 4, bodyY, 8, 12, L);
        drawer.vLine(cx - 2, bodyY, 12, HL);
        drawer.vLine(cx + 2, bodyY, 12, HL);

        // Grand fluffy avatar fur collar
        const drawAvatarFur = (fx, fy, dir) => {
            drawer.fillPath([
                { x: fx, y: fy - 2 },
                { x: fx + 10*dir, y: fy + 2 },
                { x: fx + 7*dir, y: fy + 8 },
                { x: fx + 2*dir, y: fy + 7 }
            ], colors.furDark);

            drawer.fillPath([
                { x: fx, y: fy - 1 },
                { x: fx + 8*dir, y: fy + 3 },
                { x: fx + 6*dir, y: fy + 7 },
                { x: fx + 2*dir, y: fy + 5 }
            ], colors.fur);

            drawer.line(fx + dir, fy, fx + 6*dir, fy + 3, colors.furLight);
            drawer.line(fx + 2*dir, fy + 1, fx + 5*dir, fy + 5, colors.furLight);

            // Dispersed fur strands
            drawer.pixel(fx + 9*dir, fy + 2, colors.furLight);
            drawer.pixel(fx + 7*dir, fy + 8, colors.furLight);
            drawer.pixel(fx + 4*dir, fy + 8, colors.fur);
            drawer.pixel(fx + 8*dir, fy + 5, colors.furLight);
            drawer.pixel(fx + 5*dir, fy + 9, colors.furLight);
            drawer.pixel(fx + 3*dir, fy + 1, colors.furLight);
            drawer.pixel(fx + dir, fy + 6, colors.furLight);
        };
        drawAvatarFur(cx - 2, bodyY + 1, -1);
        drawAvatarFur(cx + 2, bodyY + 1, 1);

        // Front central thick fur trim
        drawer.rect(cx - 2, bodyY + 5, 4, 7, colors.fur);
        drawer.vLine(cx - 1, bodyY + 5, 7, colors.furLight);
        drawer.vLine(cx + 1, bodyY + 5, 7, colors.furDark);
        drawer.pixel(cx - 2, bodyY + 7, colors.furLight);
        drawer.pixel(cx + 2, bodyY + 9, colors.furLight);
        drawer.pixel(cx - 2, bodyY + 10, colors.furLight);

        // Imbedded Buttons
        drawer.rect(cx - 1, bodyY + 5, 2, 2, colors.buckle);
        drawer.pixel(cx, bodyY + 5, colors.buckleLight);
        drawer.rect(cx - 1, bodyY + 9, 2, 2, colors.buckle);
        drawer.pixel(cx, bodyY + 9, colors.buckleLight);

        // Wide Avatar Belt
        const beltY = bodyY + 11;
        drawer.rect(cx - 12, beltY, 24, 3, colors.belt);
        drawer.hLine(cx - 11, beltY, 10, colors.beltLight);
        drawer.hLine(cx + 3, beltY, 8, colors.beltLight);
        drawer.pixel(cx - 12, beltY + 1, colors.beltLight);
        drawer.pixel(cx + 11, beltY + 1, colors.beltLight);

        // Large detailed buckle
        const bx = cx - 3;
        const by = beltY - 1;

        drawer.rect(bx, by, 6, 5, colors.buckleDark);
        drawer.rect(bx + 1, by + 1, 4, 3, colors.belt);

        drawer.hLine(bx, by, 5, colors.buckleLight);
        drawer.vLine(bx, by + 1, 3, colors.buckleLight);
        drawer.hLine(bx + 1, by + 4, 5, colors.buckle);
        drawer.vLine(bx + 5, by + 1, 3, colors.buckle);

        // Buckle prong
        drawer.rect(bx + 2, by + 1, 2, 3, colors.buckleLight);
        drawer.pixel(bx + 3, by + 2, colors.buckleDark);
    }
};
