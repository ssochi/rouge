// SpinnerGenerator —— 焰旋妖：悬浮旋转的火焰陀螺妖。
// 暗色恶魔核心悬于半空，四片镰形焰刃绕核旋转；attack 时转速与焰痕加剧。
// 32×32，无独立朝向（径向对称），旋转与焰强度全部由 pose 驱动。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

const TAU = Math.PI * 2;

export class SpinnerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 焰体四阶色板（核 → 外缘）
        this.cCore = '#fff2c2';       // 炽白核心
        this.cFlameHot = '#ffd24a';   // 亮黄
        this.cFlameMid = '#ff8a1e';   // 橙
        this.cFlameDeep = '#e5401b';  // 红
        this.cEmber = '#8f1f10';      // 暗烬红（焰痕/飞屑）

        // 妖核（焦壳恶魔核心）四阶
        this.cShell = '#2c110d';      // 焦壳最暗
        this.cShellMid = '#3f1a12';   // 焦壳中调
        this.cShellLight = '#5c281b'; // 焦壳受光边
        this.cEye = '#ffe27a';        // 妖眼
        this.cEyeCore = '#fffbe6';    // 妖眼高光
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.spin=0]      旋转相位 0~1（×TAU）
     * @param {number} [pose.flare=0.4]   焰强度 0~1（影响焰刃长度/亮度）
     * @param {number} [pose.tilt=0]      横向倾斜像素（Run 漂移）
     * @param {number} [pose.bob=0]       悬浮升降像素
     * @param {number} [pose.eyeGlow=0.3] 妖眼睁亮 0~1（attack 加剧）
     * @param {number} [pose.trail=0]     焰痕拖尾 0~1（attack 快转）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const spin = (pose.spin || 0) * TAU;
        const flare = pose.flare ?? 0.4;
        const tilt = pose.tilt || 0;
        const bob = pose.bob || 0;
        const eyeGlow = pose.eyeGlow ?? 0.3;
        const trail = pose.trail || 0;

        const cx = 16 + tilt;
        const cy = 15 + bob;

        // 悬浮投影（离地，较淡）
        d.ellipse(16, 29, 6, 2, 'rgba(0,0,0,0.28)');

        // 焰刃四片（先绘拖尾残影，再绘实刃）
        const bladeLen = 9 + flare * 4;
        if (trail > 0.05) this.drawTrail(d, cx, cy, spin, bladeLen, trail);
        for (let i = 0; i < 4; i++) {
            this.drawBlade(d, cx, cy, spin + i * (TAU / 4), bladeLen, flare);
        }

        // 妖核 + 内焰 + 妖眼
        this.drawCore(d, cx, cy, flare);
        this.drawEye(d, cx, cy, eyeGlow);

        return d.getCanvas();
    }

    /** 绕 (cx,cy) 旋转局部点集 angle 弧度。 */
    rotatePts(cx, cy, pts, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return pts.map(p => ({
            x: cx + p.x * c - p.y * s,
            y: cy + p.x * s + p.y * c
        }));
    }

    /** 单片镰形焰刃：红底 → 橙心 → 黄芯，指向 +x 后旋转到位。 */
    drawBlade(d, cx, cy, angle, len, flare) {
        // 外层红焰（镰形，尾部带卷曲）
        const outer = [
            { x: 2.5, y: -2.2 },
            { x: len * 0.55, y: -3.4 },
            { x: len, y: -0.6 },
            { x: len * 0.82, y: 1.9 },
            { x: len * 0.42, y: 3.1 },
            { x: 2.5, y: 2.2 }
        ];
        d.fillPath(this.rotatePts(cx, cy, outer, angle), this.cFlameDeep);

        // 中层橙焰（略短略窄）
        const mid = [
            { x: 2, y: -1.5 },
            { x: len * 0.5, y: -2.3 },
            { x: len * 0.82, y: -0.3 },
            { x: len * 0.66, y: 1.4 },
            { x: len * 0.36, y: 2.2 },
            { x: 2, y: 1.5 }
        ];
        d.fillPath(this.rotatePts(cx, cy, mid, angle), this.cFlameMid);

        // 内芯亮黄（细长舌）
        const core = [
            { x: 2, y: -0.8 },
            { x: len * 0.5, y: -1.1 },
            { x: len * 0.72, y: 0 },
            { x: len * 0.45, y: 1.2 },
            { x: 2, y: 0.8 }
        ];
        d.fillPath(this.rotatePts(cx, cy, core, angle), this.cFlameHot);

        // 刃尖白炽点（flare 高时出现）
        if (flare > 0.55) {
            const tip = this.rotatePts(cx, cy, [{ x: len * 0.7, y: 0 }], angle)[0];
            d.pixel(Math.round(tip.x), Math.round(tip.y), this.cCore);
        }
    }

    /** 焰痕残影：在实刃后方绘半透明暗烬弧（快转时的拖尾感）。 */
    drawTrail(d, cx, cy, spin, len, trail) {
        const ghosts = 3;
        for (let g = 1; g <= ghosts; g++) {
            const back = spin - g * 0.22;
            for (let i = 0; i < 4; i++) {
                const angle = back + i * (TAU / 4);
                const pts = this.rotatePts(cx, cy, [
                    { x: 2, y: -1.4 },
                    { x: len * 0.5, y: -2 },
                    { x: len * 0.78, y: 0 },
                    { x: len * 0.5, y: 2 },
                    { x: 2, y: 1.4 }
                ], angle);
                const alpha = (0.14 * trail * (ghosts - g + 1)) / ghosts;
                d.fillPath(pts, `rgba(229,64,27,${alpha.toFixed(3)})`);
            }
        }
    }

    /** 悬浮焦壳核心：暗棕球体 + 受光边 + 内焰跳动。 */
    drawCore(d, cx, cy, flare) {
        const r = 5;
        // 焦壳球体
        d.ellipse(cx, cy, r, r - 1, this.cShell);
        d.ellipse(cx, cy, r - 1, r - 2, this.cShellMid);
        // 左上受光边
        d.pixel(cx - 3, cy - 2, this.cShellLight);
        d.pixel(cx - 2, cy - 3, this.cShellLight);
        d.pixel(cx - 3, cy - 1, this.cShellLight);
        // 焦裂纹（右下暗）
        d.pixel(cx + 2, cy + 2, this.cShell);
        d.pixel(cx + 3, cy + 1, this.cShell);

        // 核内焰隙（缝隙透出的火光，随 flare 变亮）
        const glow = flare > 0.5 ? this.cFlameHot : this.cFlameMid;
        d.vLine(cx, cy - 2, 4, glow);
        d.pixel(cx - 1, cy, this.cFlameDeep);
        d.pixel(cx + 1, cy - 1, glow);
        if (flare > 0.6) {
            d.pixel(cx, cy - 3, this.cCore);
            d.pixel(cx, cy + 2, this.cFlameHot);
        }
    }

    /** 妖眼：核心上方一枚横瞳，睁亮随 eyeGlow。 */
    drawEye(d, cx, cy, eyeGlow) {
        const ey = cy - 1;
        // 眼窝暗底
        d.rect(cx - 2, ey, 4, 2, this.cShell);
        // 瞳
        const bright = eyeGlow > 0.5 ? this.cEyeCore : this.cEye;
        d.pixel(cx - 1, ey, bright);
        d.pixel(cx, ey, bright);
        if (eyeGlow > 0.35) {
            d.pixel(cx - 1, ey + 1, this.cEye);
            d.pixel(cx, ey + 1, this.cEye);
        }
        // 睁大时上下溢光
        if (eyeGlow > 0.7) {
            d.pixel(cx - 2, ey, this.cEye);
            d.pixel(cx + 1, ey, this.cEye);
            d.pixel(cx, ey - 1, this.cEyeCore);
        }
    }
}
