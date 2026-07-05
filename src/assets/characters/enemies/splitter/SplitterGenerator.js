// SplitterGenerator —— 裂弹僧：抱着爆裂法典的兜帽僧侣。
// 靛蓝金边长袍 + 兜帽 + 前抱的猩红法典（符文页），施法时书页翻飞、裂弹球自书中升起。
// 32×32，默认朝左（法典抱于身前 -x 侧）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class SplitterGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 靛蓝长袍四阶
        this.cRobe = '#3b3a5c';
        this.cRobeDark = '#25243d';
        this.cRobeLight = '#514f7a';
        this.cTrim = '#c9a86a';         // 金边

        // 兜帽内与脸
        this.cHoodShadow = '#14121f';
        this.cEye = '#c07bff';          // 妖紫眼

        // 法典四阶（猩红封皮 + 米色书页）
        this.cBookCover = '#6e2434';
        this.cBookCoverDark = '#46141d';
        this.cPage = '#e8dcc0';
        this.cPageShadow = '#bfae86';

        // 符文与裂弹球（紫）四阶
        this.cRune = '#b06bff';
        this.cRuneCore = '#f0d9ff';
        this.cOrb = '#a24dff';
        this.cOrbCore = '#efe0ff';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0]  身体升降（呼吸）
     * @param {number} [pose.robeWave=0]    袍摆相位 0~1
     * @param {number} [pose.lean=0]        前倾像素
     * @param {number} [pose.cast=0]        举书程度 0~1（施法）
     * @param {number} [pose.pageFlutter=0] 书页翻飞相位 0~1
     * @param {number} [pose.orbCharge=0]   裂弹球充能 0~1（自书中升起）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const robeWave = pose.robeWave || 0;
        const lean = pose.lean || 0;
        const cast = pose.cast || 0;
        const pageFlutter = pose.pageFlutter || 0;
        const orbCharge = pose.orbCharge || 0;

        const cx = 16 - lean;
        const bodyTop = 14 + squash;

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.3)');

        this.drawRobe(d, cx, bodyTop, robeWave);
        this.drawHood(d, cx - lean, 9 + squash);
        this.drawArms(d, cx, bodyTop, cast);
        this.drawCodex(d, cx, bodyTop, cast, pageFlutter);
        if (orbCharge > 0.05) this.drawOrb(d, cx, bodyTop, cast, orbCharge);

        return d.getCanvas();
    }

    /** 钟形长袍：肩→裙摆 + 金边，摆缘随 robeWave 波动。 */
    drawRobe(d, cx, top, robeWave) {
        const hemY = 28;
        d.fillPath([
            { x: cx, y: top - 2 },
            { x: cx + 5, y: top + 2 },
            { x: cx + 7, y: hemY },
            { x: cx - 7, y: hemY },
            { x: cx - 5, y: top + 2 }
        ], this.cRobe);

        // 明暗侧
        d.vLine(cx - 5, top + 3, hemY - top - 3, this.cRobeLight);
        d.vLine(cx - 4, top + 2, hemY - top - 2, this.cRobeLight);
        d.vLine(cx + 5, top + 3, hemY - top - 3, this.cRobeDark);
        d.vLine(cx + 6, top + 5, hemY - top - 5, this.cRobeDark);

        // 前襟金边
        d.vLine(cx, top - 1, hemY - top, this.cTrim);
        d.pixel(cx, top + 4, this.cRobeDark);

        // 金腰带
        d.hLine(cx - 5, top + 6, 11, this.cTrim);
        d.pixel(cx, top + 6, this.cBookCover);

        // 波动裙摆 + 金边点缀
        for (let i = -7; i <= 7; i++) {
            const wave = Math.sin(robeWave * Math.PI * 2 + i * 0.9);
            const dy = wave > 0.3 ? -1 : 0;
            d.pixel(cx + i, hemY + dy, this.cRobeDark);
            if (dy === 0) d.pixel(cx + i, hemY - 1, this.cRobe);
        }
        d.pixel(cx - 6, hemY, this.cTrim);
        d.pixel(cx + 5, hemY, this.cTrim);
    }

    /** 兜帽头：开口朝左，帽内阴影 + 妖紫亮眼 + 金边帽缘。 */
    drawHood(d, cx, cy) {
        d.fillPath([
            { x: cx - 5, y: cy },
            { x: cx - 3, y: cy - 4 },
            { x: cx + 2, y: cy - 5 },
            { x: cx + 6, y: cy - 2 },
            { x: cx + 6, y: cy + 4 },
            { x: cx - 5, y: cy + 4 }
        ], this.cRobe);
        d.hLine(cx - 3, cy - 4, 5, this.cRobeLight);
        d.vLine(cx + 5, cy - 2, 6, this.cRobeDark);
        // 帽缘金线
        d.pixel(cx - 5, cy, this.cTrim);
        d.pixel(cx - 4, cy - 1, this.cTrim);

        // 帽内阴影 + 双眼
        d.rect(cx - 5, cy, 6, 4, this.cHoodShadow);
        d.pixel(cx - 4, cy + 1, this.cEye);
        d.pixel(cx - 1, cy + 1, this.cEye);
        d.pixel(cx - 4, cy + 2, this.cRune);
    }

    /** 双袖前抱：随 cast 抬升，托起法典。 */
    drawArms(d, cx, bodyTop, cast) {
        const lift = Math.round(cast * 3);
        const ay = bodyTop + 8 - lift;
        // 左袖（前抱侧，朝 -x）
        d.fillPath([
            { x: cx - 6, y: ay },
            { x: cx - 2, y: ay - 1 },
            { x: cx - 3, y: ay + 3 },
            { x: cx - 7, y: ay + 2 }
        ], this.cRobe);
        d.pixel(cx - 7, ay + 1, this.cRobeDark);
        d.pixel(cx - 3, ay, this.cRobeLight);
        // 右袖（内侧扶书）
        d.fillPath([
            { x: cx + 1, y: ay },
            { x: cx + 4, y: ay },
            { x: cx + 3, y: ay + 3 },
            { x: cx, y: ay + 3 }
        ], this.cRobe);
        d.pixel(cx + 4, ay + 1, this.cRobeDark);
    }

    /** 前抱的猩红法典：翻开的书 + 书脊金边 + 符文页；施法时书页翻飞。 */
    drawCodex(d, cx, bodyTop, cast, pageFlutter) {
        const lift = Math.round(cast * 4);
        const bx = cx - 8;                 // 书本左缘
        const by = bodyTop + 6 - lift;     // 书本顶部（随举书上移）

        // 封皮（斜置的打开状）
        d.fillPath([
            { x: bx, y: by + 1 },
            { x: bx + 5, y: by - 1 },
            { x: bx + 10, y: by + 1 },
            { x: bx + 10, y: by + 6 },
            { x: bx + 5, y: by + 5 },
            { x: bx, y: by + 6 }
        ], this.cBookCover);
        // 封皮暗侧 + 书脊
        d.vLine(bx + 5, by - 1, 6, this.cBookCoverDark);
        d.pixel(bx + 5, by, this.cTrim);
        d.pixel(bx + 5, by + 3, this.cTrim);

        // 书页（左右两页米色）
        d.fillPath([
            { x: bx + 1, y: by + 1 },
            { x: bx + 4, y: by },
            { x: bx + 4, y: by + 4 },
            { x: bx + 1, y: by + 5 }
        ], this.cPage);
        d.fillPath([
            { x: bx + 6, y: by },
            { x: bx + 9, y: by + 1 },
            { x: bx + 9, y: by + 5 },
            { x: bx + 6, y: by + 4 }
        ], this.cPage);
        d.pixel(bx + 2, by + 4, this.cPageShadow);
        d.pixel(bx + 8, by + 4, this.cPageShadow);

        // 符文（页面上跳动的紫符）
        const runeOn = pageFlutter > 0.1 || cast > 0.3;
        if (runeOn) {
            d.pixel(bx + 2, by + 2, this.cRune);
            d.pixel(bx + 8, by + 2, this.cRune);
            d.pixel(bx + 3, by + 3, this.cRuneCore);
        }

        // 施法时翻飞的散页
        if (pageFlutter > 0.05) {
            for (let p = 0; p < 3; p++) {
                const ph = pageFlutter * Math.PI * 2 + p * 2.1;
                const fx = Math.round(bx + 5 + Math.cos(ph) * (5 + p * 2));
                const fy = Math.round(by - 3 - p * 2 + Math.sin(ph) * 2);
                d.rect(fx, fy, 2, 2, this.cPage);
                d.pixel(fx, fy + 1, this.cPageShadow);
            }
        }
    }

    /** 裂弹球：施法末段自书页升起的紫色大弹（orbCharge 控制大小/亮度）。 */
    drawOrb(d, cx, bodyTop, cast, orbCharge) {
        const lift = Math.round(cast * 4);
        const ox = cx - 3;
        const oy = bodyTop + 2 - lift - Math.round(orbCharge * 4);
        const r = Math.max(1, Math.round(1 + orbCharge * 3));

        d.ellipse(ox, oy, r, r, this.cOrb);
        d.ellipse(ox, oy, Math.max(1, r - 1), Math.max(1, r - 1), this.cOrbCore);
        // 环绕符光
        if (orbCharge > 0.5) {
            d.pixel(ox - r - 1, oy, this.cRune);
            d.pixel(ox + r + 1, oy, this.cRune);
            d.pixel(ox, oy - r - 1, this.cRune);
            d.pixel(ox, oy + r + 1, this.cRune);
        }
        // 升腾轨迹
        if (orbCharge > 0.3) {
            d.pixel(ox, oy + r + 2, this.cOrb);
            d.pixel(ox, oy + r + 3, this.cRune);
        }
    }
}
