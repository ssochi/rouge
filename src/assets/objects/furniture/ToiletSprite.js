import { PixelDraw } from '../../../utils/PixelDraw.js';
import { BathroomPalette } from './BathroomPalette.js';

export function createToiletSprite() {
    const w = 16;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const {
        cPorcelain, cPorcelainLight, cPorcelainShadow,
        cPorcelainDark, cPorcelainOutline,
        cChrome, cChromeDark,
        cShadow, cShadowDeep
    } = BathroomPalette;

    // === 2.5D top-down toilet, tank at top (far), bowl at bottom (near) ===

    // 1. Base pedestal (ground-level shadow)
    drawer.fillPath([
        { x: 4, y: 20 }, { x: 12, y: 20 },
        { x: 11, y: 23 }, { x: 5, y: 23 }
    ], cPorcelainDark);
    drawer.hLine(5, 23, 6, cPorcelainOutline);

    // 2. Bowl body (rounded front, wider than tank)
    drawer.fillPath([
        { x: 2, y: 10 }, { x: 14, y: 10 },
        { x: 15, y: 13 }, { x: 15, y: 18 },
        { x: 13, y: 20 }, { x: 3, y: 20 },
        { x: 1, y: 18 }, { x: 1, y: 13 }
    ], cPorcelain);

    // Bowl inner shadow (depth illusion)
    drawer.fillPath([
        { x: 4, y: 12 }, { x: 12, y: 12 },
        { x: 13, y: 14 }, { x: 13, y: 17 },
        { x: 11, y: 19 }, { x: 5, y: 19 },
        { x: 3, y: 17 }, { x: 3, y: 14 }
    ], cPorcelainShadow);

    // Inner bowl deeper center
    drawer.fillPath([
        { x: 5, y: 14 }, { x: 11, y: 14 },
        { x: 11, y: 17 }, { x: 5, y: 17 }
    ], cPorcelainDark);

    // 3. Seat rim (bright ring on top of bowl)
    drawer.fillPath([
        { x: 2, y: 10 }, { x: 14, y: 10 },
        { x: 15, y: 12 }, { x: 14, y: 12 },
        { x: 13, y: 11 }, { x: 3, y: 11 },
        { x: 2, y: 12 }, { x: 1, y: 12 }
    ], cPorcelainLight);
    // Seat rim side edges
    drawer.vLine(1, 12, 6, cPorcelainShadow);
    drawer.vLine(15, 12, 6, cPorcelainOutline);

    // 4. Tank body (rectangular, behind bowl)
    drawer.fillPath([
        { x: 3, y: 1 }, { x: 13, y: 1 },
        { x: 13, y: 10 }, { x: 3, y: 10 }
    ], cPorcelain);

    // Tank front face detail
    drawer.hLine(4, 10, 8, cPorcelainShadow);

    // 5. Tank top face (darker to show depth)
    drawer.fillPath([
        { x: 3, y: 0 }, { x: 13, y: 0 },
        { x: 13, y: 2 }, { x: 3, y: 2 }
    ], cPorcelainShadow);
    drawer.hLine(4, 0, 8, cPorcelainLight);

    // Flush button (chrome dot on tank top)
    drawer.pixel(7, 1, cChrome);
    drawer.pixel(8, 1, cChromeDark);

    // 6. Tank edge definition
    drawer.vLine(3, 1, 9, cPorcelainLight);
    drawer.vLine(13, 1, 9, cPorcelainOutline);

    // 7. Right-side shadow overlays
    // Tank shadow
    drawer.fillPath([
        { x: 11, y: 2 }, { x: 13, y: 2 },
        { x: 13, y: 10 }, { x: 11, y: 10 }
    ], cShadow);
    // Bowl shadow
    drawer.fillPath([
        { x: 13, y: 12 }, { x: 15, y: 12 },
        { x: 15, y: 18 }, { x: 13, y: 18 }
    ], cShadow);

    // 8. Top-left highlights
    drawer.hLine(4, 1, 6, cPorcelainLight);
    drawer.pixel(2, 13, cPorcelainLight);
    drawer.pixel(2, 14, cPorcelainLight);

    return drawer.getCanvas();
}
