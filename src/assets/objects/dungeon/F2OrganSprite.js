// 纯美术：管风琴残骸（32×32，木箱体+参差铜管，一管弯折一管断裂，仍自鸣的圣殿遗物）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const WOOD = '#4a3423';
const WOOD_DARK = '#33241688';
const WOOD_LIGHT = '#63482f';
const PIPE = '#9a8a63';
const PIPE_LIGHT = '#c4b485';
const PIPE_DARK = '#6e6144';
const KEY = '#d9cfb2';
const KEY_DARK = '#2a2119';

export function createF2OrganSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 30, 13, 3, 'rgba(0,0,0,0.28)');

    // 参差铜管（含一弯折、一断裂）
    const pipe = (x, top, h) => {
        d.rect(x, top, 2, h, PIPE);
        d.vLine(x, top, h, PIPE_LIGHT);
        d.vLine(x + 1, top, h, PIPE_DARK);
        d.pixel(x, top, PIPE_LIGHT);
    };
    pipe(4, 8, 13);
    pipe(7, 4, 17);
    pipe(10, 10, 11);
    // 弯折管
    d.rect(13, 6, 2, 6, PIPE);
    d.vLine(13, 6, 6, PIPE_LIGHT);
    d.rect(14, 11, 4, 2, PIPE_DARK); // 折向右
    d.rect(17, 9, 2, 12, PIPE);
    d.vLine(17, 9, 12, PIPE_LIGHT);
    // 断裂管（短，顶缘参差）
    d.rect(20, 12, 2, 9, PIPE);
    d.vLine(20, 12, 9, PIPE_LIGHT);
    d.pixel(20, 12, KEY_DARK);
    d.pixel(21, 13, KEY_DARK);
    pipe(23, 7, 14);
    pipe(26, 11, 10);

    // 木箱体
    d.rect(3, 21, 26, 8, WOOD);
    d.hLine(3, 21, 26, WOOD_LIGHT);
    d.rect(3, 27, 26, 2, WOOD_DARK);
    d.vLine(3, 21, 8, WOOD_LIGHT);
    d.vLine(28, 21, 8, WOOD_DARK);

    // 键盘（部分缺齿）
    d.rect(6, 23, 20, 3, KEY);
    for (let x = 7; x < 26; x += 3) d.vLine(x, 23, 3, KEY_DARK);
    d.rect(15, 23, 2, 3, KEY_DARK); // 缺失的一段

    return d.getCanvas();
}
