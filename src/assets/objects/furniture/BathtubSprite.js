import { PixelDraw } from '../../../utils/PixelDraw.js';
import { BathroomPalette } from './BathroomPalette.js';

export function createBathtubSprite() {
    // 2x1 tile footprint, same canvas size as sofa (48x24)
    const w = 48;
    const h = 24;
    const drawer = new PixelDraw(w, h);

    const {
        cPorcelain, cPorcelainLight, cPorcelainShadow,
        cPorcelainDark, cPorcelainOutline,
        cChrome, cChromeLight, cChromeDark,
        cWater, cWaterDark,
        cShadow, cShadowDeep
    } = BathroomPalette;

    // === 2.5D bathtub, long axis horizontal, faucet on left end ===

    // 1. Claw feet (small dark rectangles at corners)
    // Front feet (top of sprite = far from camera in 2.5D)
    drawer.rect(3, 1, 2, 2, cPorcelainOutline);
    drawer.rect(w - 5, 1, 2, 2, cPorcelainOutline);
    // Back feet (bottom, near camera)
    drawer.rect(3, h - 3, 2, 2, cPorcelainOutline);
    drawer.rect(w - 5, h - 3, 2, 2, cPorcelainOutline);

    // 2. Tub outer body (main shell with chamfered corners)
    drawer.fillPath([
        { x: 2, y: 3 }, { x: w - 2, y: 3 },
        { x: w - 1, y: 4 }, { x: w - 1, y: h - 3 },
        { x: w - 2, y: h - 2 }, { x: 2, y: h - 2 },
        { x: 1, y: h - 3 }, { x: 1, y: 4 }
    ], cPorcelain);

    // 3. Front face (south-facing, 2.5D thickness visible)
    drawer.fillPath([
        { x: 2, y: 14 }, { x: w - 2, y: 14 },
        { x: w - 2, y: h - 2 }, { x: 2, y: h - 2 }
    ], cPorcelainShadow);
    // Front face bottom edge
    drawer.hLine(3, h - 2, w - 6, cPorcelainOutline);
    // Front face vertical edges
    drawer.vLine(1, 4, h - 7, cPorcelainLight);
    drawer.vLine(w - 1, 4, h - 7, cPorcelainOutline);

    // 4. Rim (top perimeter, 2px wide)
    // Top rim (far edge)
    drawer.fillPath([
        { x: 2, y: 3 }, { x: w - 2, y: 3 },
        { x: w - 3, y: 5 }, { x: 3, y: 5 }
    ], cPorcelainLight);
    // Left rim
    drawer.fillPath([
        { x: 1, y: 4 }, { x: 3, y: 5 },
        { x: 3, y: 13 }, { x: 1, y: 14 }
    ], cPorcelainLight);
    // Right rim
    drawer.fillPath([
        { x: w - 3, y: 5 }, { x: w - 1, y: 4 },
        { x: w - 1, y: 14 }, { x: w - 3, y: 13 }
    ], cPorcelainShadow);
    // Bottom rim (near edge, south)
    drawer.fillPath([
        { x: 3, y: 13 }, { x: w - 3, y: 13 },
        { x: w - 2, y: 14 }, { x: 2, y: 14 }
    ], cPorcelain);

    // 5. Interior basin (inset, slight blue tint for depth)
    drawer.fillPath([
        { x: 4, y: 5 }, { x: w - 4, y: 5 },
        { x: w - 4, y: 13 }, { x: 4, y: 13 }
    ], cWater);

    // Basin center darker
    drawer.fillPath([
        { x: 8, y: 7 }, { x: w - 8, y: 7 },
        { x: w - 8, y: 11 }, { x: 8, y: 11 }
    ], cWaterDark);

    // Drain (dark pixel near center-bottom)
    drawer.pixel(23, 10, cPorcelainOutline);
    drawer.pixel(24, 10, cPorcelainDark);

    // 6. Faucet assembly (left end, on the rim)
    // Faucet base
    drawer.rect(4, 7, 3, 2, cChrome);
    // Faucet spout (extending over basin)
    drawer.rect(6, 8, 2, 1, cChromeDark);
    // Hot/cold handles
    drawer.pixel(4, 7, cChromeLight);
    drawer.pixel(6, 7, cChromeLight);
    // Faucet highlight
    drawer.pixel(5, 7, cChrome);

    // 7. Right-side shadow overlays
    // Outer body right shadow
    drawer.fillPath([
        { x: w - 4, y: 5 }, { x: w - 1, y: 5 },
        { x: w - 1, y: h - 3 }, { x: w - 4, y: h - 3 }
    ], cShadow);

    // 8. Top-left highlight
    drawer.hLine(3, 3, w - 6, cPorcelainLight);
    drawer.pixel(2, 4, cPorcelainLight);

    // 9. Bottom edge shadow under tub
    drawer.hLine(3, h - 1, w - 6, cShadowDeep);

    return drawer.getCanvas();
}
