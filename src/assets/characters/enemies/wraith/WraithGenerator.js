// WraithGenerator —— 地牢幽魂（囚魂）：飘浮裹布怨灵。
// 性格=怨。双层裹布（外袍+内影）、兜帽下漂移眨动的双眼、三缕独立相位拖尾、囚魂断链。
// 32×32，默认朝左；浮游体无腿，Run=前倾疾漂+拖尾拉长，Attack=怨气自体内涌出。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class WraithGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 外袍裹布（4 阶）
        this.cRobe = '#8f9bb5';       // 主色
        this.cRobeLight = '#b0bdd6';  // 高光（朝左受光侧）
        this.cRobeDark = '#6f7a94';   // 暗部
        this.cRobeEdge = '#545d75';   // 描边/下摆末端

        // 内影层（裹布之下透出的虚影，攻击时外翻）
        this.cInner = '#39415a';
        this.cInnerLight = '#4c566f';

        // 面部空洞
        this.cVoid = '#1e2438';
        this.cHoodShade = '#4a5470';  // 兜帽内壁阴影

        // 怨眼（青蓝冷光）
        this.cEye = '#9ef0ff';
        this.cEyeHot = '#e6ffff';

        // 囚魂断链
        this.cChain = '#4a4a58';
        this.cChainLight = '#6c6c7c';

        // 怨气飘魂光点
        this.cWisp = '#c8d8f0';
        this.cWispHot = '#a6f2ff';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.floatY=0]     浮沉偏移（呼吸/漂浮）
     * @param {number} [pose.tailWave=0]   拖尾三缕相位 0~1
     * @param {number} [pose.lean=0]       前倾量（追击）
     * @param {number} [pose.flare=0]      怨气外放 0~1（攻击/濒死：内影外翻+眼放大）
     * @param {number} [pose.breathe=0]    躯体轮廓涨缩 -1~1（呼吸）
     * @param {number} [pose.eyeBlink=0]   眨眼 0=睁 / 1=灭
     * @param {number} [pose.eyeDrift=0]   双眼横向漂移 -1~1
     * @param {number} [pose.chainSwing=0] 断链甩动 -1~1（随移动）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const floatY = pose.floatY || 0;
        const tailWave = pose.tailWave || 0;
        const lean = pose.lean || 0;
        const flare = pose.flare || 0;
        const breathe = pose.breathe || 0;
        const eyeBlink = pose.eyeBlink || 0;
        const eyeDrift = pose.eyeDrift || 0;
        const chainSwing = pose.chainSwing || 0;

        const cx = 16 - lean;          // 前倾：整体左移
        const top = 8 + floatY;        // 裹布顶（随浮沉升降）
        const grow = Math.round(breathe); // 呼吸涨缩量（-1~1，整数像素）

        this.drawShadow(d, floatY);
        this.drawTail(d, cx, top, tailWave, flare);
        this.drawRobe(d, cx, top, grow, lean);
        this.drawWraps(d, cx, top, grow);
        this.drawInner(d, cx, top, grow, flare);
        this.drawHood(d, cx, top, grow);
        this.drawFace(d, cx, top, eyeBlink, eyeDrift, flare);
        this.drawChain(d, cx, top, chainSwing);
        if (flare > 0.15) this.drawWisps(d, cx, top, flare);

        return d.getCanvas();
    }

    /** 淡投影：浮得越高影越小越淡。 */
    drawShadow(d, floatY) {
        const rx = Math.max(3, 6 + Math.round(floatY * 0.4));
        const alpha = 0.18 + floatY * 0.02;
        d.ellipse(16, 29, rx, 2, `rgba(0,0,0,${Math.max(0.08, alpha).toFixed(2)})`);
    }

    /** 三缕拖尾布条：各自独立相位甩动，末端消散为散逸像素。 */
    drawTail(d, cx, top, tailWave, flare) {
        const baseY = top + 14;
        for (let i = -1; i <= 1; i++) {
            // 每缕相位错开 1.7rad，形成不同步的飘摆
            const ph = tailWave * Math.PI * 2 + i * 1.7;
            const sway1 = Math.round(Math.sin(ph) * 1.5);
            const sway2 = Math.round(Math.sin(ph + 0.7) * 2.5);
            const sway3 = Math.round(Math.sin(ph + 1.4) * 3);
            const tx = cx + i * 3;

            // 逐段下垂并侧摆（越往下摆幅越大）
            d.rect(tx, baseY, 2, 2, this.cRobeDark);
            d.rect(tx + sway1, baseY + 2, 2, 2, this.cInner);
            d.rect(tx + sway2, baseY + 4, 2, 2, this.cInner);
            // 末端消散：单像素渐隐
            d.pixel(tx + sway3, baseY + 6, this.cInnerLight);
            d.pixel(tx + sway3 + (i > 0 ? 1 : -1), baseY + 7, this.cRobeEdge);
            // 怨气激涌时末梢泛冷光
            if (flare > 0.4) d.pixel(tx + sway3, baseY + 5, this.cWisp);
        }
    }

    /** 外袍裹布：兜帽罩体的水滴形，宽度随呼吸涨缩，朝左受光。 */
    drawRobe(d, cx, top, grow, lean) {
        const w = 6 + grow; // 肩部半宽
        d.fillPath([
            { x: cx,          y: top - 1 },       // 帽尖
            { x: cx + w,      y: top + 5 },       // 右肩
            { x: cx + w - 1,  y: top + 11 },
            { x: cx + w - 3,  y: top + 15 },      // 右下摆
            { x: cx - w + 3,  y: top + 15 },      // 左下摆
            { x: cx - w + 1,  y: top + 11 },
            { x: cx - w,      y: top + 5 }        // 左肩
        ], this.cRobe);

        // 侧光：朝左（受光）亮、朝右暗
        d.vLine(cx - w + 1, top + 5, 9, this.cRobeLight);
        d.vLine(cx + w - 1, top + 6, 8, this.cRobeDark);
        // 帽尖高光
        d.pixel(cx, top, this.cRobeLight);
        // 下摆撕裂描边（前倾时更飘）
        d.pixel(cx - w + 2 - (lean > 0 ? 1 : 0), top + 15, this.cRobeEdge);
        d.pixel(cx + w - 2, top + 15, this.cRobeEdge);
        d.pixel(cx - 1, top + 15, this.cRobeEdge);
    }

    /** 裹布缠束：躯体上的三道殓布绑带（斜向缠绕，明暗错落），强化“裹布分层”。 */
    drawWraps(d, cx, top, grow) {
        const w = 5 + grow;
        const bands = [top + 6, top + 9, top + 12];
        for (let b = 0; b < bands.length; b++) {
            const y = bands[b];
            const off = b % 2 === 0 ? 0 : 1; // 交错斜势
            // 绑带主体（略深于袍身）
            d.hLine(cx - w + off, y, (w - off) * 2, this.cRobeDark);
            // 绑带上缘受光、下缘描边
            d.hLine(cx - w + off + 1, y - 1, 3, this.cRobeLight);
            d.pixel(cx + w - off - 1, y + 1, this.cRobeEdge);
            // 缠束结点
            d.pixel(cx + (b % 2 === 0 ? -2 : 2), y, this.cRobeEdge);
        }
    }

    /** 内影层：外袍胸腹处透出的深色虚影，攻击时向外翻涌。 */
    drawInner(d, cx, top, grow, flare) {
        const spill = Math.round(flare * 3); // 怨气外翻扩张
        const iw = 3 + grow;
        // 胸腹内影
        d.fillPath([
            { x: cx - iw - spill, y: top + 6 },
            { x: cx + iw + spill, y: top + 6 },
            { x: cx + iw - 1,     y: top + 13 },
            { x: cx - iw + 1,     y: top + 13 }
        ], this.cInner);
        // 内影高光脊
        d.vLine(cx, top + 7, 6, this.cInnerLight);
        // 攻击外翻：内影溢出裹布边缘
        if (flare > 0.3) {
            d.pixel(cx - iw - spill, top + 8, this.cInnerLight);
            d.pixel(cx + iw + spill, top + 9, this.cInnerLight);
            d.pixel(cx - iw - spill, top + 10, this.cInner);
        }
    }

    /** 兜帽：罩住头部的深色帽兜与内壁阴影。 */
    drawHood(d, cx, top, grow) {
        const hw = 5 + grow;
        // 帽兜外缘（略深于袍身）
        d.fillPath([
            { x: cx,        y: top - 1 },
            { x: cx + hw,   y: top + 5 },
            { x: cx + hw - 2, y: top + 6 },
            { x: cx - hw + 2, y: top + 6 },
            { x: cx - hw,   y: top + 5 }
        ], this.cRobeDark);
        // 帽檐高光
        d.hLine(cx - hw + 2, top + 4, 3, this.cRobeLight);
        // 兜帽内壁阴影（面部空洞上方）
        d.hLine(cx - 3, top + 5, 6, this.cHoodShade);
    }

    /** 面部空洞 + 双怨眼：眼可漂移、可眨灭；攻击时眼放大。 */
    drawFace(d, cx, top, eyeBlink, eyeDrift, flare) {
        // 面部空洞（兜帽下的虚无）
        d.rect(cx - 4, top + 5, 8, 4, this.cVoid);
        d.pixel(cx - 4, top + 5, this.cHoodShade);
        d.pixel(cx + 3, top + 5, this.cHoodShade);

        if (eyeBlink > 0.5) {
            // 眼灭：仅余极暗残影
            d.pixel(cx - 3 + Math.round(eyeDrift), top + 6, this.cHoodShade);
            d.pixel(cx + 1 + Math.round(eyeDrift), top + 6, this.cHoodShade);
            return;
        }

        const dx = Math.round(eyeDrift);
        const big = flare > 0.5; // 怨气涌出时双眼放大
        const eyeCol = flare > 0.3 ? this.cEyeHot : this.cEye;

        // 左眼（朝左，主视）
        d.pixel(cx - 3 + dx, top + 6, eyeCol);
        // 右眼
        d.pixel(cx + 1 + dx, top + 6, eyeCol);
        if (big) {
            // 放大：眼芯外扩一圈冷焰
            d.pixel(cx - 4 + dx, top + 6, this.cEye);
            d.pixel(cx - 3 + dx, top + 7, this.cEye);
            d.pixel(cx + 2 + dx, top + 6, this.cEye);
            d.pixel(cx + 1 + dx, top + 7, this.cEye);
        } else {
            // 常态：眼下拖一像素余辉
            d.pixel(cx - 3 + dx, top + 7, this.cEye);
        }
    }

    /** 囚魂断链：右侧垂挂的镣铐残段，随移动甩动。 */
    drawChain(d, cx, top, chainSwing) {
        const s = chainSwing;
        // 铐环（贴身固定端）
        d.pixel(cx + 5, top + 9, this.cChainLight);
        d.rect(cx + 5, top + 9, 2, 2, this.cChain);
        // 链节（逐节受甩幅递增）
        const seg = [
            { x: cx + 6 + Math.round(s * 1), y: top + 11 },
            { x: cx + 7 + Math.round(s * 2), y: top + 13 },
            { x: cx + 7 + Math.round(s * 3), y: top + 15 }
        ];
        for (let i = 0; i < seg.length; i++) {
            d.pixel(seg[i].x, seg[i].y, i % 2 === 0 ? this.cChain : this.cChainLight);
        }
        // 断口：末端铁屑
        d.pixel(seg[2].x + (s > 0 ? 1 : -1), seg[2].y + 1, this.cChain);
    }

    /** 怨气飘魂：攻击/濒死时环绕体侧涌出的冷光点。 */
    drawWisps(d, cx, top, flare) {
        d.pixel(cx - 8, top + 6, this.cWisp);
        d.pixel(cx + 8, top + 8, this.cWisp);
        d.pixel(cx - 7, top + 12, this.cWisp);
        if (flare > 0.5) {
            d.pixel(cx - 9, top + 9, this.cWispHot);
            d.pixel(cx + 9, top + 4, this.cWispHot);
            d.pixel(cx + 7, top + 13, this.cWisp);
        }
        if (flare > 0.8) {
            // 爆散：更远的散逸粒子
            d.pixel(cx - 10, top + 3, this.cWispHot);
            d.pixel(cx + 10, top + 11, this.cWispHot);
            d.pixel(cx - 5, top - 1, this.cWisp);
        }
    }
}
