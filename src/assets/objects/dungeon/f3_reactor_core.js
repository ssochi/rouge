// 纯美术：F3 反应堆芯（32×32，钢框立柱 + 橙热能量核心 + 辐射辉光 + 约束环）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STEEL_D = '#2f343c';
const STEEL = '#454b56';
const STEEL_L = '#5e6672';
const STEEL_HI = '#7d8694';
const CORE = '#ff8a2c';
const CORE_L = '#ffc857';
const CORE_HI = '#fff2b0';

export function createF3ReactorCoreSprite() {
    const d = new PixelDraw(32, 32);
    d.ellipse(16, 30, 9, 3, 'rgba(0,0,0,0.3)');

    // 辐射辉光
    d.ellipse(16, 15, 10, 11, 'rgba(255,150,40,0.12)');
    d.ellipse(16, 15, 6, 8, 'rgba(255,180,60,0.18)');

    // 底座机箱
    d.rect(8, 24, 16, 5, STEEL_D);
    d.hLine(8, 24, 16, STEEL_L);
    d.rect(10, 22, 12, 2, STEEL);

    // 立柱外壳（两侧钢框）
    d.rect(9, 6, 4, 18, STEEL);
    d.vLine(9, 6, 18, STEEL_L);
    d.vLine(12, 6, 18, STEEL_D);
    d.rect(19, 6, 4, 18, STEEL);
    d.vLine(19, 6, 18, STEEL_L);
    d.vLine(22, 6, 18, STEEL_D);

    // 能量核心柱
    d.rect(13, 7, 6, 17, CORE);
    d.vLine(14, 7, 17, CORE_L);
    d.vLine(15, 7, 17, CORE_HI);
    d.vLine(16, 7, 17, CORE_L);

    // 约束环（横向钢环）
    for (const y of [9, 13, 17, 21]) {
        d.hLine(9, y, 14, STEEL_HI);
        d.hLine(9, y + 1, 14, STEEL_D);
    }

    // 顶部放电头
    d.rect(12, 3, 8, 3, STEEL_L);
    d.hLine(12, 3, 8, STEEL_HI);
    d.pixel(15, 1, CORE_HI);
    d.pixel(16, 1, CORE_HI);
    d.pixel(16, 0, CORE_L);

    // 核心亮点
    d.pixel(15, 11, CORE_HI);
    d.pixel(16, 15, CORE_HI);
    d.pixel(15, 19, CORE_HI);
    return d.getCanvas();
}
