// 纯美术：F1 监狱层·狱卒储物柜（32×32，铁皮立柜+通风百叶+门闩+编号牌）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const METAL = '#5a6470';
const METAL_DARK = '#3f4753';
const METAL_LIGHT = '#78838f';
const VENT = '#2f353d';
const LATCH = '#c9a24a';
const RUST = '#6e4a2a';

export function createF1PrisonLockerSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 9, 3, 'rgba(0,0,0,0.26)');

    // 柜体
    d.rect(8, 3, 16, 27, METAL);
    d.vLine(8, 3, 27, METAL_LIGHT);   // 左棱高光
    d.vLine(23, 3, 27, METAL_DARK);   // 右棱阴影
    d.hLine(8, 3, 16, METAL_LIGHT);   // 顶棱
    d.hLine(8, 29, 16, METAL_DARK);   // 底座

    // 柜门缝（居中开门线）
    d.vLine(16, 5, 24, METAL_DARK);
    d.vLine(17, 5, 24, METAL_LIGHT);

    // 顶部通风百叶（两扇门各三道）
    for (let i = 0; i < 3; i++) {
        const y = 6 + i * 2;
        d.hLine(10, y, 5, VENT);
        d.hLine(18, y, 5, VENT);
    }

    // 门闩把手（右门中段）
    d.rect(19, 16, 2, 4, VENT);
    d.pixel(20, 15, LATCH);

    // 编号牌（左门中段）
    d.rect(10, 15, 5, 3, METAL_DARK);
    d.hLine(10, 15, 5, METAL_LIGHT);
    d.pixel(11, 16, '#c7ccd4');
    d.pixel(13, 16, '#c7ccd4');

    // 锈渍/凹痕
    d.pixel(9, 23, RUST);
    d.pixel(22, 11, RUST);
    d.pixel(14, 27, RUST);

    return d.getCanvas();
}
