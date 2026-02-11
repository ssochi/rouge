import { PixelDraw } from '../../../utils/PixelDraw.js';
import { KitchenPalette } from './KitchenPalette.js';

export function createStoveSprite() {
    // Kitchen stove/range with burners on top, oven door in front. 16x24 (1x1 tile).
    const w = 16;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const {
        cAppliance, cApplianceLight, cApplianceShadow,
        cApplianceDark, cApplianceOutline,
        cSteel, cSteelDark,
        cBurnerGrate, cBurnerDark,
        cFlame, cFlameLight,
        cShadow, cShadowDeep
    } = KitchenPalette;

    const topH = 8;     // Top surface with burners
    const frontH = 14;  // Oven front face
    const baseH = 2;    // Base

    // === 2.5D stove: burners on top, oven face in front ===

    // 1. Base (near ground)
    drawer.fillPath([
        { x: 1, y: h - baseH }, { x: w - 1, y: h - baseH },
        { x: w - 1, y: h }, { x: 1, y: h }
    ], cApplianceDark);

    // 2. Oven front face (main body)
    drawer.fillPath([
        { x: 0, y: topH }, { x: w, y: topH },
        { x: w, y: h - baseH }, { x: 0, y: h - baseH }
    ], cAppliance);

    // 3. Oven door (recessed panel)
    const doorY = topH + 2;
    const doorH = frontH - 5;
    drawer.fillPath([
        { x: 2, y: doorY }, { x: w - 2, y: doorY },
        { x: w - 2, y: doorY + doorH }, { x: 2, y: doorY + doorH }
    ], cShadowDeep);
    drawer.fillPath([
        { x: 3, y: doorY + 1 }, { x: w - 3, y: doorY + 1 },
        { x: w - 3, y: doorY + doorH - 1 }, { x: 3, y: doorY + doorH - 1 }
    ], cApplianceShadow);
    // Oven window (dark glass)
    drawer.fillPath([
        { x: 4, y: doorY + 2 }, { x: w - 4, y: doorY + 2 },
        { x: w - 4, y: doorY + 5 }, { x: 4, y: doorY + 5 }
    ], '#303030');
    // Glass reflection
    drawer.pixel(5, doorY + 2, '#505050');
    drawer.pixel(6, doorY + 3, '#484848');

    // Oven door handle (steel bar)
    drawer.hLine(4, doorY, 8, cSteel);
    drawer.pixel(4, doorY, cApplianceLight);

    // Oven door bevels
    drawer.hLine(3, doorY + 1, w - 6, cApplianceLight);
    drawer.hLine(3, doorY + doorH - 1, w - 6, cApplianceOutline);

    // 4. Top surface (darker for perspective)
    drawer.fillPath([
        { x: 0, y: 0 }, { x: w, y: 0 },
        { x: w, y: topH }, { x: 0, y: topH }
    ], cApplianceShadow);
    // Surface inner
    drawer.fillPath([
        { x: 1, y: 1 }, { x: w - 1, y: 1 },
        { x: w - 1, y: topH - 1 }, { x: 1, y: topH - 1 }
    ], cApplianceDark);

    // 5. Burner grates (2x2 grid, simplified)
    // Top-left burner
    drawer.fillPath([
        { x: 2, y: 1 }, { x: 6, y: 1 },
        { x: 6, y: 3 }, { x: 2, y: 3 }
    ], cBurnerGrate);
    drawer.pixel(3, 2, cBurnerDark);
    drawer.pixel(4, 2, cFlame);
    // Top-right burner
    drawer.fillPath([
        { x: 10, y: 1 }, { x: 14, y: 1 },
        { x: 14, y: 3 }, { x: 10, y: 3 }
    ], cBurnerGrate);
    drawer.pixel(11, 2, cBurnerDark);
    drawer.pixel(12, 2, cFlameLight);
    // Bottom-left burner
    drawer.fillPath([
        { x: 2, y: 5 }, { x: 6, y: 5 },
        { x: 6, y: 7 }, { x: 2, y: 7 }
    ], cBurnerGrate);
    drawer.pixel(3, 6, cBurnerDark);
    drawer.pixel(4, 6, cBurnerDark);
    // Bottom-right burner
    drawer.fillPath([
        { x: 10, y: 5 }, { x: 14, y: 5 },
        { x: 14, y: 7 }, { x: 10, y: 7 }
    ], cBurnerGrate);
    drawer.pixel(11, 6, cBurnerDark);
    drawer.pixel(12, 6, cBurnerDark);

    // 6. Top edge highlight
    drawer.hLine(1, 0, w - 2, cApplianceLight);

    // 7. Edge definition
    drawer.vLine(0, topH, frontH, cApplianceLight);
    drawer.vLine(w - 1, topH, frontH, cApplianceOutline);
    drawer.hLine(1, h - baseH, w - 2, cApplianceOutline);

    // 8. Right-side shadow
    drawer.fillPath([
        { x: w - 3, y: topH + 1 }, { x: w - 1, y: topH + 1 },
        { x: w - 1, y: h - baseH - 1 }, { x: w - 3, y: h - baseH - 1 }
    ], cShadow);

    return drawer.getCanvas();
}
