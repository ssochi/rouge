// 纯美术：地牢牢栏残段（32×32，铁栏+弯折缺口）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const IRON = '#484855';
const IRON_DARK = '#33333e';
const IRON_LIGHT = '#5f5f6e';
const RUST = '#6e4a2a';

export function createDungeonBarsSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 12, 3, 'rgba(0,0,0,0.22)');

    // 上下横梁
    d.rect(4, 8, 24, 2, IRON);
    d.hLine(4, 8, 24, IRON_LIGHT);
    d.rect(4, 25, 24, 3, IRON_DARK);
    d.hLine(4, 25, 24, IRON);

    // 竖栏（中间两根缺失/弯折形成缺口）
    d.vLine(6, 10, 15, IRON);
    d.vLine(7, 10, 15, IRON_DARK);
    d.vLine(11, 10, 15, IRON);
    d.vLine(12, 10, 15, IRON_DARK);
    // 弯折栏（向右下撇）
    d.vLine(16, 10, 6, IRON);
    d.pixel(17, 16, IRON);
    d.pixel(18, 17, IRON_DARK);
    d.pixel(19, 18, IRON_DARK);
    // 断栏（只剩上半截）
    d.vLine(21, 10, 5, IRON);
    d.vLine(22, 10, 4, IRON_DARK);
    d.vLine(25, 10, 15, IRON);
    d.vLine(26, 10, 15, IRON_DARK);

    // 锈斑
    d.pixel(6, 14, RUST);
    d.pixel(11, 20, RUST);
    d.pixel(25, 12, RUST);
    d.pixel(16, 12, RUST);

    return d.getCanvas();
}
