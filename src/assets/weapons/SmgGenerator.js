import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural SMG Generator (UZI / MAC-10 Style)
 * Dimensions: 16x14
 */
export function generateSmg() {
    const width = 16;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#546e7a';       // Receiver (Blue-Grey)
    const cBodyDark = '#37474f';   // Receiver Shadow
    const cBarrel = '#455a64';     // Barrel
    const cGrip = '#263238';       // Grip (Dark)
    const cMag = '#37474f';        // Magazine
    const cHighlight = '#78909c';  // Metal Highlight
    const cBlack = '#1a1a1a';      // Sights / Bolt

    // -- Folded Stock Hint (back, thin line) --
    drawer.hLine(1, 4, 2, cBodyDark);
    drawer.pixel(1, 5, cBodyDark);

    // -- Receiver Body --
    drawer.rect(3, 3, 9, 5, cBody);
    // Top highlight
    drawer.hLine(3, 3, 9, cHighlight);
    // Bottom shadow
    drawer.hLine(3, 7, 9, cBodyDark);

    // -- Ejection Port --
    drawer.rect(7, 4, 3, 1, cHighlight);

    // -- Barrel (short & stubby) --
    drawer.rect(12, 4, 3, 2, cBarrel);
    // Barrel tip
    drawer.pixel(15, 4, cBlack);
    drawer.pixel(15, 5, cBlack);

    // -- Cocking Handle --
    drawer.rect(4, 2, 2, 1, cBodyDark);

    // -- Sights --
    drawer.pixel(4, 2, cBlack);   // Rear
    drawer.pixel(14, 3, cBlack);  // Front

    // -- Grip (angled) --
    drawer.fillPath([
        {x: 5, y: 8},
        {x: 8, y: 8},
        {x: 7, y: 13},
        {x: 4, y: 13}
    ], cGrip);
    // Grip texture
    drawer.vLine(6, 9, 3, cBodyDark);

    // -- Magazine (protruding forward of grip) --
    drawer.fillPath([
        {x: 8, y: 7},
        {x: 11, y: 7},
        {x: 10, y: 13},
        {x: 7, y: 13}
    ], cMag);
    // Magazine rib
    drawer.vLine(9, 8, 4, cBlack);

    // -- Trigger Guard --
    drawer.strokePath([
        {x: 7, y: 8},
        {x: 8, y: 9},
        {x: 9, y: 8}
    ], cBodyDark);
    // Trigger
    drawer.pixel(8, 8, cBlack);

    return drawer.getCanvas();
}

export const SMG_SPRITE = generateSmg();
