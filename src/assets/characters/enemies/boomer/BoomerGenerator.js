// BoomerGenerator —— 地牢自爆蜂（臃肿绿色爆虫：鼓胀身躯+短腿疾走+引信红闪）。
// 32×32，默认朝左。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class BoomerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        this.cBody = '#7fa653';
        this.cBodyDark = '#5d7a3c';
        this.cBodyLight = '#a3c96e';
        this.cBelly = '#c3d98a';
        this.cPustule = '#e4f0a8';
        this.cPustuleHot = '#f8ffd0';
        this.cMouth = '#3a2530';
        this.cTeeth = '#e8e4c8';
        this.cEye = '#ffd23e';
        this.cLeg = '#4a5f32';
        this.cWarn = '#ff5040';
        this.cWarnBright = '#ff8a70';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.squash=0] 呼吸/落地压缩（正值变矮胖）
     * @param {number} [pose.wobble=0] 身体顶部横向摆（-2..2）
     * @param {number} [pose.legFrame=0] 短腿疾走相位（0..5）
     * @param {number} [pose.bloat=0] 引信膨胀 0~1（身体放大）
     * @param {number} [pose.redFlash=0] 自爆预警红闪强度 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.squash || 0;
        const wobble = pose.wobble || 0;
        const legFrame = pose.legFrame || 0;
        const bloat = pose.bloat || 0;
        const redFlash = pose.redFlash || 0;

        const cx = 16;
        const grow = Math.round(bloat * 2); // 膨胀半径增量

        d.ellipse(cx, 29, 9 + grow, 3, 'rgba(0,0,0,0.3)');

        this.drawLegs(d, cx, legFrame);
        this.drawBody(d, cx, squash, wobble, grow, redFlash);

        return d.getCanvas();
    }

    /** 六条短腿疾走（三对交替）。 */
    drawLegs(d, cx, legFrame) {
        const pairs = [
            { x: cx - 7, phase: 0 },
            { x: cx - 1, phase: 2 },
            { x: cx + 5, phase: 4 }
        ];
        for (const p of pairs) {
            const step = (legFrame + p.phase) % 6;
            const lift = step < 3 ? 0 : -1;
            d.rect(p.x, 26 + lift, 2, 3 - lift, this.cLeg);
            d.rect(p.x + 2, 26 - lift, 2, 3 + lift, this.cLeg);
        }
    }

    /** 鼓胀身躯：主体椭圆 + 亮腹 + 脓包 + 眼/嘴 + 红闪。 */
    drawBody(d, cx, squash, wobble, grow, redFlash) {
        const top = 10 + squash - grow;
        const bottom = 27;
        const halfW = 9 + grow;
        const midY = Math.floor((top + bottom) / 2);

        // 主体（上宽下略收的胖圆）
        d.fillPath([
            { x: cx + wobble, y: top },
            { x: cx + halfW - 1 + wobble, y: top + 4 },
            { x: cx + halfW, y: midY },
            { x: cx + halfW - 2, y: bottom },
            { x: cx - halfW + 2, y: bottom },
            { x: cx - halfW, y: midY },
            { x: cx - halfW + 1 + wobble, y: top + 4 }
        ], this.cBody);

        // 顶部受光 / 右侧压暗
        d.hLine(cx - 4 + wobble, top, 8, this.cBodyLight);
        d.hLine(cx - 5 + wobble, top + 1, 4, this.cBodyLight);
        d.vLine(cx + halfW - 1, midY - 2, bottom - midY, this.cBodyDark);
        d.vLine(cx + halfW - 2, midY, bottom - midY - 1, this.cBodyDark);

        // 亮色鼓腹
        d.ellipse(cx - 2, midY + 3, 5, 4, this.cBelly);

        // 脓包（膨胀时变亮）
        const pustuleColor = grow > 0 ? this.cPustuleHot : this.cPustule;
        d.rect(cx + 3, top + 5, 2, 2, pustuleColor);
        d.rect(cx - 6, midY - 1, 2, 2, pustuleColor);
        d.pixel(cx + 5, midY + 4, pustuleColor);
        d.pixel(cx - 3, top + 4, pustuleColor);

        // 眼（朝左，愤怒小眼）
        d.pixel(cx - 7, top + 5, this.cEye);
        d.pixel(cx - 3, top + 5, this.cEye);
        d.pixel(cx - 7, top + 4, this.cBodyDark);
        d.pixel(cx - 3, top + 4, this.cBodyDark);

        // 咧嘴（朝左侧面大嘴）
        d.hLine(cx - 8, top + 8, 6, this.cMouth);
        d.hLine(cx - 8, top + 9, 5, this.cMouth);
        d.pixel(cx - 7, top + 8, this.cTeeth);
        d.pixel(cx - 5, top + 9, this.cTeeth);

        // 自爆预警红闪：身体覆盖红色像素网
        if (redFlash > 0.05) {
            const alpha = Math.min(0.85, 0.25 + redFlash * 0.6);
            const warn = redFlash > 0.7 ? this.cWarnBright : this.cWarn;
            const overlay = `rgba(${redFlash > 0.7 ? '255,138,112' : '255,80,64'},${alpha.toFixed(2)})`;
            d.ellipse(cx, midY, halfW - 1, Math.floor((bottom - top) / 2), overlay);
            // 裂纹发光
            d.pixel(cx + 2, midY - 2, warn);
            d.pixel(cx + 3, midY - 1, warn);
            d.pixel(cx - 4, midY + 2, warn);
            d.pixel(cx - 5, midY + 3, warn);
        }
    }
}
