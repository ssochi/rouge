export function createMedkitSprite() {
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
    const cBody = '#ecf0f1';        // White body
    const cBodyDark = '#bdc3c7';    // Shadow
    const cBodyLight = '#ffffff';   // Highlight
    const cCross = '#e74c3c';       // Red cross
    const cCrossDark = '#c0392b';   // Cross shadow
    const cEdge = '#95a5a6';        // Edge outline
    const cClasp = '#f1c40f';       // Golden clasp

    // 1. Body outline (rounded box, rows 4-13, cols 2-13)
    // Top edge
    ctx.fillStyle = cEdge;
    ctx.fillRect(4, 3, 8, 1);
    // Bottom edge
    ctx.fillRect(4, 14, 8, 1);
    // Left edge
    ctx.fillRect(2, 5, 1, 8);
    // Right edge
    ctx.fillRect(13, 5, 1, 8);
    // Corners
    p(3, 4, cEdge); p(3, 13, cEdge);
    p(12, 4, cEdge); p(12, 13, cEdge);

    // 2. Body fill (white)
    ctx.fillStyle = cBody;
    ctx.fillRect(4, 4, 8, 10);
    ctx.fillRect(3, 5, 1, 8);
    ctx.fillRect(12, 5, 1, 8);

    // Highlight on top-left
    p(4, 4, cBodyLight); p(5, 4, cBodyLight); p(6, 4, cBodyLight);
    p(4, 5, cBodyLight); p(5, 5, cBodyLight);

    // Shadow on bottom-right
    ctx.fillStyle = cBodyDark;
    ctx.fillRect(9, 12, 3, 1);
    ctx.fillRect(10, 11, 2, 1);
    ctx.fillRect(11, 13, 1, 1);

    // 3. Red cross (center)
    // Horizontal bar
    ctx.fillStyle = cCross;
    ctx.fillRect(5, 8, 6, 2);
    // Vertical bar
    ctx.fillRect(7, 6, 2, 6);
    // Cross shadow
    p(5, 9, cCrossDark); p(6, 9, cCrossDark);
    p(9, 9, cCrossDark); p(10, 9, cCrossDark);
    p(7, 10, cCrossDark); p(8, 10, cCrossDark);
    p(7, 11, cCrossDark); p(8, 11, cCrossDark);

    // 4. Clasp (top center)
    p(7, 3, cClasp); p(8, 3, cClasp);

    return canvas;
}
