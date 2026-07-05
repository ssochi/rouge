// FlailWardenGenerator —— 地牢链枷狱卒（重甲 + 逐节链枷 + 棘刺铁球，挥舞时铁球沿完整圆弧绕体，盔缝红光）。
// 32×32，默认朝左；重甲盖腿，攻击时铁球环绕身体扫击。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class FlailWardenGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 重甲（四阶）
        this.cArmor = '#4a5058';
        this.cArmorDark = '#31363d';
        this.cArmorLight = '#676e78';
        this.cArmorEdge = '#22262b';
        // 青铜滚边
        this.cTrim = '#7a5a2a';
        this.cTrimLight = '#a8813f';
        this.cTrimDark = '#54401d';
        // 面甲与红光
        this.cVisor = '#14161a';
        this.cEye = '#ff5030';
        this.cEyeHot = '#ffb060';
        // 链条（逐节，明暗交替）
        this.cChain = '#6b7079';
        this.cChainDark = '#43474e';
        this.cChainLight = '#888d97';
        // 铁球棘刺
        this.cBall = '#3a3e45';
        this.cBallDark = '#23262b';
        this.cBallLight = '#5c626c';
        this.cSpike = '#9aa0aa';
        this.cSpikeDark = '#6a707a';
        // 腿
        this.cLeg = '#363c43';
        this.cLegDark = '#23282d';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降
     * @param {number} [pose.legFrame=0] 步态相位 0~3
     * @param {number} [pose.flailAngle=2.4] 铁球相对身体中心角度（弧度，绕体环绕）
     * @param {number} [pose.flailRadius=9] 铁球环绕半径
     * @param {number} [pose.tension=0] 蓄力张力 0~1（盔眼/甲缝发光）
     * @param {number} [pose.twist=0] 蓄力身体拧转（上身+持械肩偏移 px）
     * @param {number} [pose.ballDrag=0] 铁球拖地 0~1（行走/垂放时贴地拖痕）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const legFrame = pose.legFrame || 0;
        const flailAngle = pose.flailAngle == null ? 2.4 : pose.flailAngle;
        const flailRadius = pose.flailRadius == null ? 9 : pose.flailRadius;
        const tension = pose.tension || 0;
        const twist = pose.twist || 0;
        const ballDrag = pose.ballDrag || 0;

        const cx = 16;
        const bodyTop = 12 + squash;

        d.ellipse(16, 29, 9, 3, 'rgba(0,0,0,0.32)');

        this.drawLegs(d, cx, legFrame);
        this.drawBody(d, cx, bodyTop, tension, twist);
        this.drawHead(d, cx - Math.round(twist * 0.5), bodyTop - 6, tension);
        this.drawFlail(d, cx, bodyTop, flailAngle, flailRadius, tension, twist, ballDrag);

        return d.getCanvas();
    }

    /** 铁靴重步交替。 */
    drawLegs(d, cx, legFrame) {
        const phase = Math.floor(legFrame) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        d.rect(cx - 5, 24 + leftLift, 3, 5, this.cLeg);
        d.rect(cx + 2, 24 + rightLift, 3, 5, this.cLeg);
        d.vLine(cx - 5, 24 + leftLift, 5, this.cLegDark);
        d.vLine(cx + 2, 24 + rightLift, 5, this.cLegDark);
        d.hLine(cx - 5, 28, 3, this.cArmorDark);
        d.hLine(cx + 2, 28, 3, this.cArmorDark);
    }

    /** 重甲躯干：宽厚胸板 + 双肩甲 + 青铜束带铆钉。twist 使上身前送。 */
    drawBody(d, cx, top, tension, twist) {
        const tx = -Math.round(twist);
        // 胸甲主体
        d.fillPath([
            { x: cx - 6 + tx, y: top + 2 },
            { x: cx - 7 + tx, y: top },
            { x: cx + 7 + tx, y: top },
            { x: cx + 6 + tx, y: top + 2 },
            { x: cx + 7 + tx, y: top + 13 },
            { x: cx - 7 + tx, y: top + 13 }
        ], this.cArmor);
        // 顶缘受光 / 侧明暗
        d.hLine(cx - 6 + tx, top, 13, this.cArmorLight);
        d.vLine(cx - 6 + tx, top + 1, 12, this.cArmorLight);
        d.vLine(cx + 6 + tx, top + 1, 12, this.cArmorDark);
        // 胸甲中脊
        d.vLine(cx + tx, top + 1, 12, this.cArmorLight);
        // 青铜束带 + 铆钉
        d.hLine(cx - 5 + tx, top + 6, 11, this.cTrim);
        d.hLine(cx - 5 + tx, top + 5, 11, this.cTrimLight);
        d.pixel(cx - 4 + tx, top + 6, this.cTrimDark);
        d.pixel(cx + 3 + tx, top + 6, this.cTrimDark);
        // 胸甲铆钉
        d.pixel(cx - 4 + tx, top + 3, this.cArmorLight);
        d.pixel(cx + 3 + tx, top + 3, this.cArmorLight);
        d.pixel(cx - 4 + tx, top + 10, this.cArmorEdge);
        d.pixel(cx + 3 + tx, top + 10, this.cArmorEdge);

        // 双肩甲（圆弧片）
        d.fillPath([
            { x: cx - 8 + tx, y: top + 1 },
            { x: cx - 5 + tx, y: top - 1 },
            { x: cx - 4 + tx, y: top + 3 },
            { x: cx - 8 + tx, y: top + 3 }
        ], this.cArmorLight);
        d.fillPath([
            { x: cx + 8 + tx, y: top + 1 },
            { x: cx + 5 + tx, y: top - 1 },
            { x: cx + 4 + tx, y: top + 3 },
            { x: cx + 8 + tx, y: top + 3 }
        ], this.cArmor);
        d.pixel(cx + 7 + tx, top + 2, this.cArmorDark);

        // 蓄力时甲缝透红
        if (tension > 0.4) {
            d.pixel(cx + tx, top + 8, this.cEye);
            d.pixel(cx - 2 + tx, top + 10, this.cEye);
            if (tension > 0.7) d.pixel(cx + 2 + tx, top + 9, this.cEyeHot);
        }
    }

    /** 桶盔：面甲横缝 + 双点红光眼 + 盔顶脊。tension 越高红光越盛。 */
    drawHead(d, cx, cy, tension) {
        d.rect(cx - 4, cy - 1, 8, 7, this.cArmor);
        d.hLine(cx - 4, cy - 1, 8, this.cArmorLight);
        d.vLine(cx - 4, cy - 1, 7, this.cArmorLight);
        d.vLine(cx + 3, cy, 6, this.cArmorDark);
        // 盔顶脊 + 青铜冠
        d.hLine(cx - 1, cy - 2, 3, this.cTrim);
        d.pixel(cx, cy - 3, this.cTrimLight);
        // 面甲横缝
        d.rect(cx - 4, cy + 2, 8, 2, this.cVisor);
        // 竖向透气条
        d.pixel(cx - 1, cy + 4, this.cVisor);
        d.pixel(cx + 1, cy + 4, this.cVisor);
        // 双点红光眼（随 tension 增亮）
        const eye = tension > 0.5 ? this.cEyeHot : this.cEye;
        d.pixel(cx - 2, cy + 2, eye);
        d.pixel(cx - 1, cy + 3, this.cEye);
        d.pixel(cx + 1, cy + 2, tension > 0.3 ? this.cEye : this.cVisor);
        if (tension > 0.7) {
            d.pixel(cx - 3, cy + 2, this.cEye); // 红光外溢
            d.pixel(cx + 2, cy + 3, this.cEye);
        }
    }

    /** 链枷：持握护手 → 逐节链条 → 棘刺铁球（角度/半径决定铁球绕体位置）。ballDrag 时铁球贴地。 */
    drawFlail(d, cx, bodyTop, angle, radius, tension, twist, ballDrag) {
        const tx = -Math.round(twist);
        const handX = cx - 6 + tx;
        const handY = bodyTop + 5;
        // 持械护手
        d.rect(handX - 1, handY, 3, 3, this.cArmorDark);
        d.hLine(handX - 1, handY, 3, this.cArmorLight);
        d.pixel(handX, handY + 1, this.cTrim);

        // 铁球位置：绕身体中心（椭圆透视），拖地时压到地面高度
        const centerX = cx;
        const centerY = bodyTop + 2;
        let ballX = Math.round(centerX + Math.cos(angle) * radius);
        let ballY = Math.round(centerY + Math.sin(angle) * radius * 0.7);
        if (ballDrag > 0.05) {
            // 拖地：铁球落到地面附近，X 略滞后（拖曳）
            ballY = Math.round(ballY + ballDrag * (27 - ballY));
            ballX = ballX + Math.round(ballDrag * 2);
        }

        // -- 逐节链条（手 → 铁球，交替横竖链节 + 明暗）--
        const links = 6;
        for (let i = 1; i < links; i++) {
            const t = i / links;
            const lx = Math.round(handX + (ballX - handX) * t);
            const ly = Math.round(handY + (ballY - handY) * t);
            if (i % 2 === 0) {
                // 横链节
                d.hLine(lx, ly, 2, this.cChain);
                d.pixel(lx, ly, this.cChainLight);
            } else {
                // 竖链节
                d.vLine(lx, ly, 2, this.cChainDark);
                d.pixel(lx, ly, this.cChain);
            }
        }

        // -- 棘刺铁球（球体 + 八向棘刺 + 受光）--
        // 棘刺（先画在球后）
        const spikes = [
            [0, -4], [0, 4], [-4, 0], [4, 0],
            [-3, -3], [3, -3], [-3, 3], [3, 3]
        ];
        for (const [sxo, syo] of spikes) {
            const sx = ballX + Math.sign(sxo) * (Math.abs(sxo) > 0 ? 1 : 0);
            const sy = ballY + Math.sign(syo) * (Math.abs(syo) > 0 ? 1 : 0);
            const tipX = ballX + Math.round(sxo * 0.75);
            const tipY = ballY + Math.round(syo * 0.75);
            // 棘刺主体（受光侧亮）
            const spikeCol = (sxo <= 0 && syo <= 0) ? this.cSpike : this.cSpikeDark;
            d.pixel(tipX, tipY, spikeCol);
            d.pixel(sx, sy, spikeCol);
        }
        // 球核（3x3 + 四角）
        d.rect(ballX - 1, ballY - 1, 3, 3, this.cBall);
        d.pixel(ballX - 2, ballY, this.cBall);
        d.pixel(ballX + 2, ballY, this.cBallDark);
        d.pixel(ballX, ballY - 2, this.cBall);
        d.pixel(ballX, ballY + 2, this.cBallDark);
        // 受光高光（左上）
        d.pixel(ballX - 1, ballY - 1, this.cBallLight);
        d.pixel(ballX + 1, ballY + 1, this.cBallDark);

        // 高速拖影（张力大时铁球尾迹）
        if (tension > 0.6 && ballDrag < 0.1) {
            const tX = Math.round(centerX + Math.cos(angle - 0.6) * radius);
            const tY = Math.round(centerY + Math.sin(angle - 0.6) * radius * 0.7);
            d.pixel(tX, tY, this.cChainLight);
            const t2X = Math.round(centerX + Math.cos(angle - 1.1) * radius);
            const t2Y = Math.round(centerY + Math.sin(angle - 1.1) * radius * 0.7);
            d.pixel(t2X, t2Y, this.cChainDark);
        }

        // 拖地火星尘（铁球磨地）
        if (ballDrag > 0.5) {
            d.pixel(ballX - 2, ballY + 2, this.cEyeHot);
            d.pixel(ballX + 2, ballY + 1, this.cTrimLight);
        }
    }
}
