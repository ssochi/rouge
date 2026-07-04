// 纯美术：地牢石柱（32×32，完好立柱：柱帽+柱身+基座）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const DARK = '#4f535d';
const MID = '#6b707c';
const LIGHT = '#8c929f';
const CRACK = '#2e3239';

export function createDungeonPillarSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 10, 3, 'rgba(0,0,0,0.28)');

    // 基座（两级）
    d.rect(8, 26, 16, 4, DARK);
    d.hLine(8, 26, 16, MID);
    d.rect(10, 23, 12, 3, MID);
    d.hLine(10, 23, 12, LIGHT);

    // 柱身
    d.rect(11, 7, 10, 16, MID);
    d.vLine(11, 7, 16, LIGHT);
    d.vLine(12, 7, 16, LIGHT);
    d.vLine(19, 7, 16, DARK);
    d.vLine(20, 7, 16, DARK);
    // 柱身横向节缝
    d.hLine(11, 12, 10, DARK);
    d.hLine(11, 18, 10, DARK);

    // 柱帽
    d.rect(9, 4, 14, 3, MID);
    d.hLine(9, 4, 14, LIGHT);
    d.rect(10, 2, 12, 2, LIGHT);

    // 风化细节
    d.pixel(14, 15, CRACK);
    d.pixel(15, 16, CRACK);
    d.pixel(18, 9, CRACK);

    return d.getCanvas();
}
