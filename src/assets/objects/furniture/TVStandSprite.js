import { PixelDraw } from '../../../utils/PixelDraw.js';
import { FurniturePalette } from './FurniturePalette.js';

function drawCabinet(drawer, w, h) {
    const { cWood, cWoodDark, cWoodLight, cWoodOutline, cWoodHighlight, cWoodGrain, cShadow, cShadowDeep } = FurniturePalette;

    const standH = 12;
    const standY = h - standH;

    // Legs (tapered)
    drawer.fillPath([
        {x: 2, y: h - 2}, {x: 6, y: h - 2},
        {x: 5, y: h}, {x: 3, y: h}
    ], cWoodDark);
    drawer.fillPath([
        {x: w - 6, y: h - 2}, {x: w - 2, y: h - 2},
        {x: w - 3, y: h}, {x: w - 5, y: h}
    ], cWoodDark);

    // Cabinet body (chamfered bottom corners)
    drawer.fillPath([
        {x: 0, y: standY}, {x: w, y: standY},
        {x: w, y: h - 3},
        {x: w - 1, y: h - 2},
        {x: 1, y: h - 2},
        {x: 0, y: h - 3}
    ], cWood);

    // Top surface (darker for depth)
    drawer.fillPath([
        {x: 0, y: standY}, {x: w, y: standY},
        {x: w, y: standY + 4}, {x: 0, y: standY + 4}
    ], cWoodDark);
    drawer.hLine(0, standY, w, cWoodHighlight);
    drawer.hLine(0, standY + 1, w, cWoodLight);

    // Glass door recesses
    const doorW = w / 2 - 3;
    // Left glass door
    drawer.fillPath([
        {x: 2, y: standY + 4}, {x: 2 + doorW, y: standY + 4},
        {x: 2 + doorW, y: h - 4}, {x: 2, y: h - 4}
    ], cShadowDeep);
    // Glass reflection
    drawer.line(4, standY + 6, 8, h - 5, 'rgba(255,255,255,0.12)');
    // Right glass door
    drawer.fillPath([
        {x: w / 2 + 1, y: standY + 4}, {x: w / 2 + 1 + doorW, y: standY + 4},
        {x: w / 2 + 1 + doorW, y: h - 4}, {x: w / 2 + 1, y: h - 4}
    ], cShadowDeep);
    // Glass reflection
    drawer.line(w / 2 + 3, standY + 6, w / 2 + 7, h - 5, 'rgba(255,255,255,0.12)');

    // Cabinet edge definition (natural, no strokePath)
    drawer.hLine(0, standY + 2, w, cWoodHighlight);
    drawer.vLine(w - 1, standY + 1, standH - 4, cWoodDark);
    drawer.hLine(1, h - 2, w - 2, cWoodDark);

    // Cabinet right-side shadow
    drawer.fillPath([
        {x: w - 4, y: standY + 1}, {x: w - 1, y: standY + 1},
        {x: w - 1, y: h - 3}, {x: w - 4, y: h - 3}
    ], cShadow);

    // Left highlight
    drawer.vLine(0, standY + 1, standH - 4, cWoodHighlight);

    return standY;
}

export function createTVStandAnimatedSprite() {
    const frames = [];
    const frameCount = 4;
    const w = 40;
    const h = 32;

    const { cWoodOutline, cShadow } = FurniturePalette;

    for (let f = 0; f < frameCount; f++) {
        const drawer = new PixelDraw(w, h);

        // 1. Draw Cabinet (shared across all frames)
        const standY = drawCabinet(drawer, w, h);

        // 2. TV (CRT Style with rounded corners)
        const tvW = 24;
        const tvH = 18;
        const tvX = (w - tvW) / 2;
        const tvY = standY - tvH + 3;

        const cTV = '#2c3e50';
        const cTVDark = '#1a252f';
        const cTVLight = '#34495e';

        // Main box (chamfered corners)
        drawer.fillPath([
            {x: tvX + 1, y: tvY}, {x: tvX + tvW - 1, y: tvY},
            {x: tvX + tvW, y: tvY + 1}, {x: tvX + tvW, y: tvY + tvH - 1},
            {x: tvX + tvW - 1, y: tvY + tvH}, {x: tvX + 1, y: tvY + tvH},
            {x: tvX, y: tvY + tvH - 1}, {x: tvX, y: tvY + 1}
        ], cTV);

        // Top face (3px thick)
        drawer.fillPath([
            {x: tvX + 1, y: tvY}, {x: tvX + tvW - 1, y: tvY},
            {x: tvX + tvW, y: tvY + 1}, {x: tvX + tvW, y: tvY + 3},
            {x: tvX, y: tvY + 3}, {x: tvX, y: tvY + 1}
        ], cTVLight);

        // Right side shadow
        drawer.vLine(tvX + tvW - 1, tvY + 1, tvH - 2, cTVDark);
        // Bottom shadow
        drawer.hLine(tvX + 1, tvY + tvH - 1, tvW - 2, cTVDark);

        // TV edge definition (natural)
        drawer.hLine(tvX + 1, tvY, tvW - 2, cTVLight);
        drawer.vLine(tvX, tvY + 1, tvH - 2, cTVLight);

        // Screen bezel
        const scrM = 2;
        const scrX = tvX + scrM;
        const scrY = tvY + scrM + 1;
        const scrW = tvW - scrM * 2;
        const scrH = tvH - scrM * 2 - 2;

        // Bezel (dark border)
        drawer.fillPath([
            {x: scrX - 1, y: scrY - 1}, {x: scrX + scrW + 1, y: scrY - 1},
            {x: scrX + scrW + 1, y: scrY + scrH + 1}, {x: scrX - 1, y: scrY + scrH + 1}
        ], cTVDark);

        // Screen glow
        drawer.fillPath([
            {x: scrX, y: scrY}, {x: scrX + scrW, y: scrY},
            {x: scrX + scrW, y: scrY + scrH}, {x: scrX, y: scrY + scrH}
        ], '#85c1e9');

        // Animation Content: "News Anchor"
        const headX = scrX + Math.floor(scrW / 2);
        const headY = scrY + Math.floor(scrH / 2);

        let offsetX = 0;
        if (f === 2) offsetX = -1;
        if (f === 3) offsetX = 1;

        // Head
        drawer.rect(headX - 2 + offsetX, headY - 3, 4, 4, '#f1c40f');
        // Shoulders
        drawer.rect(headX - 4 + offsetX, headY + 1, 8, 3, '#e74c3c');

        // Scanlines
        for (let ly = scrY; ly < scrY + scrH; ly++) {
            if ((ly + f) % 2 === 0) {
                drawer.hLine(scrX, ly, scrW, 'rgba(0,0,0,0.1)');
            }
        }

        // Screen glare
        drawer.line(scrX + scrW - 4, scrY + 1, scrX + scrW - 1, scrY + 4, 'rgba(255,255,255,0.4)');

        // Power light (blinking)
        const lightColor = (f % 2 === 0) ? '#e74c3c' : '#c0392b';
        drawer.pixel(tvX + tvW - 3, tvY + tvH - 2, lightColor);

        // Antenna
        drawer.line(tvX + 4, tvY, tvX - 2, tvY - 6, '#95a5a6');
        drawer.line(tvX + tvW - 4, tvY, tvX + tvW + 2, tvY - 6, '#95a5a6');

        // TV right-side shadow overlay
        drawer.fillPath([
            {x: tvX + tvW - 5, y: tvY + 2}, {x: tvX + tvW - 1, y: tvY + 2},
            {x: tvX + tvW - 1, y: tvY + tvH - 1}, {x: tvX + tvW - 5, y: tvY + tvH - 1}
        ], cShadow);

        frames.push(drawer.getCanvas());
    }

    return frames;
}
