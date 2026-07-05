// 纯美术：地牢拉杆机关（32×32，两态：up 未拉/红握把 / down 已拉/绿握把）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const BASE = '#4a4a56';
const BASE_DARK = '#33333d';
const BASE_LIGHT = '#63636f';
const SHAFT = '#8a8e9c';
const SHAFT_DARK = '#5b606b';
const RED = '#c0392b';
const RED_LIGHT = '#e05545';
const GREEN = '#27ae60';
const GREEN_LIGHT = '#4bd483';
const RUST = '#6e4a2a';

/** 地面底座 + 支轴（两态共用）。 */
function drawBase(d) {
    d.ellipse(16, 28, 9, 3, 'rgba(0,0,0,0.24)');
    // 石铁底座
    d.rect(9, 21, 14, 7, BASE_DARK);
    d.rect(10, 20, 12, 6, BASE);
    d.hLine(10, 20, 12, BASE_LIGHT);
    d.rect(10, 26, 12, 2, BASE_DARK);
    d.pixel(12, 23, RUST); d.pixel(19, 24, RUST);
    // 支轴座
    d.rect(14, 18, 4, 3, SHAFT_DARK);
    d.pixel(15, 18, SHAFT);
}

/** 未拉态：拉杆向上偏右，红握把。 */
export function createCageLeverUpSprite() {
    const d = new PixelDraw(32, 32);
    drawBase(d);
    // 拉杆（自轴向右上）
    d.line(16, 19, 22, 7, SHAFT);
    d.line(17, 19, 23, 7, SHAFT_DARK);
    // 红握把球
    d.circle(23, 6, 3, RED);
    d.pixel(22, 5, RED_LIGHT);
    d.pixel(23, 5, RED_LIGHT);
    return d.getCanvas();
}

/** 已拉态：拉杆向下偏左，绿握把。 */
export function createCageLeverDownSprite() {
    const d = new PixelDraw(32, 32);
    drawBase(d);
    // 拉杆（自轴向左下压）
    d.line(16, 19, 10, 14, SHAFT);
    d.line(16, 20, 10, 15, SHAFT_DARK);
    // 绿握把球
    d.circle(9, 13, 3, GREEN);
    d.pixel(8, 12, GREEN_LIGHT);
    d.pixel(9, 12, GREEN_LIGHT);
    return d.getCanvas();
}
