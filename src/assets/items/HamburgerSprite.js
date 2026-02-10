export function createHamburgerSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const p = (x, y, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
    };

    // === Palette ===
    const cBunTop = '#d4882e';       // Top bun main
    const cBunTopLight = '#e8a84c';  // Top bun highlight
    const cBunTopDark = '#b5711e';   // Top bun shadow
    const cBunBottom = '#c47a28';    // Bottom bun
    const cBunBottomDark = '#a06420';
    const cSesame = '#f5e6c8';       // Sesame seeds
    const cLettuce = '#27ae60';      // Lettuce
    const cLettuceLight = '#2ecc71';
    const cMeat = '#8b4513';         // Meat patty
    const cMeatDark = '#6b3410';
    const cCheese = '#f1c40f';       // Cheese
    const cCheeseDark = '#d4ac0d';
    const cTomato = '#e74c3c';       // Tomato

    // 1. Top bun (rounded dome shape, rows 3-7)
    // Row 3: top of dome
    p(6, 3, cBunTop); p(7, 3, cBunTop); p(8, 3, cBunTop); p(9, 3, cBunTop);
    // Row 4
    p(4, 4, cBunTop); p(5, 4, cBunTopLight); p(6, 4, cBunTopLight); p(7, 4, cBunTopLight);
    p(8, 4, cBunTop); p(9, 4, cBunTop); p(10, 4, cBunTop); p(11, 4, cBunTop);
    // Row 5
    p(3, 5, cBunTop); p(4, 5, cBunTopLight); p(5, 5, cBunTop); p(6, 5, cBunTop);
    p(7, 5, cBunTop); p(8, 5, cBunTop); p(9, 5, cBunTop); p(10, 5, cBunTop);
    p(11, 5, cBunTop); p(12, 5, cBunTopDark);
    // Row 6
    p(3, 6, cBunTopDark); p(4, 6, cBunTop); p(5, 6, cBunTop); p(6, 6, cBunTop);
    p(7, 6, cBunTop); p(8, 6, cBunTop); p(9, 6, cBunTop); p(10, 6, cBunTop);
    p(11, 6, cBunTop); p(12, 6, cBunTopDark);
    // Row 7: bottom of top bun
    p(3, 7, cBunTopDark); p(4, 7, cBunTopDark); p(5, 7, cBunTopDark); p(6, 7, cBunTopDark);
    p(7, 7, cBunTopDark); p(8, 7, cBunTopDark); p(9, 7, cBunTopDark); p(10, 7, cBunTopDark);
    p(11, 7, cBunTopDark); p(12, 7, cBunTopDark);

    // Sesame seeds on top bun
    p(6, 4, cSesame); p(9, 5, cSesame); p(7, 5, cSesame);

    // 2. Lettuce (row 8, slightly wavy/wider)
    p(2, 8, cLettuce); p(3, 8, cLettuceLight); p(4, 8, cLettuce); p(5, 8, cLettuceLight);
    p(6, 8, cLettuce); p(7, 8, cLettuceLight); p(8, 8, cLettuce); p(9, 8, cLettuceLight);
    p(10, 8, cLettuce); p(11, 8, cLettuceLight); p(12, 8, cLettuce); p(13, 8, cLettuceLight);

    // 3. Cheese (row 9, slight drip)
    p(3, 9, cCheese); p(4, 9, cCheese); p(5, 9, cCheese); p(6, 9, cCheese);
    p(7, 9, cCheese); p(8, 9, cCheese); p(9, 9, cCheese); p(10, 9, cCheese);
    p(11, 9, cCheese); p(12, 9, cCheese);
    // Cheese drip on left
    p(2, 9, cCheeseDark); p(13, 9, cCheeseDark);

    // 4. Tomato slice (row 10)
    p(3, 10, cTomato); p(4, 10, cTomato); p(5, 10, cTomato); p(6, 10, cTomato);
    p(7, 10, cTomato); p(8, 10, cTomato); p(9, 10, cTomato); p(10, 10, cTomato);
    p(11, 10, cTomato); p(12, 10, cTomato);

    // 5. Meat patty (rows 11-12)
    p(3, 11, cMeat); p(4, 11, cMeat); p(5, 11, cMeat); p(6, 11, cMeat);
    p(7, 11, cMeat); p(8, 11, cMeat); p(9, 11, cMeat); p(10, 11, cMeat);
    p(11, 11, cMeat); p(12, 11, cMeat);
    p(3, 12, cMeatDark); p(4, 12, cMeatDark); p(5, 12, cMeatDark); p(6, 12, cMeatDark);
    p(7, 12, cMeatDark); p(8, 12, cMeatDark); p(9, 12, cMeatDark); p(10, 12, cMeatDark);
    p(11, 12, cMeatDark); p(12, 12, cMeatDark);

    // 6. Bottom bun (row 13)
    p(3, 13, cBunBottom); p(4, 13, cBunBottom); p(5, 13, cBunBottom); p(6, 13, cBunBottom);
    p(7, 13, cBunBottom); p(8, 13, cBunBottom); p(9, 13, cBunBottom); p(10, 13, cBunBottom);
    p(11, 13, cBunBottom); p(12, 13, cBunBottom);
    // Bottom edge shadow
    p(4, 14, cBunBottomDark); p(5, 14, cBunBottomDark); p(6, 14, cBunBottomDark);
    p(7, 14, cBunBottomDark); p(8, 14, cBunBottomDark); p(9, 14, cBunBottomDark);
    p(10, 14, cBunBottomDark); p(11, 14, cBunBottomDark);

    return canvas;
}
