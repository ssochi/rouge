// DungeonWallSprites —— 纯美术：地牢墙体贴图（按楼层主题色板生成）。严禁游戏逻辑。
//
// 视觉方向（用户确认）：干净大色块——近纯色平面 + 强明暗轮廓 + 稀疏大砖缝，几乎无噪点。
// 渲染约定（Renderer 墙体绘制）：
//   顶面 top  32×32：画在 (x, y-16)，覆盖 [y-16, y+16] 的「墙顶」带
//   前脸 front 32×16：画在 (x, y+16)，覆盖墙 rect 底部露出的前立面
// 每种各 4 个变体（完好/裂纹/苔痕/缺角），由 tile 位置哈希混铺；变体差异刻意克制。

import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * 墙顶贴图变体（32×32）：整板石面 + 受光轮廓 + 一横一竖大缝。
 * @param {Object} wall 主题墙体色板（DungeonThemes theme.wall）
 * @param {number} variant 0 完好 / 1 裂纹 / 2 苔痕 / 3 缺角
 */
function createWallTop(wall, variant) {
    const d = new PixelDraw(32, 32);

    // 近纯色底面
    d.rect(0, 0, 32, 32, wall.top);

    // 大砖缝：一条横缝 + 上下半错缝竖缝（16×32 大砖感，跨 tile 重复自然连续）
    d.hLine(0, 16, 32, wall.topMortar);
    d.vLine(16, 0, 16, wall.topMortar);
    d.vLine(8, 17, 15, wall.topMortar);
    d.vLine(24, 17, 15, wall.topMortar);

    // 受光轮廓：顶/左亮线，底/右暗压边（强明暗交界，墙顶从背景里「立」出来）
    d.hLine(0, 0, 32, wall.highlight);
    d.vLine(0, 0, 32, wall.highlight);
    d.hLine(0, 31, 32, wall.topMortar);
    d.vLine(31, 0, 32, wall.topMortar);

    // 变体细节（克制：每变体一处）
    if (variant === 1) {
        // 一条短裂纹
        d.pixel(6, 6, wall.crack);
        d.pixel(7, 7, wall.crack);
        d.pixel(8, 7, wall.crack);
        d.pixel(9, 8, wall.crack);
    } else if (variant === 2) {
        // 一撮苔藓
        d.rect(22, 24, 3, 2, wall.accent);
        d.pixel(21, 25, wall.accent);
        d.pixel(25, 23, wall.accent);
    } else if (variant === 3) {
        // 一处缺角
        d.rect(26, 0, 6, 3, wall.topMortar);
        d.pixel(26, 3, wall.topMortar);
        d.pixel(29, 3, wall.crack);
    }

    return d.getCanvas();
}

/**
 * 墙前脸贴图变体（32×16）：两排大砖 + 强亮檐线 + 接地暗带。
 * @param {Object} wall 主题墙体色板
 * @param {number} variant 0 完好 / 1 裂纹 / 2 苔痕 / 3 缺角
 */
function createWallFront(wall, variant) {
    const d = new PixelDraw(32, 16);

    // 近纯色立面
    d.rect(0, 0, 32, 16, wall.front);

    // 两排 16×8 大砖错缝
    d.hLine(0, 8, 32, wall.frontMortar);
    d.vLine(16, 0, 8, wall.frontMortar);
    d.vLine(8, 9, 7, wall.frontMortar);
    d.vLine(24, 9, 7, wall.frontMortar);

    // 顶檐强亮线（墙顶与前脸的明暗交界）+ 砖顶受光
    d.hLine(0, 0, 32, wall.highlight);
    d.hLine(0, 1, 32, wall.highlight);
    // 接地暗带
    d.hLine(0, 14, 32, wall.frontMortar);
    d.hLine(0, 15, 32, wall.crack);

    // 变体细节
    if (variant === 1) {
        d.pixel(11, 4, wall.crack);
        d.pixel(12, 5, wall.crack);
        d.pixel(12, 6, wall.crack);
    } else if (variant === 2) {
        d.pixel(4, 12, wall.accent);
        d.rect(5, 13, 2, 1, wall.accent);
        d.pixel(26, 13, wall.accent);
    } else if (variant === 3) {
        d.rect(18, 9, 4, 3, wall.frontMortar);
        d.pixel(19, 10, wall.crack);
    }

    return d.getCanvas();
}

/**
 * 生成一个楼层主题的完整墙体贴图集。
 * @param {Object} theme DungeonThemes 主题对象
 * @returns {{ tops: HTMLCanvasElement[], fronts: HTMLCanvasElement[] }}
 */
export function createDungeonWallSet(theme) {
    const tops = [];
    const fronts = [];
    for (let v = 0; v < 4; v++) {
        tops.push(createWallTop(theme.wall, v));
        fronts.push(createWallFront(theme.wall, v));
    }
    return { tops, fronts };
}
