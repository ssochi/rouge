// 纯美术：F3 破裂培养槽（32×32，玻璃从内炸开 + 排空残液 + 地面碎玻璃）。严禁游戏逻辑。
// 故事：里面的东西自己出来了。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STEEL_D = '#2f343c';
const STEEL = '#454b56';
const STEEL_L = '#5e6672';
const STEEL_HI = '#7d8694';
const GLASS_D = '#2c4a44';
const GLASS = '#3d6b60';
const GLASS_L = '#5f9488';
const SHARD = '#8fbfb5';
const RESIDUE = '#3f6f4f';

export function createF3CultureTankBrokenSprite() {
    const d = new PixelDraw(32, 32);
    d.ellipse(16, 30, 10, 3, 'rgba(0,0,0,0.28)');

    // 底座
    d.rect(9, 26, 14, 4, STEEL_D);
    d.hLine(9, 26, 14, STEEL_L);
    d.rect(11, 24, 10, 2, STEEL);

    // 残破玻璃管（左半较完整，右上炸开缺口）
    d.rect(10, 9, 12, 16, GLASS_D);
    d.rect(11, 9, 10, 16, GLASS);
    d.vLine(11, 9, 16, GLASS_L);

    // 炸裂缺口（右上，挖成锯齿暗口）
    d.fillPath([{ x: 16, y: 9 }, { x: 22, y: 9 }, { x: 22, y: 18 }, { x: 19, y: 13 }, { x: 16, y: 16 }], STEEL_D);
    // 锯齿玻璃碴
    d.pixel(16, 16, SHARD);
    d.pixel(18, 14, SHARD);
    d.pixel(20, 12, SHARD);
    d.pixel(17, 11, SHARD);

    // 底部残液
    d.rect(11, 23, 10, 2, RESIDUE);
    d.pixel(12, 25, RESIDUE);
    d.pixel(19, 25, RESIDUE);

    // 地面碎玻璃
    d.pixel(7, 29, SHARD);
    d.pixel(24, 28, SHARD);
    d.pixel(25, 30, GLASS_L);
    d.pixel(6, 30, GLASS_L);

    // 顶盖翘起
    d.rect(9, 5, 14, 4, STEEL);
    d.hLine(9, 5, 14, STEEL_HI);
    d.rect(9, 7, 14, 2, STEEL_D);
    d.pixel(22, 4, STEEL_L); // 翘起一角
    d.pixel(15, 3, STEEL_HI);
    return d.getCanvas();
}
