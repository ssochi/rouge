// DungeonFloorSprites —— 纯美术：地牢石板地面贴图（按楼层主题色板生成）。严禁游戏逻辑。
// 16×16 子瓦 4 变体，接 Assets.floors['dungeon_f1'/'dungeon_f2'/'dungeon_f3']，
// 由 WorldSystem.buildFloorCanvas 位置哈希混铺。

import { PixelDraw } from '../../utils/PixelDraw.js';

function scatter(seed, count, w, h) {
    const pts = [];
    let s = seed;
    for (let i = 0; i < count; i++) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const x = s % w;
        s = (s * 1664525 + 1013904223) >>> 0;
        const y = s % h;
        pts.push({ x, y });
    }
    return pts;
}

/**
 * 单个石板变体（16×16，双行错缝砖 + 主题色噪点）。
 * @param {Object} floor 主题地板色板（DungeonThemes theme.floor）
 * @param {number} seed 变体种子
 */
function createSlabVariant(floor, seed) {
    const d = new PixelDraw(16, 16);

    d.rect(0, 0, 16, 16, floor.base);

    // 两行石板，行缝固定保证跨瓦连续
    d.hLine(0, 7, 16, floor.gap);
    d.hLine(0, 15, 16, floor.gap);

    // 错缝纵缝
    let ps = seed;
    ps = (ps * 1664525 + 1013904223) >>> 0;
    const joint1 = 5 + (ps % 6);
    ps = (ps * 1664525 + 1013904223) >>> 0;
    const joint2 = (joint1 + 6 + (ps % 4)) % 16;

    for (let y = 0; y <= 6; y++) d.pixel(joint1, y, floor.gap);
    for (let y = 8; y <= 14; y++) d.pixel(joint2, y, floor.gap);

    // 行顶受光 / 行底落影
    d.hLine(0, 0, 16, floor.light);
    d.hLine(0, 8, 16, floor.light);
    d.hLine(0, 6, 16, floor.dark);
    d.hLine(0, 14, 16, floor.dark);

    // 主题色噪点（苔藓/焦痕等由 accent 承担）
    scatter(seed + 40, 3, 16, 16).forEach(p => d.pixel(p.x, p.y, floor.light));
    scatter(seed + 90, 2, 16, 16).forEach(p => d.pixel(p.x, p.y, floor.dark));
    if (seed % 2 === 0) {
        scatter(seed + 140, 2, 16, 16).forEach(p => d.pixel(p.x, p.y, floor.accent));
    }

    // 偶发缺损
    if (seed % 3 === 0) {
        const cx = 3 + (seed % 9);
        const cy = 2 + ((seed >> 2) % 10);
        d.pixel(cx, cy, floor.gap);
        d.pixel(cx + 1, cy, floor.dark);
    }

    return d.getCanvas();
}

/**
 * 生成一个楼层主题的地板变体组。
 * @param {Object} theme DungeonThemes 主题对象
 * @returns {HTMLCanvasElement[]} 4 变体
 */
export function createDungeonFloorVariants(theme) {
    return [7, 31, 53, 89].map(s => createSlabVariant(theme.floor, s));
}
