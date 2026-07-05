// 纯美术：F3 培养槽（32×32，钢座玻璃管 + 毒绿培养液 + 悬浮实验体）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STEEL_D = '#2f343c';
const STEEL = '#454b56';
const STEEL_L = '#5e6672';
const STEEL_HI = '#7d8694';
const GLASS_D = '#2c5c4a';
const FLUID = '#3f8f5f';
const FLUID_L = '#5fb072';
const FLUID_HI = '#8fd68a';
const SPEC = '#22331f';
const SPEC_L = '#38502f';

export function createF3CultureTankSprite() {
    const d = new PixelDraw(32, 32);
    d.ellipse(16, 30, 10, 3, 'rgba(0,0,0,0.28)');

    // 底座
    d.rect(9, 26, 14, 4, STEEL_D);
    d.hLine(9, 26, 14, STEEL_L);
    d.rect(11, 24, 10, 2, STEEL);

    // 玻璃管主体（培养液）
    d.rect(10, 7, 12, 18, GLASS_D);     // 玻璃暗轮廓
    d.rect(11, 7, 10, 18, FLUID);       // 培养液
    d.vLine(11, 7, 18, FLUID_L);        // 左高光柱
    d.vLine(20, 7, 18, GLASS_D);        // 右暗边
    d.vLine(12, 8, 16, FLUID_HI);       // 玻璃反光条

    // 悬浮实验体（蜷曲胚体）
    d.ellipse(16, 16, 3, 4, SPEC);
    d.ellipse(16, 14, 2, 2, SPEC_L);    // 头
    d.pixel(15, 18, SPEC_L);
    d.pixel(17, 19, SPEC_L);

    // 气泡
    d.pixel(14, 10, FLUID_HI);
    d.pixel(18, 12, FLUID_HI);
    d.pixel(15, 21, FLUID_HI);

    // 顶盖 + 管线
    d.rect(9, 3, 14, 4, STEEL);
    d.hLine(9, 3, 14, STEEL_HI);
    d.rect(9, 5, 14, 2, STEEL_D);
    d.rect(14, 0, 4, 3, STEEL_L);       // 顶部管口
    d.pixel(15, 0, STEEL_HI);
    d.vLine(8, 8, 10, STEEL);           // 侧管
    d.vLine(23, 10, 8, STEEL);
    d.pixel(8, 8, STEEL_HI);

    // 铆钉
    d.pixel(10, 24, STEEL_HI);
    d.pixel(21, 24, STEEL_HI);
    return d.getCanvas();
}
