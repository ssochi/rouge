// 纯美术：炼金坩埚（32×32，三足铁釜+炭火+翻沸绿液+升腾气雾）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const IRON = '#3b3b46';
const IRON_DARK = '#2a2a33';
const IRON_LIGHT = '#565663';
const EMBER = '#c85a22';
const EMBER_HOT = '#ff9a3c';
const BREW = '#3f9a55';
const BREW_LIGHT = '#6fd07a';
const BREW_DARK = '#2c6b3c';
const STEAM = 'rgba(180,240,190,0.55)';

export function createF2CauldronSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 11, 3, 'rgba(0,0,0,0.28)');

    // 炭火
    d.rect(9, 27, 14, 2, IRON_DARK);
    d.pixel(11, 27, EMBER);
    d.pixel(14, 28, EMBER_HOT);
    d.pixel(17, 27, EMBER);
    d.pixel(20, 28, EMBER_HOT);
    d.pixel(13, 26, EMBER_HOT);
    d.pixel(19, 26, EMBER);

    // 三铁足
    d.rect(9, 24, 2, 4, IRON);
    d.rect(15, 25, 2, 3, IRON);
    d.rect(21, 24, 2, 4, IRON);

    // 釜身（圆鼓）
    d.fillPath([
        { x: 8, y: 15 }, { x: 24, y: 15 },
        { x: 25, y: 20 }, { x: 22, y: 25 },
        { x: 10, y: 25 }, { x: 7, y: 20 }
    ], IRON);
    d.fillPath([
        { x: 8, y: 15 }, { x: 11, y: 15 },
        { x: 9, y: 24 }, { x: 7, y: 20 }
    ], IRON_LIGHT); // 左弧受光
    d.vLine(23, 16, 8, IRON_DARK);
    d.pixel(21, 23, IRON_DARK);

    // 釜口铁沿
    d.rect(7, 13, 18, 3, IRON_LIGHT);
    d.hLine(7, 13, 18, '#6a6a78');
    d.hLine(7, 15, 18, IRON_DARK);

    // 翻沸绿液
    d.rect(9, 14, 14, 2, BREW);
    d.hLine(9, 14, 14, BREW_LIGHT);
    d.pixel(12, 13, BREW_LIGHT);
    d.pixel(13, 13, BREW);
    d.pixel(17, 13, BREW_LIGHT);
    d.pixel(20, 14, BREW_DARK);
    d.pixel(11, 15, BREW_DARK);

    // 气雾
    d.pixel(13, 10, STEAM);
    d.pixel(14, 8, STEAM);
    d.pixel(18, 9, STEAM);
    d.pixel(19, 7, STEAM);
    d.pixel(16, 6, STEAM);

    return d.getCanvas();
}
