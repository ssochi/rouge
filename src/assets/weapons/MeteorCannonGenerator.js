import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateMeteorCannon() {
    const width = 28;
    const height = 16;
    const drawer = new PixelDraw(width, height);

    const cBody = '#4e342e';
    const cBodyLight = '#6d4c41';
    const cDark = '#3e2723';
    const cGrip = '#1a1a1a';
    const cOrange = '#ff6d00';
    const cOrangeBright = '#ff9100';
    const cRed = '#d84315';
    const cYellow = '#ffc107';
    const cMetal = '#757575';
    const cMetalLight = '#9e9e9e';

    // Stock (heavy, reinforced)
    drawer.rect(0, 5, 4, 5, cBody);
    drawer.rect(0, 5, 4, 1, cBodyLight);
    drawer.pixel(1, 6, cMetal);
    drawer.pixel(2, 7, cMetal);

    // Receiver body (bulky)
    drawer.rect(4, 3, 12, 9, cBody);
    drawer.hLine(4, 3, 12, cBodyLight);
    drawer.hLine(4, 11, 12, cDark);

    // Meteor chamber (glowing core)
    drawer.rect(7, 4, 6, 7, cDark);
    drawer.rect(8, 5, 4, 5, cRed);
    drawer.rect(9, 6, 2, 3, cOrange);
    drawer.pixel(9, 6, cYellow);
    drawer.pixel(10, 7, cOrangeBright);

    // Heat vents on sides
    drawer.pixel(5, 5, cOrange);
    drawer.pixel(5, 7, cOrangeBright);
    drawer.pixel(5, 9, cOrange);

    // Grip
    drawer.fillPath([
        {x: 7, y: 12}, {x: 10, y: 12}, {x: 9, y: 15}, {x: 6, y: 15}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 10, y: 12}, {x: 11, y: 13}, {x: 13, y: 12}
    ], cBody);

    // Barrel (wide bore)
    drawer.rect(16, 4, 8, 8, cBody);
    drawer.rect(17, 5, 6, 6, cDark);
    drawer.hLine(16, 4, 8, cMetal);

    // Internal rifling (decorative)
    drawer.hLine(18, 7, 4, cMetalLight);
    drawer.hLine(18, 8, 4, cMetal);

    // Muzzle with flame ring
    drawer.rect(24, 3, 4, 10, cMetalLight);
    drawer.rect(25, 4, 2, 8, cDark);
    // Molten ring
    drawer.pixel(27, 4, cOrange);
    drawer.pixel(27, 6, cRed);
    drawer.pixel(27, 8, cYellow);
    drawer.pixel(27, 10, cOrange);
    drawer.pixel(27, 12, cRed);

    // Top rail with heat sink
    drawer.rect(5, 2, 4, 1, cMetal);
    drawer.pixel(6, 2, cOrange);
    drawer.pixel(8, 2, cRed);

    return drawer.getCanvas();
}

export const METEOR_CANNON_SPRITE = generateMeteorCannon();
