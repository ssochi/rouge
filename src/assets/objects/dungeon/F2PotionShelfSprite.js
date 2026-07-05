// 纯美术：药剂架（32×32，木架三层+各色药瓶，炼金室墙侧陈列）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const WOOD = '#5a4128';
const WOOD_DARK = '#3d2c1a';
const WOOD_LIGHT = '#72543a';
const CORK = '#9c7b4e';
const R_RED = '#b83a3a';
const R_GRN = '#4fa85e';
const R_BLU = '#4a7fc0';
const R_PUR = '#8a5aa8';
const R_AMB = '#d0952e';
const GLINT = '#eaf2ff';

export function createF2PotionShelfSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 9, 3, 'rgba(0,0,0,0.24)');

    // 立柱与顶楣
    d.rect(5, 4, 3, 25, WOOD);
    d.rect(24, 4, 3, 25, WOOD);
    d.vLine(5, 4, 25, WOOD_LIGHT);
    d.vLine(26, 4, 25, WOOD_DARK);
    d.rect(5, 4, 22, 2, WOOD_LIGHT);

    // 三层隔板
    const shelves = [11, 18, 25];
    shelves.forEach(y => {
        d.rect(6, y, 20, 2, WOOD);
        d.hLine(6, y, 20, WOOD_LIGHT);
        d.hLine(6, y + 1, 20, WOOD_DARK);
    });

    // 每层药瓶（瓶身 + 木塞 + 高光）
    const vial = (x, top, color) => {
        d.rect(x, top, 3, 4, color);
        d.pixel(x + 1, top - 1, CORK);
        d.pixel(x, top, GLINT);
    };
    // 顶层
    vial(8, 7, R_RED);
    vial(13, 7, R_GRN);
    vial(18, 7, R_BLU);
    vial(22, 7, R_PUR);
    // 中层
    vial(8, 14, R_AMB);
    vial(13, 14, R_PUR);
    vial(19, 14, R_RED);
    // 底层
    vial(9, 21, R_BLU);
    vial(15, 21, R_GRN);
    vial(20, 21, R_AMB);

    return d.getCanvas();
}
