import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Black Hole Gun Generator (Gravitational Weapon)
 * Dimensions: 26x14
 */
export function generateBlackHoleGun() {
    const width = 26;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#1a1a2e';        // Very dark blue-black body
    const cBodyLight = '#2d2d44';   // Body highlight
    const cDark = '#0d0d1a';        // Darkest accents
    const cPurple = '#9b59b6';      // Purple energy
    const cPurpleDark = '#6c3483';  // Dark purple
    const cPurpleBright = '#c39bd3'; // Bright purple highlight
    const cGrip = '#111111';        // Grip
    const cMetal = '#444466';       // Metal trim
    const cVoid = '#050510';        // Void/emitter core

    // -- Stock (Short, angular) --
    drawer.fillPath([
        {x: 0, y: 5},
        {x: 4, y: 5},
        {x: 4, y: 9},
        {x: 0, y: 8}
    ], cBody);
    drawer.hLine(0, 5, 4, cBodyLight);
    drawer.pixel(1, 7, cPurple); // Small energy indicator

    // -- Receiver body --
    drawer.rect(4, 4, 12, 5, cBody);
    drawer.hLine(4, 4, 12, cBodyLight); // Top rail
    drawer.hLine(4, 8, 12, cDark);      // Bottom shadow

    // -- Energy conduits (purple lines) --
    drawer.hLine(5, 5, 10, cPurpleDark);
    drawer.hLine(5, 7, 10, cPurpleDark);
    // Bright energy nodes
    drawer.pixel(7, 5, cPurple);
    drawer.pixel(10, 5, cPurple);
    drawer.pixel(13, 5, cPurple);
    drawer.pixel(7, 7, cPurple);
    drawer.pixel(10, 7, cPurple);
    drawer.pixel(13, 7, cPurple);

    // -- Gravity core chamber (center) --
    drawer.rect(8, 5, 4, 3, cDark);
    drawer.pixel(9, 6, cPurpleBright);
    drawer.pixel(10, 6, cPurpleBright);

    // -- Pistol Grip --
    drawer.fillPath([
        {x: 7, y: 9},
        {x: 10, y: 9},
        {x: 9, y: 13},
        {x: 6, y: 13}
    ], cGrip);

    // -- Trigger guard --
    drawer.strokePath([
        {x: 9, y: 9},
        {x: 10, y: 10},
        {x: 12, y: 9}
    ], cBody);

    // -- Barrel (short, wide) --
    drawer.rect(16, 4, 6, 5, cBody);
    drawer.hLine(16, 4, 6, cMetal);
    // Energy lines along barrel
    drawer.hLine(17, 5, 4, cPurpleDark);
    drawer.hLine(17, 7, 4, cPurpleDark);

    // -- Emitter (wide aperture with void core) --
    drawer.rect(22, 3, 4, 7, cDark);
    drawer.rect(23, 4, 2, 5, cVoid);
    // Purple energy ring around emitter
    drawer.pixel(22, 3, cPurple);
    drawer.pixel(22, 9, cPurple);
    drawer.pixel(25, 3, cPurple);
    drawer.pixel(25, 9, cPurple);
    drawer.vLine(22, 4, 5, cPurpleDark);
    drawer.vLine(25, 4, 5, cPurpleDark);
    // Central void glow
    drawer.pixel(24, 6, cPurple);

    return drawer.getCanvas();
}

export const BLACK_HOLE_GUN_SPRITE = generateBlackHoleGun();
