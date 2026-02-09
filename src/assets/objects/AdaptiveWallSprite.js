import { PixelDraw } from '../../utils/PixelDraw.js';
import { WALL_COLORS, addBlockTexture } from './WallTexture.js';

export function createAdaptiveWallSprites() {
    const sprites = [];

    const tileSize = 32;
    const wallHeight = 16;
    const wallThickness = 12;
    const centerStart = (tileSize - wallThickness) / 2; // 10
    const centerEnd = centerStart + wallThickness; // 22

    const { cTop, cFront, cOutline, cHighlight, cMortarTop, cMortarFront } = WALL_COLORS;

    for (let mask = 0; mask < 16; mask++) {
        const drawer = new PixelDraw(tileSize, tileSize + wallHeight);

        const hasNorth = (mask & 1) !== 0;
        const hasEast = (mask & 2) !== 0;
        const hasSouth = (mask & 4) !== 0;
        const hasWest = (mask & 8) !== 0;

        const rects = [];

        // Center (always present)
        rects.push({x: centerStart, y: centerStart, w: wallThickness, h: wallThickness});

        if (hasNorth) {
            rects.push({x: centerStart, y: 0, w: wallThickness, h: centerStart});
        }
        if (hasSouth) {
            rects.push({x: centerStart, y: centerEnd, w: wallThickness, h: tileSize - centerEnd});
        }
        if (hasWest) {
            rects.push({x: 0, y: centerStart, w: centerStart, h: wallThickness});
        }
        if (hasEast) {
            rects.push({x: centerEnd, y: centerStart, w: tileSize - centerEnd, h: wallThickness});
        }

        // 1. Front Faces
        rects.forEach(r => {
            let drawFace = false;

            if (r.y === centerStart && r.x === centerStart) {
                if (!hasSouth) drawFace = true;
            } else if (r.y === 0) {
                drawFace = false;
            } else if (r.y === centerEnd) {
                drawFace = false;
            } else if (r.x === 0) {
                drawFace = true;
            } else if (r.x === centerEnd) {
                drawFace = true;
            }

            if (drawFace) {
                const faceX = r.x;
                const faceY = r.y + r.h;
                const faceW = r.w;
                const faceH = wallHeight;

                drawer.rect(faceX, faceY, faceW, faceH, cFront);
                addBlockTexture(drawer, faceX, faceY, faceW, faceH, cMortarFront, 8, 4);
                drawer.vLine(faceX, faceY, faceH, cOutline);
                drawer.vLine(faceX + faceW - 1, faceY, faceH, cOutline);
                drawer.hLine(faceX, faceY + faceH - 1, faceW, cOutline);
            }
        });

        // 2. Top Faces
        rects.forEach(r => {
            drawer.rect(r.x, r.y, r.w, r.h, cTop);
        });

        // 3. Top Face Block Texture
        rects.forEach(r => {
            addBlockTexture(drawer, r.x, r.y, r.w, r.h, cMortarTop, 8, 4);
        });

        // 4. Highlights (Top/Left edges)
        if (!hasNorth) drawer.hLine(centerStart, centerStart, wallThickness, cHighlight);
        if (!hasWest) drawer.vLine(centerStart, centerStart, wallThickness, cHighlight);

        if (hasNorth) {
            drawer.vLine(centerStart, 0, centerStart, cHighlight);
        }
        if (hasWest) {
            drawer.hLine(0, centerStart, centerStart, cHighlight);
        }
        if (hasEast) {
            drawer.hLine(centerEnd, centerStart, tileSize-centerEnd, cHighlight);
        }
        if (hasSouth) {
            drawer.vLine(centerStart, centerEnd, tileSize-centerEnd, cHighlight);
        }

        // 5. Outlines (Right/Bottom edges)
        if (!hasEast) drawer.vLine(centerEnd-1, centerStart, wallThickness, cOutline);
        if (!hasSouth) drawer.hLine(centerStart, centerEnd-1, wallThickness, cOutline);

        if (hasNorth) {
            drawer.vLine(centerEnd-1, 0, centerStart, cOutline);
        }
        if (hasSouth) {
            drawer.vLine(centerEnd-1, centerEnd, tileSize-centerEnd, cOutline);
        }
        if (hasWest) {
            drawer.hLine(0, centerEnd-1, centerStart, cOutline);
        }
        if (hasEast) {
            drawer.hLine(centerEnd, centerEnd-1, tileSize-centerEnd, cOutline);
        }

        sprites.push(drawer.getCanvas());
    }

    return sprites;
}
