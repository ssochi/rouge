// 纯美术：遗物三选一祭坛的单个石质底座（20×24，石柱 + 顶盘 + 符文微光）。严禁游戏逻辑。
// 实体侧（RelicAltar）横向排列三座，并在每座顶盘上方叠绘悬浮的遗物图标（图标属游戏状态，不在此文件）。
// 导出：lit（两帧符文明暗脉动）/ broken（熄灭碎裂：塌落石堆 + 裂纹，无符文）。
import { PixelDraw } from '../../../utils/PixelDraw.js';

export const PEDESTAL_W = 20;
export const PEDESTAL_H = 24;
// 顶盘中心（供实体定位悬浮图标与底光）：相对底座左上角。
export const PEDESTAL_TOP = { x: 10, y: 7 };

// —— 调色板 ——
const STONE_DARK = '#4f535d';
const STONE_MID = '#6b707c';
const STONE_LIGHT = '#8c929f';
const STONE_HI = '#a7adba';
const RUNE = '#6fe3d0';
const RUNE_HOT = '#c8fff2';
const RUNE_DIM = '#3f8f84';
const RUBBLE = '#565b66';
const RUBBLE_DARK = '#3a3e47';
const CRACK = '#26282e';

/** 绘制石柱主体（底座 / 柱身 / 顶盘），供 lit 各帧共用。 */
function drawColumn(d) {
    // 地面阴影
    d.ellipse(10, 22, 8, 2, 'rgba(0,0,0,0.30)');

    // 底座（宽台）
    d.rect(2, 17, 16, 5, STONE_MID);
    d.hLine(2, 17, 16, STONE_LIGHT);
    d.hLine(2, 21, 16, STONE_DARK);
    d.vLine(2, 17, 5, STONE_LIGHT);
    d.vLine(17, 17, 5, STONE_DARK);

    // 柱身（收窄）
    d.rect(5, 9, 10, 8, STONE_MID);
    d.vLine(5, 9, 8, STONE_LIGHT);
    d.vLine(14, 9, 8, STONE_DARK);
    d.pixel(7, 12, STONE_DARK); // 石纹
    d.pixel(11, 14, STONE_DARK);

    // 顶盘（承放遗物）
    d.rect(3, 6, 14, 3, STONE_LIGHT);
    d.hLine(3, 6, 14, STONE_HI);
    d.hLine(3, 8, 14, STONE_DARK);
    d.vLine(3, 6, 3, STONE_HI);
    d.vLine(16, 6, 3, STONE_DARK);
}

/** 生成一帧「点亮」底座：符文与顶光按 bright 决定明暗（脉动动画）。 */
function makeLit(bright) {
    const d = new PixelDraw(PEDESTAL_W, PEDESTAL_H);
    drawColumn(d);

    const rune = bright ? RUNE_HOT : RUNE;
    const runeSoft = bright ? RUNE : RUNE_DIM;

    // 柱身正面符文（菱形）
    d.pixel(10, 11, rune);
    d.hLine(9, 12, 3, runeSoft);
    d.pixel(10, 13, rune);
    d.pixel(10, 12, RUNE_HOT);

    // 顶盘凹槽微光（承接悬浮遗物的底光）
    d.hLine(7, 7, 6, runeSoft);
    if (bright) {
        d.hLine(6, 7, 8, RUNE);
        d.pixel(9, 6, RUNE_HOT);
        d.pixel(12, 6, RUNE_HOT);
    }
    return d.getCanvas();
}

/** 生成「熄灭碎裂」底座：柱身塌落为石堆，符文消失，裂纹密布。 */
function makeBroken() {
    const d = new PixelDraw(PEDESTAL_W, PEDESTAL_H);
    d.ellipse(10, 22, 8, 2, 'rgba(0,0,0,0.30)');

    // 残余底座（压暗）
    d.rect(2, 17, 16, 5, RUBBLE);
    d.hLine(2, 17, 16, STONE_MID);
    d.hLine(2, 21, 16, RUBBLE_DARK);
    d.vLine(2, 17, 5, RUBBLE);
    d.vLine(17, 17, 5, RUBBLE_DARK);
    // 底座裂纹
    d.line(6, 17, 9, 21, CRACK);
    d.line(13, 18, 11, 21, CRACK);

    // 塌落的柱身残桩（低矮、参差）
    d.rect(5, 13, 5, 4, RUBBLE);
    d.hLine(5, 13, 5, STONE_MID);
    d.vLine(5, 13, 4, RUBBLE_DARK);
    d.rect(11, 14, 3, 3, RUBBLE_DARK);

    // 散落碎石
    d.rect(3, 15, 2, 2, RUBBLE_DARK);
    d.pixel(15, 15, RUBBLE);
    d.pixel(16, 16, RUBBLE_DARK);
    d.pixel(9, 12, RUBBLE);
    // 顶盘残片（倾倒）
    d.rect(10, 11, 4, 2, RUBBLE);
    d.hLine(10, 11, 4, STONE_MID);

    return d.getCanvas();
}

/**
 * 生成遗物祭坛底座精灵资源。
 * @returns {{ lit: HTMLCanvasElement[], broken: HTMLCanvasElement }}
 */
export function createRelicAltarSprites() {
    return {
        lit: [makeLit(false), makeLit(true)],
        broken: makeBroken(),
    };
}
