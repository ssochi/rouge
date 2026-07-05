// BurrowerGenerator —— 掘地虫：破土而出的节肢巨蛆。
// 分节甲壳身躯从地面拔起，头端一对开合大颚 + 红色复眼簇，体侧成排小足。
// 32×32，默认朝左（头颚偏 -x）。rear 控制拔起高度，burst 控制出土爆土。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

const TAU = Math.PI * 2;

export class BurrowerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 甲壳四阶（暗褐几丁质）
        this.cShell = '#5a4636';
        this.cShellDark = '#33261b';
        this.cShellLight = '#7d6349';
        this.cShellEdge = '#211710';
        // 腹节（苍白软肉）
        this.cBelly = '#b8a888';
        this.cBellyDark = '#8f7f60';
        // 大颚（骨白）
        this.cJaw = '#d8cbb0';
        this.cJawDark = '#8a7a5a';
        // 复眼（血红簇）
        this.cEye = '#ff3b2e';
        this.cEyeDark = '#a01810';
        this.cEyeShine = '#ffd0a0';
        // 内口腔灼光
        this.cMaw = '#ff8a3a';
        this.cMawHot = '#ffd08a';
        // 足
        this.cLeg = '#3a2c20';
        // 出土泥屑
        this.cDirt = '#6b573b';
        this.cDirtDark = '#463726';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.rear=1]      拔起高度 0(仅头)~1(全身直立)
     * @param {number} [pose.undulate=0]  体节波动相位 0~1
     * @param {number} [pose.mandible=0]  大颚开合 0(闭)~1(张)
     * @param {number} [pose.burst=0]     出土爆发 0~1（泥屑 + 上冲）
     * @param {number} [pose.glow=0.4]    口腔/复眼灼光 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const rear = pose.rear ?? 1;
        const undulate = pose.undulate || 0;
        const mandible = pose.mandible || 0;
        const burst = pose.burst || 0;
        const glow = pose.glow ?? 0.4;

        const baseX = 16;
        const groundY = 28;

        // 地面投影 + 出土泥堆
        d.ellipse(baseX, groundY + 1, 8, 2, 'rgba(0,0,0,0.30)');
        this.drawDirtMound(d, baseX, groundY, burst);

        // 分节身躯（自地面向上拔起，越高越细并左倾）
        const segCount = 6;
        const rise = 4 + rear * 18;
        const segs = [];
        for (let k = 0; k < segCount; k++) {
            const t = k / (segCount - 1);
            const sway = Math.sin(undulate * TAU + k * 0.9) * 2 * rear;
            const x = baseX - t * 4 * rear + sway - burst * 1.5;
            const y = groundY - t * rise;
            const r = 5.4 - t * 1.6;
            segs.push({ x, y, r });
        }

        // 体侧小足（先画，被甲壳压住根部）
        this.drawLegs(d, segs, undulate);
        // 甲壳节（自下而上）
        for (let k = 0; k < segCount; k++) this.drawSegment(d, segs[k], k, segCount);
        // 头端大颚 + 复眼 + 口腔
        this.drawHead(d, segs[segCount - 1], mandible, glow);

        // 出土泥屑飞溅
        if (burst > 0.05) this.drawDirtFling(d, baseX, groundY, burst);

        return d.getCanvas();
    }

    drawSegment(d, seg, k, total) {
        const t = k / (total - 1);
        // 背甲
        d.ellipse(Math.round(seg.x), Math.round(seg.y), Math.round(seg.r), Math.round(seg.r - 0.5), this.cShell);
        // 苍白腹侧（前/下缘）
        d.ellipse(Math.round(seg.x - seg.r * 0.4), Math.round(seg.y + 1), Math.round(seg.r - 2), Math.round(seg.r - 2.5), this.cBelly);
        // 背脊受光
        d.pixel(Math.round(seg.x - 1), Math.round(seg.y - seg.r + 1), this.cShellLight);
        d.pixel(Math.round(seg.x), Math.round(seg.y - seg.r + 1), this.cShellLight);
        // 节缝暗环
        d.hLine(Math.round(seg.x - seg.r + 1), Math.round(seg.y + seg.r - 1), Math.round(seg.r * 2 - 2), this.cShellDark);
        // 侧缘暗描边
        d.pixel(Math.round(seg.x + seg.r - 1), Math.round(seg.y), this.cShellEdge);
    }

    drawLegs(d, segs, undulate) {
        // 除头节外每节一对短足，交替抬落
        for (let k = 0; k < segs.length - 1; k++) {
            const seg = segs[k];
            const swing = Math.sin(undulate * TAU + k * 1.3);
            const dy = Math.round(swing);
            // 左足（-x）
            d.pixel(Math.round(seg.x - seg.r - 1), Math.round(seg.y + dy), this.cLeg);
            d.pixel(Math.round(seg.x - seg.r - 2), Math.round(seg.y + dy + 1), this.cLeg);
            // 右足（+x）反相
            d.pixel(Math.round(seg.x + seg.r), Math.round(seg.y - dy), this.cLeg);
            d.pixel(Math.round(seg.x + seg.r + 1), Math.round(seg.y - dy + 1), this.cLeg);
        }
    }

    drawHead(d, head, mandible, glow) {
        const hx = Math.round(head.x);
        const hy = Math.round(head.y);
        // 头壳（略大）
        d.ellipse(hx, hy, 5, 4, this.cShell);
        d.ellipse(hx - 1, hy - 1, 3, 2, this.cShellLight);
        // 复眼簇（前额，朝左）
        const eyeCol = glow > 0.5 ? this.cEye : this.cEyeDark;
        d.rect(hx - 4, hy - 2, 2, 2, eyeCol);
        d.pixel(hx - 3, hy, eyeCol);
        d.pixel(hx - 2, hy - 2, this.cEyeShine);
        d.pixel(hx - 4, hy + 1, this.cEyeDark);
        // 口腔灼光（张颚时透出）
        if (mandible > 0.2) {
            const mawCol = glow > 0.5 ? this.cMawHot : this.cMaw;
            d.rect(hx - 6, hy + 1, 3, 2, this.cShellEdge);
            d.pixel(hx - 5, hy + 1, mawCol);
            d.pixel(hx - 5, hy + 2, this.cMaw);
        }
        // 一对大颚（钳形，随 mandible 张开）
        const open = Math.round(mandible * 3);
        // 上颚
        d.fillPath([
            { x: hx - 4, y: hy - 1 },
            { x: hx - 9, y: hy - 2 - open },
            { x: hx - 8, y: hy - open },
            { x: hx - 4, y: hy }
        ], this.cJaw);
        d.pixel(hx - 8, hy - 1 - open, this.cJawDark);
        // 下颚
        d.fillPath([
            { x: hx - 4, y: hy + 2 },
            { x: hx - 9, y: hy + 3 + open },
            { x: hx - 8, y: hy + 1 + open },
            { x: hx - 4, y: hy + 1 }
        ], this.cJaw);
        d.pixel(hx - 8, hy + 2 + open, this.cJawDark);
    }

    /** 地面出土泥堆（burst 越大越隆起）。 */
    drawDirtMound(d, cx, groundY, burst) {
        const w = 8 + Math.round(burst * 3);
        const h = 2 + Math.round(burst * 2);
        d.ellipse(cx, groundY + 1, w, h, this.cDirtDark);
        d.ellipse(cx, groundY, w - 2, h - 1, this.cDirt);
    }

    /** 出土瞬间的泥屑飞溅（放射短线/点）。 */
    drawDirtFling(d, cx, groundY, burst) {
        const n = Math.round(burst * 8);
        for (let i = 0; i < n; i++) {
            const a = Math.PI + (i / Math.max(1, n)) * Math.PI - 0.2; // 上半圈
            const dist = 4 + burst * 8 + (i % 3) * 2;
            const px = Math.round(cx + Math.cos(a) * dist);
            const py = Math.round(groundY - Math.abs(Math.sin(a)) * dist * 0.8);
            d.pixel(px, py, i % 2 ? this.cDirt : this.cDirtDark);
        }
    }
}
