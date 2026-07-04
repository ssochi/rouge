// DungeonWallSprites —— 纯美术：地牢石砖墙体贴图（按楼层主题色板生成）。严禁游戏逻辑。
//
// 渲染约定（Renderer 墙体绘制）：
//   顶面 top  32×32：画在 (x, y-16)，覆盖 [y-16, y+16] 的「墙顶」带
//   前脸 front 32×16：画在 (x, y+16)，覆盖墙 rect 底部露出的前立面
// 每种各 4 个变体（完好/裂纹/苔痕/破损），由 tile 位置哈希混铺。

import { PixelDraw } from '../../utils/PixelDraw.js';
import { addBlockTexture } from '../objects/WallTexture.js';

/** 确定性伪随机散点（与 FloorSprites 同源实现，独立副本避免跨模块耦合）。 */
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
 * 墙顶贴图变体（32×32，大石板俯视）。
 * @param {Object} wall 主题墙体色板（DungeonThemes theme.wall）
 * @param {number} variant 0 完好 / 1 裂纹 / 2 苔痕 / 3 破损
 */
function createWallTop(wall, variant) {
    const d = new PixelDraw(32, 32);

    d.rect(0, 0, 32, 32, wall.top);
    // 16×8 石板砌体，砂浆勾缝
    addBlockTexture(d, 0, 0, 32, 32, wall.topMortar, 16, 8);

    // 每块石板左上角受光高亮
    for (let row = 0; row < 4; row++) {
        const offset = row % 2 === 0 ? 0 : 8;
        for (let bx = offset; bx < 32; bx += 16) {
            d.hLine(bx + 1, row * 8 + 1, 5, wall.highlight);
            d.pixel(bx + 1, row * 8 + 2, wall.highlight);
        }
    }

    // 变体细节
    if (variant === 1) {
        // 斜向裂纹
        const cx = 6 + (variant * 7) % 12;
        for (let i = 0; i < 7; i++) {
            d.pixel(cx + i, 8 + i * 2, wall.crack);
            if (i % 2 === 0) d.pixel(cx + i + 1, 9 + i * 2, wall.crack);
        }
    } else if (variant === 2) {
        // 苔痕簇
        scatter(37, 9, 14, 12).forEach(p => d.pixel(p.x + 3, p.y + 16, wall.accent));
        d.rect(6, 22, 3, 2, wall.accent);
        d.rect(20, 25, 2, 2, wall.accent);
    } else if (variant === 3) {
        // 破损缺角：一角石板剥落露出砂浆层
        d.rect(22, 2, 8, 5, wall.topMortar);
        d.pixel(23, 3, wall.crack);
        d.pixel(26, 5, wall.crack);
        scatter(59, 4, 30, 30).forEach(p => d.pixel(p.x + 1, p.y + 1, wall.topMortar));
    }

    // 通用噪点
    scatter(11 + variant * 100, 5, 32, 32).forEach(p => d.pixel(p.x, p.y, wall.topMortar));
    return d.getCanvas();
}

/**
 * 墙前脸贴图变体（32×16，砖砌立面）。
 * @param {Object} wall 主题墙体色板
 * @param {number} variant 0 完好 / 1 裂纹 / 2 苔痕 / 3 破损
 */
function createWallFront(wall, variant) {
    const d = new PixelDraw(32, 16);

    d.rect(0, 0, 32, 16, wall.front);
    // 8×5 砖块错缝
    addBlockTexture(d, 0, 0, 32, 16, wall.frontMortar, 8, 5);

    // 顶檐受光 + 底部接地阴影
    d.hLine(0, 0, 32, wall.highlight);
    d.hLine(0, 15, 32, wall.frontMortar);
    d.hLine(0, 14, 32, wall.crack);

    if (variant === 1) {
        // 纵向裂缝
        const cx = 10;
        d.pixel(cx, 2, wall.crack);
        d.pixel(cx, 3, wall.crack);
        d.pixel(cx + 1, 4, wall.crack);
        d.pixel(cx + 1, 5, wall.crack);
        d.pixel(cx, 6, wall.crack);
        d.pixel(cx, 7, wall.crack);
    } else if (variant === 2) {
        // 底部返潮苔痕
        for (let x = 2; x < 30; x += 3) {
            d.pixel(x, 12 + (x % 2), wall.accent);
        }
        d.rect(5, 11, 2, 2, wall.accent);
        d.rect(24, 12, 3, 1, wall.accent);
    } else if (variant === 3) {
        // 局部砖块剥落
        d.rect(16, 5, 7, 4, wall.frontMortar);
        d.pixel(17, 6, wall.crack);
        d.pixel(20, 7, wall.crack);
    }

    scatter(23 + variant * 100, 4, 32, 13).forEach(p => d.pixel(p.x, p.y + 1, wall.frontMortar));
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
