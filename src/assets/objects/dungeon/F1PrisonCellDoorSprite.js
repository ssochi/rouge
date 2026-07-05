// 纯美术：F1 监狱层·完整铁栏牢门（32×32，栏门+锁盘+铰链+锈迹）。严禁游戏逻辑。
// 与 dungeon_bars（弯折残段）区分：这是一扇仍在服役的整门，用于囚区/禁闭室封锁。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const IRON = '#484855';
const IRON_DARK = '#31313c';
const IRON_LIGHT = '#66667a';
const RUST = '#6e4a2a';
const RUST_DARK = '#472d18';

export function createF1PrisonCellDoorSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 12, 3, 'rgba(0,0,0,0.24)');

    // 门框（四边梁）
    d.rect(5, 3, 22, 3, IRON);          // 上梁
    d.hLine(5, 3, 22, IRON_LIGHT);
    d.rect(5, 27, 22, 3, IRON_DARK);    // 下梁
    d.hLine(5, 27, 22, IRON);
    d.vLine(5, 3, 27, IRON);            // 左框
    d.vLine(6, 3, 27, IRON_DARK);
    d.vLine(26, 3, 27, IRON);           // 右框
    d.vLine(25, 3, 27, IRON_LIGHT);

    // 竖栏（等距 6 根）
    for (const x of [9, 12, 15, 18, 21, 24]) {
        d.vLine(x, 6, 21, IRON);
        d.vLine(x + 1, 6, 21, IRON_DARK);
    }
    // 中横撑
    d.rect(6, 15, 20, 2, IRON);
    d.hLine(6, 15, 20, IRON_LIGHT);

    // 锁盘 + 匙孔（右侧偏中）
    d.rect(19, 17, 6, 5, IRON_LIGHT);
    d.rect(20, 18, 4, 3, IRON_DARK);
    d.pixel(21, 19, '#20202a');
    d.pixel(21, 20, '#20202a');

    // 铰链（左框上下）
    d.rect(4, 8, 3, 3, IRON_DARK);
    d.rect(4, 22, 3, 3, IRON_DARK);
    d.pixel(5, 8, IRON_LIGHT);
    d.pixel(5, 22, IRON_LIGHT);

    // 锈斑
    d.pixel(9, 12, RUST);
    d.pixel(12, 24, RUST_DARK);
    d.pixel(18, 9, RUST);
    d.pixel(24, 20, RUST_DARK);
    d.pixel(15, 26, RUST);

    return d.getCanvas();
}
