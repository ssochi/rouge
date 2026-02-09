import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

export function createExplosiveBarrelSprite() {
    const drawer = new PixelDraw(32, 32);
    const p = PALETTE;

    const cBody = '#c0392b'; // Dark Red
    const cBodyLight = '#e74c3c'; // Red
    const cMetal = '#2c3e50'; // Dark Blue/Grey for bands
    const cWarning = '#f1c40f'; // Yellow
    const cShadow = 'rgba(0,0,0,0.3)';
    const cOutline = '#641e16'; // Dark Red Outline

    // Dimensions
    const cx = 16;
    const topY = 6;
    const bottomY = 28;
    const wTop = 16; // Width at top rim
    const wMid = 22; // Width at bulge
    const wBot = 16; // Width at bottom

    // 1. Draw Main Body (Solid Shape with Outline)
    const leftPoints = [];
    const rightPoints = [];
    const steps = 10;
    
    for(let i=0; i<=steps; i++) {
        const t = i/steps;
        const y = topY + (bottomY - topY) * t;
        const cpX_Left = cx - wMid/2 - 2;
        const cpX_Right = cx + wMid/2 + 2;
        
        const xl = Math.pow(1-t, 2) * (cx - wTop/2) + 2*(1-t)*t * cpX_Left + Math.pow(t, 2) * (cx - wBot/2);
        const xr = Math.pow(1-t, 2) * (cx + wTop/2) + 2*(1-t)*t * cpX_Right + Math.pow(t, 2) * (cx + wBot/2);
        
        leftPoints.push({x: xl, y: y});
        rightPoints.push({x: xr, y: y});
    }
    
    const fullPath = [...leftPoints, ...rightPoints.reverse()];
    
    // Fill
    drawer.fillPath(fullPath, cBody);
    // Outline
    drawer.strokePath(fullPath, cOutline);

    // 2. Metal Bands (Dark)
    const drawBand = (y, width, color) => {
        const curveDepth = 2;
        const path = [];
        for(let i=0; i<=10; i++) {
            const t = i/10;
            const dx = (t - 0.5) * width;
            const dy = Math.cos((t - 0.5) * Math.PI) * curveDepth;
            path.push({x: cx + dx, y: y + dy});
        }
        for(let i=10; i>=0; i--) {
            const t = i/10;
            const dx = (t - 0.5) * width;
            const dy = Math.cos((t - 0.5) * Math.PI) * curveDepth + 3;
            path.push({x: cx + dx, y: y + dy});
        }
        drawer.fillPath(path, color);
        // Band outline logic if needed
    };

    drawBand(topY + 4, 20, cMetal);
    drawBand(bottomY - 6, 20, cMetal);

    // 3. Warning Symbol (Yellow Diamond/Triangle)
    const symY = (topY + bottomY)/2;
    drawer.fillPath([
        {x: cx, y: symY - 3},
        {x: cx + 3, y: symY},
        {x: cx, y: symY + 3},
        {x: cx - 3, y: symY}
    ], cWarning);
    // Inner flame icon (Red pixel)
    drawer.pixel(cx, symY, cBody);

    // 4. Shading
    const shadowPath = [];
    for(let i=0; i<=steps; i++) {
        const t = i/steps;
        const y = topY + (bottomY - topY) * t;
        const cpX_Right = cx + wMid/2 + 2;
        const xr = Math.pow(1-t, 2) * (cx + wTop/2) + 2*(1-t)*t * cpX_Right + Math.pow(t, 2) * (cx + wBot/2);
        const xShadowStart = xr - 4; 
        shadowPath.push({x: xShadowStart, y: y});
    }
    for(let i=steps; i>=0; i--) {
        const t = i/steps;
        const y = topY + (bottomY - topY) * t;
        const cpX_Right = cx + wMid/2 + 2;
        const xr = Math.pow(1-t, 2) * (cx + wTop/2) + 2*(1-t)*t * cpX_Right + Math.pow(t, 2) * (cx + wBot/2);
        shadowPath.push({x: xr - 1, y: y});
    }
    drawer.fillPath(shadowPath, cShadow);

    // 5. Top Opening
    // Back Rim (Darker)
    drawer.ellipse(cx, topY, wTop/2, 3, cOutline); // Darker base for rim
    
    // Top Lid (Sealed, dark metal cap)
    // Draw full ellipse for lid
    drawer.ellipse(cx, topY, wTop/2 - 1, 3, '#34495e'); // Dark Blue Grey Lid
    
    // Lid Highlight/Detail
    drawer.ellipse(cx, topY, wTop/2 - 4, 1, '#5d6d7e'); // Inner ring
    
    // Rim Outline
    drawer.strokePath([
        {x: cx - wTop/2, y: topY}, 
        {x: cx, y: topY - 3}, 
        {x: cx + wTop/2, y: topY},
        {x: cx, y: topY + 3},
        {x: cx - wTop/2, y: topY}
    ], cOutline);
    
    // Front Rim Highlight
    const rimY = topY + 1;
    drawer.pixel(cx - wTop/2 + 1, rimY, cBodyLight);
    drawer.pixel(cx, rimY + 2, cBodyLight);
    drawer.pixel(cx + wTop/2 - 1, rimY, cBodyLight);

    return drawer.getCanvas();
}
