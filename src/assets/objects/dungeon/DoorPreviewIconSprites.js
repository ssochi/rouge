// 纯美术：门口预告漂浮小图标（16×16，深色底盘 + 亮色图标，供世界内漂浮标识相邻房间类型）。严禁游戏逻辑。
// 图标语义：生存=沙漏 / 猎杀=靶心 / 契约=手掌 / 精英=星 / 宝藏=箱 / 商店=币 / Boss=骷髅。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const SIZE = 16;
const CX = 8;
const CY = 8;

/** 深色圆底盘 + 细边（提升地板上的可读性）。 */
function badge(d, ring) {
    d.circle(CX, CY, 7, 'rgba(18,16,26,0.82)');
    // 环形描边（用比底盘略大的圈叠一圈亮环）
    for (let a = 0; a < 32; a++) {
        const ang = (a / 32) * Math.PI * 2;
        d.pixel(Math.round(CX + Math.cos(ang) * 7), Math.round(CY + Math.sin(ang) * 7), ring);
    }
}

/** 生存：沙漏（琥珀色，上下三角 + 中缝 + 落沙）。 */
export function createSurvivalIcon() {
    const d = new PixelDraw(SIZE, SIZE);
    badge(d, '#e0b64a');
    const AMBER = '#f2c94c';
    const FRAME = '#caa03a';
    // 上下横框
    d.hLine(4, 3, 8, FRAME);
    d.hLine(4, 12, 8, FRAME);
    // 上三角（沙）
    d.fillPath([{ x: 5, y: 4 }, { x: 11, y: 4 }, { x: 8, y: 8 }], AMBER);
    // 下三角（已落沙）
    d.fillPath([{ x: 8, y: 8 }, { x: 5, y: 11 }, { x: 11, y: 11 }], AMBER);
    // 落沙细流
    d.pixel(8, 8, '#fff2b0');
    d.pixel(8, 9, '#fff2b0');
    return d.getCanvas();
}

/** 猎杀：靶心（红白同心环 + 中心点）。 */
export function createHuntIcon() {
    const d = new PixelDraw(SIZE, SIZE);
    badge(d, '#ff6a5a');
    d.circle(CX, CY, 5, '#e74c3c');
    d.circle(CX, CY, 4, '#f6f2ee');
    d.circle(CX, CY, 3, '#e74c3c');
    d.circle(CX, CY, 2, '#f6f2ee');
    d.pixel(CX, CY, '#c0392b');
    return d.getCanvas();
}

/** 契约：手掌（紫色，掌心 + 五指剪影）。 */
export function createPactIcon() {
    const d = new PixelDraw(SIZE, SIZE);
    badge(d, '#c084f0');
    const HAND = '#b070e0';
    const HAND_LT = '#d9a6ff';
    // 掌心
    d.rect(6, 8, 5, 4, HAND);
    // 四指
    d.vLine(6, 4, 4, HAND);
    d.vLine(8, 3, 5, HAND);
    d.vLine(10, 4, 4, HAND);
    // 拇指
    d.pixel(5, 9, HAND);
    d.pixel(11, 9, HAND);
    // 掌心高光符文
    d.pixel(8, 9, HAND_LT);
    d.pixel(8, 10, HAND_LT);
    return d.getCanvas();
}

/** 精英：四角星（粉紫，闪光）。 */
export function createEliteIcon() {
    const d = new PixelDraw(SIZE, SIZE);
    badge(d, '#e79cf4');
    const STAR = '#e79cf4';
    d.fillPath([
        { x: 8, y: 2 }, { x: 9.5, y: 6.5 }, { x: 14, y: 8 }, { x: 9.5, y: 9.5 },
        { x: 8, y: 14 }, { x: 6.5, y: 9.5 }, { x: 2, y: 8 }, { x: 6.5, y: 6.5 }
    ], STAR);
    d.pixel(8, 8, '#ffffff');
    return d.getCanvas();
}

/** 宝藏：木箱（拱盖 + 金箍 + 锁扣）。 */
export function createTreasureIcon() {
    const d = new PixelDraw(SIZE, SIZE);
    badge(d, '#56b8bd');
    d.rect(4, 8, 8, 4, '#7a4f28');
    d.rect(3, 5, 10, 3, '#96622f');
    d.rect(7, 5, 2, 7, '#e8c14a'); // 金箍
    d.pixel(8, 9, '#f6d873');       // 锁扣
    return d.getCanvas();
}

/** 商店：金币（金盘 + 内圈 + 竖槽 + 高光）。 */
export function createShopIcon() {
    const d = new PixelDraw(SIZE, SIZE);
    badge(d, '#e0aa2c');
    d.circle(CX, CY, 5, '#e0aa2c');
    d.circle(CX, CY, 3, '#f6d873');
    d.vLine(8, 5, 6, '#a5720f');
    d.pixel(6, 6, '#fff2c0');
    return d.getCanvas();
}

/** Boss：骷髅（颅骨 + 黑眼窝 + 下颌）。 */
export function createBossIcon() {
    const d = new PixelDraw(SIZE, SIZE);
    badge(d, '#f2ede4');
    d.circle(CX, 7, 4, '#f2ede4');
    d.rect(6, 10, 5, 3, '#f2ede4');
    d.pixel(6, 6, '#17121c'); d.pixel(6, 7, '#17121c');
    d.pixel(10, 6, '#17121c'); d.pixel(10, 7, '#17121c');
    d.pixel(8, 9, '#17121c');
    d.pixel(7, 11, '#17121c'); d.pixel(9, 11, '#17121c');
    return d.getCanvas();
}

/** 汇总构建（kind → canvas），供 Assets 注册。 */
export function createDoorPreviewIcons() {
    return {
        survival: createSurvivalIcon(),
        hunt: createHuntIcon(),
        pact: createPactIcon(),
        elite: createEliteIcon(),
        treasure: createTreasureIcon(),
        shop: createShopIcon(),
        boss: createBossIcon()
    };
}
