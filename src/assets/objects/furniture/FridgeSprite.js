import { PixelDraw } from '../../../utils/PixelDraw.js';
import { KitchenPalette } from './KitchenPalette.js';

export function createFridgeSprite() {
    // Tall refrigerator, 2.5D top-down. 16x28 (1x1 tile).
    const w = 16;
    const h = 28;
    const drawer = new PixelDraw(w, h);

    const {
        cAppliance, cApplianceLight, cApplianceShadow,
        cApplianceDark, cApplianceOutline,
        cSteel, cSteelDark,
        cShadow, cShadowDeep
    } = KitchenPalette;

    // === 2.5D fridge: top surface at top, front face below ===

    const topH = 4;     // Top surface depth
    const bodyH = 22;   // Front face height
    const baseH = 2;    // Base/feet

    // 1. Base feet (near ground)
    drawer.fillPath([
        { x: 2, y: h - baseH }, { x: w - 2, y: h - baseH },
        { x: w - 2, y: h }, { x: 2, y: h }
    ], cApplianceDark);
    drawer.hLine(3, h - 1, w - 6, cApplianceOutline);

    // 2. Main body front face
    drawer.fillPath([
        { x: 0, y: topH }, { x: w, y: topH },
        { x: w, y: h - baseH }, { x: 0, y: h - baseH }
    ], cAppliance);

    // 3. Freezer compartment (upper portion of front)
    const freezerH = 8;
    drawer.fillPath([
        { x: 1, y: topH + 1 }, { x: w - 1, y: topH + 1 },
        { x: w - 1, y: topH + freezerH }, { x: 1, y: topH + freezerH }
    ], cApplianceLight);
    // Freezer border
    drawer.hLine(1, topH + freezerH, w - 2, cApplianceShadow);

    // 4. Fridge compartment (lower portion of front)
    drawer.fillPath([
        { x: 1, y: topH + freezerH + 1 }, { x: w - 1, y: topH + freezerH + 1 },
        { x: w - 1, y: h - baseH - 1 }, { x: 1, y: h - baseH - 1 }
    ], cApplianceLight);

    // 5. Door seam (horizontal divider between freezer and fridge)
    drawer.hLine(1, topH + freezerH, w - 2, cApplianceOutline);

    // 6. Handles (steel, right side)
    // Freezer handle
    drawer.vLine(w - 3, topH + 3, 3, cSteel);
    drawer.pixel(w - 3, topH + 3, cApplianceLight);
    // Fridge handle
    drawer.vLine(w - 3, topH + freezerH + 3, 5, cSteel);
    drawer.pixel(w - 3, topH + freezerH + 3, cApplianceLight);

    // 7. Top surface (darker perspective)
    drawer.fillPath([
        { x: 0, y: 0 }, { x: w, y: 0 },
        { x: w, y: topH }, { x: 0, y: topH }
    ], cApplianceShadow);
    // Top surface inner highlight
    drawer.fillPath([
        { x: 1, y: 1 }, { x: w - 1, y: 1 },
        { x: w - 1, y: topH - 1 }, { x: 1, y: topH - 1 }
    ], cApplianceDark);
    // Top edge highlight
    drawer.hLine(1, 0, w - 2, cApplianceLight);

    // 8. Edge definition
    drawer.vLine(0, topH, bodyH, cApplianceLight);
    drawer.vLine(w - 1, topH, bodyH, cApplianceOutline);

    // 9. Right-side shadow overlay
    drawer.fillPath([
        { x: w - 3, y: topH + 1 }, { x: w - 1, y: topH + 1 },
        { x: w - 1, y: h - baseH - 1 }, { x: w - 3, y: h - baseH - 1 }
    ], cShadow);

    // 10. Bottom edge shadow
    drawer.hLine(1, h - baseH, w - 2, cShadowDeep);

    return drawer.getCanvas();
}
