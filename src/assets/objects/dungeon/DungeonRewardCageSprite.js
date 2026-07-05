// 纯美术：地牢奖励笼（32×32，两态：闭 closed=铁笼锁宝箱 / 开 open=笼门敞开空框）。严禁游戏逻辑。
// 开态不画箱体——由代码在开笼时生成真实 Chest 实体显示于笼内。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const IRON = '#4a4a56';
const IRON_DARK = '#33333d';
const IRON_LIGHT = '#63636f';
const RUST = '#6e4a2a';
const WOOD = '#7a5230';
const WOOD_DARK = '#5a3c22';
const WOOD_LIGHT = '#94693e';
const BAND = '#8a8e9c';
const GOLD = '#e0b64a';
const LOCK = '#b8bcc8';

/** 笼子外框：底影 + 顶梁 + 四角立柱（两态共用）。 */
function drawFrame(d) {
    d.ellipse(16, 29, 13, 3, 'rgba(0,0,0,0.24)');
    // 顶梁
    d.rect(3, 4, 26, 3, IRON);
    d.hLine(3, 4, 26, IRON_LIGHT);
    d.rect(3, 6, 26, 1, IRON_DARK);
    // 四角立柱
    d.rect(3, 6, 3, 22, IRON);
    d.rect(26, 6, 3, 22, IRON);
    d.vLine(3, 6, 22, IRON_LIGHT);
    d.vLine(28, 6, 22, IRON_DARK);
    // 底座横梁
    d.rect(3, 26, 26, 2, IRON_DARK);
    // 锈斑
    d.pixel(4, 14, RUST); d.pixel(27, 19, RUST); d.pixel(5, 24, RUST);
}

/** 笼内小宝箱（闭态）。 */
function drawChestInside(d) {
    // 箱体
    d.rect(9, 17, 14, 9, WOOD);
    d.hLine(9, 17, 14, WOOD_LIGHT);
    d.rect(9, 24, 14, 2, WOOD_DARK);
    // 箱盖弧
    d.rect(9, 13, 14, 4, WOOD);
    d.hLine(9, 13, 14, WOOD_LIGHT);
    d.rect(9, 16, 14, 1, WOOD_DARK);
    // 铁箍
    d.vLine(12, 13, 13, BAND);
    d.vLine(19, 13, 13, BAND);
    // 锁扣
    d.rect(15, 18, 2, 3, GOLD);
}

/** 闭态：前排竖栏 + 正中挂锁，锁着笼内宝箱。 */
export function createRewardCageClosedSprite() {
    const d = new PixelDraw(32, 32);
    drawFrame(d);
    drawChestInside(d);
    // 前排竖栏（盖在箱体上，表现"锁住"）
    for (const x of [7, 11, 15, 19, 23]) {
        d.vLine(x, 7, 19, IRON);
        d.vLine(x + 1, 7, 19, IRON_DARK);
    }
    // 中横栏
    d.rect(6, 15, 20, 1, IRON);
    // 挂锁
    d.rect(14, 19, 5, 5, LOCK);
    d.hLine(14, 19, 5, '#d6dae6');
    d.rect(15, 17, 3, 2, IRON_LIGHT); // 锁梁
    d.pixel(16, 21, IRON_DARK);       // 锁孔
    return d.getCanvas();
}

/** 开态：前栏向两侧敞开，笼内留空（宝箱实体另绘）。 */
export function createRewardCageOpenSprite() {
    const d = new PixelDraw(32, 32);
    drawFrame(d);
    // 敞开的笼门（两扇栏斜靠立柱）
    for (let i = 0; i < 4; i++) {
        d.pixel(6 - i, 8 + i * 4, IRON);
        d.pixel(7 - i, 8 + i * 4, IRON_DARK);
        d.pixel(26 + i, 8 + i * 4, IRON);
        d.pixel(27 + i, 8 + i * 4, IRON_DARK);
    }
    // 门轴断口高光
    d.pixel(6, 8, IRON_LIGHT);
    d.pixel(25, 8, IRON_LIGHT);
    return d.getCanvas();
}
