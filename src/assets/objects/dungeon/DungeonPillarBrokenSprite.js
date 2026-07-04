// 纯美术：地牢断柱（32×32，半截柱身+断口+散落碎块）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const DARK = '#4f535d';
const MID = '#6b707c';
const LIGHT = '#8c929f';
const CRACK = '#2e3239';
const MOSS = '#5b6d45';

export function createDungeonPillarBrokenSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 10, 3, 'rgba(0,0,0,0.28)');

    // 基座
    d.rect(8, 26, 16, 4, DARK);
    d.hLine(8, 26, 16, MID);
    d.rect(10, 23, 12, 3, MID);
    d.hLine(10, 23, 12, LIGHT);

    // 半截柱身
    d.rect(11, 13, 10, 10, MID);
    d.vLine(11, 13, 10, LIGHT);
    d.vLine(12, 14, 9, LIGHT);
    d.vLine(19, 13, 10, DARK);
    d.vLine(20, 13, 10, DARK);
    d.hLine(11, 19, 10, DARK);

    // 参差断口
    d.pixel(11, 12, MID);
    d.rect(13, 11, 2, 2, MID);
    d.pixel(16, 12, MID);
    d.rect(18, 10, 2, 3, MID);
    d.pixel(20, 12, DARK);
    d.hLine(11, 13, 10, LIGHT);

    // 断裂裂纹
    d.pixel(15, 16, CRACK);
    d.pixel(16, 17, CRACK);
    d.pixel(17, 18, CRACK);

    // 散落碎块
    d.rect(4, 27, 3, 2, MID);
    d.pixel(5, 26, LIGHT);
    d.rect(25, 28, 3, 2, DARK);
    d.pixel(26, 27, MID);

    // 苔痕
    d.rect(11, 21, 2, 1, MOSS);
    d.pixel(19, 22, MOSS);

    return d.getCanvas();
}
