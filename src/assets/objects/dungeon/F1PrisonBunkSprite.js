// 纯美术：F1 监狱层·囚室铁床（32×32，双层铁架床+薄褥+攀梯）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const IRON = '#4a4a58';
const IRON_DARK = '#31313c';
const IRON_LIGHT = '#66667a';
const MAT = '#8f8676';
const MAT_DARK = '#6d6558';
const STAIN = '#5a4636';
const RUST = '#6e4a2a';

export function createF1PrisonBunkSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 14, 3, 'rgba(0,0,0,0.24)');

    // 四立柱
    d.vLine(3, 5, 24, IRON);
    d.vLine(4, 5, 24, IRON_DARK);
    d.vLine(28, 5, 24, IRON);
    d.vLine(27, 5, 24, IRON_LIGHT);

    // 上铺床架 + 薄褥
    d.rect(3, 9, 26, 2, IRON);          // 上铺框
    d.hLine(3, 9, 26, IRON_LIGHT);
    d.rect(5, 6, 22, 3, MAT);           // 上铺褥
    d.hLine(5, 6, 22, '#a49a88');
    d.rect(5, 8, 22, 1, MAT_DARK);
    d.pixel(11, 7, STAIN); d.pixel(20, 7, STAIN);

    // 下铺床架 + 薄褥
    d.rect(3, 21, 26, 2, IRON);         // 下铺框
    d.hLine(3, 21, 26, IRON_LIGHT);
    d.rect(5, 18, 22, 3, MAT);          // 下铺褥
    d.hLine(5, 18, 22, '#a49a88');
    d.rect(5, 20, 22, 1, MAT_DARK);
    d.pixel(9, 19, STAIN); d.pixel(22, 19, STAIN);

    // 攀梯（左柱内侧横档）
    for (let y = 12; y <= 20; y += 3) {
        d.hLine(4, y, 4, IRON_LIGHT);
    }

    // 锈渍
    d.pixel(3, 16, RUST);
    d.pixel(28, 13, RUST);
    d.pixel(16, 23, RUST);

    return d.getCanvas();
}
