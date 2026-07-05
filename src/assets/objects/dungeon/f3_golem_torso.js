// 纯美术：F3 未完成魔像躯干（32×32，装配支架上的半成品机甲胸腔 + 裸露线缆 + 空头槽）。严禁游戏逻辑。
// 故事：那台没造完的「看守者」。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STEEL_D = '#2f343c';
const STEEL = '#454b56';
const STEEL_L = '#5e6672';
const STEEL_HI = '#7d8694';
const WIRE_R = '#a23b2f';
const WIRE_Y = '#c2a63a';
const CORE = '#3fd0c0';
const CORE_HI = '#bffff5';

export function createF3GolemTorsoSprite() {
    const d = new PixelDraw(32, 32);
    d.ellipse(16, 30, 10, 3, 'rgba(0,0,0,0.28)');

    // 装配支架
    d.rect(7, 20, 3, 9, STEEL_D);
    d.rect(22, 20, 3, 9, STEEL_D);
    d.hLine(7, 27, 18, STEEL_D);
    d.pixel(7, 20, STEEL_L);
    d.pixel(22, 20, STEEL_L);

    // 躯干主体（胸甲，钟形）
    d.fillPath([{ x: 16, y: 6 }, { x: 23, y: 11 }, { x: 22, y: 23 }, { x: 10, y: 23 }, { x: 9, y: 11 }], STEEL);
    d.vLine(9, 11, 12, STEEL_L);   // 左高光
    d.vLine(22, 11, 12, STEEL_D);  // 右暗

    // 胸口能量核（未装完，裸露）
    d.rect(13, 12, 6, 6, STEEL_D);
    d.ellipse(16, 15, 2, 2, CORE);
    d.pixel(16, 15, CORE_HI);

    // 裸露肋条 / 线缆
    d.hLine(11, 19, 10, STEEL_HI);
    d.pixel(12, 20, WIRE_R);
    d.pixel(14, 20, WIRE_Y);
    d.pixel(18, 20, WIRE_R);
    d.pixel(20, 20, WIRE_Y);

    // 空头槽（脖颈接口）
    d.rect(13, 4, 6, 3, STEEL_D);
    d.hLine(13, 4, 6, STEEL_L);
    d.pixel(15, 5, CORE);
    d.pixel(17, 5, '#2a9c90');

    // 左肩臂桩 / 右肩断口
    d.rect(6, 11, 3, 5, STEEL);
    d.pixel(6, 11, STEEL_L);
    d.rect(23, 11, 3, 3, STEEL_D);
    d.pixel(24, 12, WIRE_R);

    // 铆钉
    d.pixel(11, 13, STEEL_HI);
    d.pixel(20, 13, STEEL_HI);
    return d.getCanvas();
}
