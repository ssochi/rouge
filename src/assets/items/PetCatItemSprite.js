export function createPetCatItemSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const p = (x, y, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
    };

    // Palette (matches CatGenerator)
    const cFur = '#8a8a8a';
    const cFurDark = '#5c5c5c';
    const cFurLight = '#a8a8a8';
    const cChest = '#e0e0e0';
    const cStripe = '#4a4a4a';
    const cNose = '#e8a0a0';
    const cEye = '#7dcea0';
    const cPupil = '#1a1a2e';
    const cHighlight = '#ffffff';
    const cEarInner = '#d4a0a0';
    const cWhisker = '#c0c0c0';
    const cCollar = '#4a90d9';
    const cBell = '#ffd700';

    // Ears (pointed triangles - cat style)
    p(3, 1, cFur); p(4, 0, cFur); p(5, 1, cFur);
    p(4, 1, cEarInner);
    p(10, 1, cFur); p(11, 0, cFur); p(12, 1, cFur);
    p(11, 1, cEarInner);

    // Head shape
    ctx.fillStyle = cFur;
    ctx.fillRect(4, 2, 8, 7);
    // Round top
    p(5, 1, cFur); p(6, 1, cFur); p(9, 1, cFur); p(10, 1, cFur);
    // Round sides
    p(3, 3, cFur); p(3, 4, cFur); p(3, 5, cFur); p(3, 6, cFur);
    p(12, 3, cFur); p(12, 4, cFur); p(12, 5, cFur); p(12, 6, cFur);

    // Highlight
    p(6, 2, cFurLight); p(7, 2, cFurLight); p(8, 2, cFurLight);

    // Tabby M forehead
    p(6, 3, cStripe); p(7, 2, cStripe); p(8, 3, cStripe);
    p(9, 2, cStripe);

    // White muzzle
    ctx.fillStyle = cChest;
    ctx.fillRect(6, 7, 4, 2);

    // Eyes (green, almond)
    p(5, 5, cEye); p(6, 5, cEye);
    p(5, 5, cPupil);
    p(5, 4, cHighlight);
    p(9, 5, cEye); p(10, 5, cEye);
    p(10, 5, cPupil);
    p(10, 4, cHighlight);

    // Nose (pink)
    p(7, 7, cNose); p(8, 7, cNose);

    // Mouth
    p(7, 8, cFurDark); p(6, 8, cFurDark); p(8, 8, cFurDark);

    // Whiskers
    p(2, 5, cWhisker); p(1, 4, cWhisker);
    p(2, 6, cWhisker); p(1, 7, cWhisker);
    p(13, 5, cWhisker); p(14, 4, cWhisker);
    p(13, 6, cWhisker); p(14, 7, cWhisker);

    // Collar
    ctx.fillStyle = cCollar;
    ctx.fillRect(5, 9, 6, 1);
    p(7, 10, cBell);

    // Body hint
    ctx.fillStyle = cFur;
    ctx.fillRect(5, 10, 6, 3);
    ctx.fillStyle = cChest;
    ctx.fillRect(6, 11, 4, 2);

    // Stripes on body
    p(5, 11, cStripe); p(7, 10, cStripe); p(10, 11, cStripe);

    // Paws
    p(5, 13, cFurDark); p(6, 13, cFurDark);
    p(9, 13, cFurDark); p(10, 13, cFurDark);

    return canvas;
}
