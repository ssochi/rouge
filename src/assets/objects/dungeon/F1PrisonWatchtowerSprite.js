// 纯美术：F1 监狱层·瞭望塔基座（32×32，石砌塔基+木哨台残段+攀爬梯）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STONE = '#737787';
const STONE_DARK = '#565a6a';
const STONE_LIGHT = '#8b8fa0';
const MORTAR = '#4a4e5c';
const WOOD = '#5a4029';
const WOOD_DARK = '#42301e';
const WOOD_LIGHT = '#71533a';
const IRON = '#484855';

export function createF1PrisonWatchtowerSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 12, 3, 'rgba(0,0,0,0.28)');

    // 石砌塔基（梯形，下宽上窄）
    d.fillPath([{ x: 8, y: 12 }, { x: 24, y: 12 }, { x: 26, y: 29 }, { x: 6, y: 29 }], STONE);
    d.vLine(6, 12, 17, STONE_LIGHT);   // 左棱受光——近似
    d.fillPath([{ x: 22, y: 12 }, { x: 24, y: 12 }, { x: 26, y: 29 }, { x: 24, y: 29 }], STONE_DARK);

    // 砖缝（横向两道 + 错缝竖点）
    d.hLine(7, 18, 18, MORTAR);
    d.hLine(7, 24, 18, MORTAR);
    d.pixel(12, 15, MORTAR); d.pixel(18, 15, MORTAR);
    d.pixel(10, 21, MORTAR); d.pixel(16, 21, MORTAR); d.pixel(21, 21, MORTAR);
    d.pixel(13, 27, MORTAR); d.pixel(19, 27, MORTAR);

    // 顶部木哨台（悬挑残段）
    d.rect(5, 8, 22, 4, WOOD);
    d.hLine(5, 8, 22, WOOD_LIGHT);
    d.hLine(5, 11, 22, WOOD_DARK);
    // 哨台护栏残柱
    d.vLine(7, 4, 4, WOOD_DARK);
    d.vLine(15, 3, 5, WOOD);
    d.vLine(24, 4, 4, WOOD_DARK);
    d.pixel(15, 3, WOOD_LIGHT);

    // 攀爬梯（塔基正面两轨 + 横档）
    d.vLine(12, 13, 15, IRON);
    d.vLine(19, 13, 15, IRON);
    for (let y = 15; y <= 27; y += 3) {
        d.hLine(12, y, 8, IRON);
    }

    return d.getCanvas();
}
