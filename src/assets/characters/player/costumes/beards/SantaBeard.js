/**
 * Santa Beard (圣诞白胡子)
 * Style: Big fluffy white beard like Santa Claus
 */
export const SANTA_BEARD = {
    id: 'beard_santa',
    name: '圣诞白胡子',
    slot: 'beard',
    colors: {
        beardHighlight: '#ffffff',
        beard: '#ecf0f1',
        beardDark: '#bdc3c7',
        beardDeep: '#95a5a6',
    },
    draw(drawer, cx, headY, colors) {
        const cHigh = colors.beardHighlight || '#ffffff';
        const cBase = colors.beard || '#ecf0f1';
        const cDark = colors.beardDark || '#bdc3c7';
        const cDeep = colors.beardDeep || '#95a5a6';

        const palette = {
            '1': cDeep,
            '2': cDark,
            '3': cBase,
            '4': cHigh
        };

        // Procedural pixel-perfect mapped string pattern for fluffy details
        const beardPattern = [
            "   23       32   ",
            "  1442     2441  ",
            " 144442   244441 ",
            " 134442   244431 ",
            "  12231   13221  ",
            " 1344333 3334431 ",
            "13444444444444431",
            "14442444344424441",
            "13444434443444431",
            " 144344424443441 ",
            " 134444444444431 ",
            "  1442443442441  ",
            "  1344444444431  ",
            "   14443434441   ",
            "    134444431    ",
            "     1243421     ",
            "      12221      ",
            "       111       "
        ];

        const startX = Math.floor(cx - 8);
        const startY = Math.floor(headY - 4);

        for (let r = 0; r < beardPattern.length; r++) {
            const row = beardPattern[r];
            for (let c = 0; c < row.length; c++) {
                const char = row[c];
                if (palette[char]) {
                    drawer.pixel(startX + c, startY + r, palette[char]);
                }
            }
        }
    },
    drawAvatar(drawer, hx, hy, headW, headH, colors) {
        const cx = Math.floor(hx + headW / 2);
        const bY = Math.floor(hy + headH - 2);

        const cHigh = colors.beardHighlight || '#ffffff';
        const cBase = colors.beard || '#ecf0f1';
        const cDark = colors.beardDark || '#bdc3c7';
        const cDeep = colors.beardDeep || '#95a5a6';

        // Base structural puffs for the beard body
        const puffs = [
            {x: 0, y: 7, r: 8},
            {x: -6, y: 5, r: 6},
            {x: 6, y: 5, r: 6},
            {x: -10, y: 1, r: 5},
            {x: 10, y: 1, r: 5},
            {x: -12, y: -4, r: 4},
            {x: 12, y: -4, r: 4}
        ];

        // 3D layering from deep shadow to top bright highlight
        puffs.forEach(p => drawer.circle(cx + p.x, bY + p.y, p.r + 1, cDeep));
        puffs.forEach(p => drawer.circle(cx + p.x, bY + p.y, p.r, cDark));
        puffs.forEach(p => drawer.circle(cx + p.x, bY + p.y - 1, p.r - 1, cBase));
        puffs.forEach(p => drawer.circle(cx + p.x, bY + p.y - 2, p.r - 2, cHigh));

        // Unify the center mass
        drawer.ellipse(cx, bY + 1, 10, 6, cDark);
        drawer.ellipse(cx, bY, 10, 6, cBase);
        drawer.ellipse(cx, bY - 1, 9, 5, cHigh);

        // Handlebar Mustache with layered curves
        const mY = bY - 5;
        const drawMustacheSide = (dir) => {
            drawer.fillPath([
                {x: cx, y: mY},
                {x: cx + dir * 8, y: mY + 2},
                {x: cx + dir * 12, y: mY + 5},
                {x: cx + dir * 6, y: mY + 4},
                {x: cx, y: mY + 2}
            ], cDeep);
            drawer.fillPath([
                {x: cx, y: mY - 1},
                {x: cx + dir * 8, y: mY + 1},
                {x: cx + dir * 11, y: mY + 4},
                {x: cx + dir * 5, y: mY + 3},
                {x: cx, y: mY + 1}
            ], cDark);
            drawer.fillPath([
                {x: cx, y: mY - 2},
                {x: cx + dir * 8, y: mY},
                {x: cx + dir * 11, y: mY + 3},
                {x: cx + dir * 5, y: mY + 2},
                {x: cx, y: mY}
            ], cBase);
            drawer.fillPath([
                {x: cx, y: mY - 3},
                {x: cx + dir * 7, y: mY - 1},
                {x: cx + dir * 10, y: mY + 2},
                {x: cx + dir * 4, y: mY + 1},
                {x: cx, y: mY - 1}
            ], cHigh);

            // Round off tips
            drawer.circle(cx + dir * 12, mY + 5, 2, cDeep);
            drawer.circle(cx + dir * 11, mY + 4, 1, cDark);
            drawer.pixel(cx + dir * 11, mY + 3, cBase);
        };

        drawMustacheSide(-1);
        drawMustacheSide(1);
    }
};
