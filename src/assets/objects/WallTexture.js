/**
 * Shared wall texture utilities - running bond block pattern
 */

/** Concrete wall color palette */
export const WALL_COLORS = {
    cTop: '#95a5a6',
    cFront: '#7f8c8d',
    cOutline: '#546e7a',
    cHighlight: '#bdc3c7',
    cMortarTop: '#8a9a9b',
    cMortarFront: '#6e7b7c'
};

/**
 * Draw running bond block texture mortar lines on a rectangular region.
 * Uses global coordinates for seamless tiling between adjacent sprites.
 * @param {import('../../utils/PixelDraw.js').PixelDraw} drawer
 * @param {number} rx - Region x
 * @param {number} ry - Region y
 * @param {number} rw - Region width
 * @param {number} rh - Region height
 * @param {string} mortarColor - Color for mortar lines
 * @param {number} blockW - Block width (use 8 for 32px tile alignment)
 * @param {number} blockH - Block height
 */
export function addBlockTexture(drawer, rx, ry, rw, rh, mortarColor, blockW, blockH) {
    // Horizontal mortar lines at global grid positions
    for (let gy = blockH; gy <= ry + rh; gy += blockH) {
        if (gy > ry && gy < ry + rh) {
            drawer.hLine(rx, gy, rw, mortarColor);
        }
    }
    // Vertical mortar lines with running bond offset
    for (let gy = 0; gy <= ry + rh; gy += blockH) {
        const rowIdx = Math.floor(gy / blockH);
        const offset = (rowIdx % 2 === 0) ? 0 : Math.floor(blockW / 2);
        const lineTop = Math.max(gy, ry);
        const lineBot = Math.min(gy + blockH, ry + rh);
        if (lineBot <= lineTop) continue;
        for (let gx = offset; gx <= rx + rw; gx += blockW) {
            if (gx > rx && gx < rx + rw) {
                drawer.vLine(gx, lineTop, lineBot - lineTop, mortarColor);
            }
        }
    }
}
