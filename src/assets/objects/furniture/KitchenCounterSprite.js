import { PixelDraw } from '../../../utils/PixelDraw.js';
import { KitchenPalette } from './KitchenPalette.js';

export function createKitchenCounterSprite() {
    // Long kitchen counter/workspace with cabinets below. 48x24 (2x1 tile).
    const w = 48;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const {
        cCounter, cCounterLight, cCounterDark, cCounterOutline,
        cAppliance, cApplianceLight, cApplianceShadow,
        cApplianceOutline,
        cSteel, cSteelDark,
        cShadow, cShadowDeep
    } = KitchenPalette;

    const topH = 5;     // Counter surface depth
    const frontH = 15;  // Cabinet front face
    const baseH = 4;    // Kick plate

    // === 2.5D kitchen counter: stone top, cabinet doors below ===

    // 1. Base kick plate
    drawer.fillPath([
        { x: 2, y: h - baseH }, { x: w - 2, y: h - baseH },
        { x: w - 2, y: h }, { x: 2, y: h }
    ], cApplianceOutline);
    drawer.hLine(3, h - 1, w - 6, cShadowDeep);

    // 2. Cabinet body (front face)
    drawer.fillPath([
        { x: 0, y: topH }, { x: w, y: topH },
        { x: w, y: h - baseH }, { x: 0, y: h - baseH }
    ], cAppliance);

    // 3. Three cabinet doors
    const doorY = topH + 2;
    const doorH = frontH - 5;
    const doorW = 12;
    const doors = [3, 18, 33]; // x positions

    for (const dx of doors) {
        // Door recess
        drawer.fillPath([
            { x: dx, y: doorY }, { x: dx + doorW, y: doorY },
            { x: dx + doorW, y: doorY + doorH }, { x: dx, y: doorY + doorH }
        ], cShadowDeep);
        // Door panel
        drawer.fillPath([
            { x: dx + 1, y: doorY + 1 }, { x: dx + doorW - 1, y: doorY + 1 },
            { x: dx + doorW - 1, y: doorY + doorH - 1 }, { x: dx + 1, y: doorY + doorH - 1 }
        ], cAppliance);
        // Door bevels
        drawer.hLine(dx + 1, doorY + 1, doorW - 2, cApplianceLight);
        drawer.vLine(dx + 1, doorY + 1, doorH - 2, cApplianceLight);
        drawer.hLine(dx + 1, doorY + doorH - 1, doorW - 2, cApplianceShadow);
        drawer.vLine(dx + doorW - 1, doorY + 1, doorH - 2, cApplianceShadow);
        // Door handle (small steel knob)
        drawer.pixel(dx + doorW - 3, doorY + Math.floor(doorH / 2), cSteel);
        drawer.pixel(dx + doorW - 3, doorY + Math.floor(doorH / 2) + 1, cSteelDark);
    }

    // 4. Counter top surface (stone)
    drawer.fillPath([
        { x: 0, y: 0 }, { x: w, y: 0 },
        { x: w, y: topH }, { x: 0, y: topH }
    ], cCounterDark);
    // Inner surface
    drawer.fillPath([
        { x: 1, y: 1 }, { x: w - 1, y: 1 },
        { x: w - 1, y: topH - 1 }, { x: 1, y: topH - 1 }
    ], cCounter);
    // Top edge highlight
    drawer.hLine(1, 0, w - 2, cCounterLight);
    // Counter front lip
    drawer.hLine(0, topH, w, cCounterOutline);

    // 5. Items on counter
    // Cutting board (left)
    drawer.fillPath([
        { x: 6, y: 1 }, { x: 14, y: 1 },
        { x: 14, y: 4 }, { x: 6, y: 4 }
    ], '#c8a878');
    drawer.hLine(7, 1, 6, '#d0b888');

    // Knife on cutting board
    drawer.hLine(8, 2, 4, cSteel);
    drawer.pixel(7, 2, '#805030');

    // Bowl (right)
    drawer.fillPath([
        { x: 34, y: 1 }, { x: 40, y: 1 },
        { x: 41, y: 2 }, { x: 41, y: 3 },
        { x: 40, y: 4 }, { x: 34, y: 4 },
        { x: 33, y: 3 }, { x: 33, y: 2 }
    ], cApplianceShadow);
    drawer.pixel(36, 2, cApplianceLight);

    // 6. Edge definition
    drawer.vLine(0, topH, frontH, cCounterLight);
    drawer.vLine(w - 1, topH, frontH, cApplianceOutline);
    drawer.hLine(1, h - baseH, w - 2, cApplianceOutline);

    // 7. Right-side shadow overlay
    drawer.fillPath([
        { x: w - 4, y: 1 }, { x: w - 1, y: 1 },
        { x: w - 1, y: topH - 1 }, { x: w - 4, y: topH - 1 }
    ], cShadow);
    drawer.fillPath([
        { x: w - 3, y: topH + 1 }, { x: w - 1, y: topH + 1 },
        { x: w - 1, y: h - baseH - 1 }, { x: w - 3, y: h - baseH - 1 }
    ], cShadow);

    return drawer.getCanvas();
}
