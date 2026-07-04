// 纯美术：地牢木刑架（32×32，X 形木架+镣铐链）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const WOOD = '#5a4029';
const WOOD_DARK = '#42301e';
const WOOD_LIGHT = '#71533a';
const IRON = '#484855';
const IRON_LIGHT = '#5f5f6e';

export function createDungeonRackSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 10, 3, 'rgba(0,0,0,0.25)');

    // X 形交叉木梁
    for (let i = 0; i < 18; i++) {
        d.pixel(7 + i, 6 + i, WOOD);
        d.pixel(8 + i, 6 + i, WOOD_LIGHT);
        d.pixel(24 - i, 6 + i, WOOD);
        d.pixel(25 - i, 6 + i, WOOD_DARK);
    }

    // 底部支撑座
    d.rect(6, 24, 6, 4, WOOD_DARK);
    d.rect(20, 24, 6, 4, WOOD_DARK);
    d.hLine(6, 24, 6, WOOD);
    d.hLine(20, 24, 6, WOOD);

    // 中心铆接铁板
    d.rect(14, 13, 4, 4, IRON);
    d.pixel(14, 13, IRON_LIGHT);

    // 四角镣铐环 + 垂链
    d.rect(7, 5, 3, 2, IRON);
    d.rect(22, 5, 3, 2, IRON);
    d.pixel(8, 7, IRON_LIGHT);
    d.pixel(23, 7, IRON_LIGHT);
    d.pixel(8, 8, IRON);
    d.pixel(8, 10, IRON);
    d.pixel(23, 8, IRON);
    d.pixel(23, 10, IRON);

    return d.getCanvas();
}
