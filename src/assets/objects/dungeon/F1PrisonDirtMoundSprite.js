// 纯美术：F1 监狱层·越狱土堆（32×32，挖洞掏出的新土+插着的铁锹）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const DIRT = '#6d5a42';
const DIRT_DARK = '#4f4130';
const DIRT_LIGHT = '#8b7355';
const PEBBLE = '#9e8d70';
const WOOD = '#5a4029';
const WOOD_LIGHT = '#71533a';
const BLADE = '#8a8e9c';
const BLADE_DARK = '#5a606b';

export function createF1PrisonDirtMoundSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 13, 3, 'rgba(0,0,0,0.24)');

    // 土堆主体（低矮堆形，逐层收窄）
    d.rect(5, 26, 22, 4, DIRT_DARK);
    d.rect(6, 23, 20, 3, DIRT);
    d.rect(8, 20, 16, 3, DIRT);
    d.rect(11, 17, 10, 3, DIRT_LIGHT);
    d.fillPath([{ x: 13, y: 15 }, { x: 18, y: 15 }, { x: 20, y: 17 }, { x: 11, y: 17 }], DIRT_LIGHT);

    // 明暗与碎石点
    d.hLine(11, 17, 10, DIRT_LIGHT);
    d.hLine(6, 25, 20, DIRT_DARK);
    d.pixel(9, 22, PEBBLE);
    d.pixel(16, 24, PEBBLE);
    d.pixel(21, 21, DIRT_DARK);
    d.pixel(13, 19, PEBBLE);
    d.pixel(19, 26, DIRT_DARK);

    // 斜插的铁锹（把手 + 铲头）
    for (let i = 0; i < 12; i++) {
        d.pixel(20 + Math.floor(i * 0.5), 4 + i, WOOD);
        d.pixel(21 + Math.floor(i * 0.5), 4 + i, WOOD_LIGHT);
    }
    d.rect(23, 15, 5, 5, BLADE);
    d.hLine(23, 15, 5, '#a9adba');
    d.rect(24, 19, 3, 2, BLADE_DARK);

    return d.getCanvas();
}
