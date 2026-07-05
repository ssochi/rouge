// WeeperGenerator —— 怨眼：漂浮的哭泣巨眼。
// 独眼球 + 血丝巩膜 + 上下眼睑开合 + 泪痕垂落 + 下垂触须帘。
// 32×32，默认朝左（瞳孔偏向 -x）；attack 时眼睁大、泪涌。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class WeeperGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 巩膜（眼白）四阶
        this.cSclera = '#e9edf0';       // 眼白
        this.cScleraShadow = '#bcc6cd'; // 眼白阴影
        this.cScleraDark = '#8d99a1';   // 眼窝深影
        this.cVein = '#b5555f';         // 血丝

        // 虹膜（幽蓝）四阶
        this.cIrisGlow = '#a7e0ff';     // 虹膜高光
        this.cIris = '#49a8db';         // 虹膜主调
        this.cIrisDark = '#276f9e';     // 虹膜暗环
        this.cPupil = '#0b2130';        // 瞳孔

        // 眼睑（病态肉色）四阶
        this.cLidLight = '#8c6678';     // 睑受光
        this.cLid = '#6b4a5c';          // 睑主调
        this.cLidDark = '#472f3c';      // 睑暗
        this.cLash = '#2a1a22';         // 睫影

        // 泪与触须
        this.cTear = '#8fd4ff';         // 泪滴
        this.cTearDark = '#4f9fce';     // 泪暗
        this.cTendril = '#5a3d4c';      // 触须
        this.cTendrilDark = '#38232f';  // 触须暗
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.blink=0]       眼睑闭合 0(睁)~1(闭)
     * @param {number} [pose.tearFlow=0.3]  泪量 0~1
     * @param {number} [pose.pupil=1]       瞳孔缩放（1 常态，<1 收缩，>1 睁大）
     * @param {number} [pose.tendrilWave=0] 触须摆动相位 0~1
     * @param {number} [pose.bob=0]         悬浮升降像素
     * @param {number} [pose.gaze=0]        瞳孔横向偏移像素（注视）
     * @param {number} [pose.wide=0]        睁大程度 0~1（attack 眼球外凸+溢光）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const blink = pose.blink || 0;
        const tearFlow = pose.tearFlow ?? 0.3;
        const pupil = pose.pupil ?? 1;
        const tendrilWave = pose.tendrilWave || 0;
        const bob = pose.bob || 0;
        const gaze = pose.gaze || 0;
        const wide = pose.wide || 0;

        const cx = 16;
        const cy = 14 + bob;

        d.ellipse(16, 30, 7, 2, 'rgba(0,0,0,0.28)');

        // 触须帘（先绘，位于眼球后下方）
        this.drawTendrils(d, cx, cy + 6, tendrilWave);

        // 眼球本体
        this.drawSclera(d, cx, cy, wide);
        this.drawVeins(d, cx, cy);
        this.drawIris(d, cx, cy, gaze, pupil, wide);
        this.drawLids(d, cx, cy, blink, wide);
        this.drawTears(d, cx, cy, tearFlow);

        return d.getCanvas();
    }

    /** 眼白球体：主椭圆 + 底部阴影 + 睁大时轻微外凸描边。 */
    drawSclera(d, cx, cy, wide) {
        const rx = 8 + Math.round(wide);
        const ry = 7 + Math.round(wide * 0.5);
        d.ellipse(cx, cy, rx, ry, this.cSclera);
        // 下半阴影
        for (let x = -rx; x <= rx; x++) {
            const yb = Math.round(Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx))) * ry);
            d.pixel(cx + x, cy + yb - 1, this.cScleraShadow);
        }
        // 眼窝深影（左右角）
        d.pixel(cx - rx + 1, cy + 1, this.cScleraDark);
        d.pixel(cx + rx - 1, cy + 1, this.cScleraDark);
        // 高光
        d.pixel(cx - 4, cy - 4, '#ffffff');
        d.pixel(cx - 3, cy - 4, '#ffffff');
    }

    /** 血丝：从眼角向虹膜蔓延的红纹。 */
    drawVeins(d, cx, cy) {
        d.pixel(cx - 6, cy - 1, this.cVein);
        d.pixel(cx - 5, cy - 1, this.cVein);
        d.pixel(cx - 5, cy, this.cVein);
        d.pixel(cx + 6, cy + 1, this.cVein);
        d.pixel(cx + 5, cy + 1, this.cVein);
        d.pixel(cx + 5, cy + 2, this.cVein);
        d.pixel(cx - 2, cy + 4, this.cVein);
    }

    /** 虹膜 + 瞳孔：幽蓝同心环，随 gaze 偏移，pupil 控制瞳孔大小。 */
    drawIris(d, cx, cy, gaze, pupil, wide) {
        const ix = cx + Math.round(gaze) - 1; // 默认朝左（-x）
        const iy = cy + 1;
        const ir = 4 + Math.round(wide * 0.5);
        // 虹膜外环暗
        d.ellipse(ix, iy, ir, ir, this.cIrisDark);
        // 虹膜主体
        d.ellipse(ix, iy, ir - 1, ir - 1, this.cIris);
        // 内环高光弧
        d.pixel(ix - 2, iy - 2, this.cIrisGlow);
        d.pixel(ix - 1, iy - 2, this.cIrisGlow);
        d.pixel(ix - 2, iy - 1, this.cIrisGlow);
        // 瞳孔
        const pr = Math.max(1, Math.round(2 * pupil));
        d.ellipse(ix, iy, pr, pr, this.cPupil);
        // 瞳孔反光点
        d.pixel(ix - 1, iy - 1, this.cIrisGlow);
        // 睁大时虹膜溢光
        if (wide > 0.6) {
            d.pixel(ix + ir, iy, this.cIrisGlow);
            d.pixel(ix - ir, iy, this.cIrisGlow);
        }
    }

    /** 上下眼睑：blink=0 缩在眼眶外缘，blink=1 于中线闭合。 */
    drawLids(d, cx, cy, blink, wide) {
        const rx = 8 + Math.round(wide);
        const ry = 7 + Math.round(wide * 0.5);
        // 上睑下沿高度（从顶部向中心推进）
        const topCover = Math.round(-ry + blink * ry);   // blink=1 → 0（到中线）
        const botCover = Math.round(ry - blink * ry);

        for (let x = -rx; x <= rx; x++) {
            const edge = Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx))) * ry;
            // 上睑：从 -ry 覆盖到 topCover
            for (let y = -Math.ceil(edge); y <= topCover; y++) {
                if (y < -edge) continue;
                const tone = (y === topCover) ? this.cLidLight : (y < topCover - 2 ? this.cLidDark : this.cLid);
                d.pixel(cx + x, cy + y, tone);
            }
            // 下睑：从 botCover 覆盖到 +ry
            for (let y = botCover; y <= Math.ceil(edge); y++) {
                if (y > edge) continue;
                const tone = (y === botCover) ? this.cLidLight : (y > botCover + 2 ? this.cLidDark : this.cLid);
                d.pixel(cx + x, cy + y, tone);
            }
        }
        // 睑缘睫影（上睑下沿一条暗线）
        if (blink < 0.9) {
            d.hLine(cx - rx + 2, cy + topCover, (rx - 2) * 2, this.cLash);
        }
    }

    /** 泪痕：下睑外角垂落的幽蓝泪streak，长度随 tearFlow。 */
    drawTears(d, cx, cy, tearFlow) {
        if (tearFlow <= 0.05) return;
        const len = Math.round(4 + tearFlow * 8);
        // 左泪痕
        const lx = cx - 4;
        const ly = cy + 6;
        for (let k = 0; k < len; k++) {
            const yy = ly + k;
            const tone = k % 3 === 0 ? this.cTear : this.cTearDark;
            d.pixel(lx + Math.round(Math.sin(k * 0.5)), yy, tone);
        }
        // 右泪痕（较短）
        const rx = cx + 3;
        const ry = cy + 6;
        const rlen = Math.max(2, len - 3);
        for (let k = 0; k < rlen; k++) {
            const yy = ry + k;
            const tone = k % 3 === 0 ? this.cTear : this.cTearDark;
            d.pixel(rx + Math.round(Math.sin(k * 0.5 + 1)), yy, tone);
        }
        // 将落的泪珠
        if (tearFlow > 0.5) {
            d.rect(lx - 1, ly + len, 2, 2, this.cTear);
            d.pixel(lx, ly + len + 2, this.cTearDark);
        }
    }

    /** 触须帘：眼球下方 5 条下垂触须，随相位左右摆。 */
    drawTendrils(d, cx, top, wave) {
        const roots = [-6, -3, 0, 3, 6];
        for (let r = 0; r < roots.length; r++) {
            const rootX = cx + roots[r];
            const len = 8 + (r % 2) * 2;
            for (let k = 0; k < len; k++) {
                const t = k / len;
                const swing = Math.sin(wave * Math.PI * 2 + r * 0.8 + k * 0.3) * (1.5 + t * 2);
                const px = Math.round(rootX + swing);
                const py = top + k;
                d.pixel(px, py, this.cTendril);
                // 内侧暗边
                d.pixel(px + 1, py, this.cTendrilDark);
            }
            // 触须末端小球
            const tipSwing = Math.sin(wave * Math.PI * 2 + r * 0.8 + len * 0.3) * (1.5 + 2);
            d.pixel(Math.round(rootX + tipSwing), top + len, this.cTendrilDark);
        }
    }
}
