// 纯美术：地牢老虎机（24×32，红金街机柜 + 三滚轮窗 + 拉杆）。严禁游戏逻辑。
// 导出多帧动画（待机灯闪 / 转轮 / 中奖闪光 / 爆机冒烟 / 废机）与滚轮图案 glyph 字典。
// 滚轮窗内的具体图案由实体侧按 REEL 几何叠绘（图案属游戏状态，不在此文件）。
import { PixelDraw } from '../../../utils/PixelDraw.js';

export const SLOT_W = 24;
export const SLOT_H = 32;

// 滚轮窗几何（供实体侧定位三连图案 glyph）：左上角 + 单格宽高 + 列数。
export const REEL = { x0: 3, y0: 11, cellW: 6, cellH: 8, cols: 3 };

// —— 调色板 ——
const RED = '#b8332e';
const RED_DARK = '#872321';
const RED_LIGHT = '#dd554c';
const GOLD = '#e6b843';
const GOLD_DARK = '#b8892c';
const GOLD_LIGHT = '#f6dd8b';
const STEEL = '#8a8f9c';
const STEEL_DARK = '#565b67';
const STEEL_LIGHT = '#c2c6d0';
const FRAME_DARK = '#221d1a';
const CREAM = '#f0e9d6';
const CREAM_SH = '#ccc4ac';
const DARKWIN = '#171310';
const BULB_ON = '#ffe27a';
const BULB_OFF = '#7a6a34';
const GLOW = '#fff3b0';
const SMOKE = '#6c6f74';
const SMOKE_LIGHT = '#93969b';
const CRACK = '#0d0b09';

// 三颗跑马灯位置（帽檐顶边）。
const BULBS = [{ x: 4, y: 1 }, { x: 11, y: 1 }, { x: 18, y: 1 }];

/**
 * 绘制柜体主体（帽檐 / 滚轮窗框 / 控制面板 / 出币口 / 拉杆 / 底座），共用于各帧。
 * @param {PixelDraw} d
 * @param {{ leverDown?: boolean, darken?: boolean }} opts
 */
function drawBody(d, opts = {}) {
    const bodyRed = opts.darken ? '#5c2523' : RED;
    const bodyRedD = opts.darken ? '#431a18' : RED_DARK;
    const bodyRedL = opts.darken ? '#6f2c2a' : RED_LIGHT;
    const trim = opts.darken ? '#7a6535' : GOLD;
    const trimD = opts.darken ? '#5e4e28' : GOLD_DARK;

    // 帽檐（顶部金色横幅）
    d.rect(2, 2, 20, 5, trim);
    d.hLine(2, 2, 20, opts.darken ? '#8f7738' : GOLD_LIGHT);
    d.hLine(2, 6, 20, trimD);
    d.rect(3, 3, 18, 3, opts.darken ? '#6b3230' : '#a8302c'); // 帽檐内嵌红牌（招牌）

    // 柜体
    d.rect(1, 6, 22, 24, bodyRed);
    d.vLine(1, 6, 24, bodyRedL);   // 左棱受光
    d.vLine(22, 6, 24, bodyRedD);  // 右棱背光
    d.hLine(1, 29, 22, bodyRedD);

    // 滚轮窗外框（金边）
    d.rect(2, 10, 20, 11, trim);
    d.hLine(2, 10, 20, opts.darken ? '#8f7738' : GOLD_LIGHT);
    d.rect(2, 20, 20, 1, trimD);

    // 控制面板（金属条）
    const panel = opts.darken ? '#4a4e58' : STEEL;
    d.rect(2, 22, 20, 4, panel);
    d.hLine(2, 22, 20, opts.darken ? '#5c6069' : STEEL_LIGHT);
    d.hLine(2, 25, 20, STEEL_DARK);
    // 投币口（横缝）
    d.rect(7, 23, 6, 1, DARKWIN);
    d.pixel(7, 23, opts.darken ? '#2a2d33' : STEEL_LIGHT);
    // 红色圆钮
    d.rect(16, 23, 2, 2, opts.darken ? '#5c2523' : RED_LIGHT);
    d.pixel(16, 23, opts.darken ? '#743' : '#ff8a80');

    // 出币托盘（底部暗腔）
    d.rect(4, 26, 14, 3, opts.darken ? '#100e0c' : '#2b2320');
    d.hLine(4, 26, 14, bodyRedD);
    d.rect(6, 27, 10, 1, '#050403');

    // 底座双腿
    d.rect(3, 30, 3, 2, bodyRedD);
    d.rect(18, 30, 3, 2, bodyRedD);

    // 拉杆（右侧）：金属杆 + 红球柄
    const leverX = 22;
    const knobY = opts.leverDown ? 16 : 9;
    d.vLine(leverX, knobY + 1, 20 - knobY, STEEL);
    d.vLine(leverX + 1, knobY + 1, 20 - knobY, STEEL_DARK);
    d.rect(leverX, knobY, 2, 2, opts.darken ? '#5c2523' : RED);
    d.pixel(leverX, knobY, opts.darken ? '#6f2c2a' : RED_LIGHT);
    d.pixel(leverX + 1, knobY + 1, RED_DARK);
}

/**
 * 绘制滚轮窗内胆（三格）。图案由实体叠绘，此处只铺底色/暗腔。
 * @param {PixelDraw} d
 * @param {'cream'|'spin'|'dark'|'crack'} mode
 */
function drawReelWindow(d, mode) {
    if (mode === 'dark' || mode === 'crack') {
        d.rect(3, 11, 18, 8, DARKWIN);
        // 分隔柱
        d.vLine(9, 11, 8, '#000');
        d.vLine(15, 11, 8, '#000');
        if (mode === 'crack') {
            // 裂纹
            d.line(4, 12, 8, 18, CRACK);
            d.line(12, 11, 14, 18, CRACK);
            d.pixel(17, 13, CRACK);
        }
        return;
    }
    // cream / spin：三格奶白底，spin 加横向动感扫线并压暗
    const base = mode === 'spin' ? '#d7cfb8' : CREAM;
    d.rect(3, 11, 18, 8, base);
    for (let c = 0; c < 3; c++) {
        const cx = 3 + c * 6;
        d.rect(cx, 11, 6, 8, base);
        d.hLine(cx, 11, 6, CREAM_SH);       // 顶部内阴影
        d.hLine(cx, 18, 6, CREAM_SH);       // 底部内阴影
    }
    // 分隔柱（金属）
    d.vLine(9, 11, 8, STEEL_DARK);
    d.vLine(15, 11, 8, STEEL_DARK);
    if (mode === 'spin') {
        // 动感扫线（暗色横纹，暗示滚动）
        d.hLine(3, 13, 18, CREAM_SH);
        d.hLine(3, 16, 18, CREAM_SH);
    }
}

/**
 * 绘制帽檐跑马灯。
 * @param {PixelDraw} d
 * @param {boolean[]} states 三颗灯的亮灭
 * @param {boolean} glow 是否加辉光（中奖/转动时更亮）
 */
function drawBulbs(d, states, glow = false) {
    BULBS.forEach((b, i) => {
        const on = states[i];
        if (on && glow) {
            d.pixel(b.x, b.y - 1, GLOW);
            d.pixel(b.x - 1, b.y, GLOW);
            d.pixel(b.x + 1, b.y, GLOW);
        }
        d.rect(b.x, b.y, 2, 2, on ? BULB_ON : BULB_OFF);
        if (on) d.pixel(b.x, b.y, GLOW);
    });
}

/** 冒烟（爆机 / 废机顶部）。 */
function drawSmoke(d, dense) {
    const puffs = dense
        ? [{ x: 6, y: 4, r: 2 }, { x: 12, y: 2, r: 3 }, { x: 17, y: 5, r: 2 }, { x: 10, y: 6, r: 2 }]
        : [{ x: 8, y: 5, r: 2 }, { x: 14, y: 3, r: 2 }];
    for (const p of puffs) {
        d.ellipse(p.x, p.y, p.r, p.r, SMOKE);
        d.pixel(p.x - 1, p.y - 1, SMOKE_LIGHT);
    }
}

function makeIdle(bulbPattern) {
    const d = new PixelDraw(SLOT_W, SLOT_H);
    drawBody(d);
    drawReelWindow(d, 'cream');
    drawBulbs(d, bulbPattern, false);
    return d.getCanvas();
}

function makeSpin(bulbPattern) {
    const d = new PixelDraw(SLOT_W, SLOT_H);
    drawBody(d, { leverDown: true });
    drawReelWindow(d, 'spin');
    drawBulbs(d, bulbPattern, true);
    return d.getCanvas();
}

function makeWin(sparkle) {
    const d = new PixelDraw(SLOT_W, SLOT_H);
    drawBody(d);
    drawReelWindow(d, 'cream');
    drawBulbs(d, [true, true, true], true);
    if (sparkle) {
        // 金色火花点缀
        d.pixel(3, 8, GOLD_LIGHT);
        d.pixel(20, 8, GOLD_LIGHT);
        d.pixel(1, 4, GOLD_LIGHT);
        d.pixel(22, 3, GOLD_LIGHT);
    }
    return d.getCanvas();
}

function makeBust(dense) {
    const d = new PixelDraw(SLOT_W, SLOT_H);
    drawBody(d, { darken: true });
    drawReelWindow(d, 'crack');
    drawBulbs(d, [false, false, false], false);
    drawSmoke(d, dense);
    return d.getCanvas();
}

function makeDead() {
    const d = new PixelDraw(SLOT_W, SLOT_H);
    drawBody(d, { darken: true, leverDown: true });
    drawReelWindow(d, 'dark');
    drawBulbs(d, [false, false, false], false);
    // 熄火余烟一缕
    d.ellipse(12, 4, 2, 2, 'rgba(108,111,116,0.6)');
    // 柜体裂纹
    d.line(6, 8, 4, 28, CRACK);
    d.line(16, 22, 19, 29, CRACK);
    return d.getCanvas();
}

// —— 滚轮图案 glyph（6×8，纯美术）——
function glyph(drawFn) {
    const d = new PixelDraw(REEL.cellW, REEL.cellH);
    drawFn(d);
    return d.getCanvas();
}

function makeSymbols() {
    return {
        // 红 7
        seven: glyph(d => {
            d.hLine(1, 1, 4, RED);
            d.pixel(4, 2, RED_DARK);
            d.pixel(3, 3, RED);
            d.pixel(3, 4, RED);
            d.pixel(2, 5, RED);
            d.pixel(2, 6, RED);
            d.pixel(1, 1, RED_LIGHT);
        }),
        // 樱桃（双果 + 梗）
        cherry: glyph(d => {
            d.pixel(3, 1, '#3f8f3a');
            d.pixel(4, 2, '#3f8f3a');
            d.ellipse(2, 5, 1, 1, RED);
            d.ellipse(4, 6, 1, 1, RED);
            d.pixel(1, 4, RED_LIGHT);
            d.pixel(3, 5, RED_LIGHT);
        }),
        // 金铃
        bell: glyph(d => {
            d.rect(2, 2, 2, 3, GOLD);
            d.pixel(1, 4, GOLD);
            d.pixel(4, 4, GOLD);
            d.hLine(1, 5, 4, GOLD_DARK);
            d.pixel(2, 6, GOLD_DARK);
            d.pixel(2, 2, GOLD_LIGHT);
            d.pixel(3, 1, GOLD_DARK);
        }),
        // 金币
        coin: glyph(d => {
            d.ellipse(3, 4, 2, 3, GOLD);
            d.ellipse(3, 4, 1, 2, GOLD_LIGHT);
            d.pixel(3, 2, GOLD_LIGHT);
            d.pixel(4, 6, GOLD_DARK);
            d.pixel(3, 3, '#fff6cf');
        }),
        // 炸弹
        bomb: glyph(d => {
            d.ellipse(3, 5, 2, 2, '#2b2f36');
            d.pixel(2, 4, '#4a4f58');
            d.pixel(4, 2, GOLD_DARK); // 引线
            d.pixel(4, 1, '#ff8a3a'); // 火星
            d.pixel(3, 3, '#3a3f47');
        }),
        // 钥匙
        key: glyph(d => {
            d.ellipse(2, 2, 1, 1, GOLD);
            d.vLine(2, 3, 4, GOLD);
            d.pixel(3, 5, GOLD_DARK);
            d.pixel(3, 6, GOLD_DARK);
            d.pixel(2, 2, GOLD_LIGHT);
        }),
        // 医疗十字
        cross: glyph(d => {
            d.rect(1, 3, 4, 2, '#e8ecef'); // 白底
            d.rect(2, 1, 2, 6, '#e8ecef');
            d.rect(2, 3, 2, 2, '#e0433a'); // 红十字
            d.pixel(2, 3, '#f26a62');
        }),
        // 剑
        sword: glyph(d => {
            d.vLine(3, 0, 5, STEEL_LIGHT);
            d.vLine(2, 1, 4, STEEL);
            d.hLine(1, 5, 4, GOLD);   // 护手
            d.vLine(3, 6, 2, GOLD_DARK); // 柄
            d.pixel(3, 0, '#fff');
        }),
        // BAR 金条
        bar: glyph(d => {
            d.rect(0, 2, 6, 4, GOLD);
            d.hLine(0, 2, 6, GOLD_LIGHT);
            d.hLine(0, 5, 6, GOLD_DARK);
            d.pixel(2, 3, '#7a5f1e');
            d.pixel(4, 4, '#7a5f1e');
        }),
    };
}

/**
 * 生成老虎机全部精灵资源。
 * @returns {{ frames: { idle: HTMLCanvasElement[], spin: HTMLCanvasElement[],
 *            win: HTMLCanvasElement[], bust: HTMLCanvasElement[], dead: HTMLCanvasElement },
 *            symbols: Record<string, HTMLCanvasElement> }}
 */
export function createSlotMachineSprites() {
    return {
        frames: {
            idle: [
                makeIdle([true, false, true]),
                makeIdle([false, true, false]),
            ],
            spin: [
                makeSpin([true, false, true]),
                makeSpin([false, true, false]),
                makeSpin([true, true, true]),
            ],
            win: [
                makeWin(false),
                makeWin(true),
            ],
            bust: [
                makeBust(false),
                makeBust(true),
            ],
            dead: makeDead(),
        },
        symbols: makeSymbols(),
    };
}
