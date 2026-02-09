import { PixelDraw } from '../../utils/PixelDraw.js';

// Shared colors for both states
const COLORS = {
    metal: '#455a64',
    metalDark: '#263238',
    metalLight: '#78909c',
    string: '#bdc3c7',
    grip: '#1a1a1a',
    bolt: '#5d4037',
    boltTip: '#90a4ae',
    fletch: '#e74c3c',
    limb: '#4e342e',
    limbLight: '#6d4c41',
    limbDark: '#3e2723',
    railShadow: '#1a2530'
};

/**
 * Draw the crossbow body (shared between loaded and fired states)
 */
function drawBody(drawer, c) {
    // -- Stock (compact, rear) --
    drawer.fillPath([
        { x: 0, y: 6 },
        { x: 4, y: 6 },
        { x: 4, y: 10 },
        { x: 0, y: 10 }
    ], c.metalDark);
    drawer.vLine(0, 6, 4, c.grip);         // Buttpad
    drawer.hLine(1, 6, 3, c.metalLight);   // Top highlight

    // -- Main Rail / Body --
    drawer.rect(4, 7, 14, 2, c.metalDark);
    drawer.hLine(4, 7, 14, c.metalLight);  // Top rail highlight
    drawer.hLine(4, 8, 14, c.railShadow);  // Bottom shadow
    // Rail groove
    drawer.hLine(6, 7, 12, c.metal);

    // -- Limb Mount Block (where limbs attach) --
    drawer.rect(15, 5, 3, 6, c.metal);
    drawer.vLine(15, 5, 6, c.metalLight);  // Left edge highlight
    drawer.vLine(17, 5, 6, c.metalDark);   // Right edge shadow
    drawer.pixel(16, 7, c.metalDark);      // Axle detail
    drawer.pixel(16, 9, c.metalDark);

    // -- Sight (small iron sight) --
    drawer.pixel(9, 5, c.metalDark);
    drawer.pixel(9, 6, c.metalLight);      // Front post

    // -- Trigger Guard & Trigger --
    drawer.strokePath([
        { x: 7, y: 9 },
        { x: 8, y: 11 },
        { x: 10, y: 9 }
    ], c.metal);
    drawer.pixel(8, 9, c.metalLight);      // Trigger

    // -- Grip --
    drawer.fillPath([
        { x: 6, y: 9 },
        { x: 9, y: 9 },
        { x: 8, y: 13 },
        { x: 5, y: 13 }
    ], c.grip);
    drawer.pixel(6, 11, c.metalDark);      // Grip texture
    drawer.pixel(7, 12, c.metalDark);
}

/**
 * Procedural Crossbow Generator - Loaded State (Cocked, bolt ready)
 * Dimensions: 24x16
 * Pivot: (8, 9) - at grip area
 */
export function generateCrossbow() {
    const width = 24;
    const height = 16;
    const drawer = new PixelDraw(width, height);
    const c = COLORS;

    drawBody(drawer, c);

    // -- Top Limb (pulled back / cocked position) --
    // Limb drawn back: tips point more backward-upward
    drawer.fillPath([
        { x: 16, y: 5 },
        { x: 17, y: 5 },
        { x: 21, y: 1 },
        { x: 20, y: 0 }
    ], c.limb);
    drawer.fillPath([
        { x: 17, y: 6 },
        { x: 18, y: 6 },
        { x: 22, y: 2 },
        { x: 21, y: 1 }
    ], c.limbDark);
    // Recurve tip
    drawer.pixel(21, 0, c.limbLight);
    drawer.pixel(22, 1, c.limbLight);
    // Tip cam
    drawer.pixel(22, 0, c.metalLight);

    // -- Bottom Limb (mirror, pulled back) --
    drawer.fillPath([
        { x: 16, y: 11 },
        { x: 17, y: 11 },
        { x: 21, y: 15 },
        { x: 20, y: 16 }
    ], c.limb);
    drawer.fillPath([
        { x: 17, y: 10 },
        { x: 18, y: 10 },
        { x: 22, y: 14 },
        { x: 21, y: 15 }
    ], c.limbDark);
    // Recurve tip
    drawer.pixel(21, 15, c.limbLight);
    drawer.pixel(22, 15, c.limbLight);
    // Tip cam
    drawer.pixel(22, 16, c.metalLight);

    // -- String (V-shape, pulled back to latch) --
    drawer.line(22, 0, 10, 8, c.string);
    drawer.line(22, 16, 10, 8, c.string);

    // -- Loaded Bolt --
    drawer.hLine(10, 8, 13, c.bolt);       // Shaft
    drawer.pixel(23, 8, c.boltTip);        // Tip (broadhead)
    drawer.pixel(22, 8, c.boltTip);
    drawer.pixel(10, 7, c.fletch);         // Top fletching
    drawer.pixel(10, 9, c.fletch);         // Bottom fletching
    drawer.pixel(11, 7, c.fletch);
    drawer.pixel(11, 9, c.fletch);

    return drawer.getCanvas();
}

/**
 * Procedural Crossbow Generator - Fired State (Limbs snapped forward, no bolt)
 * Same dimensions & pivot as loaded state
 */
export function generateCrossbowFired() {
    const width = 24;
    const height = 16;
    const drawer = new PixelDraw(width, height);
    const c = COLORS;

    drawBody(drawer, c);

    // -- Top Limb (relaxed / snapped forward) --
    // Limb tips point more forward-outward
    drawer.fillPath([
        { x: 16, y: 5 },
        { x: 17, y: 5 },
        { x: 23, y: 2 },
        { x: 23, y: 3 }
    ], c.limb);
    drawer.fillPath([
        { x: 17, y: 6 },
        { x: 18, y: 6 },
        { x: 23, y: 4 },
        { x: 23, y: 3 }
    ], c.limbDark);
    // Tip
    drawer.pixel(23, 2, c.limbLight);
    drawer.pixel(23, 1, c.metalLight);

    // -- Bottom Limb (mirror, relaxed) --
    drawer.fillPath([
        { x: 16, y: 11 },
        { x: 17, y: 11 },
        { x: 23, y: 14 },
        { x: 23, y: 13 }
    ], c.limb);
    drawer.fillPath([
        { x: 17, y: 10 },
        { x: 18, y: 10 },
        { x: 23, y: 12 },
        { x: 23, y: 13 }
    ], c.limbDark);
    // Tip
    drawer.pixel(23, 14, c.limbLight);
    drawer.pixel(23, 15, c.metalLight);

    // -- String (wider V, relaxed at front) --
    drawer.line(23, 1, 18, 8, c.string);
    drawer.line(23, 15, 18, 8, c.string);

    // No bolt - rail is empty

    return drawer.getCanvas();
}

export const CROSSBOW_SPRITE = generateCrossbow();
export const CROSSBOW_FIRED_SPRITE = generateCrossbowFired();
