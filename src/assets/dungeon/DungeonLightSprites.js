// DungeonLightSprites —— 纯美术：地牢火把与火盆（2 帧火焰动画）。严禁游戏逻辑。
// 火把 16×24：挂在墙体前脸上的铁托壁火（配合 drawOffset 定位到墙 tile 前脸）。
// 火盆 32×32：落地铁盆炭火，可破坏掩体级装饰。

import { PixelDraw } from '../../utils/PixelDraw.js';

const IRON_DARK = '#33333e';
const IRON_MID = '#484855';
const IRON_LIGHT = '#5f5f6e';
const WOOD_DARK = '#523620';
const WOOD_MID = '#6e4a2a';
const FLAME_OUT = '#ff7b2e';
const FLAME_MID = '#ffa94d';
const FLAME_CORE = '#ffe08a';
const COAL_DARK = '#5c2413';
const COAL_HOT = '#a83f1c';
const EMBER = '#ff6b2e';

/** 火把单帧（16×24）。frame 0/1 火焰形态交替。 */
function createTorchFrame(frame) {
    const d = new PixelDraw(16, 24);

    // 木柄（斜插在铁托里）
    d.vLine(7, 12, 9, WOOD_MID);
    d.vLine(8, 12, 9, WOOD_DARK);

    // 铁托环 + 底座钉板
    d.rect(5, 13, 6, 2, IRON_MID);
    d.hLine(5, 13, 6, IRON_LIGHT);
    d.rect(6, 20, 4, 2, IRON_DARK);
    d.pixel(5, 21, IRON_MID);
    d.pixel(10, 21, IRON_MID);

    // 火焰（两帧摇曳）
    if (frame === 0) {
        d.fillPath([
            { x: 8, y: 1 },
            { x: 11, y: 5 },
            { x: 11, y: 9 },
            { x: 8, y: 12 },
            { x: 5, y: 9 },
            { x: 5, y: 5 }
        ], FLAME_OUT);
        d.fillPath([
            { x: 8, y: 4 },
            { x: 10, y: 7 },
            { x: 8, y: 11 },
            { x: 6, y: 7 }
        ], FLAME_MID);
        d.rect(7, 7, 2, 3, FLAME_CORE);
        d.pixel(11, 3, FLAME_OUT); // 火星
    } else {
        d.fillPath([
            { x: 7, y: 2 },
            { x: 10, y: 6 },
            { x: 11, y: 10 },
            { x: 8, y: 12 },
            { x: 5, y: 10 },
            { x: 6, y: 5 }
        ], FLAME_OUT);
        d.fillPath([
            { x: 7, y: 5 },
            { x: 9, y: 8 },
            { x: 8, y: 11 },
            { x: 6, y: 8 }
        ], FLAME_MID);
        d.rect(7, 8, 2, 2, FLAME_CORE);
        d.pixel(4, 4, FLAME_OUT);
    }

    return d.getCanvas();
}

/** 火盆单帧（32×32）。frame 0/1 火焰形态交替。 */
function createBrazierFrame(frame) {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 10, 3, 'rgba(0,0,0,0.28)');

    // 三足铁架
    d.vLine(9, 24, 5, IRON_DARK);
    d.vLine(22, 24, 5, IRON_DARK);
    d.vLine(16, 25, 4, IRON_DARK);

    // 铁盆
    d.fillPath([
        { x: 6, y: 18 },
        { x: 25, y: 18 },
        { x: 23, y: 24 },
        { x: 8, y: 24 }
    ], IRON_MID);
    d.hLine(5, 17, 22, IRON_LIGHT);
    d.hLine(5, 18, 22, IRON_MID);
    d.hLine(8, 24, 16, IRON_DARK);

    // 炭堆
    d.rect(9, 15, 14, 3, COAL_DARK);
    d.pixel(11, 15, COAL_HOT);
    d.pixel(15, 16, COAL_HOT);
    d.pixel(19, 15, COAL_HOT);
    d.pixel(13, 15, EMBER);
    d.pixel(18, 16, EMBER);

    // 火焰
    if (frame === 0) {
        d.fillPath([
            { x: 16, y: 3 },
            { x: 21, y: 8 },
            { x: 22, y: 13 },
            { x: 16, y: 16 },
            { x: 10, y: 13 },
            { x: 11, y: 8 }
        ], FLAME_OUT);
        d.fillPath([
            { x: 16, y: 6 },
            { x: 19, y: 10 },
            { x: 16, y: 15 },
            { x: 13, y: 10 }
        ], FLAME_MID);
        d.rect(15, 10, 2, 4, FLAME_CORE);
        d.pixel(21, 4, FLAME_OUT);
        d.pixel(9, 6, FLAME_OUT);
    } else {
        d.fillPath([
            { x: 15, y: 4 },
            { x: 20, y: 9 },
            { x: 21, y: 14 },
            { x: 16, y: 16 },
            { x: 11, y: 14 },
            { x: 12, y: 7 }
        ], FLAME_OUT);
        d.fillPath([
            { x: 15, y: 7 },
            { x: 18, y: 11 },
            { x: 16, y: 15 },
            { x: 13, y: 11 }
        ], FLAME_MID);
        d.rect(14, 11, 2, 3, FLAME_CORE);
        d.pixel(23, 6, FLAME_OUT);
        d.pixel(12, 3, FLAME_OUT);
    }

    return d.getCanvas();
}

/** @returns {HTMLCanvasElement[]} 火把 2 帧 */
export function createDungeonTorchFrames() {
    return [createTorchFrame(0), createTorchFrame(1)];
}

/** @returns {HTMLCanvasElement[]} 火盆 2 帧 */
export function createDungeonBrazierFrames() {
    return [createBrazierFrame(0), createBrazierFrame(1)];
}
