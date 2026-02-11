import { PixelDraw } from '../../../utils/PixelDraw.js';
import { KitchenPalette } from './KitchenPalette.js';

export function createKitchenSinkSprite() {
    // Kitchen sink unit: counter with basin on top, cabinet below. 16x24 (1x1 tile).
    const w = 16;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const {
        cCounter, cCounterLight, cCounterDark, cCounterOutline,
        cAppliance, cApplianceLight, cApplianceShadow,
        cApplianceOutline,
        cSteel, cSteelLight, cSteelDark,
        cWater,
        cShadow
    } = KitchenPalette;

    const topH = 10;  // Counter + basin area
    const cabH = 12;  // Cabinet body
    const baseH = 2;  // Base

    // === 2.5D kitchen sink: basin on stone counter, cabinet below ===

    // 1. Cabinet base
    drawer.fillPath([
        { x: 1, y: h - baseH }, { x: w - 1, y: h - baseH },
        { x: w - 1, y: h }, { x: 1, y: h }
    ], cApplianceOutline);
    drawer.hLine(2, h - 1, w - 4, cApplianceOutline);

    // 2. Cabinet body (front face)
    drawer.fillPath([
        { x: 0, y: topH }, { x: w, y: topH },
        { x: w, y: h - baseH }, { x: 0, y: h - baseH }
    ], cAppliance);

    // Cabinet door line (center vertical)
    drawer.vLine(w / 2, topH + 2, cabH - 4, cApplianceShadow);

    // Door handles (small steel dots)
    drawer.pixel(w / 2 - 2, topH + 5, cSteel);
    drawer.pixel(w / 2 + 1, topH + 5, cSteel);

    // Cabinet edge highlights
    drawer.vLine(0, topH, cabH - baseH, cApplianceLight);
    drawer.vLine(w - 1, topH, cabH - baseH, cApplianceOutline);
    drawer.hLine(1, h - baseH, w - 2, cApplianceOutline);

    // 3. Counter top surface (stone)
    drawer.fillPath([
        { x: 0, y: 0 }, { x: w, y: 0 },
        { x: w, y: topH }, { x: 0, y: topH }
    ], cCounterDark);
    // Surface inner
    drawer.fillPath([
        { x: 1, y: 1 }, { x: w - 1, y: 1 },
        { x: w - 1, y: topH - 1 }, { x: 1, y: topH - 1 }
    ], cCounter);
    // Counter front lip
    drawer.hLine(0, topH, w, cCounterOutline);

    // 4. Basin depression (rectangular, inset in counter)
    drawer.fillPath([
        { x: 3, y: 3 }, { x: 13, y: 3 },
        { x: 13, y: 8 }, { x: 3, y: 8 }
    ], cCounterDark);
    // Basin inner (stainless steel)
    drawer.fillPath([
        { x: 4, y: 4 }, { x: 12, y: 4 },
        { x: 12, y: 7 }, { x: 4, y: 7 }
    ], cSteelDark);
    // Basin highlight
    drawer.hLine(4, 4, 4, cSteel);

    // Water hint in basin
    drawer.pixel(7, 5, cWater);
    drawer.pixel(8, 5, cWater);
    drawer.pixel(7, 6, cWater);
    drawer.pixel(8, 6, cWater);

    // 5. Faucet (chrome, back-center of basin)
    drawer.pixel(7, 2, cSteel);
    drawer.pixel(8, 2, cSteel);
    drawer.pixel(7, 1, cSteelDark);
    drawer.pixel(8, 1, cSteelDark);
    // Faucet spout
    drawer.pixel(8, 3, cSteel);

    // 6. Counter top edge highlight
    drawer.hLine(1, 0, w - 2, cCounterLight);
    drawer.vLine(0, 1, topH - 2, cCounterLight);

    // 7. Right-side shadow overlays
    drawer.fillPath([
        { x: w - 2, y: 1 }, { x: w - 1, y: 1 },
        { x: w - 1, y: topH - 1 }, { x: w - 2, y: topH - 1 }
    ], cShadow);
    drawer.fillPath([
        { x: w - 2, y: topH + 1 }, { x: w - 1, y: topH + 1 },
        { x: w - 1, y: h - baseH - 1 }, { x: w - 2, y: h - baseH - 1 }
    ], cShadow);

    return drawer.getCanvas();
}
