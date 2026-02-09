import { PixelDraw } from '../../../utils/PixelDraw.js';
import { NaturePalette as P } from './NaturePalette.js';

function drawGrassBlade(d, x, y, h, type = 'normal') {
    // type: normal, left, right
    const color = h > 4 ? P.grass : P.grassDark;
    const light = P.grassLight;
    const tip = P.grassTip;

    // Base
    d.pixel(x, y, P.grassDark);
    
    // Stem
    for (let i = 1; i < h - 1; i++) {
        let dx = 0;
        if (type === 'left' && i > 2) dx = -1;
        if (type === 'right' && i > 2) dx = 1;
        d.pixel(x + dx, y - i, color);
        // Highlight side
        if (h > 3 && i < h-2) d.pixel(x + dx - 1, y - i, P.grassDark); // Shadow left
        if (h > 3 && i < h-2) d.pixel(x + dx + 1, y - i, light); // Light right
    }
    
    // Tip
    let tipX = x;
    if (type === 'left') tipX -= 1;
    if (type === 'right') tipX += 1;
    d.pixel(tipX, y - h + 1, tip);
}

function createDenseTuft() {
    const d = new PixelDraw(16, 16);
    
    // Back layer (Darker, shorter)
    drawGrassBlade(d, 4, 13, 4, 'left');
    drawGrassBlade(d, 12, 13, 4, 'right');
    drawGrassBlade(d, 8, 12, 5, 'normal');

    // Front layer
    drawGrassBlade(d, 6, 14, 6, 'left');
    drawGrassBlade(d, 10, 14, 6, 'right');
    drawGrassBlade(d, 8, 14, 7, 'normal');
    drawGrassBlade(d, 2, 14, 3, 'left');
    drawGrassBlade(d, 14, 14, 3, 'right');

    return d.getCanvas();
}

function createTallGrass() {
    const d = new PixelDraw(16, 20);

    // Tall blades
    drawGrassBlade(d, 5, 17, 10, 'left');
    drawGrassBlade(d, 11, 17, 9, 'right');
    drawGrassBlade(d, 8, 18, 12, 'normal'); // Very tall center
    
    // Short filler
    drawGrassBlade(d, 3, 18, 5, 'left');
    drawGrassBlade(d, 13, 18, 5, 'right');
    drawGrassBlade(d, 7, 18, 6, 'normal');
    drawGrassBlade(d, 9, 18, 6, 'normal');

    return d.getCanvas();
}

function createFlowerGrass() {
    const d = new PixelDraw(16, 16);
    
    // Back layer
    drawGrassBlade(d, 5, 13, 5, 'left');
    drawGrassBlade(d, 11, 13, 5, 'right');

    // Front layer
    drawGrassBlade(d, 8, 14, 8, 'normal'); // Tall central stem for flower
    drawGrassBlade(d, 4, 14, 4, 'left');
    drawGrassBlade(d, 12, 14, 4, 'right');

    // Flowers
    // 1. Center white flower
    d.pixel(8, 5, '#ffffff'); 
    d.pixel(7, 6, '#ffffff'); d.pixel(9, 6, '#ffffff');
    d.pixel(8, 7, '#ffffff');
    d.pixel(8, 6, '#f1c40f'); // Yellow center

    // 2. Small blue flower left
    d.pixel(5, 8, '#3498db');
    d.pixel(4, 9, '#3498db'); d.pixel(6, 9, '#3498db');
    d.pixel(5, 10, '#3498db');

    return d.getCanvas();
}

export function createGrassTuftSprites() {
    return {
        grass_tuft: createDenseTuft(),
        grass_tall: createTallGrass(),
        grass_flower: createFlowerGrass()
    };
}
