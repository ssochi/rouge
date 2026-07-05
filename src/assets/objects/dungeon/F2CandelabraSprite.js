// 纯美术：落地烛台（32×32，锻铁三足柱+五臂烛群，圣殿光海的光点）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const IRON = '#3a3a44';
const IRON_LIGHT = '#585866';
const WAX = '#d8cfae';
const WAX_DARK = '#b0a888';
const FLAME = '#ffce62';
const FLAME_HOT = '#fff3c0';
const GLOW = 'rgba(255,200,110,0.30)';

export function createF2CandelabraSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 7, 3, 'rgba(0,0,0,0.26)');

    // 三足底座
    d.fillPath([
        { x: 16, y: 24 }, { x: 22, y: 29 }, { x: 10, y: 29 }
    ], IRON);
    d.pixel(11, 28, IRON_LIGHT);
    d.pixel(16, 25, IRON_LIGHT);

    // 中央立柱
    d.vLine(15, 8, 17, IRON);
    d.vLine(16, 8, 17, IRON_LIGHT);
    d.pixel(15, 16, IRON_LIGHT); // 柱节

    // 横臂（上下两组）
    d.hLine(9, 12, 14, IRON);
    d.hLine(11, 9, 10, IRON);

    // 五支烛（臂端 + 中心，高低错落）
    const candle = (x, y) => {
        d.rect(x, y, 2, 4, WAX);
        d.vLine(x + 1, y, 4, WAX_DARK);
        d.pixel(x, y - 2, FLAME);
        d.pixel(x + 1, y - 1, FLAME);
        d.pixel(x, y - 1, FLAME_HOT);
    };
    // 光晕先铺（在焰下层）
    [[8, 8], [22, 8], [10, 5], [21, 5], [15, 3]].forEach(([gx, gy]) => {
        d.pixel(gx, gy, GLOW);
        d.pixel(gx + 1, gy + 1, GLOW);
    });
    candle(8, 10);
    candle(21, 10);
    candle(10, 7);
    candle(20, 7);
    candle(15, 4);

    return d.getCanvas();
}
