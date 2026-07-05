// 纯美术：契约拉杆机关（32×32，两态：up 未立约/紫晶暗 / down 已立约/紫晶亮 + 符文点亮）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const BASE = '#4a3a56';
const BASE_DARK = '#33283d';
const BASE_LIGHT = '#63506f';
const SHAFT = '#9c8aa0';
const SHAFT_DARK = '#6b5b70';
const PURPLE = '#8e44ad';
const PURPLE_LIGHT = '#c084f0';
const PURPLE_DIM = '#5b3a70';
const RUNE_DIM = '#4a3560';
const RUNE_LIT = '#d9a6ff';
const GOLD = '#c9a24a';

/** 立约石座 + 支轴 + 前脸符文（两态共用，rune 传入符文亮色）。 */
function drawBase(d, rune) {
    d.ellipse(16, 28, 10, 3, 'rgba(0,0,0,0.26)');
    // 契约石座（比奖励笼拉杆更宽厚，带金饰边）
    d.rect(8, 20, 16, 8, BASE_DARK);
    d.rect(9, 19, 14, 7, BASE);
    d.hLine(9, 19, 14, BASE_LIGHT);
    d.rect(9, 26, 14, 2, BASE_DARK);
    d.hLine(9, 20, 14, GOLD);           // 金饰上边
    // 前脸符文（立约印记：竖线 + 双臂，象征"手掌/契约"）
    d.vLine(16, 22, 4, rune);
    d.pixel(14, 23, rune); d.pixel(18, 23, rune);
    d.pixel(13, 24, rune); d.pixel(19, 24, rune);
    // 支轴座
    d.rect(14, 17, 4, 3, SHAFT_DARK);
    d.pixel(15, 17, SHAFT);
}

/** 未立约态：拉杆向上偏右，紫晶暗、符文暗。 */
export function createPactLeverUpSprite() {
    const d = new PixelDraw(32, 32);
    drawBase(d, RUNE_DIM);
    // 拉杆（自轴向右上）
    d.line(16, 18, 23, 5, SHAFT);
    d.line(17, 18, 24, 5, SHAFT_DARK);
    // 紫晶握把（暗）
    d.circle(24, 4, 3, PURPLE_DIM);
    d.pixel(23, 3, PURPLE);
    d.pixel(24, 3, PURPLE);
    return d.getCanvas();
}

/** 已立约态：拉杆向下偏左，紫晶亮、符文点亮（契约生效）。 */
export function createPactLeverDownSprite() {
    const d = new PixelDraw(32, 32);
    drawBase(d, RUNE_LIT);
    // 拉杆（自轴向左下压）
    d.line(16, 18, 9, 13, SHAFT);
    d.line(16, 19, 9, 14, SHAFT_DARK);
    // 紫晶握把（亮）+ 高光
    d.circle(8, 12, 3, PURPLE);
    d.pixel(7, 11, PURPLE_LIGHT);
    d.pixel(8, 11, PURPLE_LIGHT);
    d.pixel(9, 12, RUNE_LIT);
    return d.getCanvas();
}
