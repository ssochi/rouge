// 纯美术：讲坛（32×32，锥形石台+斜面摊开的禁经+一支引读烛）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STONE = '#4d5a63';
const STONE_DARK = '#38434b';
const STONE_LIGHT = '#68767f';
const PAGE = '#d9cfb2';
const PAGE_DARK = '#b3a888';
const SPINE = '#5a3324';
const GOLD = '#d6b23c';
const WAX = '#d8cfae';
const FLAME = '#ffd97a';
const FLAME_HOT = '#fff3c0';

export function createF2PulpitSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 10, 3, 'rgba(0,0,0,0.28)');

    // 锥形石柱（下宽上窄）
    d.fillPath([
        { x: 12, y: 14 }, { x: 20, y: 14 },
        { x: 23, y: 28 }, { x: 9, y: 28 }
    ], STONE);
    d.fillPath([
        { x: 12, y: 14 }, { x: 14, y: 14 },
        { x: 11, y: 28 }, { x: 9, y: 28 }
    ], STONE_LIGHT); // 左侧受光棱
    d.vLine(21, 15, 13, STONE_DARK);
    d.pixel(20, 22, STONE_DARK);
    d.hLine(9, 27, 14, STONE_DARK);

    // 顶部读经斜台
    d.fillPath([
        { x: 7, y: 12 }, { x: 25, y: 12 },
        { x: 22, y: 15 }, { x: 10, y: 15 }
    ], STONE_DARK);
    d.hLine(7, 12, 18, STONE_LIGHT);

    // 摊开的禁经（双页 + 书脊 + 金页缘）
    d.fillPath([
        { x: 9, y: 7 }, { x: 16, y: 9 },
        { x: 15, y: 13 }, { x: 8, y: 11 }
    ], PAGE);
    d.fillPath([
        { x: 16, y: 9 }, { x: 23, y: 7 },
        { x: 24, y: 11 }, { x: 17, y: 13 }
    ], PAGE);
    d.vLine(16, 9, 4, SPINE);
    d.pixel(11, 9, PAGE_DARK);
    d.pixel(12, 10, PAGE_DARK);
    d.pixel(20, 9, PAGE_DARK);
    d.pixel(19, 10, PAGE_DARK);
    d.pixel(9, 11, GOLD);
    d.pixel(23, 11, GOLD);

    // 侧立引读烛
    d.vLine(26, 9, 6, WAX);
    d.pixel(26, 8, FLAME);
    d.pixel(26, 7, FLAME_HOT);

    return d.getCanvas();
}
