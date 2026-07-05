// 纯美术：血祭石（32×32，低矮石祭台+导血凹槽+四角镣环+暗红血渍，仪式核心）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STONE = '#4c4650';
const STONE_TOP = '#5f5866';
const STONE_DARK = '#332f3a';
const STONE_LIGHT = '#726a7c';
const BLOOD = '#7a1a22';
const BLOOD_DARK = '#4c0e14';
const BLOOD_WET = '#a8262e';
const IRON = '#3a3a44';
const IRON_LIGHT = '#585866';

export function createF2SacrificeSlabSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 12, 3, 'rgba(0,0,0,0.30)');

    // 台面（顶视受光）
    d.fillPath([
        { x: 6, y: 16 }, { x: 26, y: 16 },
        { x: 28, y: 20 }, { x: 4, y: 20 }
    ], STONE_TOP);
    d.hLine(6, 16, 20, STONE_LIGHT);

    // 台身（正面暗）
    d.rect(4, 20, 24, 7, STONE);
    d.hLine(4, 20, 24, STONE_LIGHT);
    d.rect(4, 25, 24, 2, STONE_DARK);
    d.vLine(4, 20, 7, STONE_DARK);
    d.vLine(27, 20, 7, STONE_DARK);

    // 导血凹槽（台面中央 + 顺正面淌下）
    d.hLine(9, 18, 14, BLOOD_DARK);
    d.pixel(16, 17, BLOOD);
    d.rect(15, 18, 3, 1, BLOOD_WET);
    d.vLine(16, 19, 6, BLOOD);
    d.vLine(16, 21, 5, BLOOD_DARK);
    d.pixel(15, 24, BLOOD_WET);
    d.pixel(17, 26, BLOOD_DARK);

    // 血渍
    d.pixel(11, 22, BLOOD_DARK);
    d.pixel(21, 23, BLOOD_DARK);
    d.pixel(9, 19, BLOOD);
    d.pixel(23, 18, BLOOD);

    // 四角镣环
    const ring = (x, y) => {
        d.rect(x, y, 3, 2, IRON);
        d.pixel(x + 1, y, IRON_LIGHT);
        d.pixel(x + 1, y + 2, IRON);
    };
    ring(5, 15);
    ring(24, 15);
    ring(5, 22);
    ring(24, 22);

    return d.getCanvas();
}
