// 纯美术：地牢烛台祭坛（32×32，石台+烛群，微光光源）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STONE_DARK = '#4f535d';
const STONE_MID = '#6b707c';
const STONE_LIGHT = '#8c929f';
const CLOTH = '#5c3a4e';
const CLOTH_TRIM = '#8a5a3a';
const WAX = '#d8cfae';
const WAX_DARK = '#b0a888';
const FLAME = '#ffd97a';
const FLAME_HOT = '#fff3c0';

export function createDungeonAltarSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 11, 3, 'rgba(0,0,0,0.28)');

    // 石台
    d.rect(6, 20, 20, 9, STONE_MID);
    d.hLine(6, 20, 20, STONE_LIGHT);
    d.rect(6, 26, 20, 3, STONE_DARK);
    d.vLine(6, 20, 9, STONE_LIGHT);
    d.vLine(25, 20, 9, STONE_DARK);

    // 祭布
    d.rect(9, 18, 14, 4, CLOTH);
    d.hLine(9, 18, 14, CLOTH_TRIM);
    d.pixel(10, 21, CLOTH_TRIM);
    d.pixel(21, 21, CLOTH_TRIM);

    // 三支蜡烛（高低错落）
    d.rect(11, 12, 2, 6, WAX);
    d.vLine(12, 12, 6, WAX_DARK);
    d.rect(16, 10, 2, 8, WAX);
    d.vLine(17, 10, 8, WAX_DARK);
    d.rect(21, 13, 2, 5, WAX);
    d.vLine(22, 13, 5, WAX_DARK);

    // 烛火
    d.pixel(11, 10, FLAME);
    d.pixel(12, 11, FLAME);
    d.pixel(11, 11, FLAME_HOT);
    d.pixel(16, 8, FLAME);
    d.pixel(17, 9, FLAME);
    d.pixel(16, 9, FLAME_HOT);
    d.pixel(21, 11, FLAME);
    d.pixel(22, 12, FLAME);
    d.pixel(21, 12, FLAME_HOT);

    // 蜡油垂痕
    d.pixel(11, 18, WAX);
    d.pixel(17, 19, WAX);

    return d.getCanvas();
}
