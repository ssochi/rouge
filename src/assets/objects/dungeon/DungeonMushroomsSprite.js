// 纯美术：地牢荧光蘑菇丛（32×32，蓝紫冷光点缀）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STEM = '#8a94b8';
const STEM_DARK = '#6a7492';
const CAP = '#5a7fd6';
const CAP_LIGHT = '#84a8f0';
const CAP_GLOW = '#b8d4ff';
const SPORE = '#9fc2ff';

export function createDungeonMushroomsSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 9, 3, 'rgba(0,0,0,0.2)');

    // 大蘑菇（中央）
    d.rect(14, 20, 3, 7, STEM);
    d.vLine(16, 20, 7, STEM_DARK);
    d.fillPath([
        { x: 15, y: 12 },
        { x: 21, y: 17 },
        { x: 21, y: 20 },
        { x: 10, y: 20 },
        { x: 10, y: 17 }
    ], CAP);
    d.hLine(11, 17, 9, CAP_LIGHT);
    d.pixel(13, 15, CAP_GLOW);
    d.pixel(17, 16, CAP_GLOW);
    d.pixel(15, 18, CAP_LIGHT);

    // 中蘑菇（左）
    d.rect(7, 23, 2, 4, STEM);
    d.rect(5, 20, 6, 3, CAP);
    d.hLine(5, 20, 6, CAP_LIGHT);
    d.pixel(7, 21, CAP_GLOW);

    // 小蘑菇（右）
    d.rect(23, 24, 2, 3, STEM_DARK);
    d.rect(21, 22, 6, 2, CAP);
    d.pixel(24, 22, CAP_GLOW);

    // 飘散孢子光点
    d.pixel(12, 9, SPORE);
    d.pixel(20, 11, SPORE);
    d.pixel(25, 18, SPORE);
    d.pixel(9, 16, SPORE);

    return d.getCanvas();
}
