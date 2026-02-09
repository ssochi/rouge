export function createRecoveryNeedleSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Needle body
    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(2, 7, 10, 2);

    // Plunger
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, 6, 3, 4);

    // Grip
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(3, 6, 2, 4);

    // Liquid chamber
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(5, 7, 4, 2);

    // Needle tip
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(12, 8, 3, 1);

    return canvas;
}
