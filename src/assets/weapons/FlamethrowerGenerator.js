import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Flamethrower Generator (Military Flamethrower)
 * Dimensions: 30x14
 */
export function generateFlamethrower() {
    const width = 30;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cTube = '#556b2f';        // Main tube (olive drab)
    const cTubeLight = '#6b8e23';   // Tube highlight
    const cTubeDark = '#3b4d23';    // Tube shadow
    const cTank = '#4a5d23';        // Fuel tank
    const cTankLight = '#698b22';   // Tank highlight
    const cTankBand = '#333333';    // Tank straps
    const cNozzle = '#333333';      // Nozzle metal
    const cNozzleDark = '#1a1a1a';  // Nozzle dark
    const cGrip = '#1a1a1a';        // Grip
    const cMetal = '#666666';       // Metal fittings
    const cFlame = '#ff6600';       // Pilot light
    const cGauge = '#ffffff';       // Pressure gauge

    // -- Fuel Tank (underneath, rear) --
    drawer.rect(2, 8, 10, 4, cTank);
    drawer.hLine(2, 8, 10, cTankLight);
    drawer.hLine(2, 11, 10, cTubeDark);
    // Tank straps
    drawer.vLine(4, 8, 4, cTankBand);
    drawer.vLine(9, 8, 4, cTankBand);
    // Pressure gauge
    drawer.pixel(6, 9, cGauge);
    drawer.pixel(7, 9, cMetal);
    // End caps
    drawer.vLine(2, 9, 2, cMetal);
    drawer.vLine(11, 9, 2, cMetal);

    // -- Main Tube (fuel line + ignition chamber) --
    drawer.rect(3, 4, 20, 3, cTube);
    drawer.hLine(3, 4, 20, cTubeLight);
    drawer.hLine(3, 6, 20, cTubeDark);

    // -- Connection pipe (tank to tube) --
    drawer.vLine(7, 7, 1, cMetal);
    drawer.vLine(8, 7, 1, cMetal);

    // -- Rear cap --
    drawer.rect(1, 4, 2, 3, cMetal);
    drawer.vLine(1, 4, 3, cTubeDark);

    // -- Pistol Grip --
    drawer.fillPath([
        {x: 10, y: 7},
        {x: 13, y: 7},
        {x: 12, y: 11},
        {x: 9, y: 11}
    ], cGrip);

    // -- Front Grip --
    drawer.fillPath([
        {x: 17, y: 7},
        {x: 19, y: 7},
        {x: 19, y: 10},
        {x: 17, y: 10}
    ], cGrip);

    // -- Trigger guard --
    drawer.strokePath([
        {x: 12, y: 7},
        {x: 13, y: 8},
        {x: 15, y: 7}
    ], cTube);

    // -- Nozzle (wider aperture) --
    drawer.rect(23, 3, 5, 5, cNozzle);
    drawer.rect(24, 3, 3, 1, cMetal);
    drawer.rect(24, 7, 3, 1, cMetal);
    drawer.rect(27, 4, 3, 3, cNozzleDark);
    drawer.pixel(28, 5, cNozzle);

    // -- Pilot light (orange glow at nozzle tip) --
    drawer.pixel(29, 5, cFlame);
    drawer.pixel(28, 4, '#ff9900');

    // -- Ignition wire along barrel --
    drawer.hLine(15, 5, 8, cMetal);

    return drawer.getCanvas();
}

export const FLAMETHROWER_SPRITE = generateFlamethrower();
