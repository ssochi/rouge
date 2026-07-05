// 纯美术：地牢诱饵雕像（32×32，嵌宝石的石偶——诱人击破，掉金币或炸开）。严禁游戏逻辑。
import { PixelDraw } from '../../../utils/PixelDraw.js';

const STONE = '#6b6b74';
const STONE_DARK = '#4c4c54';
const STONE_LIGHT = '#84848d';
const CRACK = '#3a3a40';
const GEM = '#e0b64a';
const GEM_LIGHT = '#f4d97a';
const GEM_DARK = '#b8892e';

export function createDecoyStatueSprite() {
    const d = new PixelDraw(32, 32);

    d.ellipse(16, 29, 10, 3, 'rgba(0,0,0,0.26)');

    // 基座
    d.rect(9, 25, 14, 4, STONE_DARK);
    d.rect(10, 24, 12, 2, STONE);
    d.hLine(10, 24, 12, STONE_LIGHT);

    // 躯干（石偶盘坐轮廓）
    d.fillPath([{ x: 11, y: 24 }, { x: 21, y: 24 }, { x: 20, y: 14 }, { x: 12, y: 14 }], STONE);
    d.vLine(12, 14, 10, STONE_LIGHT);
    d.vLine(20, 14, 10, STONE_DARK);

    // 头（兜帽/宽脸）
    d.fillPath([{ x: 12, y: 14 }, { x: 20, y: 14 }, { x: 19, y: 7 }, { x: 13, y: 7 }], STONE);
    d.rect(13, 6, 6, 2, STONE_LIGHT);
    d.hLine(13, 7, 6, STONE_LIGHT);
    // 眼窝暗影
    d.pixel(14, 10, CRACK); d.pixel(18, 10, CRACK);

    // 胸口宝石（诱饵）
    d.rect(15, 17, 3, 3, GEM);
    d.pixel(15, 17, GEM_LIGHT);
    d.pixel(17, 19, GEM_DARK);
    d.pixel(16, 16, GEM_LIGHT);

    // 裂纹（暗示可击破）
    d.line(13, 15, 15, 22, CRACK);
    d.line(19, 12, 17, 9, CRACK);
    d.pixel(16, 23, CRACK);

    return d.getCanvas();
}
