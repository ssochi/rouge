// 纯美术：F3 冷冻舱（32×32，钢框立舱 + 磨砂冰蓝玻璃 + 冻结的人影 + 底部指示灯）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STEEL_D = '#2f343c';
const STEEL = '#454b56';
const STEEL_L = '#5e6672';
const STEEL_HI = '#7d8694';
const ICE_D = '#6f97a8';
const ICE = '#a9d3e0';
const ICE_L = '#d6ecf2';
const FROST = '#eaf6fa';
const FIG = '#5a7b88';

export function createF3CryoPodSprite() {
    const d = new PixelDraw(32, 32);
    d.ellipse(16, 30, 9, 3, 'rgba(0,0,0,0.28)');

    // 底座控制台 + 指示灯
    d.rect(8, 25, 16, 4, STEEL_D);
    d.hLine(8, 25, 16, STEEL_L);
    d.pixel(11, 26, '#3fd06a');
    d.pixel(13, 26, '#2a9c50');
    d.pixel(20, 26, '#c23a3a');

    // 舱体钢框
    d.rect(8, 4, 16, 21, STEEL);
    d.vLine(8, 4, 21, STEEL_L);
    d.vLine(23, 4, 21, STEEL_D);
    d.hLine(8, 4, 16, STEEL_HI);

    // 冷冻玻璃窗（磨砂）
    d.rect(10, 7, 12, 16, ICE_D);
    d.rect(11, 7, 10, 16, ICE);
    d.vLine(11, 7, 16, ICE_L);

    // 冻结的人影（模糊）
    d.ellipse(16, 12, 2, 3, FIG); // 头肩
    d.rect(14, 14, 5, 7, FIG);

    // 霜层（顶部与边角积霜）
    d.hLine(11, 7, 10, FROST);
    d.pixel(12, 8, FROST);
    d.pixel(19, 9, FROST);
    d.pixel(11, 20, FROST);
    d.pixel(20, 21, FROST);
    d.pixel(12, 22, ICE_L);

    // 舱盖顶
    d.rect(10, 2, 12, 3, STEEL_L);
    d.hLine(10, 2, 12, STEEL_HI);

    // 侧铰链
    d.pixel(8, 10, STEEL_HI);
    d.pixel(8, 18, STEEL_HI);
    return d.getCanvas();
}
