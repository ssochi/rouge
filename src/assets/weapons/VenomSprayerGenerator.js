import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateVenomSprayer() {
    const width = 28;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#33691e';
    const cBodyLight = '#558b2f';
    const cDark = '#1b5e20';
    const cGrip = '#1a1a1a';
    const cTank = '#76ff03';
    const cTankDark = '#64dd17';
    const cToxic = '#c6ff00';
    const cMetal = '#616161';
    const cMetalLight = '#9e9e9e';

    // Rear tank (venom reservoir)
    drawer.rect(0, 3, 5, 7, cDark);
    drawer.rect(1, 4, 3, 5, cTankDark);
    // Bubbling liquid effect
    drawer.pixel(2, 5, cTank);
    drawer.pixel(3, 6, cToxic);
    drawer.pixel(1, 7, cTank);

    // Receiver body
    drawer.rect(5, 3, 10, 7, cBody);
    drawer.hLine(5, 3, 10, cBodyLight);
    drawer.hLine(5, 9, 10, cDark);

    // Pressure system
    drawer.rect(8, 4, 4, 5, cMetal);
    drawer.rect(9, 5, 2, 3, cMetalLight);
    // Pressure gauge
    drawer.pixel(9, 5, cToxic);
    drawer.pixel(10, 6, cTank);

    // Grip
    drawer.fillPath([
        {x: 7, y: 10}, {x: 10, y: 10}, {x: 9, y: 13}, {x: 6, y: 13}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 10, y: 10}, {x: 11, y: 11}, {x: 13, y: 10}
    ], cBody);

    // Barrel / nozzle assembly
    drawer.rect(15, 4, 8, 5, cBody);
    drawer.hLine(15, 4, 8, cBodyLight);
    drawer.hLine(15, 8, 8, cDark);
    // Internal tube
    drawer.hLine(16, 6, 6, cTankDark);

    // Wide spray nozzle
    drawer.fillPath([
        {x: 23, y: 3}, {x: 28, y: 1}, {x: 28, y: 12}, {x: 23, y: 10}
    ], cMetal);
    drawer.fillPath([
        {x: 24, y: 4}, {x: 27, y: 2}, {x: 27, y: 11}, {x: 24, y: 9}
    ], cDark);
    // Toxic drip at nozzle
    drawer.pixel(27, 5, cTank);
    drawer.pixel(27, 8, cToxic);

    // Hazard marking on body
    drawer.pixel(6, 4, cToxic);
    drawer.pixel(6, 6, cToxic);

    return drawer.getCanvas();
}

export const VENOM_SPRAYER_SPRITE = generateVenomSprayer();
