import { PixelDraw } from '../../../../utils/PixelDraw.js';

/**
 * Generate 16x16 inventory icons for costume pieces.
 * Each icon is a simple recognizable silhouette of the item type.
 */

// ---- Hairstyle Icons ----

export function generateHairLongIcon() {
    const d = new PixelDraw(16, 16);
    const hair = '#2c1a0e';
    const hl = '#4e342e';
    // Long flowing hair shape
    d.fillQuadCurve(3, 5, 8, 0, 13, 5, hair);
    d.rect(3, 5, 10, 4, hair);
    d.fillPath([
        { x: 3, y: 9 }, { x: 2, y: 15 },
        { x: 6, y: 14 }, { x: 10, y: 14 },
        { x: 14, y: 15 }, { x: 13, y: 9 }
    ], hair);
    d.hLine(5, 3, 6, hl);
    return d.getCanvas();
}

export function generateMessyHairIcon() {
    const d = new PixelDraw(16, 16);
    const hair = '#4a3b2a';
    const hl = '#8d6e63';
    // Messy shape
    d.fillPath([
        { x: 2, y: 6 },
        { x: 3, y: 2 },
        { x: 8, y: 0 },
        { x: 13, y: 2 },
        { x: 14, y: 6 },
        { x: 13, y: 10 },
        { x: 8, y: 12 },
        { x: 3, y: 10 }
    ], hair);
    // Spikes
    d.pixel(4, 1, hair);
    d.pixel(11, 1, hair);
    d.pixel(14, 5, hair);
    // Highlights
    d.pixel(5, 3, hl);
    d.pixel(10, 2, hl);
    return d.getCanvas();
}

export function generateShortHairIcon() {
    const d = new PixelDraw(16, 16);
    const hair = '#5d4037';
    const hl = '#795548';
    d.fillQuadCurve(3, 8, 8, 1, 13, 8, hair);
    d.rect(4, 6, 8, 4, hair);
    d.rect(5, 8, 6, 5, '#f5cba7'); // face peek
    d.hLine(6, 4, 4, hl);
    return d.getCanvas();
}

// ---- Hat Icons ----

export function generateBeretIcon() {
    const d = new PixelDraw(16, 16);
    const hat = '#8b0000';
    const hl = '#a52a2a';
    // Beret shape
    d.fillQuadCurve(2, 10, 8, 2, 14, 10, hat);
    d.rect(3, 9, 10, 3, hat);
    d.hLine(3, 11, 10, '#6b0000'); // brim
    d.pixel(7, 4, hl); // pip
    return d.getCanvas();
}

export function generateBandanaIcon() {
    const d = new PixelDraw(16, 16);
    const cloth = '#1a5276';
    const hl = '#2980b9';
    d.rect(3, 5, 10, 4, cloth);
    d.hLine(3, 5, 10, hl);
    // Knot tail
    d.fillPath([
        { x: 12, y: 6 }, { x: 15, y: 8 },
        { x: 14, y: 11 }, { x: 12, y: 9 }
    ], cloth);
    return d.getCanvas();
}

// ---- Clothes Icons ----

export function generateCoatIcon() {
    const d = new PixelDraw(16, 16);
    const coat = '#455a64';
    const light = '#607d8b';
    // Coat shape
    d.rect(4, 2, 8, 6, coat);
    d.fillPath([
        { x: 3, y: 8 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 8 }
    ], coat); // left sleeve
    d.fillPath([
        { x: 13, y: 8 }, { x: 12, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 8 }
    ], coat); // right sleeve
    // Coat tails
    d.fillPath([
        { x: 4, y: 8 }, { x: 3, y: 15 }, { x: 7, y: 15 }, { x: 7, y: 8 }
    ], coat);
    d.fillPath([
        { x: 9, y: 8 }, { x: 9, y: 15 }, { x: 13, y: 15 }, { x: 12, y: 8 }
    ], coat);
    // Collar
    d.fillPath([{ x: 7, y: 2 }, { x: 8, y: 5 }, { x: 9, y: 2 }], light);
    d.rect(7, 3, 2, 3, '#95a5a6'); // shirt peek
    return d.getCanvas();
}

export function generateHoodieIcon() {
    const d = new PixelDraw(16, 16);
    const hoodie = '#e67e22';
    const dark = '#d35400';
    d.rect(3, 2, 10, 12, hoodie);
    // Hood
    d.fillQuadCurve(4, 4, 8, 0, 12, 4, hoodie);
    // Pocket
    d.rect(5, 10, 6, 2, dark);
    // Zipper
    d.vLine(8, 4, 8, '#f39c12');
    return d.getCanvas();
}

export function generateVestIcon() {
    const d = new PixelDraw(16, 16);
    const vest = '#2c3e50';
    const strap = '#7f8c8d';
    d.rect(4, 2, 8, 10, vest);
    // Pouches
    d.rect(4, 6, 3, 3, strap);
    d.rect(9, 6, 3, 3, strap);
    d.rect(5, 3, 2, 2, strap);
    d.rect(9, 3, 2, 2, strap);
    // Collar
    d.hLine(5, 2, 6, '#34495e');
    return d.getCanvas();
}

// ---- Glasses Icons ----

export function generateSunglassesIcon() {
    const d = new PixelDraw(16, 16);
    const lens = '#111111';
    const rim = '#333333';
    d.rect(2, 6, 5, 4, lens);
    d.rect(9, 6, 5, 4, lens);
    d.hLine(7, 7, 2, rim);
    d.pixel(1, 7, rim);
    d.pixel(14, 7, rim);
    d.pixel(3, 6, '#ffffff');
    d.pixel(10, 6, '#ffffff');
    return d.getCanvas();
}

export function generateRoundGlassesIcon() {
    const d = new PixelDraw(16, 16);
    const rim = '#8B4513';
    d.circle(5, 8, 3, rim);
    d.circle(5, 8, 2, '#dceefb');
    d.circle(11, 8, 3, rim);
    d.circle(11, 8, 2, '#dceefb');
    d.hLine(8, 7, 1, rim);
    d.pixel(1, 7, rim);
    d.pixel(14, 7, rim);
    return d.getCanvas();
}

export function generateGogglesIcon() {
    const d = new PixelDraw(16, 16);
    const band = '#2c3e50';
    const lens = '#f39c12';
    d.rect(1, 6, 14, 5, band);
    d.rect(2, 7, 5, 3, lens);
    d.rect(9, 7, 5, 3, lens);
    d.pixel(3, 7, '#ffffff');
    d.pixel(10, 7, '#ffffff');
    return d.getCanvas();
}

// ---- No Glasses Icon ----
export function generateNoGlassesIcon() {
    const d = new PixelDraw(16, 16);
    // Simple face without glasses
    d.circle(8, 8, 5, '#f5cba7');
    d.pixel(6, 7, '#333');
    d.pixel(10, 7, '#333');
    d.hLine(7, 10, 2, '#d68910');
    return d.getCanvas();
}

// ---- Beard Icons ----
export function generateBeardFullIcon() {
    const d = new PixelDraw(16, 16);
    const beard = '#2c1a0e';
    const skin = '#f5cba7';
    // Face outline
    d.fillQuadCurve(3, 4, 8, 1, 13, 4, skin);
    d.rect(4, 4, 8, 6, skin);
    // Beard shape
    d.fillPath([
        { x: 3, y: 7 }, { x: 3, y: 12 },
        { x: 8, y: 14 },
        { x: 13, y: 12 }, { x: 13, y: 7 },
        { x: 11, y: 9 }, { x: 5, y: 9 }
    ], beard);
    // Mustache
    d.rect(5, 8, 6, 2, beard);
    // Eyes
    d.pixel(6, 5, '#333');
    d.pixel(10, 5, '#333');
    return d.getCanvas();
}
