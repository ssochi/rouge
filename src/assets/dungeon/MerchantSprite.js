// MerchantSprite.js
// 纯美术：地牢商人 NPC（32×32，兜帽斗篷+发光双眼+油灯）。严禁游戏逻辑。

import { PixelDraw } from '../../utils/PixelDraw.js';

const CLOAK_DARK = '#3d2b52';
const CLOAK_MAIN = '#553a73';
const CLOAK_LIGHT = '#6f4f94';
const TRIM = '#c9a227';
const FACE_VOID = '#120a1c';
const EYE = '#7ef7d4';
const LANTERN_BODY = '#8a6d1a';
const LANTERN_GLOW = '#ffd75e';
const LANTERN_CORE = '#fff3b0';

/**
 * 生成商人站立单帧（32×32，默认朝左）。
 * @returns {HTMLCanvasElement}
 */
export function createMerchantSprite() {
    const d = new PixelDraw(32, 32);

    // ── 斗篷主体（钟形轮廓）──
    d.rect(11, 8, 10, 3, CLOAK_MAIN);      // 兜帽顶
    d.rect(10, 10, 12, 5, CLOAK_MAIN);     // 兜帽主体
    d.rect(9, 15, 14, 12, CLOAK_MAIN);     // 躯干斗篷
    d.rect(8, 22, 16, 5, CLOAK_DARK);      // 下摆
    d.rect(9, 27, 14, 2, CLOAK_DARK);      // 底边

    // 斗篷立体感：左亮右暗
    d.vLine(10, 11, 14, CLOAK_LIGHT);
    d.vLine(9, 16, 10, CLOAK_LIGHT);
    d.vLine(21, 11, 14, CLOAK_DARK);
    d.vLine(22, 16, 10, CLOAK_DARK);

    // ── 兜帽阴影中的脸 + 发光双眼 ──
    d.rect(12, 11, 8, 4, FACE_VOID);
    d.pixel(13, 12, EYE);
    d.pixel(14, 12, EYE);
    d.pixel(17, 12, EYE);
    d.pixel(18, 12, EYE);

    // ── 金色滚边 ──
    d.hLine(10, 15, 12, TRIM);
    d.hLine(9, 26, 14, TRIM);
    d.pixel(11, 9, TRIM);

    // ── 左手油灯（朝左伸出）──
    d.vLine(6, 16, 2, CLOAK_DARK);         // 手臂
    d.rect(4, 18, 4, 5, LANTERN_BODY);     // 灯壳
    d.rect(5, 19, 2, 3, LANTERN_GLOW);     // 灯光
    d.pixel(5, 20, LANTERN_CORE);
    d.pixel(5, 17, LANTERN_BODY);          // 提环

    // ── 背后钱袋 ──
    d.rect(22, 17, 4, 5, '#8b5a2b');
    d.pixel(23, 16, '#6e4520');
    d.pixel(24, 16, '#6e4520');
    d.pixel(23, 18, '#a8713a');

    return d.getCanvas();
}
