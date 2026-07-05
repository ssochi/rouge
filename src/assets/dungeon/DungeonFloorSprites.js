// DungeonFloorSprites —— 纯美术：地牢石板地面（按楼层主题色板生成）。严禁游戏逻辑。
// 视觉方向（截图自查后二次迭代）：地面是「安静的背景」——
// 去掉受光亮线（网格感来源），用两档低频明暗底色交替 + 右/下细缝；细节每板至多一处。
// 接 Assets.floors['dungeon_f1'/'dungeon_f2'/'dungeon_f3']，buildFloorCanvas 位置哈希混铺。

import { PixelDraw } from '../../utils/PixelDraw.js';

/** hex 颜色线性插值（地板明暗档介于 base 与 dark 之间，避免对比过强）。 */
function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

/**
 * 单块石板变体（16×16）。
 * @param {Object} floor 主题地板色板（DungeonThemes theme.floor）
 * @param {number} variant 0 亮板 / 1 暗板 / 2 亮板+细裂 / 3 暗板+苔点
 */
function createSlabVariant(floor, variant) {
    const d = new PixelDraw(16, 16);

    const darkBase = mixHex(floor.base, floor.dark, 0.4);
    const isDark = variant === 1 || variant === 3;
    d.rect(0, 0, 16, 16, isDark ? darkBase : floor.base);

    // 右/下细缝（相邻板拼成安静的石板网格）
    d.hLine(0, 15, 16, floor.gap);
    d.vLine(15, 0, 16, floor.gap);

    // 变体细节（每块至多一处，低对比）
    if (variant === 2) {
        d.pixel(5, 6, floor.gap);
        d.pixel(6, 7, floor.gap);
        d.pixel(7, 7, floor.gap);
    } else if (variant === 3) {
        d.pixel(11, 11, floor.accent);
        d.pixel(12, 12, floor.accent);
    }

    return d.getCanvas();
}

/**
 * 生成一个楼层主题的地板变体组。
 * @param {Object} theme DungeonThemes 主题对象
 * @returns {HTMLCanvasElement[]} 4 变体
 */
export function createDungeonFloorVariants(theme) {
    return [0, 1, 2, 3].map(v => createSlabVariant(theme.floor, v));
}

/**
 * 坑贴图（16×16 深渊）：近纯黑 + 顶缘断口暗壁 + 微星点。全主题通用。
 * @returns {HTMLCanvasElement[]}
 */
export function createPitVariants() {
    const out = [];
    for (const seed of [3, 17]) {
        const d = new PixelDraw(16, 16);
        d.rect(0, 0, 16, 16, '#050508');
        // 顶缘断口壁面（地面厚度感）
        d.hLine(0, 0, 16, '#2c2c36');
        d.hLine(0, 1, 16, '#1a1a22');
        // 深渊微星点
        d.pixel((seed * 5) % 14 + 1, 6 + (seed % 7), '#141420');
        d.pixel((seed * 11) % 14 + 1, 9 + (seed % 5), '#10101a');
        out.push(d.getCanvas());
    }
    return out;
}
