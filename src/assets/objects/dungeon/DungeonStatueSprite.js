// 纯美术：地牢石雕像（32×32，兜帽祷告者立像+台座）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const DARK = '#454a56';
const MID = '#5d6370';
const LIGHT = '#7a808e';
const SHADOW_C = '#31353f';

export function createDungeonStatueSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 10, 3, 'rgba(0,0,0,0.28)');

    // 台座
    d.rect(9, 25, 14, 4, DARK);
    d.hLine(9, 25, 14, MID);
    d.rect(11, 23, 10, 2, MID);
    d.hLine(11, 23, 10, LIGHT);

    // 长袍躯体（钟形）
    d.fillPath([
        { x: 16, y: 8 },
        { x: 21, y: 13 },
        { x: 22, y: 23 },
        { x: 10, y: 23 },
        { x: 11, y: 13 }
    ], MID);

    // 兜帽头部
    d.rect(13, 5, 6, 5, MID);
    d.hLine(13, 5, 6, LIGHT);
    d.rect(14, 8, 4, 2, SHADOW_C); // 帽内阴影

    // 祷告合掌
    d.rect(14, 14, 4, 3, LIGHT);
    d.vLine(15, 13, 5, LIGHT);
    d.vLine(16, 13, 5, LIGHT);

    // 袍褶明暗
    d.vLine(11, 13, 10, LIGHT);
    d.vLine(21, 13, 10, DARK);
    d.vLine(20, 14, 9, DARK);

    // 风化
    d.pixel(13, 18, SHADOW_C);
    d.pixel(18, 20, SHADOW_C);

    return d.getCanvas();
}
