// 纯美术：F3 训练靶（32×32，同心圆靶盘 + 弹孔 + 金属立柱三脚座）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const POST = '#4a4f58';
const POST_L = '#5e6672';
const BASE = '#3a3f47';
const RING_W = '#c9c2b2';
const RING_W_HI = '#efe9db';
const RING_R = '#b8443a';
const BULL = '#8f2f28';
const HOLE = '#20232a';

export function createF3TargetDummySprite() {
    const d = new PixelDraw(32, 32);
    d.ellipse(16, 30, 7, 2, 'rgba(0,0,0,0.25)');

    // 立柱
    d.rect(15, 16, 3, 12, POST);
    d.vLine(15, 16, 12, POST_L);
    // 三脚底座
    d.rect(11, 27, 10, 2, BASE);
    d.pixel(11, 26, POST_L);
    d.pixel(20, 26, POST_L);

    // 靶盘（同心圆）
    d.circle(16, 11, 8, RING_W);
    d.circle(16, 11, 7, RING_R);
    d.circle(16, 11, 5, RING_W);
    d.circle(16, 11, 3, RING_R);
    d.circle(16, 11, 1, BULL);

    // 弹孔
    d.pixel(13, 9, HOLE);
    d.pixel(18, 13, HOLE);
    d.pixel(15, 7, HOLE);
    d.pixel(19, 10, HOLE);

    // 高光
    d.pixel(13, 8, RING_W_HI);
    d.pixel(12, 11, RING_W_HI);
    return d.getCanvas();
}
