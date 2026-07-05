// BoomerGenerator —— 地牢自爆蜂（臃肿爆虫：鼓胀腹囊 + 复眼 + 体内荧液晃动 + 脓包明灭 + 背裂发光 + 引信裂纹网）。
// 32×32，默认朝左（头/复眼在左，鼓腹在后）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class BoomerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 甲壳（四阶绿）
        this.cBody = '#6f9a4a';
        this.cBodyDark = '#4e7233';
        this.cBodyLight = '#93bf67';
        this.cBodyEdge = '#35501e';
        // 腹囊（半透，内有荧液）
        this.cBelly = '#bad98a';
        this.cBellyDark = '#96b566';
        this.cFluid = '#a8d070';       // 体内荧液
        this.cFluidHot = '#d8f0a8';    // 荧液亮斑
        // 脓包
        this.cPustule = '#cfe89a';
        this.cPustuleHot = '#f6ffcf';
        this.cPustuleRim = '#788c44';
        // 复眼
        this.cEye = '#ffcf3e';
        this.cEyeDark = '#b8891f';
        this.cEyePupil = '#2e2410';
        this.cEyeShine = '#fff2b0';
        // 口器
        this.cMouth = '#33202a';
        this.cTusk = '#e8e0c0';
        // 六腿（近亮远暗）
        this.cLegNear = '#5f7f3c';
        this.cLegFar = '#3e5827';
        this.cLegTip = '#2a3d18';
        // 背裂 / 引信
        this.cCrack = '#ffce54';
        this.cCrackHot = '#fff0b0';
        // 自爆红闪
        this.cWarn = '#ff5040';
        this.cWarnBright = '#ff9a70';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.squash=0] 呼吸/落地压缩（正值变矮胖）
     * @param {number} [pose.wobble=0] 腹囊横向摆（-2..2，荧液随之偏移）
     * @param {number} [pose.legFrame=0] 六腿疾走相位（0..5）
     * @param {number} [pose.bloat=0] 引信膨胀 0~1（身体放大 + 背裂扩大）
     * @param {number} [pose.redFlash=0] 自爆预警红闪 0~1
     * @param {number} [pose.pustulePhase=0] 脓包明灭全局相位 0~1（各包按偏移错相）
     * @param {number} [pose.crackSpread=0] 体表裂纹网蔓延 0~1（引信末段）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.squash || 0;
        const wobble = pose.wobble || 0;
        const legFrame = pose.legFrame || 0;
        const bloat = pose.bloat || 0;
        const redFlash = pose.redFlash || 0;
        const pustulePhase = pose.pustulePhase || 0;
        const crackSpread = pose.crackSpread || 0;

        const cx = 16;
        const grow = Math.round(bloat * 2);

        d.ellipse(cx, 29, 9 + grow, 3, 'rgba(0,0,0,0.3)');

        // 远腿（背侧，先画，较暗较高）
        this.drawLegs(d, cx, legFrame, true);
        this.drawBody(d, cx, squash, wobble, grow, redFlash, pustulePhase, bloat, crackSpread);
        // 近腿（腹侧，后画覆盖，较亮较低）
        this.drawLegs(d, cx, legFrame, false);

        return d.getCanvas();
    }

    /** 六条腿三对（near=腹侧亮腿，far=背侧暗腿），交替抬落。 */
    drawLegs(d, cx, legFrame, isFar) {
        const pairs = [
            { x: cx - 6, phase: 0 },
            { x: cx,     phase: 2 },
            { x: cx + 6,  phase: 4 }
        ];
        const baseY = isFar ? 22 : 25;         // 远腿高、近腿低
        const col = isFar ? this.cLegFar : this.cLegNear;
        for (const p of pairs) {
            const step = (Math.floor(legFrame) + p.phase) % 6;
            const lift = step < 3 ? 0 : -1;    // 抬腿
            const spread = isFar ? -1 : 1;     // 远腿内收、近腿外张
            // 大腿
            d.rect(p.x, baseY + lift, 2, 3 - lift, col);
            // 胫（斜向足尖）
            d.pixel(p.x + spread, baseY + 3 + lift, col);
            d.pixel(p.x + spread * 2, baseY + 4 + lift, this.cLegTip);
        }
    }

    /** 鼓胀腹囊 + 头胸 + 复眼口器 + 荧液 + 脓包 + 背裂 + 红闪。 */
    drawBody(d, cx, squash, wobble, grow, redFlash, pustulePhase, bloat, crackSpread) {
        const top = 9 + squash - grow;
        const bottom = 27;
        const halfW = 8 + grow;
        const midY = Math.floor((top + bottom) / 2);

        // -- 主腹囊（后大前收的水滴形，朝左收窄）--
        d.fillPath([
            { x: cx - halfW + 2, y: midY - 3 },              // 前上（近头）
            { x: cx - 2 + wobble, y: top },                   // 顶前
            { x: cx + halfW - 2 + wobble, y: top + 2 },       // 顶后
            { x: cx + halfW, y: midY },                        // 后缘
            { x: cx + halfW - 2, y: bottom - 1 },              // 后下
            { x: cx - halfW + 3, y: bottom },                  // 前下
            { x: cx - halfW, y: midY + 2 }                     // 前收
        ], this.cBody);

        // 顶部受光带 / 后侧压暗
        d.hLine(cx - 3 + wobble, top + 1, 8, this.cBodyLight);
        d.hLine(cx - 1 + wobble, top, 5, this.cBodyLight);
        d.vLine(cx + halfW - 1, midY - 2, bottom - midY - 1, this.cBodyDark);
        d.vLine(cx + halfW, midY - 1, 3, this.cBodyEdge);
        d.pixel(cx + halfW - 2, bottom - 1, this.cBodyEdge);

        // 甲壳分节缝（三道弧线）
        d.hLine(cx - 2, top + 4, halfW, this.cBodyDark);
        d.hLine(cx - 1, top + 7, halfW - 1, this.cBodyDark);
        d.hLine(cx, top + 10, halfW - 2, this.cBodyDark);

        // -- 半透腹（前下方，透出荧液）--
        d.fillPath([
            { x: cx - halfW + 2, y: midY },
            { x: cx + 2, y: midY - 1 },
            { x: cx + 3, y: bottom - 1 },
            { x: cx - halfW + 3, y: bottom }
        ], this.cBelly);
        d.pixel(cx - halfW + 2, bottom - 1, this.cBellyDark);

        // 体内荧液晃动（亮斑随 wobble 偏移）
        const fx = cx - 3 + wobble;
        const fy = midY + 3;
        d.ellipse(fx, fy, 3, 2, this.cFluid);
        d.pixel(fx + wobble, fy - 1, this.cFluidHot);   // 高光随晃动
        d.pixel(fx - 1 + wobble, fy, this.cFluidHot);
        // 膨胀时荧液上涌
        if (bloat > 0.4) {
            d.pixel(cx - 1 + wobble, midY, this.cFluidHot);
            d.pixel(cx + wobble, midY + 1, this.cFluid);
        }

        // -- 头胸 + 复眼口器（前左）--
        const hx = cx - halfW - 1;
        const hy = midY - 1;
        d.ellipse(hx + 2, hy, 3, 3, this.cBodyDark);      // 头胸壳
        d.pixel(hx + 1, hy - 2, this.cBodyLight);
        // 复眼（多格点阵 + 高光）
        d.rect(hx, hy - 1, 3, 3, this.cEye);
        d.pixel(hx, hy - 1, this.cEyeDark);
        d.pixel(hx + 2, hy + 1, this.cEyeDark);
        d.pixel(hx + 1, hy, this.cEyePupil);              // 复眼小格
        d.pixel(hx, hy + 1, this.cEyePupil);
        d.pixel(hx + 2, hy - 1, this.cEyePupil);
        d.pixel(hx, hy - 1, this.cEyeShine);              // 高光
        // 口器獠牙
        d.pixel(hx - 1, hy + 2, this.cTusk);
        d.pixel(hx, hy + 3, this.cMouth);
        d.pixel(hx + 1, hy + 3, this.cTusk);

        // -- 脓包（各自按 pustulePhase + 偏移错相明灭）--
        const pustules = [
            { x: cx + 2, y: top + 3, off: 0.0 },
            { x: cx + halfW - 3, y: midY - 1, off: 0.33 },
            { x: cx - 1, y: midY + 1, off: 0.66 },
            { x: cx + 4, y: bottom - 3, off: 0.15 },
            { x: cx + halfW - 4, y: bottom - 2, off: 0.5 }
        ];
        for (const p of pustules) {
            const lit = Math.sin((pustulePhase + p.off) * Math.PI * 2) > 0.2;
            const c = lit ? this.cPustuleHot : this.cPustule;
            d.rect(p.x, p.y, 2, 2, c);
            d.pixel(p.x, p.y + 1, this.cPustuleRim);       // 包沿阴影
            if (lit) d.pixel(p.x, p.y, this.cFluidHot);     // 亮时透光
        }

        // -- 背裂发光（顶部纵向裂缝，随 bloat 扩大 + 变亮）--
        if (bloat > 0.1) {
            const crackW = 1 + Math.round(bloat * 2);
            const cyy = top + 3;
            const crackCol = bloat > 0.6 ? this.cCrackHot : this.cCrack;
            for (let k = 0; k < 4; k++) {
                const jitter = (k % 2 === 0) ? 0 : 1;
                d.rect(cx + 1 + jitter, cyy + k * 2, Math.max(1, crackW - jitter), 1, crackCol);
            }
            if (bloat > 0.6) {
                d.pixel(cx, cyy + 2, this.cCrackHot);
                d.pixel(cx + crackW + 1, cyy + 4, this.cCrackHot);
            }
        }

        // -- 引信末段：体表裂纹网蔓延（发光锯齿网）--
        if (crackSpread > 0.05) {
            const net = [
                [cx - 4, midY - 2], [cx - 3, midY - 1], [cx - 2, midY],
                [cx + 3, top + 6], [cx + 4, top + 7], [cx + 5, top + 8],
                [cx - 2, bottom - 3], [cx - 1, bottom - 4], [cx, bottom - 5],
                [cx + 5, midY + 1], [cx + 6, midY + 2]
            ];
            const n = Math.floor(net.length * crackSpread);
            for (let k = 0; k < n; k++) {
                d.pixel(net[k][0], net[k][1], k % 2 ? this.cCrackHot : this.cWarnBright);
            }
        }

        // -- 自爆预警红闪：覆盖红雾 + 裂纹灼红 --
        if (redFlash > 0.05) {
            const alpha = Math.min(0.82, 0.22 + redFlash * 0.6);
            const rgb = redFlash > 0.7 ? '255,154,112' : '255,80,64';
            d.ellipse(cx + 1, midY, halfW - 1, Math.floor((bottom - top) / 2), `rgba(${rgb},${alpha.toFixed(2)})`);
            const warn = redFlash > 0.7 ? this.cWarnBright : this.cWarn;
            d.pixel(cx + 2, midY - 2, warn);
            d.pixel(cx + 3, midY - 1, warn);
            d.pixel(cx - 3, midY + 2, warn);
            d.pixel(cx + halfW - 3, top + 4, warn);
        }
    }
}
