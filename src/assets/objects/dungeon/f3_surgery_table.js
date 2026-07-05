// 纯美术：F3 手术台（32×32，钢制手术台 + 束缚带 + 器械托盘 + 陈血）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STEEL_D = '#2f343c';
const STEEL = '#454b56';
const STEEL_L = '#5e6672';
const STEEL_HI = '#7d8694';
const PAD = '#6b7280';
const STRAP = '#3a2f26';
const BUCKLE = '#8a8f99';
const BLOOD = '#6e2626';

export function createF3SurgeryTableSprite() {
    const d = new PixelDraw(32, 32);
    d.ellipse(16, 29, 12, 3, 'rgba(0,0,0,0.25)');

    // 台腿
    d.rect(8, 22, 3, 7, STEEL_D);
    d.rect(21, 22, 3, 7, STEEL_D);
    d.pixel(8, 22, STEEL_L);
    d.pixel(21, 22, STEEL_L);

    // 台面（带厚度侧面）
    d.rect(5, 14, 22, 6, STEEL);
    d.rect(5, 12, 22, 3, STEEL_L);
    d.hLine(5, 12, 22, STEEL_HI);
    d.hLine(5, 19, 22, STEEL_D);

    // 软垫
    d.rect(7, 13, 18, 2, PAD);

    // 束缚带（两道）+ 扣
    d.vLine(11, 12, 8, STRAP);
    d.vLine(20, 12, 8, STRAP);
    d.pixel(11, 15, BUCKLE);
    d.pixel(20, 15, BUCKLE);

    // 陈血
    d.pixel(15, 14, BLOOD);
    d.pixel(16, 15, BLOOD);
    d.pixel(23, 18, BLOOD);

    // 器械托盘（右侧小几）
    d.rect(25, 15, 5, 2, STEEL_L);
    d.vLine(27, 17, 5, STEEL_D);
    d.pixel(26, 14, STEEL_HI); // 手术器械反光
    d.pixel(28, 14, STEEL_HI);
    return d.getCanvas();
}
