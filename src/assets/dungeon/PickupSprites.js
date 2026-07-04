// PickupSprites.js
// 纯美术：地牢金币 / 钥匙拾取物的程序化像素画。
// 严禁包含任何游戏逻辑，仅返回 Canvas。遵循 docs/PIXEL_ART_GUIDE.md。

import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * 以子像素中心绘制一个实心圆盘。
 * 画布尺寸为偶数时，几何中心落在整数坐标，像素中心需 +0.5 才能对称。
 */
function disc(d, cx, cy, r, color) {
    const r2 = r * r;
    for (let y = 0; y < d.height; y++) {
        for (let x = 0; x < d.width; x++) {
            const dx = x + 0.5 - cx;
            const dy = y + 0.5 - cy;
            if (dx * dx + dy * dy <= r2) d.pixel(x, y, color);
        }
    }
}

/**
 * 绘制圆环（annulus）。用于钥匙的匙柄（带孔）。
 */
function ring(d, cx, cy, rOuter, rInner, color) {
    const ro2 = rOuter * rOuter;
    const ri2 = rInner * rInner;
    for (let y = 0; y < d.height; y++) {
        for (let x = 0; x < d.width; x++) {
            const dx = x + 0.5 - cx;
            const dy = y + 0.5 - cy;
            const dist2 = dx * dx + dy * dy;
            if (dist2 <= ro2 && dist2 > ri2) d.pixel(x, y, color);
        }
    }
}

// --- 金币色板（简报指定）---
const COIN_EDGE = '#8a6d1a';   // 外圈暗线
const COIN_BODY = '#f1c40f';   // 主体金黄
const COIN_HI = '#fff3b0';     // 左上高光
const COIN_EMBOSS = '#c9a227'; // 中心压花 "¢" 暗纹
const COIN_GLINT = '#ffffff';  // 微闪帧的纯白亮点

/**
 * 生成一枚金币的单帧（10×10）。
 * @param {boolean} shimmer 是否为微闪帧（高光更亮、带白色亮点）
 * @returns {HTMLCanvasElement}
 */
function createCoinFrame(shimmer) {
    const d = new PixelDraw(10, 10);
    const cx = 5;
    const cy = 5;

    // 外圈暗线 → 金色主体
    disc(d, cx, cy, 4.6, COIN_EDGE);
    disc(d, cx, cy, 3.5, COIN_BODY);

    // 中心压花 "¢"：竖线 + 左侧 C 弧
    d.pixel(5, 3, COIN_EMBOSS);
    d.pixel(5, 4, COIN_EMBOSS);
    d.pixel(5, 5, COIN_EMBOSS);
    d.pixel(5, 6, COIN_EMBOSS);
    d.pixel(4, 3, COIN_EMBOSS);
    d.pixel(3, 4, COIN_EMBOSS);
    d.pixel(3, 5, COIN_EMBOSS);
    d.pixel(4, 6, COIN_EMBOSS);

    // 左上高光（光源左上）
    d.pixel(3, 2, COIN_HI);
    d.pixel(2, 3, COIN_HI);
    d.pixel(3, 3, COIN_HI);
    d.pixel(4, 2, COIN_HI);

    if (shimmer) {
        // 微闪：高光扩散一格并点缀白色亮点
        d.pixel(2, 4, COIN_HI);
        d.pixel(6, 2, COIN_GLINT);
        d.pixel(3, 2, COIN_GLINT);
    }

    return d.getCanvas();
}

/**
 * 生成金币两帧微闪动画。
 * @returns {HTMLCanvasElement[]} [静止帧, 微闪帧]
 */
export function createCoinSprite() {
    return [createCoinFrame(false), createCoinFrame(true)];
}

// --- 钥匙色板（古铜色）---
const KEY_DARK = '#6e4a1f';  // 暗部/底边
const KEY_MAIN = '#b8823a';  // 古铜主体
const KEY_LIGHT = '#e3ad5c'; // 高光

/**
 * 生成一把古铜色钥匙（14×8，横向，匙柄在左）。
 * @returns {HTMLCanvasElement}
 */
export function createKeySprite() {
    const d = new PixelDraw(14, 8);

    // 匙柄（bow）：左侧带孔圆环
    const bx = 3.5;
    const by = 4;
    ring(d, bx, by, 3.0, 1.3, KEY_MAIN);

    // 匙杆（shaft）：横向双像素条
    d.rect(5, 3, 8, 2, KEY_MAIN);

    // 匙齿（bit）：右端向下的两颗齿
    d.pixel(9, 5, KEY_MAIN);
    d.pixel(11, 5, KEY_MAIN);
    d.pixel(12, 5, KEY_MAIN);
    d.pixel(12, 6, KEY_MAIN);

    // 高光：匙柄左上弧 + 匙杆上沿
    d.pixel(2, 1, KEY_LIGHT);
    d.pixel(1, 2, KEY_LIGHT);
    d.pixel(2, 2, KEY_LIGHT);
    d.hLine(6, 3, 6, KEY_LIGHT);

    // 暗部：匙柄右下弧 + 匙齿底
    d.pixel(5, 5, KEY_DARK);
    d.pixel(4, 6, KEY_DARK);
    d.pixel(12, 6, KEY_DARK);

    return d.getCanvas();
}
