// 纯美术：教团长椅（32×32，深木高背长椅+紫祭垫，面向讲坛的信徒座席）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const WOOD = '#5a4128';
const WOOD_DARK = '#40301c';
const WOOD_LIGHT = '#72543a';
const CUSHION = '#4a2f5a';
const CUSHION_DARK = '#382445';
const CUSHION_LIGHT = '#63437a';
const TRIM = '#b28a2c';

export function createF2PewSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 13, 3, 'rgba(0,0,0,0.26)');

    // 高椅背（竖木条）
    d.rect(4, 7, 24, 9, WOOD);
    d.hLine(4, 7, 24, WOOD_LIGHT);        // 顶栏高光
    d.hLine(4, 15, 24, WOOD_DARK);        // 背底阴影
    for (let x = 7; x < 27; x += 4) {
        d.vLine(x, 8, 7, WOOD_DARK);       // 背板竖缝
        d.vLine(x + 1, 8, 7, WOOD_LIGHT);
    }
    d.hLine(5, 9, 22, TRIM);              // 背中一道金饰线

    // 紫色祭垫
    d.rect(4, 18, 24, 4, CUSHION);
    d.hLine(4, 18, 24, CUSHION_LIGHT);
    d.hLine(4, 21, 24, CUSHION_DARK);
    d.pixel(9, 20, CUSHION_DARK);
    d.pixel(17, 20, CUSHION_DARK);
    d.pixel(23, 20, CUSHION_DARK);

    // 座板木框
    d.rect(4, 22, 24, 3, WOOD);
    d.hLine(4, 22, 24, WOOD_LIGHT);
    d.hLine(4, 24, 24, WOOD_DARK);

    // 扶手立柱 + 椅腿
    d.rect(4, 16, 3, 12, WOOD_DARK);
    d.rect(25, 16, 3, 12, WOOD_DARK);
    d.vLine(4, 16, 12, WOOD);
    d.vLine(25, 16, 12, WOOD);
    d.rect(9, 25, 3, 4, WOOD_DARK);
    d.rect(20, 25, 3, 4, WOOD_DARK);

    return d.getCanvas();
}
