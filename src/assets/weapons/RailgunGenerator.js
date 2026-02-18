import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateRailgun() {
    const width = 28;
    const height = 12;
    const drawer = new PixelDraw(width, height);

    const cBody = '#263238';
    const cBodyLight = '#37474f';
    const cDark = '#1a1a1a';
    const cGrip = '#1a1a1a';
    const cRail = '#b0bec5';
    const cEnergy = '#00bcd4';
    const cEnergyGlow = '#4dd0e1';

    // Capacitor bank (rear)
    drawer.rect(0, 3, 4, 6, cDark);
    drawer.rect(1, 4, 2, 4, cBody);
    drawer.pixel(1, 5, cEnergy);
    drawer.pixel(2, 6, cEnergyGlow);

    // Receiver body
    drawer.rect(4, 3, 10, 6, cBody);
    drawer.hLine(4, 3, 10, cBodyLight);
    drawer.hLine(4, 8, 10, cDark);

    // Energy core
    drawer.rect(8, 4, 4, 4, cDark);
    drawer.rect(9, 5, 2, 2, cEnergy);
    drawer.pixel(9, 5, cEnergyGlow);
    drawer.pixel(10, 6, cEnergyGlow);

    // Grip
    drawer.fillPath([
        {x: 7, y: 9}, {x: 10, y: 9}, {x: 9, y: 11}, {x: 6, y: 11}
    ], cGrip);

    // Trigger guard
    drawer.strokePath([
        {x: 10, y: 9}, {x: 11, y: 10}, {x: 13, y: 9}
    ], cBody);

    // Top rail (electromagnetic)
    drawer.rect(14, 2, 14, 2, cRail);
    drawer.hLine(14, 2, 14, cEnergyGlow);

    // Bottom rail
    drawer.rect(14, 8, 14, 2, cRail);
    drawer.hLine(14, 9, 14, cDark);

    // Barrel body (between rails)
    drawer.rect(14, 4, 10, 4, cBody);
    drawer.hLine(15, 5, 8, cEnergy);
    drawer.hLine(15, 6, 8, cBodyLight);

    // Rail tips (extend past body)
    drawer.rect(24, 2, 4, 2, cRail);
    drawer.rect(24, 8, 4, 2, cRail);
    drawer.pixel(27, 3, cEnergy);
    drawer.pixel(27, 8, cEnergy);

    // Energy conduit line
    drawer.hLine(14, 6, 10, cEnergy);

    return drawer.getCanvas();
}

export const RAILGUN_SPRITE = generateRailgun();
