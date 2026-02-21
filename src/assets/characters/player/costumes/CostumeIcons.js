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

// ---- Santa Icons ----

export function generateSantaHatIcon() {
    const d = new PixelDraw(16, 16);
    const hat = '#c0392b';
    const fur = '#ecf0f1';
    const furD = '#bdc3c7';
    // Hat body (drooping cone)
    d.fillPath([
        { x: 2, y: 9 }, { x: 6, y: 4 },
        { x: 10, y: 1 }, { x: 12, y: 3 },
        { x: 9, y: 6 }, { x: 14, y: 9 }
    ], hat);
    // Fur trim band
    d.rect(2, 9, 12, 3, fur);
    d.pixel(4, 10, furD);
    d.pixel(8, 9, furD);
    d.pixel(12, 10, furD);
    // Pompom
    d.rect(10, 0, 3, 3, fur);
    d.pixel(11, 1, furD);
    return d.getCanvas();
}

export function generateSantaSuitIcon() {
    const d = new PixelDraw(16, 16);
    const coat = '#c0392b';
    const dark = '#922b21';
    const fur = '#ecf0f1';
    const belt = '#1a1a1a';
    const buckle = '#f1c40f';
    // Coat body
    d.rect(4, 2, 8, 10, coat);
    // Sleeves
    d.fillPath([
        { x: 3, y: 8 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 8 }
    ], coat);
    d.fillPath([
        { x: 13, y: 8 }, { x: 12, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 8 }
    ], coat);
    // Fur collar
    d.hLine(5, 2, 6, fur);
    d.hLine(4, 3, 2, fur);
    d.hLine(10, 3, 2, fur);
    // Belt
    d.rect(4, 8, 8, 2, belt);
    d.rect(7, 8, 2, 2, buckle);
    // Buttons
    d.pixel(8, 5, buckle);
    d.pixel(8, 7, buckle);
    // Bottom fur trim
    d.hLine(4, 12, 8, fur);
    return d.getCanvas();
}

export function generateSantaBeardIcon() {
    const d = new PixelDraw(16, 16);
    const beard = '#ecf0f1';
    const beardD = '#bdc3c7';
    const skin = '#f5cba7';
    // Face outline
    d.fillQuadCurve(3, 4, 8, 1, 13, 4, skin);
    d.rect(4, 4, 8, 6, skin);
    // Big white beard
    d.fillPath([
        { x: 3, y: 7 }, { x: 2, y: 12 },
        { x: 5, y: 15 }, { x: 8, y: 16 },
        { x: 11, y: 15 }, { x: 14, y: 12 },
        { x: 13, y: 7 }, { x: 11, y: 9 }, { x: 5, y: 9 }
    ], beard);
    // Texture
    d.pixel(5, 11, beardD);
    d.pixel(8, 13, beardD);
    d.pixel(11, 11, beardD);
    // Mustache
    d.rect(5, 8, 6, 2, beard);
    // Eyes
    d.pixel(6, 5, '#333');
    d.pixel(10, 5, '#333');
    return d.getCanvas();
}

// ---- Clown Icons ----

export function generateClownHatIcon() {
    const d = new PixelDraw(16, 16);
    const red = '#e74c3c';
    const blue = '#3498db';
    const bell = '#f1c40f';
    // Left point (red)
    d.fillPath([
        { x: 3, y: 10 }, { x: 8, y: 8 },
        { x: 7, y: 4 }, { x: 1, y: 1 }, { x: 2, y: 7 }
    ], red);
    // Right point (blue)
    d.fillPath([
        { x: 13, y: 10 }, { x: 8, y: 8 },
        { x: 9, y: 4 }, { x: 15, y: 1 }, { x: 14, y: 7 }
    ], blue);
    // Band
    d.rect(3, 10, 10, 2, '#c0392b');
    // Bells
    d.rect(0, 0, 2, 2, bell);
    d.rect(14, 0, 2, 2, bell);
    return d.getCanvas();
}

export function generateClownSuitIcon() {
    const d = new PixelDraw(16, 16);
    const red = '#e74c3c';
    const blue = '#3498db';
    const ruffle = '#ecf0f1';
    const button = '#f1c40f';
    // Left half (red)
    d.rect(4, 3, 4, 10, red);
    d.fillPath([{ x: 3, y: 8 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 5, y: 8 }], red);
    // Right half (blue)
    d.rect(8, 3, 4, 10, blue);
    d.fillPath([{ x: 13, y: 8 }, { x: 12, y: 3 }, { x: 11, y: 3 }, { x: 11, y: 8 }], blue);
    // Collar ruffle
    d.fillPath([{ x: 5, y: 2 }, { x: 8, y: 5 }, { x: 11, y: 2 }], ruffle);
    // Buttons
    d.pixel(8, 5, button);
    d.pixel(8, 7, button);
    d.pixel(8, 9, button);
    return d.getCanvas();
}

export function generateClownHairIcon() {
    const d = new PixelDraw(16, 16);
    const hair = '#e74c3c';
    const hl = '#f39c12';
    const skin = '#f5cba7';
    // Bald top
    d.fillQuadCurve(4, 6, 8, 1, 12, 6, skin);
    d.rect(5, 4, 6, 3, skin);
    // Left puff
    d.fillPath([
        { x: 1, y: 4 }, { x: 0, y: 7 },
        { x: 1, y: 12 }, { x: 4, y: 10 }, { x: 3, y: 5 }
    ], hair);
    // Right puff
    d.fillPath([
        { x: 15, y: 4 }, { x: 16, y: 7 },
        { x: 15, y: 12 }, { x: 12, y: 10 }, { x: 13, y: 5 }
    ], hair);
    // Highlights
    d.pixel(1, 8, hl);
    d.pixel(14, 8, hl);
    // Eyes
    d.pixel(6, 6, '#333');
    d.pixel(10, 6, '#333');
    return d.getCanvas();
}

// ---- Cyberpunk Icons ----

export function generateCyberHairIcon() {
    const d = new PixelDraw(16, 16);
    const hair = '#1a1a2e';
    const cyan = '#00ffff';
    const magenta = '#ff00ff';
    // Mohawk base
    d.rect(6, 6, 4, 6, hair);
    // Center spike (tallest)
    d.fillPath([
        { x: 7, y: 6 }, { x: 8, y: 1 }, { x: 9, y: 6 }
    ], hair);
    d.pixel(8, 1, cyan);
    d.pixel(8, 2, cyan);
    // Left spike
    d.fillPath([
        { x: 6, y: 7 }, { x: 6, y: 3 }, { x: 7, y: 6 }
    ], hair);
    d.pixel(6, 3, magenta);
    // Right spike
    d.fillPath([
        { x: 9, y: 6 }, { x: 10, y: 3 }, { x: 10, y: 7 }
    ], hair);
    d.pixel(10, 3, cyan);
    // Neon glow at base
    d.hLine(6, 6, 4, cyan);
    // Shaved sides
    d.pixel(4, 8, '#2a2a3e');
    d.pixel(12, 8, '#2a2a3e');
    return d.getCanvas();
}

export function generateCyberJacketIcon() {
    const d = new PixelDraw(16, 16);
    const coat = '#1a1a2e';
    const dark = '#0d0d1a';
    const cyan = '#00ffff';
    const magenta = '#ff00ff';
    // Jacket body
    d.rect(4, 2, 8, 10, coat);
    // Sleeves
    d.fillPath([
        { x: 3, y: 8 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 8 }
    ], coat);
    d.fillPath([
        { x: 13, y: 8 }, { x: 12, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 8 }
    ], coat);
    // Standing collar
    d.rect(5, 1, 2, 2, dark);
    d.rect(9, 1, 2, 2, dark);
    // Neon shoulder lines
    d.hLine(3, 3, 3, cyan);
    d.hLine(10, 3, 3, cyan);
    // Neon side seams
    d.vLine(3, 4, 4, cyan);
    d.vLine(13, 4, 4, cyan);
    // Center circuit line
    d.vLine(8, 4, 6, magenta);
    // Bottom neon trim
    d.hLine(4, 12, 8, cyan);
    return d.getCanvas();
}

export function generateCyberVisorIcon() {
    const d = new PixelDraw(16, 16);
    const rim = '#1a1a2e';
    const lens = '#00ffff';
    const glow = '#ff00ff';
    // Frame band
    d.rect(1, 6, 14, 5, rim);
    // Holographic lens (single continuous band)
    d.rect(2, 7, 12, 3, lens);
    // White reflection
    d.pixel(3, 7, '#ffffff');
    d.pixel(4, 7, '#ffffff');
    // Magenta glow bottom
    d.hLine(2, 10, 12, glow);
    // HUD dot
    d.pixel(12, 7, '#ffffff');
    return d.getCanvas();
}

export function generateKnightHelmetIcon() {
    const d = new PixelDraw(16, 16);
    const steel = '#8e8e8e';
    const dark = '#4a4a4a';
    const light = '#b0b0b0';
    const visor = '#2a2a2a';
    const gold = '#c9a73e';
    // Helmet dome
    d.fillQuadCurve(3, 7, 8, 1, 13, 7, steel);
    // Helmet body
    d.rect(4, 5, 8, 8, steel);
    // Rounded chin
    d.fillQuadCurve(5, 12, 8, 14, 11, 12, steel);
    // Side shading
    d.rect(4, 6, 2, 6, dark);
    d.rect(10, 6, 2, 6, dark);
    // Top highlight
    d.hLine(6, 3, 4, light);
    // T-visor slit
    d.rect(6, 7, 4, 2, visor);
    d.rect(7, 7, 2, 4, visor);
    // Gold brow trim
    d.hLine(5, 6, 6, gold);
    // Crest
    d.pixel(8, 2, light);
    return d.getCanvas();
}

export function generateKnightArmorIcon() {
    const d = new PixelDraw(16, 16);
    const steel = '#8e8e8e';
    const dark = '#4a4a4a';
    const light = '#b0b0b0';
    const gold = '#c9a73e';
    const chain = '#6b6b6b';
    // Armor body
    d.rect(4, 3, 8, 10, steel);
    // Sleeves/shoulders (wider)
    d.fillPath([
        { x: 2, y: 6 }, { x: 3, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 6 }
    ], steel);
    d.fillPath([
        { x: 14, y: 6 }, { x: 13, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 6 }
    ], steel);
    // Pauldron highlights
    d.hLine(2, 4, 4, light);
    d.hLine(10, 4, 4, light);
    // Chainmail collar
    d.fillPath([{ x: 7, y: 2 }, { x: 8, y: 5 }, { x: 9, y: 2 }], chain);
    // Gold cross emblem
    d.pixel(8, 6, gold);
    d.hLine(7, 7, 3, gold);
    d.pixel(8, 8, gold);
    // Gold belt
    d.hLine(4, 10, 8, gold);
    // Center seam
    d.vLine(8, 5, 4, dark);
    return d.getCanvas();
}

// ---- Ninja Icons ----

export function generateNinjaHoodIcon() {
    const d = new PixelDraw(16, 16);
    const cloth = '#1a1a1a';
    const dark = '#0d0d0d';
    const band = '#8b0000';
    // Hood dome
    d.fillQuadCurve(3, 8, 8, 2, 13, 8, cloth);
    d.rect(4, 6, 8, 7, cloth);
    // Eye slit
    d.rect(5, 8, 6, 2, '#2d2d2d');
    // Red headband
    d.rect(3, 7, 10, 2, band);
    // Trailing tails
    d.fillPath([
        { x: 13, y: 7 }, { x: 15, y: 6 },
        { x: 16, y: 8 }, { x: 14, y: 9 }
    ], band);
    // Side shadow
    d.vLine(4, 7, 5, dark);
    d.vLine(11, 7, 5, dark);
    return d.getCanvas();
}

export function generateNinjaSuitIcon() {
    const d = new PixelDraw(16, 16);
    const coat = '#1a1a1a';
    const dark = '#0d0d0d';
    const light = '#2d2d2d';
    const band = '#8b0000';
    // Body
    d.rect(4, 2, 8, 11, coat);
    // Sleeves
    d.fillPath([
        { x: 3, y: 8 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 8 }
    ], coat);
    d.fillPath([
        { x: 13, y: 8 }, { x: 12, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 8 }
    ], coat);
    // Cross wrap
    d.fillPath([
        { x: 5, y: 3 }, { x: 11, y: 8 }, { x: 11, y: 9 }, { x: 5, y: 4 }
    ], light);
    d.fillPath([
        { x: 11, y: 3 }, { x: 5, y: 8 }, { x: 5, y: 9 }, { x: 11, y: 4 }
    ], light);
    // Red belt/sash
    d.rect(4, 10, 8, 2, band);
    return d.getCanvas();
}

// ---- Pirate Icons ----

export function generatePirateHatIcon() {
    const d = new PixelDraw(16, 16);
    const hat = '#2c1810';
    const dark = '#1a0e08';
    const gold = '#c9a73e';
    const skull = '#ecf0f1';
    // Crown dome
    d.fillQuadCurve(4, 8, 8, 2, 12, 8, hat);
    // Top peak
    d.fillPath([
        { x: 6, y: 4 }, { x: 8, y: 1 }, { x: 10, y: 4 }
    ], hat);
    // Brim (turned up sides)
    d.fillPath([
        { x: 1, y: 9 }, { x: 4, y: 7 }, { x: 12, y: 7 },
        { x: 15, y: 9 }, { x: 14, y: 11 }, { x: 2, y: 11 }
    ], hat);
    // Gold trim
    d.hLine(2, 10, 12, gold);
    // Skull
    d.pixel(7, 5, skull);
    d.pixel(8, 5, skull);
    d.pixel(9, 5, skull);
    d.pixel(8, 6, skull);
    // Side shadow
    d.vLine(2, 8, 2, dark);
    d.vLine(13, 8, 2, dark);
    return d.getCanvas();
}

export function generatePirateCoatIcon() {
    const d = new PixelDraw(16, 16);
    const coat = '#8b0000';
    const dark = '#5c0000';
    const gold = '#c9a73e';
    const shirt = '#ecf0f1';
    // Coat body
    d.rect(4, 2, 8, 6, coat);
    // Sleeves
    d.fillPath([
        { x: 3, y: 8 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 8 }
    ], coat);
    d.fillPath([
        { x: 13, y: 8 }, { x: 12, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 8 }
    ], coat);
    // Coat tails
    d.fillPath([
        { x: 4, y: 8 }, { x: 3, y: 15 }, { x: 7, y: 15 }, { x: 7, y: 8 }
    ], coat);
    d.fillPath([
        { x: 9, y: 8 }, { x: 9, y: 15 }, { x: 13, y: 15 }, { x: 12, y: 8 }
    ], coat);
    // White shirt V
    d.fillPath([{ x: 7, y: 2 }, { x: 8, y: 5 }, { x: 9, y: 2 }], shirt);
    // Gold buttons
    d.pixel(6, 4, gold);
    d.pixel(6, 6, gold);
    d.pixel(10, 4, gold);
    d.pixel(10, 6, gold);
    // Gold trim on tails
    d.hLine(3, 14, 4, gold);
    d.hLine(9, 14, 4, gold);
    return d.getCanvas();
}

export function generateEyepatchIcon() {
    const d = new PixelDraw(16, 16);
    const patch = '#1a1a1a';
    const strap = '#2c1810';
    const skin = '#f5cba7';
    // Face
    d.fillQuadCurve(3, 4, 8, 1, 13, 4, skin);
    d.rect(4, 4, 8, 6, skin);
    // Good eye
    d.pixel(6, 6, '#333');
    // Strap
    d.hLine(2, 7, 4, strap);
    d.hLine(12, 7, 3, strap);
    // Eyepatch
    d.rect(9, 5, 4, 4, patch);
    d.rect(9, 5, 4, 1, strap);
    d.rect(9, 8, 4, 1, strap);
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
