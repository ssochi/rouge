// 纯美术：圣物展柜（32×32，金框玻璃柜+台座，柜内供奉泛光的圣骨遗物）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STONE = '#4a5560';
const STONE_DARK = '#333c45';
const STONE_LIGHT = '#65727c';
const GOLD = '#d6b23c';
const GOLD_DARK = '#9c7f22';
const GOLD_LIGHT = '#f2dd78';
const GLASS = 'rgba(150,190,210,0.28)';
const GLASS_HI = 'rgba(230,245,255,0.5)';
const BONE = '#e2d8bd';
const BONE_DARK = '#b6ac90';
const HALO = 'rgba(255,236,160,0.35)';

export function createF2ReliquarySprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 8, 3, 'rgba(0,0,0,0.26)');

    // 石台座
    d.rect(7, 24, 18, 5, STONE);
    d.hLine(7, 24, 18, STONE_LIGHT);
    d.rect(7, 27, 18, 2, STONE_DARK);
    d.hLine(8, 26, 16, GOLD_DARK); // 台缘金线

    // 玻璃柜体（金框）
    d.strokeRect(8, 7, 15, 17, GOLD);
    d.rect(8, 7, 16, 2, GOLD);         // 顶楣
    d.hLine(8, 8, 16, GOLD_LIGHT);
    d.vLine(8, 9, 15, GOLD_DARK);
    d.vLine(23, 9, 15, GOLD_DARK);
    // 玻璃填充 + 高光斜纹
    d.rect(9, 9, 14, 14, GLASS);
    d.line(11, 22, 20, 11, GLASS_HI);

    // 柜内圣骨（头骨）+ 光晕
    d.ellipse(16, 17, 4, 3, HALO);
    d.rect(14, 14, 5, 5, BONE);           // 颅
    d.hLine(14, 14, 5, '#f0e8cf');
    d.pixel(15, 16, STONE_DARK);          // 眼窝
    d.pixel(17, 16, STONE_DARK);
    d.rect(14, 19, 5, 2, BONE_DARK);      // 颌
    d.pixel(15, 20, STONE_DARK);
    d.pixel(17, 20, STONE_DARK);

    return d.getCanvas();
}
