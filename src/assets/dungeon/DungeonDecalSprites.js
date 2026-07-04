// DungeonDecalSprites —— 纯美术：地牢地板贴花（一次性盖印到 floorCanvas，零帧成本）。严禁游戏逻辑。
// 种类：裂纹×2 / 苔藓×2 / 血迹×2 / 水洼 / 角落蛛网 / 散页 / Boss 房大圆环刻纹。
// 半透明像素直接叠在石板上，网缝/圆环颜色随主题地板色板微调。

import { PixelDraw } from '../../utils/PixelDraw.js';

const MOSS_A = 'rgba(91,109,69,0.85)';
const MOSS_B = 'rgba(109,138,79,0.7)';
const BLOOD_A = 'rgba(96,26,26,0.8)';
const BLOOD_B = 'rgba(70,16,16,0.85)';
const WATER = 'rgba(52,72,96,0.55)';
const WATER_RIM = 'rgba(140,170,200,0.4)';
const WEB = 'rgba(200,205,215,0.5)';
const WEB_DIM = 'rgba(200,205,215,0.28)';
const PAGE = 'rgba(214,204,170,0.9)';
const PAGE_DIM = 'rgba(178,168,138,0.9)';

function createCrackDecal(gapColor, variant) {
    const d = new PixelDraw(16, 16);
    if (variant === 0) {
        // 主裂缝斜穿 + 分叉
        for (let i = 0; i < 10; i++) d.pixel(3 + i, 4 + Math.floor(i * 0.8), gapColor);
        d.pixel(7, 6, gapColor);
        d.pixel(8, 5, gapColor);
        d.pixel(9, 4, gapColor);
        d.pixel(6, 10, gapColor);
        d.pixel(5, 11, gapColor);
    } else {
        // 放射碎裂
        d.pixel(8, 8, gapColor);
        for (let i = 1; i < 5; i++) {
            d.pixel(8 + i, 8 - i, gapColor);
            d.pixel(8 - i, 8 + Math.floor(i * 0.7), gapColor);
            if (i < 4) d.pixel(8 - i, 8 - i, gapColor);
        }
        d.pixel(9, 9, gapColor);
        d.pixel(11, 10, gapColor);
    }
    return d.getCanvas();
}

function createMossDecal(variant) {
    const d = new PixelDraw(24, 24);
    const blobs = variant === 0
        ? [[6, 8, 5, 3], [12, 12, 6, 4], [4, 15, 4, 2]]
        : [[10, 5, 6, 3], [5, 11, 7, 4], [14, 16, 5, 3]];
    for (const [x, y, w, h] of blobs) {
        d.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, MOSS_A);
    }
    // 边缘散点柔化
    const spots = variant === 0
        ? [[4, 6], [12, 7], [18, 13], [9, 16], [15, 19], [3, 12]]
        : [[8, 4], [14, 8], [4, 9], [12, 15], [19, 18], [7, 19]];
    for (const [x, y] of spots) d.pixel(x, y, MOSS_B);
    return d.getCanvas();
}

function createBloodDecal(variant) {
    const d = new PixelDraw(24, 24);
    if (variant === 0) {
        // 泼溅
        d.ellipse(11, 11, 5, 4, BLOOD_A);
        d.ellipse(9, 10, 3, 2, BLOOD_B);
        const drops = [[18, 8], [19, 14], [16, 18], [5, 16], [4, 7], [14, 4]];
        for (const [x, y] of drops) d.pixel(x, y, BLOOD_A);
        d.rect(17, 11, 2, 1, BLOOD_A);
    } else {
        // 拖痕
        d.ellipse(7, 8, 4, 3, BLOOD_B);
        for (let i = 0; i < 10; i++) {
            d.pixel(9 + i, 10 + Math.floor(i * 0.5), BLOOD_A);
            if (i % 3 === 0) d.pixel(9 + i, 11 + Math.floor(i * 0.5), BLOOD_B);
        }
        d.pixel(20, 16, BLOOD_A);
    }
    return d.getCanvas();
}

function createPuddleDecal() {
    const d = new PixelDraw(24, 24);
    d.ellipse(12, 13, 8, 5, WATER);
    d.ellipse(10, 12, 4, 2, WATER);
    // 高光反光缘
    d.hLine(7, 10, 5, WATER_RIM);
    d.pixel(15, 11, WATER_RIM);
    d.pixel(17, 14, WATER_RIM);
    return d.getCanvas();
}

function createWebDecal() {
    // 左上角蛛网（放房间内角，必要时可旋转绘制——当前四角同款）
    const d = new PixelDraw(16, 16);
    for (let i = 0; i < 12; i += 2) {
        d.pixel(i, 0, WEB_DIM);
        d.pixel(0, i, WEB_DIM);
    }
    // 放射丝
    for (let i = 0; i < 10; i++) {
        d.pixel(i, Math.floor(i * 0.45), WEB);
        d.pixel(Math.floor(i * 0.45), i, WEB);
        if (i < 9) d.pixel(i, i, WEB);
    }
    // 弦线
    d.pixel(4, 2, WEB_DIM);
    d.pixel(5, 4, WEB_DIM);
    d.pixel(2, 4, WEB_DIM);
    d.pixel(4, 5, WEB_DIM);
    d.pixel(7, 3, WEB_DIM);
    d.pixel(8, 6, WEB_DIM);
    d.pixel(3, 7, WEB_DIM);
    d.pixel(6, 8, WEB_DIM);
    return d.getCanvas();
}

function createPagesDecal() {
    const d = new PixelDraw(16, 16);
    // 三张散落书页（微错角）
    d.rect(3, 4, 4, 5, PAGE);
    d.vLine(4, 5, 3, PAGE_DIM);
    d.rect(9, 7, 4, 5, PAGE);
    d.vLine(10, 8, 3, PAGE_DIM);
    d.rect(6, 11, 4, 4, PAGE_DIM);
    return d.getCanvas();
}

/**
 * Boss 房地面圆环刻纹（160×160，双环+刻痕符点，主题色低调融入石板）。
 */
function createBossRingDecal(floor) {
    const d = new PixelDraw(160, 160);
    const cx = 80;
    const cy = 80;
    const line = floor.gap;
    const glow = floor.light;

    const ring = (radius, color, step) => {
        const n = Math.floor(radius * 6.28 / step);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            d.pixel(Math.round(cx + Math.cos(a) * radius), Math.round(cy + Math.sin(a) * radius), color);
        }
    };

    // 外环双线 + 内环
    ring(70, line, 1);
    ring(68, line, 1);
    ring(69, glow, 3);
    ring(46, line, 1);

    // 环间符文刻点（八向）
    for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        const rx = Math.round(cx + Math.cos(a) * 58);
        const ry = Math.round(cy + Math.sin(a) * 58);
        d.rect(rx - 1, ry - 1, 3, 3, line);
        d.pixel(rx, ry, glow);
    }

    // 中心刻纹（十字+菱形）
    d.hLine(cx - 6, cy, 13, line);
    d.vLine(cx, cy - 6, 13, line);
    d.pixel(cx - 3, cy - 3, line);
    d.pixel(cx + 3, cy - 3, line);
    d.pixel(cx - 3, cy + 3, line);
    d.pixel(cx + 3, cy + 3, line);

    return d.getCanvas();
}

/**
 * 生成一个楼层主题的贴花集。
 * @param {Object} theme DungeonThemes 主题对象
 * @returns {{crack: HTMLCanvasElement[], moss: HTMLCanvasElement[], blood: HTMLCanvasElement[], puddle: HTMLCanvasElement[], web: HTMLCanvasElement[], pages: HTMLCanvasElement[], bossRing: HTMLCanvasElement}}
 */
export function createDungeonDecalSet(theme) {
    return {
        crack: [createCrackDecal(theme.floor.gap, 0), createCrackDecal(theme.floor.gap, 1)],
        moss: [createMossDecal(0), createMossDecal(1)],
        blood: [createBloodDecal(0), createBloodDecal(1)],
        puddle: [createPuddleDecal()],
        web: [createWebDecal()],
        pages: [createPagesDecal()],
        bossRing: createBossRingDecal(theme.floor)
    };
}
