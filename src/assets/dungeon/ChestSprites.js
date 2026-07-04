// ChestSprites.js
// 纯美术：地牢四档宝箱（木/铁/秘银/龙纹 × 关/开）的程序化像素画。
// 严禁包含任何游戏逻辑，仅返回 Canvas。遵循 docs/PIXEL_ART_GUIDE.md 与家具五层绘制标准
// （轮廓 → 主体 → 档位色金属包边 → 右侧阴影 → 左上高光）。

import { PixelDraw } from '../../utils/PixelDraw.js';

export const CHEST_W = 26;
export const CHEST_H = 22;

// 木质箱体共用色板
const WOOD_OUTLINE = '#2e1c10';
const WOOD_DARK = '#5d3a1e';
const WOOD_MAIN = '#8b5a2b';
const WOOD_LIGHT = '#a8713a';
const INTERIOR = '#1d1208';

// 档位金属包边色板：main 包边主色 / light 高光 / dark 暗部
const TIER_TRIM = {
    wood:    { main: '#7a5230', light: '#9a6c42', dark: '#5a3719' },
    iron:    { main: '#4a7fb5', light: '#7fa8d4', dark: '#2f5a8a' },
    mithril: { main: '#3fa66a', light: '#74cf98', dark: '#27714a' },
    dragon:  { main: '#c0392b', light: '#e77c66', dark: '#86261c' },
};

/**
 * 绘制箱体主体（下半部分，开/关共用）。
 * 主体区域：y ∈ [bodyTop, 19]，两只脚 y ∈ [20, 21]。
 */
function drawBody(d, trim, bodyTop) {
    // 轮廓
    d.rect(1, bodyTop, CHEST_W - 2, 20 - bodyTop, WOOD_OUTLINE);
    // 主体木板
    d.rect(2, bodyTop + 1, CHEST_W - 4, 19 - bodyTop - 1, WOOD_MAIN);
    // 木板横纹（暗线）
    for (let y = bodyTop + 3; y < 18; y += 3) {
        d.hLine(3, y, CHEST_W - 6, WOOD_DARK);
    }
    // 档位色金属竖箍 ×2
    d.rect(5, bodyTop, 2, 20 - bodyTop, trim.main);
    d.rect(19, bodyTop, 2, 20 - bodyTop, trim.main);
    d.pixel(5, bodyTop + 1, trim.light);
    d.pixel(19, bodyTop + 1, trim.light);
    // 右侧阴影（叠加暗部）
    d.rect(CHEST_W - 4, bodyTop + 1, 2, 19 - bodyTop - 1, WOOD_DARK);
    d.vLine(CHEST_W - 3, bodyTop + 1, 19 - bodyTop - 1, WOOD_OUTLINE);
    // 左上高光
    d.vLine(2, bodyTop + 1, 3, WOOD_LIGHT);
    // 两只脚
    d.rect(2, 20, 4, 2, WOOD_OUTLINE);
    d.rect(CHEST_W - 6, 20, 4, 2, WOOD_OUTLINE);
}

/**
 * 关闭状态：圆角盖子 + 锁面板。
 */
function drawClosedChest(tier) {
    const trim = TIER_TRIM[tier];
    const d = new PixelDraw(CHEST_W, CHEST_H);

    // ── 盖子（y 2..9，圆角）──
    d.rect(2, 2, CHEST_W - 4, 8, WOOD_OUTLINE);
    d.rect(1, 4, CHEST_W - 2, 6, WOOD_OUTLINE);
    d.rect(3, 3, CHEST_W - 6, 6, WOOD_MAIN);
    d.rect(2, 5, CHEST_W - 4, 4, WOOD_MAIN);
    // 盖顶高光弧
    d.hLine(4, 3, 8, WOOD_LIGHT);
    d.pixel(3, 4, WOOD_LIGHT);
    // 盖子金属箍（与箱体竖箍对齐）
    d.rect(5, 2, 2, 8, trim.main);
    d.rect(19, 2, 2, 8, trim.main);
    d.pixel(5, 3, trim.light);
    d.pixel(19, 3, trim.light);
    // 盖子右侧阴影
    d.rect(CHEST_W - 4, 5, 2, 4, WOOD_DARK);
    // 盖底沿分界线（档位暗色）
    d.hLine(2, 9, CHEST_W - 4, trim.dark);

    // ── 箱体（y 10..19 + 脚）──
    drawBody(d, trim, 10);

    // ── 锁面板（中央，档位色）──
    d.rect(11, 8, 4, 6, WOOD_OUTLINE);
    d.rect(12, 9, 2, 4, trim.main);
    d.pixel(12, 9, trim.light);
    // 锁孔
    d.pixel(12, 11, WOOD_OUTLINE);
    d.pixel(13, 11, WOOD_OUTLINE);

    return d.getCanvas();
}

/**
 * 开启状态：盖子向后翻起（露出盖内侧）+ 幽暗内部 + 档位色微光。
 */
function drawOpenChest(tier) {
    const trim = TIER_TRIM[tier];
    const d = new PixelDraw(CHEST_W, CHEST_H);

    // ── 翻起的盖子（y 0..5，露出内侧暗木）──
    d.rect(2, 0, CHEST_W - 4, 6, WOOD_OUTLINE);
    d.rect(3, 1, CHEST_W - 6, 4, WOOD_DARK);
    // 盖内侧金属箍
    d.rect(5, 0, 2, 6, trim.dark);
    d.rect(19, 0, 2, 6, trim.dark);
    // 盖内沿高光（档位色微光反射）
    d.hLine(4, 4, CHEST_W - 8, trim.dark);

    // ── 敞开的箱口（y 7..12：内部幽暗）──
    d.rect(1, 7, CHEST_W - 2, 6, WOOD_OUTLINE);
    d.rect(2, 8, CHEST_W - 4, 5, INTERIOR);
    // 内部档位色微光（宝物反光）
    d.pixel(9, 10, trim.light);
    d.pixel(10, 11, trim.main);
    d.pixel(15, 10, trim.light);
    d.pixel(14, 11, trim.main);
    d.pixel(12, 9, trim.light);

    // ── 箱体（y 13..19 + 脚）──
    drawBody(d, trim, 13);

    return d.getCanvas();
}

/**
 * 生成指定档位、开/关状态的宝箱精灵（26×22）。
 * @param {'wood'|'iron'|'mithril'|'dragon'} tier
 * @param {boolean} isOpen
 * @returns {HTMLCanvasElement}
 */
export function createChestSprite(tier, isOpen) {
    return isOpen ? drawOpenChest(tier) : drawClosedChest(tier);
}

export const CHEST_TIER_NAMES = ['wood', 'iron', 'mithril', 'dragon'];
