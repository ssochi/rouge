// 纯美术：F1 监狱层·档案柜（32×32，四抽铁皮柜+把手+半开抽屉露卷宗）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const METAL = '#6b6f7e';
const METAL_DARK = '#4d515e';
const METAL_LIGHT = '#8a8e9c';
const GROOVE = '#3b3e49';
const PAPER = '#d8d2c2';
const PAPER_SHADE = '#b3ad9c';
const RUST = '#6e4a2a';

export function createF1PrisonFileCabinetSprite() {
    const d = new PixelDraw(32, 32);
    const handleC = '#2f323c';

    d.ellipse(16, 30, 11, 3, 'rgba(0,0,0,0.26)');

    // 柜体
    d.rect(7, 4, 19, 26, METAL);
    d.vLine(7, 4, 26, METAL_LIGHT);     // 左高光棱
    d.vLine(25, 4, 26, METAL_DARK);     // 右暗棱
    d.hLine(7, 4, 19, METAL_LIGHT);     // 顶棱
    d.hLine(7, 29, 19, METAL_DARK);     // 底座暗

    // 四层抽屉分隔槽
    const drawerTops = [6, 12, 18, 24];
    for (const y of drawerTops) {
        d.hLine(8, y, 17, GROOVE);
        d.hLine(8, y + 1, 17, METAL_LIGHT);
    }

    // 把手（每抽居中）
    for (const y of drawerTops) {
        d.rect(14, y + 3, 4, 1, handleC);
        d.pixel(13, y + 3, handleC);
        d.pixel(18, y + 3, handleC);
    }

    // 顶抽半开——露出卷宗
    d.rect(9, 5, 15, 4, METAL_DARK);    // 抽屉内腔阴影
    d.rect(9, 4, 15, 2, PAPER);         // 翘出的纸叠
    d.hLine(9, 4, 15, '#efe9da');
    d.pixel(12, 5, PAPER_SHADE);
    d.pixel(17, 5, PAPER_SHADE);
    d.pixel(21, 5, PAPER_SHADE);

    // 锈渍/磨损
    d.pixel(9, 16, RUST);
    d.pixel(24, 22, RUST);
    d.pixel(10, 27, RUST);

    return d.getCanvas();
}
