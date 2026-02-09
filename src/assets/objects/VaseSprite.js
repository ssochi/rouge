import { PixelDraw } from '../../utils/PixelDraw.js';
import { PALETTE } from '../Palette.js';

export function createVaseSprite() {
    const drawer = new PixelDraw(32, 32);
    const p = PALETTE;
    
    const cClay = p['a']; // Orange/Reddish
    const cClayDark = '#a04000';
    const cHighlight = p['S'];
    const cShadow = 'rgba(0,0,0,0.2)';
    const cOutline = '#6e2c00'; // Darker outline

    const cx = 16;
    const yBase = 28;
    const bulbWidth = 12; // Slightly smaller radius for cleaner look
    const neckY = yBase - 16;
    const rimY = neckY - 2;

    // 1. Full Body Shape (Solid + Outline)
    // Draw left and right curves to form the vase body
    const leftPoints = [];
    const rightPoints = [];
    const steps = 15;

    // Bezier Logic for "S" curve profile: Rim -> Neck -> Bulb -> Base
    // We'll compose it of segments for better control
    
    // Segment 1: Neck (Rim to Shoulder)
    // Start wide at rim, narrow at neck, widen to shoulder
    // y: rimY -> neckY -> yBase - 8 (Shoulder)
    
    // Simplified: Just use a nice bulbous shape with a flared neck
    for(let i=0; i<=steps; i++) {
        const t = i/steps;
        const y = rimY + (yBase - rimY) * t;
        
        // Profile function x(y)
        // Normalized Y from 0 (top) to 1 (bottom)
        // Shape: Hourglass top + Sphere bottom
        let xOffset = 0;
        
        if (t < 0.2) { 
            // Neck flare (0.0 to 0.2)
            // t=0 -> x=6, t=0.2 -> x=4
            xOffset = 6 - 10 * t; 
        } else {
            // Body bulb (0.2 to 1.0)
            // Elliptical bulge
            // Map t [0.2, 1.0] to angle [-PI/2, PI/2]? No, simple sin
            const t2 = (t - 0.2) / 0.8; 
            // Sin curve 0 to PI
            xOffset = 4 + Math.sin(t2 * Math.PI) * (bulbWidth - 4);
        }
        
        // Ensure base isn't too pointy
        if (t > 0.9) {
            xOffset *= 0.8; // Taper slightly at very bottom
        }

        leftPoints.push({x: cx - xOffset, y: y});
        rightPoints.push({x: cx + xOffset, y: y});
    }

    const fullPath = [...leftPoints, ...rightPoints.reverse()];
    
    // Fill Base
    drawer.fillPath(fullPath, cClay);
    // Outline
    drawer.strokePath(fullPath, cOutline);

    // 2. Base Stand
    drawer.fillPath([
        {x: cx - 5, y: yBase - 1},
        {x: cx + 5, y: yBase - 1},
        {x: cx + 6, y: yBase + 1},
        {x: cx - 6, y: yBase + 1}
    ], cClayDark);
    drawer.strokePath([
        {x: cx - 5, y: yBase - 1},
        {x: cx - 6, y: yBase + 1},
        {x: cx + 6, y: yBase + 1},
        {x: cx + 5, y: yBase - 1}
    ], cOutline);

    // 3. Shading (Right side)
    const shadowPath = [];
    for(let i=0; i<leftPoints.length; i++) {
        const lp = leftPoints[i];
        const rp = rightPoints[rightPoints.length - 1 - i]; // Matching right point
        // Shadow on right 30%
        const xShadow = rp.x - (rp.x - lp.x) * 0.25;
        shadowPath.push({x: xShadow, y: rp.y});
    }
    // Connect to right edge
    for(let i=rightPoints.length-1; i>=0; i--) {
        shadowPath.push({x: rightPoints[i].x - 1, y: rightPoints[i].y});
    }
    drawer.fillPath(shadowPath, cShadow);

    // 4. Rim / Opening
    // Draw back rim (darker inside)
    drawer.ellipse(cx, rimY, 6, 2, cClayDark);
    // Hole
    drawer.ellipse(cx, rimY, 4, 1.5, '#3e2723');
    // Front Rim Highlight (Thick lip)
    drawer.strokePath([
        {x: cx - 6, y: rimY},
        {x: cx, y: rimY + 2.5},
        {x: cx + 6, y: rimY}
    ], cHighlight);
    
    // 5. Highlights
    drawer.pixel(cx - 5, yBase - 10, cHighlight);
    drawer.pixel(cx - 6, yBase - 9, cHighlight);
    drawer.pixel(cx - 5, yBase - 8, cHighlight);

    return drawer.getCanvas();
}
