import { PixelDraw } from '../../utils/PixelDraw.js';

export function generateStormRevolver() {
    const width = 22;
    const height = 14;
    const drawer = new PixelDraw(width, height);

    const cBody = '#263238';
    const cBodyLight = '#37474f';
    const cDark = '#1a1a2e';
    const cGrip = '#4a148c';
    const cGripLight = '#6a1b9a';
    const cElectric = '#ffeb3b';
    const cElectricBright = '#fff59d';
    const cBlue = '#42a5f5';
    const cMetal = '#78909c';

    // Frame body
    drawer.rect(3, 3, 10, 6, cBody);
    drawer.hLine(3, 3, 10, cBodyLight);
    drawer.hLine(3, 8, 10, cDark);

    // Cylinder (revolver drum with lightning coils)
    drawer.rect(6, 3, 5, 6, cBodyLight);
    drawer.rect(7, 4, 3, 4, cDark);
    // Lightning coils in cylinder
    drawer.pixel(7, 4, cElectric);
    drawer.pixel(9, 5, cElectricBright);
    drawer.pixel(8, 6, cElectric);
    drawer.pixel(7, 7, cElectricBright);

    // Grip (purple themed)
    drawer.fillPath([
        {x: 5, y: 9}, {x: 8, y: 9}, {x: 7, y: 13}, {x: 4, y: 13}
    ], cGrip);
    drawer.vLine(6, 10, 3, cGripLight);

    // Trigger guard
    drawer.strokePath([
        {x: 8, y: 9}, {x: 9, y: 10}, {x: 11, y: 9}
    ], cBody);

    // Barrel with tesla coil
    drawer.rect(13, 4, 6, 4, cBody);
    drawer.hLine(13, 4, 6, cMetal);
    drawer.hLine(14, 5, 4, cDark);
    // Electrical arcs on barrel
    drawer.pixel(15, 4, cBlue);
    drawer.pixel(17, 4, cElectric);

    // Muzzle with arc emitter
    drawer.rect(19, 3, 3, 6, cMetal);
    drawer.rect(20, 4, 1, 4, cDark);
    // Arc tips
    drawer.pixel(21, 3, cElectric);
    drawer.pixel(21, 5, cBlue);
    drawer.pixel(21, 8, cElectric);

    // Hammer (back of revolver)
    drawer.rect(2, 2, 2, 3, cBody);
    drawer.pixel(2, 2, cElectricBright);

    // Top sight
    drawer.rect(14, 3, 2, 1, cDark);
    drawer.pixel(14, 3, cElectric);

    return drawer.getCanvas();
}

export const STORM_REVOLVER_SPRITE = generateStormRevolver();
