import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

export function createBarrelSprite() {
    const drawer = new PixelDraw(32, 32);
    const p = PALETTE;

    const cWood = p['7'];
    const cWoodLight = p['8'];
    const cMetal = p['9'];
    const cMetalDark = p['G'];
    const cShadow = 'rgba(0,0,0,0.3)';
    const cOutline = '#3e2723'; // Dark brown outline

    // Dimensions
    const cx = 16;
    const topY = 6;
    const bottomY = 28;
    const wTop = 16; // Width at top rim
    const wMid = 22; // Width at bulge
    const wBot = 16; // Width at bottom

    // 1. Draw Main Body (Solid Shape with Outline)
    // Instead of two quad curves, we define a full polygon for the barrel silhouette
    const leftPoints = [];
    const rightPoints = [];
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = topY + (bottomY - topY) * t;
        // Parabolic curve for width: wTop -> wMid -> wBot
        // Simple quadratic bezier logic manually
        // x = (1-t)^2 * start + 2(1-t)t * cp + t^2 * end
        const cpX_Left = cx - wMid / 2 - 2;
        const cpX_Right = cx + wMid / 2 + 2;

        const xl = Math.pow(1 - t, 2) * (cx - wTop / 2) + 2 * (1 - t) * t * cpX_Left + Math.pow(t, 2) * (cx - wBot / 2);
        const xr = Math.pow(1 - t, 2) * (cx + wTop / 2) + 2 * (1 - t) * t * cpX_Right + Math.pow(t, 2) * (cx + wBot / 2);

        leftPoints.push({ x: xl, y: y });
        rightPoints.push({ x: xr, y: y });
    }

    // Combine into full path (Right points reversed)
    const fullPath = [...leftPoints, ...rightPoints.reverse()];

    // Fill Base
    drawer.fillPath(fullPath, cWood);

    // Outline
    drawer.strokePath(fullPath, cOutline);

    // 2. Metal Bands (Curved)
    const drawBand = (y, width, color) => {
        const curveDepth = 2;
        const path = [];
        // Top edge curve
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const dx = (t - 0.5) * width;
            const dy = Math.cos((t - 0.5) * Math.PI) * curveDepth;
            path.push({ x: cx + dx, y: y + dy });
        }
        // Bottom edge curve (reverse)
        for (let i = 10; i >= 0; i--) {
            const t = i / 10;
            const dx = (t - 0.5) * width;
            const dy = Math.cos((t - 0.5) * Math.PI) * curveDepth + 3;
            path.push({ x: cx + dx, y: y + dy });
        }
        drawer.fillPath(path, color);
        // Band outline (optional, maybe just darker edges)
        drawer.pixel(path[0].x, path[0].y, cOutline);
        drawer.pixel(path[path.length - 1].x, path[path.length - 1].y, cOutline);
    };

    drawBand(topY + 5, 20, cMetalDark);
    drawBand(bottomY - 7, 20, cMetalDark);

    // 3. Shading
    // Right side shadow
    const shadowPath = [];
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = topY + (bottomY - topY) * t;
        const cpX_Right = cx + wMid / 2 + 2;
        const xr = Math.pow(1 - t, 2) * (cx + wTop / 2) + 2 * (1 - t) * t * cpX_Right + Math.pow(t, 2) * (cx + wBot / 2);

        // Shadow covers right 30%?
        const xShadowStart = xr - 4;
        shadowPath.push({ x: xShadowStart, y: y });
    }
    // Add right edge points
    for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        const y = topY + (bottomY - topY) * t;
        const cpX_Right = cx + wMid / 2 + 2;
        const xr = Math.pow(1 - t, 2) * (cx + wTop / 2) + 2 * (1 - t) * t * cpX_Right + Math.pow(t, 2) * (cx + wBot / 2);
        shadowPath.push({ x: xr - 1, y: y }); // Slightly inside outline
    }
    drawer.fillPath(shadowPath, cShadow);

    // 4. Top Opening
    // Back Rim (Darker)
    drawer.ellipse(cx, topY, wTop / 2, 3, cWood);
    drawer.strokePath([
        { x: cx - wTop / 2, y: topY },
        { x: cx, y: topY - 3 },
        { x: cx + wTop / 2, y: topY }
    ], cOutline); // Top outline

    // Liquid/Hole
    drawer.ellipse(cx, topY + 1, wTop / 2 - 2, 2, '#2b1b17');

    // Front Rim Highlight
    const rimY = topY + 1;
    drawer.pixel(cx - wTop / 2 + 1, rimY, cWoodLight);
    drawer.pixel(cx, rimY + 2, cWoodLight);
    drawer.pixel(cx + wTop / 2 - 1, rimY, cWoodLight);

    return drawer.getCanvas();
}
