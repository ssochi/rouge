import { PixelDraw } from '../../utils/PixelDraw.js';

export function createCarpetSprites() {
    const sprites = {};

    // 1. Large Rug (96x64) - Persian Style Red/Gold
    sprites.rug_large = (() => {
        const canvas = PixelDraw.createCanvas(96, 64);
        const ctx = canvas.getContext('2d');
        
        // Base - Deep Red
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(4, 4, 88, 56);
        
        // Border - Gold
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(8, 8, 80, 48);
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(12, 12, 72, 40); // Inner Red

        // Pattern - Simple Geometric Center
        ctx.fillStyle = '#e67e22'; // Orange
        ctx.fillRect(32, 20, 32, 24);
        
        // Diamond Shape in Center
        ctx.fillStyle = '#f1c40f';
        // Draw diamond using pixels
        // Top triangle
        for(let i=0; i<8; i++) {
            ctx.fillRect(48 - i*2, 24 + i, i*4 + 2, 1);
        }
        // Bottom triangle
        for(let i=0; i<8; i++) {
            ctx.fillRect(34 + i*2, 32 + i, 28 - i*4, 1);
        }

        // Fringes (Left/Right)
        ctx.fillStyle = '#ecf0f1'; // White
        for(let y=4; y<60; y+=2) {
            ctx.fillRect(0, y, 4, 1); // Left Fringe
            ctx.fillRect(92, y, 4, 1); // Right Fringe
        }

        return canvas;
    })();

    // 2. Round Rug (64x64) - Blue
    sprites.rug_round = (() => {
        const canvas = PixelDraw.createCanvas(64, 64);
        const ctx = canvas.getContext('2d');
        
        const cx = 32, cy = 32;
        
        // Outer Circle - Dark Blue
        ctx.fillStyle = '#2980b9';
        
        // Function to draw pixel circle
        const drawCircle = (radius, color) => {
            ctx.fillStyle = color;
            for(let y = -radius; y <= radius; y++) {
                for(let x = -radius; x <= radius; x++) {
                    if(x*x + y*y <= radius*radius) {
                        ctx.fillRect(cx + x, cy + y, 1, 1);
                    }
                }
            }
        };

        drawCircle(30, '#2980b9');
        drawCircle(26, '#3498db'); // Inner Light Blue
        drawCircle(20, '#ecf0f1'); // Inner White Ring
        drawCircle(18, '#3498db'); // Back to Blue
        
        // Star Pattern
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(cx-4, cy-4, 8, 8);
        ctx.fillRect(cx-2, cy-10, 4, 20);
        ctx.fillRect(cx-10, cy-2, 20, 4);

        return canvas;
    })();

    // 3. Doormat (32x20) - Brown "WELCOME"
    sprites.doormat = (() => {
        const canvas = PixelDraw.createCanvas(32, 20);
        const ctx = canvas.getContext('2d');
        
        // Base - Brown
        ctx.fillStyle = '#795548'; // Material Brown
        ctx.fillRect(0, 0, 32, 20);
        
        // Inner Border - Darker
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(2, 2, 28, 16);
        
        // "Text" (Lines)
        ctx.fillStyle = '#d7ccc8'; // Light Beige
        ctx.fillRect(6, 6, 20, 2);
        ctx.fillRect(6, 10, 20, 2);
        ctx.fillRect(6, 14, 20, 2);
        
        return canvas;
    })();

    // 4. Tutorial Markers (Metal Plates) - 48x80
    // Style: Industrial Metal Plate with Caution Stripes
    
    // Helper to draw metal plate base
    const drawMetalPlate = (ctx, w, h, baseColor, stripeColor) => {
        // Base Metal
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, w, h);
        
        // Noise / Texture
        for(let i=0; i<100; i++) {
            const nx = Math.floor(Math.random() * w);
            const ny = Math.floor(Math.random() * h);
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            ctx.fillRect(nx, ny, 1, 1);
        }
        
        // Rivets (Bolts) in corners
        ctx.fillStyle = '#bdc3c7'; // Silver
        ctx.fillRect(2, 2, 2, 2);
        ctx.fillRect(w-4, 2, 2, 2);
        ctx.fillRect(2, h-4, 2, 2);
        ctx.fillRect(w-4, h-4, 2, 2);
        
        // Caution Stripes (Bottom Edge)
        ctx.fillStyle = stripeColor;
        const stripeH = 8;
        const yStart = h - stripeH;
        ctx.fillRect(0, yStart, w, stripeH);
        
        // Stripes Pattern
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for(let x=-10; x<w; x+=10) {
            // Draw diagonal line
            // Start at (x, yStart), go to (x+5, yStart+stripeH)
            ctx.beginPath();
            ctx.moveTo(x, yStart);
            ctx.lineTo(x+5, yStart);
            ctx.lineTo(x-5, yStart+stripeH); // Slanted left
            ctx.lineTo(x-10, yStart+stripeH);
            ctx.fill();
        }
        
        // Border Outline (Thin)
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, w-1, h-1);
    };

    // 4.1 Reload (R) - Industrial Grey + Red/Yellow Hazard
    sprites.tutorial_r = (() => {
        const w = 48, h = 96;
        const canvas = PixelDraw.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        drawMetalPlate(ctx, w, h, '#34495e', '#f1c40f'); // Dark Grey Base, Yellow Hazard
        
        // Icon Area
        const bx = w/2;
        const by = 30;
        // Draw Ammo
        drawDetailedBullet(ctx, bx - 10, by);
        drawDetailedBullet(ctx, bx, by - 5);
        drawDetailedBullet(ctx, bx + 10, by);
        
        // Label
        drawLabel(ctx, w/2, 52, 'RELOAD');

        // Key Area
        drawLargeKey(ctx, w/2, 70, 'R');
        
        return canvas;
    })();

    // 4.2 Inventory (B) - Industrial Brown + Orange Hazard
    sprites.tutorial_b = (() => {
        const w = 48, h = 96;
        const canvas = PixelDraw.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        drawMetalPlate(ctx, w, h, '#5d4037', '#e67e22'); // Brown Base, Orange Hazard
        
        // Icon Area
        drawDetailedBag(ctx, w/2, 30);
        
        // Label
        drawLabel(ctx, w/2, 52, 'BAG');

        // Key Area
        drawLargeKey(ctx, w/2, 70, 'B');
        
        return canvas;
    })();

    // 4.3 Interact (E) - Industrial Blue + Cyan Hazard
    sprites.tutorial_e = (() => {
        const w = 48, h = 96;
        const canvas = PixelDraw.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        drawMetalPlate(ctx, w, h, '#2c3e50', '#3498db'); // Blue Base, Cyan Hazard
        
        // Icon Area
        drawDetailedHand(ctx, w/2, 30);
        
        // Label
        drawLabel(ctx, w/2, 52, 'USE');

        // Key Area
        drawLargeKey(ctx, w/2, 70, 'E');
        
        return canvas;
    })();

    return sprites;
}

// --- Detailed Helpers ---

function drawLabel(ctx, x, y, text) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

function drawLargeKey(ctx, x, y, char) {
    // 3D Keycap style
    const size = 20;
    
    // Shadow/Side
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - size/2, y - size/2 + 2, size, size);
    
    // Top Face
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(x - size/2, y - size/2, size, size);
    
    // Letter
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, x, y);
}

function drawDetailedBullet(ctx, x, y) {
    // Brass casing
    ctx.fillStyle = '#f39c12'; // Darker Gold
    ctx.fillRect(x-3, y-4, 6, 8);
    // Highlight
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x-1, y-4, 2, 8);
    
    // Copper tip
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.moveTo(x-3, y-4);
    ctx.lineTo(x, y-8);
    ctx.lineTo(x+3, y-4);
    ctx.fill();
    
    // Rim
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(x-4, y+2, 8, 2);
}

function drawDetailedBag(ctx, x, y) {
    const w = 24;
    const h = 20;
    
    // Main body
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(x - w/2, y - h/2, w, h);
    
    // Flap
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(x - w/2, y - h/2, w, h/2 + 2);
    
    // Straps (Vertical)
    ctx.fillStyle = '#5e3370';
    ctx.fillRect(x - 6, y - h/2, 3, h);
    ctx.fillRect(x + 3, y - h/2, 3, h);
    
    // Buckles (Gold)
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x - 6, y, 3, 3);
    ctx.fillRect(x + 3, y, 3, 3);
    
    // Side Pockets
    ctx.fillStyle = '#71368a';
    ctx.fillRect(x - w/2 - 2, y, 2, 8);
    ctx.fillRect(x + w/2, y, 2, 8);
}

function drawDetailedHand(ctx, x, y) {
    // Open Palm / Grabbing
    ctx.fillStyle = '#e74c3c'; // Skin tone (Reddish for visibility)
    
    // Palm
    ctx.fillRect(x - 6, y - 4, 12, 10);
    
    // Fingers (4)
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x - 6, y - 9, 2, 5); // Pinky
    ctx.fillRect(x - 3, y - 10, 2, 6); // Ring
    ctx.fillRect(x, y - 10, 2, 6); // Middle
    ctx.fillRect(x + 3, y - 9, 2, 5); // Index
    
    // Thumb (Side)
    ctx.fillRect(x + 6, y - 2, 3, 4);
    
    // Action Lines (Radiating)
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10); ctx.lineTo(x - 14, y - 14);
    ctx.moveTo(x + 10, y - 10); ctx.lineTo(x + 14, y - 14);
    ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 18);
    ctx.stroke();
}
