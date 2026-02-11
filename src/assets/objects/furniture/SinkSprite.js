import { PixelDraw } from '../../../utils/PixelDraw.js';
import { BathroomPalette } from './BathroomPalette.js';

export function createSinkSprite() {
    const w = 16;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const {
        cPorcelain, cPorcelainLight, cPorcelainShadow,
        cPorcelainDark, cPorcelainOutline,
        cChrome, cChromeLight, cChromeDark,
        cWater,
        cShadow, cShadowDeep
    } = BathroomPalette;

    // === 2.5D wall-mounted sink with vanity cabinet ===

    const topH = 10;  // Counter + basin area
    const cabH = 12;  // Cabinet body

    // 1. Cabinet legs/base
    drawer.fillPath([
        { x: 1, y: h - 2 }, { x: w - 1, y: h - 2 },
        { x: w - 1, y: h }, { x: 1, y: h }
    ], cPorcelainDark);
    drawer.hLine(2, h - 1, w - 4, cPorcelainOutline);

    // 2. Cabinet body (front face)
    drawer.fillPath([
        { x: 0, y: topH }, { x: w, y: topH },
        { x: w, y: h - 2 }, { x: 0, y: h - 2 }
    ], cPorcelain);

    // Cabinet door line (center vertical)
    drawer.vLine(w / 2, topH + 2, cabH - 4, cPorcelainShadow);

    // Door handles (small chrome dots)
    drawer.pixel(w / 2 - 2, topH + 5, cChrome);
    drawer.pixel(w / 2 + 1, topH + 5, cChrome);

    // Cabinet edge highlights
    drawer.vLine(0, topH, cabH - 2, cPorcelainLight);
    drawer.vLine(w - 1, topH, cabH - 2, cPorcelainOutline);
    drawer.hLine(1, h - 2, w - 2, cPorcelainOutline);

    // 3. Counter top face (chamfered, darker)
    drawer.fillPath([
        { x: 0, y: 0 }, { x: w, y: 0 },
        { x: w, y: topH }, { x: 0, y: topH }
    ], cPorcelainShadow);
    // Counter surface (slightly inset)
    drawer.fillPath([
        { x: 1, y: 1 }, { x: w - 1, y: 1 },
        { x: w - 1, y: topH - 1 }, { x: 1, y: topH - 1 }
    ], cPorcelain);

    // 4. Basin depression (oval shadow on counter surface)
    drawer.fillPath([
        { x: 4, y: 3 }, { x: 12, y: 3 },
        { x: 13, y: 4 }, { x: 13, y: 7 },
        { x: 12, y: 8 }, { x: 4, y: 8 },
        { x: 3, y: 7 }, { x: 3, y: 4 }
    ], cPorcelainShadow);

    // Basin inner depth
    drawer.fillPath([
        { x: 5, y: 4 }, { x: 11, y: 4 },
        { x: 12, y: 5 }, { x: 12, y: 6 },
        { x: 11, y: 7 }, { x: 5, y: 7 },
        { x: 4, y: 6 }, { x: 4, y: 5 }
    ], cPorcelainDark);

    // Water hint in basin
    drawer.pixel(7, 5, cWater);
    drawer.pixel(8, 5, cWater);
    drawer.pixel(7, 6, cWater);
    drawer.pixel(8, 6, cWater);

    // 5. Faucet (chrome, back-center of basin)
    drawer.pixel(7, 2, cChrome);
    drawer.pixel(8, 2, cChrome);
    drawer.pixel(7, 1, cChromeLight);
    drawer.pixel(8, 1, cChromeDark);

    // 6. Counter top edge highlight
    drawer.hLine(1, 0, w - 2, cPorcelainLight);
    drawer.vLine(0, 1, topH - 2, cPorcelainLight);

    // 7. Right-side shadow overlays
    // Counter shadow
    drawer.fillPath([
        { x: w - 2, y: 1 }, { x: w - 1, y: 1 },
        { x: w - 1, y: topH - 1 }, { x: w - 2, y: topH - 1 }
    ], cShadow);
    // Cabinet shadow
    drawer.fillPath([
        { x: w - 2, y: topH + 1 }, { x: w - 1, y: topH + 1 },
        { x: w - 1, y: h - 3 }, { x: w - 2, y: h - 3 }
    ], cShadow);

    return drawer.getCanvas();
}
