// LobberGenerator —— 地牢投弹手（矮壮皮甲兵：背炸弹桶（引线束/警示标）+ 腰挂弹球串 + 全身联动掷弹 + 引线火花走线）。
// 32×32，默认朝左。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class LobberGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 身体与皮甲（四阶）
        this.cSkin = '#b5906a';
        this.cSkinShadow = '#8f6e4e';
        this.cSkinLight = '#ceac82';
        this.cLeather = '#6e4a2a';
        this.cLeatherDark = '#523620';
        this.cLeatherLight = '#8c6138';
        this.cLeatherEdge = '#392513';
        this.cHood = '#4a4038';
        this.cHoodDark = '#322b25';
        this.cEye = '#ffd23e';
        this.cStrap = '#463625';
        this.cBuckle = '#c9a227';
        // 炸弹
        this.cBomb = '#33333e';
        this.cBombLight = '#565662';
        this.cBombDark = '#20202a';
        this.cFuse = '#c9a227';
        this.cSpark = '#ff8a3c';
        this.cSparkHot = '#ffe0a0';
        // 背桶
        this.cBarrel = '#7c5c34';
        this.cBarrelDark = '#5a4224';
        this.cBarrelLight = '#96703f';
        this.cHoop = '#4a4a56';
        this.cWarn = '#d8402e';
        this.cWarnStripe = '#f0c838';
        // 靴
        this.cBoots = '#3a3028';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降（呼吸/下蹲蓄力，正值下蹲）
     * @param {number} [pose.legFrame=0] 步行相位 0~3
     * @param {number} [pose.armPhase=0] 抡臂 0~1（0 腰间持弹 → 1 过肩释放）
     * @param {number} [pose.sparkTravel=0] 引线火花沿线位置 0~1（0=近弹身 1=线端）
     * @param {number} [pose.lean=0] 前倾
     * @param {number} [pose.twist=0] 拧腰（上身前送像素，掷弹发力）
     * @param {number} [pose.tossBall=-1] idle 抛接弹球高度（>=0 显示，值=上抛高度 0~1；<0 隐藏）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const legFrame = pose.legFrame || 0;
        const armPhase = pose.armPhase || 0;
        const sparkTravel = pose.sparkTravel == null ? 0 : pose.sparkTravel;
        const lean = pose.lean || 0;
        const twist = pose.twist || 0;
        const tossBall = pose.tossBall == null ? -1 : pose.tossBall;

        const cx = 16 - lean;
        const bodyTop = 15 + squash;

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.3)');

        this.drawBackBarrel(d, cx, bodyTop);
        this.drawLegs(d, cx, legFrame);
        this.drawBody(d, cx, bodyTop, twist);
        this.drawHead(d, cx - Math.round(twist * 0.5), bodyTop - 5);
        // idle 抛接模式（tossBall>=0）：手中不另握弹，只演示被抛接的那一颗
        this.drawThrowArm(d, cx, bodyTop, armPhase, sparkTravel, twist, tossBall < 0);
        if (tossBall >= 0) this.drawTossBall(d, cx, bodyTop, tossBall);

        return d.getCanvas();
    }

    /** 背后炸弹桶：木桶 + 铁箍 + 顶部引线束 + 侧面警示标。 */
    drawBackBarrel(d, cx, bodyTop) {
        const bx = cx + 3;
        const by = bodyTop - 5;
        // 桶身
        d.rect(bx, by, 6, 11, this.cBarrel);
        d.vLine(bx, by, 11, this.cBarrelLight);
        d.vLine(bx + 5, by, 11, this.cBarrelDark);
        // 铁箍
        d.hLine(bx, by + 2, 6, this.cHoop);
        d.hLine(bx, by + 6, 6, this.cHoop);
        d.hLine(bx, by + 9, 6, this.cHoop);
        // 侧面警示标（红底黄纹）
        d.rect(bx + 1, by + 3, 3, 3, this.cWarn);
        d.pixel(bx + 2, by + 4, this.cWarnStripe);
        d.pixel(bx + 1, by + 3, this.cWarnStripe);
        d.pixel(bx + 3, by + 5, this.cWarnStripe);
        // 顶部引线束（多根卷曲引线）
        d.pixel(bx + 1, by - 1, this.cFuse);
        d.pixel(bx + 2, by - 2, this.cFuse);
        d.pixel(bx + 4, by - 1, this.cFuse);
        d.pixel(bx + 4, by - 2, this.cFuse);
        d.pixel(bx + 3, by - 3, this.cFuse);
        // 顶露弹球
        d.rect(bx + 2, by - 2, 2, 2, this.cBomb);
        d.pixel(bx + 2, by - 2, this.cBombLight);
    }

    /** 矮壮短腿步行。 */
    drawLegs(d, cx, legFrame) {
        const phase = Math.floor(legFrame) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        d.rect(cx - 4, 25 + leftLift, 3, 4 - leftLift, this.cBoots);
        d.rect(cx + 1, 25 + rightLift, 3, 4 - rightLift, this.cBoots);
        d.hLine(cx - 4, 28, 3, this.cLeatherEdge);
        d.hLine(cx + 1, 28, 3, this.cLeatherEdge);
    }

    /** 矮壮皮甲躯干 + 斜背带 + 腰带 + 腰挂弹球串。twist 让上身前送。 */
    drawBody(d, cx, top, twist) {
        const tx = -Math.round(twist); // 上身随拧腰前送
        // 躯干
        d.rect(cx - 6 + tx, top, 9, 10, this.cLeather);
        d.hLine(cx - 6 + tx, top, 9, this.cLeatherLight);
        d.vLine(cx - 6 + tx, top, 10, this.cLeatherLight);
        d.vLine(cx + 2 + tx, top + 1, 9, this.cLeatherDark);
        // 胸甲片高光
        d.hLine(cx - 4 + tx, top + 2, 5, this.cLeatherLight);
        // 斜背带（连背桶）
        for (let i = 0; i < 7; i++) {
            d.pixel(cx - 4 + tx + i, top + 1 + i, this.cStrap);
        }
        // 腰带 + 铜扣
        d.hLine(cx - 6 + tx, top + 7, 9, this.cLeatherDark);
        d.pixel(cx - 2 + tx, top + 7, this.cBuckle);

        // 腰挂弹球串（三颗小弹球垂于腰前）
        const beltY = top + 9;
        for (let k = 0; k < 3; k++) {
            const bx2 = cx - 5 + tx + k * 3;
            d.pixel(bx2, beltY, this.cStrap);          // 挂绳
            d.rect(bx2 - 1, beltY + 1, 2, 2, this.cBomb);
            d.pixel(bx2 - 1, beltY + 1, this.cBombLight);
            d.pixel(bx2, beltY, this.cFuse);            // 小引线
        }
    }

    /** 兜帽圆脸：独眼亮黄 + 络腮阴影。 */
    drawHead(d, cx, cy) {
        // 兜帽
        d.rect(cx - 6, cy - 4, 8, 6, this.cHood);
        d.hLine(cx - 6, cy - 4, 8, this.cLeatherLight);
        d.vLine(cx + 1, cy - 3, 5, this.cHoodDark);
        d.pixel(cx - 2, cy - 5, this.cHood);           // 帽尖
        // 脸（朝左露出）
        d.rect(cx - 6, cy, 5, 3, this.cSkin);
        d.hLine(cx - 6, cy, 5, this.cSkinLight);
        d.pixel(cx - 6, cy + 2, this.cSkinShadow);
        d.hLine(cx - 5, cy + 3, 3, this.cSkinShadow); // 络腮/下颌阴影
        // 独眼
        d.pixel(cx - 5, cy + 1, this.cEye);
        d.pixel(cx - 4, cy + 1, this.cEye);
        d.pixel(cx - 3, cy + 1, this.cHoodDark);       // 眼线
    }

    /** 投掷臂 + 手中炸弹：腰间持弹（armPhase 0）→ 抡臂过肩（1）。引线火花沿线走位。holdBomb=false 时空手。 */
    drawThrowArm(d, cx, bodyTop, armPhase, sparkTravel, twist, holdBomb = true) {
        const tx = -Math.round(twist);
        // 肩点
        const shX = cx - 5 + tx;
        const shY = bodyTop + 2;
        // 手沿圆弧：腰间前下 → 过肩后上
        const a = armPhase;
        const handX = Math.round(cx - 7 + tx + a * 10);   // 前下 → 后上（向右后）
        const handY = Math.round(bodyTop + 6 - a * 14);
        // 上臂
        this.drawLimb(d, shX, shY, handX, handY, this.cLeather, this.cLeatherDark);
        // 手
        d.rect(handX - 1, handY, 2, 2, this.cSkin);
        d.pixel(handX - 1, handY, this.cSkinLight);

        // 手中炸弹（未释放时握持，armPhase<0.95；idle 抛接时空手不画）
        if (holdBomb && armPhase < 0.95) {
            const bx = handX - 1, by = handY - 3;
            d.rect(bx, by, 3, 3, this.cBomb);
            d.pixel(bx, by, this.cBombLight);
            d.pixel(bx + 2, by + 2, this.cBombDark);
            // 引线（从弹顶卷出）
            const fuseLen = 4;
            const fx0 = bx + 1, fy0 = by - 1;
            for (let k = 0; k < fuseLen; k++) {
                d.pixel(fx0 + (k % 2), fy0 - k, this.cFuse);
            }
            // 火花沿引线走位
            const sp = Math.round(sparkTravel * (fuseLen - 1));
            d.pixel(fx0 + (sp % 2), fy0 - sp, this.cSparkHot);
            d.pixel(fx0 + (sp % 2) + 1, fy0 - sp, this.cSpark);
        }
    }

    /** idle 抛接的弹球：悬于前手上方，随 tossBall 上下（抛物线）。 */
    drawTossBall(d, cx, bodyTop, h) {
        const arc = Math.sin(h * Math.PI); // 0→1→0 上抛下落
        const bx = cx - 7;
        const by = Math.round(bodyTop + 3 - arc * 8);
        d.rect(bx, by, 3, 3, this.cBomb);
        d.pixel(bx, by, this.cBombLight);
        d.pixel(bx + 2, by + 2, this.cBombDark);
        // 引线火星
        d.pixel(bx + 1, by - 1, this.cFuse);
        d.pixel(bx + 1, by - 2, this.cSpark);
    }

    /** 打点式短肢（起点→终点，带明暗两色）。 */
    drawLimb(d, x0, y0, x1, y1, col, colDark) {
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(x0 + (x1 - x0) * t);
            const y = Math.round(y0 + (y1 - y0) * t);
            d.pixel(x, y, col);
            d.pixel(x, y + 1, colDark);
        }
    }
}
