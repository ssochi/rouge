// 纯美术：地牢立式旗帜架（32×32，木杆+垂旗，精英房标识感）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const POLE = '#5a4029';
const POLE_DARK = '#42301e';
const BANNER = '#7a2f35';
const BANNER_DARK = '#5c2228';
const TRIM = '#c9a227';
const BASE = '#4f535d';

export function createDungeonBannerSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 7, 3, 'rgba(0,0,0,0.25)');

    // 石底座
    d.rect(12, 26, 8, 3, BASE);
    d.hLine(12, 26, 8, '#6b707c');

    // 立杆 + 横杆
    d.vLine(15, 4, 22, POLE);
    d.vLine(16, 4, 22, POLE_DARK);
    d.hLine(9, 5, 14, POLE);
    d.pixel(9, 6, POLE_DARK);
    d.pixel(22, 6, POLE_DARK);

    // 垂旗（燕尾）
    d.rect(10, 7, 12, 12, BANNER);
    d.vLine(10, 7, 12, BANNER_DARK);
    d.vLine(21, 7, 12, BANNER_DARK);
    d.fillPath([
        { x: 10, y: 19 },
        { x: 21, y: 19 },
        { x: 21, y: 23 },
        { x: 16, y: 20 },
        { x: 10, y: 23 }
    ], BANNER);

    // 金纹章（菱形）
    d.pixel(15, 11, TRIM);
    d.pixel(16, 11, TRIM);
    d.pixel(14, 12, TRIM);
    d.pixel(17, 12, TRIM);
    d.pixel(15, 13, TRIM);
    d.pixel(16, 13, TRIM);
    d.hLine(11, 8, 10, TRIM);

    // 褶皱
    d.vLine(13, 9, 9, BANNER_DARK);
    d.vLine(18, 9, 9, BANNER_DARK);

    return d.getCanvas();
}
