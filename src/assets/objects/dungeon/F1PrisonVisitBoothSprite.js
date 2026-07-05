// 纯美术：F1 监狱层·探视隔离台（32×32，柜台+上方隔栏玻璃+中央隔断，玻璃已碎）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const METAL = '#5f6675';
const METAL_DARK = '#414753';
const METAL_LIGHT = '#7e8593';
const GLASS = 'rgba(150,180,200,0.30)';
const GLASS_EDGE = '#7d97a6';
const CRACK = '#cfe0ea';
const IRON = '#484855';
const RUST = '#6e4a2a';

export function createF1PrisonVisitBoothSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 14, 3, 'rgba(0,0,0,0.24)');

    // 柜台（下半台面）
    d.rect(3, 20, 26, 9, METAL);
    d.hLine(3, 20, 26, METAL_LIGHT);   // 台沿高光
    d.rect(3, 27, 26, 2, METAL_DARK);  // 台座阴影
    d.vLine(3, 20, 9, METAL_LIGHT);
    d.vLine(28, 20, 9, METAL_DARK);
    // 台面中缝分隔（一分为二）
    d.vLine(16, 20, 9, METAL_DARK);

    // 上方隔栏框
    d.rect(4, 5, 24, 2, IRON);          // 顶横框
    d.hLine(4, 5, 24, '#5f5f6e');
    d.vLine(4, 5, 15, IRON);            // 左立框
    d.vLine(27, 5, 15, IRON);           // 右立框
    d.vLine(15, 5, 15, IRON);           // 中央隔断柱
    d.vLine(16, 5, 15, '#33333e');

    // 玻璃隔板（半透，两格）
    d.rect(6, 7, 8, 13, GLASS);
    d.rect(18, 7, 8, 13, GLASS);
    d.strokeRect(6, 7, 8, 13, GLASS_EDGE);
    d.strokeRect(18, 7, 8, 13, GLASS_EDGE);

    // 传话孔（隔断中段小格）
    d.rect(13, 13, 6, 3, METAL_DARK);
    d.hLine(13, 13, 6, METAL_LIGHT);

    // 左格玻璃已碎——放射裂纹
    d.line(10, 9, 7, 18, CRACK);
    d.line(10, 9, 13, 17, CRACK);
    d.line(10, 9, 6, 12, CRACK);
    d.pixel(9, 13, CRACK);

    // 锈渍
    d.pixel(5, 24, RUST);
    d.pixel(27, 23, RUST);
    d.pixel(16, 26, RUST);

    return d.getCanvas();
}
