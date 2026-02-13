export function createPetDogItemSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const p = (x, y, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
    };

    // Palette (matches DogGenerator)
    const cFur = '#d4a04a';
    const cFurDark = '#b8862e';
    const cFurLight = '#e8c06a';
    const cCream = '#f0d8a8';
    const cNose = '#3a2a1a';
    const cEye = '#1a1a2e';
    const cHighlight = '#ffffff';
    const cEarInner = '#c97a4a';
    const cCollar = '#e04040';
    const cBell = '#ffd700';

    // Ears (pointed, behind head)
    p(3, 2, cFurDark); p(4, 1, cFurDark); p(5, 2, cFurDark);
    p(4, 2, cEarInner);
    p(10, 2, cFurDark); p(11, 1, cFurDark); p(12, 2, cFurDark);
    p(11, 2, cEarInner);

    // Head shape (round)
    ctx.fillStyle = cFur;
    ctx.fillRect(4, 3, 8, 7);
    // Round top
    p(5, 2, cFur); p(6, 2, cFur); p(9, 2, cFur); p(10, 2, cFur);
    // Round sides
    p(3, 4, cFur); p(3, 5, cFur); p(3, 6, cFur); p(3, 7, cFur);
    p(12, 4, cFur); p(12, 5, cFur); p(12, 6, cFur); p(12, 7, cFur);

    // Highlight
    p(6, 3, cFurLight); p(7, 3, cFurLight); p(8, 3, cFurLight);

    // Cream muzzle
    ctx.fillStyle = cCream;
    ctx.fillRect(5, 7, 6, 3);

    // Eyes
    p(5, 5, cEye); p(6, 5, cEye);
    p(5, 4, cHighlight);
    p(9, 5, cEye); p(10, 5, cEye);
    p(9, 4, cHighlight);

    // Nose
    p(7, 7, cNose); p(8, 7, cNose);

    // Mouth
    p(7, 8, cFurDark); p(6, 9, cFurDark); p(8, 9, cFurDark);

    // Cheek blush
    p(4, 6, '#e8a090');
    p(11, 6, '#e8a090');

    // Collar
    ctx.fillStyle = cCollar;
    ctx.fillRect(4, 10, 8, 1);
    p(7, 11, cBell);

    // Body hint
    ctx.fillStyle = cFur;
    ctx.fillRect(5, 11, 6, 3);
    ctx.fillStyle = cCream;
    ctx.fillRect(6, 12, 4, 2);

    // Paws
    p(5, 14, cFurDark); p(6, 14, cFurDark);
    p(9, 14, cFurDark); p(10, 14, cFurDark);

    return canvas;
}
