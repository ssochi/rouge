// ArcTwinGenerator —— 电弧双子：成对浮空的幽体，一蓝一紫镜像配色。
// 兜帽幽体 + 悬浮光核 + 飘散披风尾焰 + 电弧发射节点；两只之间由实体绘制一道折线闪电。
// 32×32，默认朝左（兜帽/双眼偏 -x）。variant='blue' | 'purple'；enrage 时红化抖动。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

const PALETTES = {
    blue: {
        coreHot: '#eaf6ff', core: '#8fd0ff', coreDim: '#3f8ad8',
        body: '90,150,220', bodyEdge: '52,104,178',
        eye: '#eaffff', arc: '#bfe8ff', arcHot: '#ffffff'
    },
    purple: {
        coreHot: '#f6eaff', core: '#c99cff', coreDim: '#7a44d8',
        body: '160,110,220', bodyEdge: '104,60,178',
        eye: '#f6eaff', arc: '#e6cfff', arcHot: '#ffffff'
    }
};

export class ArcTwinGenerator {
    constructor(variant = 'blue') {
        this.width = 32;
        this.height = 32;
        this.variant = variant;
        this.p = PALETTES[variant] || PALETTES.blue;
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bob=0]      悬浮升降像素
     * @param {number} [pose.flare=0.4]  披风尾焰扩张 0~1
     * @param {number} [pose.eyeGlow=0.5]双眼睁亮 0~1
     * @param {number} [pose.charge=0]   电弧蓄能 0~1（发射节点变亮 + 电火花）
     * @param {number} [pose.enrage=0]   狂暴红化 0~1
     * @param {number} [pose.lean=0]     横向漂移像素
     * @param {number} [pose.wisp=0]     尾焰摆动相位 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);
        const p = this.p;

        const bob = pose.bob || 0;
        const flare = pose.flare ?? 0.4;
        const eyeGlow = pose.eyeGlow ?? 0.5;
        const charge = pose.charge || 0;
        const enrage = pose.enrage || 0;
        const lean = pose.lean || 0;
        const wisp = pose.wisp || 0;

        const cx = 16 + lean;
        const cy = 15 + bob;

        // 悬浮投影（淡）
        d.ellipse(16, 29, 5, 2, 'rgba(0,0,0,0.22)');

        this.drawTail(d, cx, cy + 6, flare, wisp);
        this.drawCloak(d, cx, cy, flare);
        this.drawCore(d, cx, cy, charge);
        this.drawHead(d, cx, cy, eyeGlow);
        this.drawArcNode(d, cx, cy, charge);

        if (enrage > 0.05) this.drawEnrage(d, cx, cy, enrage);

        return d.getCanvas();
    }

    /** 半透兜帽披风：上窄下阔的幽体轮廓。 */
    drawCloak(d, cx, cy, flare) {
        const p = this.p;
        const spread = 6 + Math.round(flare * 3);
        d.fillPath([
            { x: cx - 4, y: cy - 6 },           // 兜帽顶前
            { x: cx + 4, y: cy - 6 },           // 兜帽顶后
            { x: cx + spread, y: cy + 6 },
            { x: cx + spread - 2, y: cy + 9 },
            { x: cx - spread + 2, y: cy + 9 },
            { x: cx - spread, y: cy + 6 }
        ], `rgba(${p.body},0.68)`);
        // 内层更实
        d.fillPath([
            { x: cx - 3, y: cy - 5 },
            { x: cx + 3, y: cy - 5 },
            { x: cx + spread - 3, y: cy + 6 },
            { x: cx - spread + 3, y: cy + 6 }
        ], `rgba(${p.body},0.85)`);
        // 边缘幽光描边
        d.pixel(cx - spread, cy + 6, `rgba(${p.bodyEdge},0.9)`);
        d.pixel(cx + spread, cy + 6, `rgba(${p.bodyEdge},0.9)`);
    }

    /** 悬浮光核（胸口能量球）。 */
    drawCore(d, cx, cy, charge) {
        const p = this.p;
        const r = 3;
        d.ellipse(cx, cy + 1, r, r, p.coreDim);
        d.ellipse(cx, cy + 1, r - 1, r - 1, p.core);
        d.pixel(cx, cy, p.coreHot);
        d.pixel(cx - 1, cy + 1, p.coreHot);
        if (charge > 0.4) {
            d.pixel(cx + 1, cy, p.coreHot);
            d.pixel(cx, cy + 2, p.coreHot);
        }
    }

    /** 兜帽头 + 双眼幽光（朝左）。 */
    drawHead(d, cx, cy, eyeGlow) {
        const p = this.p;
        // 兜帽内暗腔
        d.fillPath([
            { x: cx - 4, y: cy - 6 },
            { x: cx + 3, y: cy - 6 },
            { x: cx + 2, y: cy - 1 },
            { x: cx - 4, y: cy - 1 }
        ], `rgba(${p.bodyEdge},0.92)`);
        // 双眼（一大一小，朝左聚拢）
        const bright = eyeGlow > 0.5 ? p.coreHot : p.eye;
        d.rect(cx - 3, cy - 4, 2, 2, bright);
        d.pixel(cx, cy - 4, p.eye);
        d.pixel(cx, cy - 3, bright);
        if (eyeGlow > 0.7) {
            d.pixel(cx - 4, cy - 4, p.eye);
            d.pixel(cx - 3, cy - 5, p.eye);
        }
    }

    /** 电弧发射节点（体侧朝玩家一侧的亮结 + 蓄能火花）。 */
    drawArcNode(d, cx, cy, charge) {
        const p = this.p;
        const nx = cx - 6;
        const ny = cy;
        const col = charge > 0.5 ? p.arcHot : p.arc;
        d.pixel(nx, ny, col);
        d.pixel(nx - 1, ny, p.arc);
        d.pixel(nx, ny - 1, p.arc);
        if (charge > 0.3) {
            // 蓄能小火花
            const spark = Math.round(charge * 3);
            for (let i = 0; i < spark; i++) {
                const a = (i / spark) * Math.PI * 2;
                d.pixel(Math.round(nx + Math.cos(a) * 2), Math.round(ny + Math.sin(a) * 2), p.arcHot);
            }
        }
    }

    /** 飘散尾焰（幽体下摆的三缕摆动残焰）。 */
    drawTail(d, cx, top, flare, wisp) {
        const p = this.p;
        const roots = [-3, 0, 3];
        for (let r = 0; r < roots.length; r++) {
            const rootX = cx + roots[r];
            const len = 5 + Math.round(flare * 3) + (r % 2);
            for (let k = 0; k < len; k++) {
                const t = k / len;
                const swing = Math.sin(wisp * Math.PI * 2 + r * 1.1 + k * 0.4) * (1 + t * 2.5);
                const px = Math.round(rootX + swing);
                const py = top + k;
                const alpha = (0.7 * (1 - t)).toFixed(2);
                d.pixel(px, py, `rgba(${p.body},${alpha})`);
            }
        }
    }

    /** 狂暴红化：叠加红雾 + 眼芯灼红。 */
    drawEnrage(d, cx, cy, enrage) {
        const alpha = (0.15 + enrage * 0.35).toFixed(2);
        d.ellipse(cx, cy + 1, 7, 8, `rgba(255,60,50,${alpha})`);
        d.pixel(cx - 3, cy - 4, '#ff5a4a');
        d.pixel(cx - 2, cy - 4, '#ff5a4a');
        d.pixel(cx, cy - 4, '#ff8a70');
        d.pixel(cx, cy + 1, '#ffd0c0');
    }
}
