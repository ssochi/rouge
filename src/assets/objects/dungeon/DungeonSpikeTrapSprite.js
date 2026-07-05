// 纯美术：地牢尖刺陷阱（32×32，三态：收回 idle / 预警 warn / 弹出 up）。严禁游戏逻辑。
// 三态共用同一块嵌入地面的锈铁底盘，仅尖刺露出程度不同——供物件按周期切帧。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const PLATE = '#54545f';
const PLATE_DARK = '#393942';
const PLATE_LIGHT = '#6d6d79';
const HOLE = '#191920';
const RUST = '#7a4a28';
const SPIKE = '#9aa0ad';
const SPIKE_LIGHT = '#cfd4de';
const SPIKE_DARK = '#5b606b';

// 3×3 尖刺孔位（底盘内均匀排布）
const SLOTS = [
    [8, 12], [15, 12], [22, 12],
    [8, 18], [15, 18], [22, 18],
    [8, 24], [15, 24], [22, 24]
];

/** 嵌入地面的锈铁底盘（三态共用底）。 */
function drawPlate(d) {
    d.ellipse(16, 28, 13, 3, 'rgba(0,0,0,0.20)');
    // 外框凹槽
    d.rect(3, 6, 26, 23, PLATE_DARK);
    d.rect(4, 7, 24, 21, PLATE);
    d.hLine(4, 7, 24, PLATE_LIGHT);
    d.vLine(4, 7, 21, PLATE_LIGHT);
    d.hLine(4, 27, 24, PLATE_DARK);
    // 铆钉四角
    d.pixel(5, 8, PLATE_LIGHT); d.pixel(26, 8, PLATE_LIGHT);
    d.pixel(5, 26, PLATE_LIGHT); d.pixel(26, 26, PLATE_LIGHT);
    // 锈斑
    d.pixel(10, 9, RUST); d.pixel(24, 20, RUST); d.pixel(6, 22, RUST);
}

/** 尖刺孔（收回时露出的黑洞）。 */
function drawHoles(d) {
    for (const [x, y] of SLOTS) {
        d.rect(x - 1, y - 1, 3, 3, HOLE);
    }
}

/** 单根尖刺（h=露出高度）。 */
function drawSpike(d, cx, baseY, h) {
    const topY = baseY - h;
    // 三角刺身
    for (let i = 0; i < h; i++) {
        const half = Math.max(0, Math.floor(((h - i) / h) * 2));
        d.hLine(cx - half, topY + i, half * 2 + 1, SPIKE);
    }
    // 高光棱 + 尖头
    d.vLine(cx - 1, topY + 1, h - 1, SPIKE_LIGHT);
    d.pixel(cx, topY, SPIKE_LIGHT);
    d.vLine(cx + 1, topY + 1, h - 1, SPIKE_DARK);
    // 根部落影
    d.pixel(cx, baseY, HOLE);
}

/** 收回态：只见底盘与黑洞。 */
export function createSpikeTrapIdleSprite() {
    const d = new PixelDraw(32, 32);
    drawPlate(d);
    drawHoles(d);
    return d.getCanvas();
}

/** 预警态：尖刺尖头半露 + 顶端反光提示。 */
export function createSpikeTrapWarnSprite() {
    const d = new PixelDraw(32, 32);
    drawPlate(d);
    drawHoles(d);
    for (const [x, y] of SLOTS) {
        drawSpike(d, x, y + 1, 3);
    }
    return d.getCanvas();
}

/** 弹出态：尖刺全出，投出细影。 */
export function createSpikeTrapUpSprite() {
    const d = new PixelDraw(32, 32);
    drawPlate(d);
    // 尖刺投影（错位半透黑）
    for (const [x, y] of SLOTS) {
        d.rect(x, y - 6, 2, 7, 'rgba(0,0,0,0.18)');
    }
    for (const [x, y] of SLOTS) {
        drawSpike(d, x, y + 1, 9);
    }
    return d.getCanvas();
}
