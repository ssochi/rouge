export function createPet2BItemSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const p = (x, y, c) => {
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
    };

    // Palette (matches Nier2bGenerator)
    const cHair = '#e0d8d0';
    const cHairDark = '#c8c0b8';
    const cHairLight = '#f0ece8';
    const cSkin = '#f0ddd0';
    const cSkinDark = '#e0ccbe';
    const cBlindfold = '#1a1a20';
    const cBlindfoldEdge = '#2a2a30';
    const cDress = '#2a2a30';
    const cDressLight = '#3a3a42';
    const cLips = '#d4a898';
    const cMole = '#3a2a20';

    // --- Hair back (bob cut frame) ---
    p(3, 2, cHairDark); p(4, 1, cHairDark); p(5, 1, cHairDark);
    p(6, 1, cHairDark); p(7, 1, cHairDark); p(8, 1, cHairDark);
    p(9, 1, cHairDark); p(10, 1, cHairDark); p(11, 1, cHairDark);
    p(12, 2, cHairDark);

    // --- Hair top / bangs ---
    // Top of head
    ctx.fillStyle = cHair;
    ctx.fillRect(4, 2, 8, 2);
    // Highlights
    p(6, 2, cHairLight); p(7, 2, cHairLight); p(8, 2, cHairLight);

    // Bangs (asymmetric - left side longer)
    p(4, 4, cHair); p(5, 4, cHair); p(6, 4, cHair); // left bangs
    p(9, 4, cHair); p(10, 4, cHair); // right bangs shorter
    p(3, 4, cHairDark); // left bang edge

    // --- Face ---
    ctx.fillStyle = cSkin;
    ctx.fillRect(4, 5, 8, 5);
    // Round out face
    p(3, 6, cSkin); p(3, 7, cSkin); p(3, 8, cSkin);
    p(12, 6, cSkin); p(12, 7, cSkin); p(12, 8, cSkin);
    // Face shading
    p(3, 7, cSkinDark); p(12, 7, cSkinDark);

    // --- Blindfold (signature feature) ---
    ctx.fillStyle = cBlindfold;
    ctx.fillRect(3, 5, 10, 2);
    // Blindfold edges
    p(3, 5, cBlindfoldEdge); p(12, 5, cBlindfoldEdge);
    // Blindfold knot/tie trailing right
    p(13, 5, cBlindfold); p(13, 6, cBlindfoldEdge);

    // --- Side hair (over blindfold) ---
    p(3, 5, cHair); p(3, 6, cHair); p(3, 7, cHair); p(3, 8, cHair);
    p(2, 8, cHairDark); p(2, 9, cHairDark);
    p(12, 5, cHair); p(12, 6, cHair); p(12, 7, cHair);
    p(13, 7, cHairDark); p(13, 8, cHairDark);

    // --- Lips ---
    p(7, 9, cLips); p(8, 9, cLips);

    // --- Mole (left of mouth) ---
    p(6, 9, cMole);

    // --- Neck ---
    p(7, 10, cSkin); p(8, 10, cSkin);

    // --- High collar / dress top ---
    ctx.fillStyle = cDress;
    ctx.fillRect(5, 11, 6, 2);
    // Collar highlight
    p(6, 11, cDressLight); p(7, 11, cDressLight); p(8, 11, cDressLight);

    // --- Body / dress ---
    ctx.fillStyle = cDress;
    ctx.fillRect(5, 13, 6, 2);
    // Center seam
    p(7, 13, cDressLight);

    return canvas;
}
