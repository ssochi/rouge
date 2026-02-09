import { PixelDraw } from '../../utils/PixelDraw.js';
import { WALL_COLORS, addBlockTexture } from './WallTexture.js';

export function createHorizontalWallSprite() {
    const drawer = new PixelDraw(32, 48);
    const { cTop, cFront, cOutline, cHighlight, cMortarTop, cMortarFront } = WALL_COLORS;

    const yTop = 10;
    const thickness = 12;
    const height = 16;

    // Front Face (y=22 to 38)
    drawer.rect(0, yTop + thickness, 32, height, cFront);
    addBlockTexture(drawer, 0, yTop + thickness, 32, height, cMortarFront, 8, 4);
    drawer.vLine(0, yTop + thickness, height, cOutline);
    drawer.vLine(31, yTop + thickness, height, cOutline);
    drawer.hLine(0, yTop + thickness + height - 1, 32, cOutline);

    // Top Face (y=10 to 22)
    drawer.rect(0, yTop, 32, thickness, cTop);
    addBlockTexture(drawer, 0, yTop, 32, thickness, cMortarTop, 8, 4);

    // Highlights
    drawer.hLine(0, yTop, 32, cHighlight);

    return drawer.getCanvas();
}

export function createVerticalWallSprite() {
    const drawer = new PixelDraw(32, 48);
    const { cTop, cFront, cOutline, cHighlight, cMortarTop, cMortarFront } = WALL_COLORS;

    const xLeft = 10;
    const width = 12;
    const height = 16;

    // Front Face (End Cap) at y=32..48
    drawer.rect(xLeft, 32, width, height, cFront);
    addBlockTexture(drawer, xLeft, 32, width, height, cMortarFront, 8, 4);
    drawer.vLine(xLeft, 32, height, cOutline);
    drawer.vLine(xLeft + width - 1, 32, height, cOutline);
    drawer.hLine(xLeft, 32 + height - 1, width, cOutline);

    // Top Face (y=0 to 32)
    drawer.rect(xLeft, 0, width, 32, cTop);
    addBlockTexture(drawer, xLeft, 0, width, 32, cMortarTop, 8, 4);

    // Highlights
    drawer.vLine(xLeft, 0, 32, cHighlight);

    return drawer.getCanvas();
}
