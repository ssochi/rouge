// FlailWardenGenerator —— 地牢链枷狱卒（重甲 + 铁球链枷，横扫时链球绕体）。
// 32×32，默认朝左；长袍/重甲盖腿，攻击时铁球沿身体环绕。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class FlailWardenGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        this.cArmor = '#4a5058';
        this.cArmorDark = '#31363d';
        this.cArmorLight = '#666d77';
        this.cTrim = '#7a5a2a';
        this.cVisor = '#1b1e22';
        this.cEye = '#ff7a3a';
        this.cChain = '#6a6f78';
        this.cChainDark = '#43474e';
        this.cBall = '#3a3e45';
        this.cBallLight = '#5b616b';
        this.cSpike = '#8a909a';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降
     * @param {number} [pose.legFrame=0] 步态相位 0~3
     * @param {number} [pose.flailAngle=1.9] 链球相对身体中心的角度（弧度，绕体环绕）
     * @param {number} [pose.flailRadius=9] 链球环绕半径
     * @param {number} [pose.tension=0] 蓄力张力 0~1（护甲/眼发光）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const legFrame = pose.legFrame || 0;
        const flailAngle = pose.flailAngle == null ? 1.9 : pose.flailAngle;
        const flailRadius = pose.flailRadius == null ? 9 : pose.flailRadius;
        const tension = pose.tension || 0;

        const cx = 16;
        const bodyTop = 12 + squash;

        d.ellipse(16, 29, 9, 3, 'rgba(0,0,0,0.32)');

        this.drawLegs(d, cx, legFrame);
        this.drawBody(d, cx, bodyTop, tension);
        this.drawHead(d, cx, bodyTop - 6, tension);
        this.drawFlail(d, cx, bodyTop + 4, flailAngle, flailRadius, tension);

        return d.getCanvas();
    }

    drawLegs(d, cx, legFrame) {
        const phase = Math.floor(legFrame) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        d.rect(cx - 5, 24 + leftLift, 3, 5, this.cArmorDark);
        d.rect(cx + 2, 24 + rightLift, 3, 5, this.cArmorDark);
        d.hLine(cx - 5, 28, 3, this.cArmor);
        d.hLine(cx + 2, 28, 3, this.cArmor);
    }

    /** 重甲躯干（宽厚胸板 + 肩甲）。 */
    drawBody(d, cx, top, tension) {
        d.fillPath([
            { x: cx - 6, y: top + 2 },
            { x: cx - 7, y: top },
            { x: cx + 7, y: top },
            { x: cx + 6, y: top + 2 },
            { x: cx + 7, y: top + 13 },
            { x: cx - 7, y: top + 13 }
        ], this.cArmor);
        // 肩甲高光 / 侧暗
        d.hLine(cx - 6, top, 13, this.cArmorLight);
        d.vLine(cx + 6, top + 1, 12, this.cArmorDark);
        d.vLine(cx - 6, top + 1, 12, this.cArmorLight);
        // 胸甲铆钉与束带
        d.hLine(cx - 4, top + 6, 9, this.cTrim);
        d.pixel(cx - 4, top + 3, this.cArmorLight);
        d.pixel(cx + 3, top + 3, this.cArmorLight);
        // 蓄力时甲缝透红
        if (tension > 0.4) {
            d.pixel(cx, top + 6, this.cEye);
            d.pixel(cx - 2, top + 9, this.cEye);
        }
    }

    /** 桶盔（横缝面甲 + 独条红光眼）。 */
    drawHead(d, cx, cy, tension) {
        d.rect(cx - 4, cy - 1, 8, 7, this.cArmor);
        d.hLine(cx - 4, cy - 1, 8, this.cArmorLight);
        d.vLine(cx + 3, cy, 6, this.cArmorDark);
        // 面甲横缝
        d.rect(cx - 4, cy + 2, 8, 2, this.cVisor);
        const eye = tension > 0.3 ? this.cEye : '#c85028';
        d.pixel(cx - 2, cy + 2, eye);
        d.pixel(cx - 1, cy + 2, eye);
        // 盔顶脊
        d.pixel(cx - 1, cy - 2, this.cTrim);
        d.pixel(cx, cy - 2, this.cTrim);
    }

    /** 链枷：从持握手引出链条至铁球（角度/半径决定铁球环绕位置）。 */
    drawFlail(d, cx, handY, angle, radius, tension) {
        const handX = cx - 6;
        // 持握护手
        d.rect(handX - 1, handY, 3, 3, this.cArmorDark);

        // 铁球位置（绕身体中心环绕，椭圆透视）
        const centerX = cx;
        const centerY = handY - 3;
        const ballX = Math.round(centerX + Math.cos(angle) * radius);
        const ballY = Math.round(centerY + Math.sin(angle) * radius * 0.7);

        // 链条：手 → 铁球（等分打点）
        const links = 5;
        for (let i = 1; i < links; i++) {
            const t = i / links;
            const lx = Math.round(handX + (ballX - handX) * t);
            const ly = Math.round(handY + (ballY - handY) * t);
            d.pixel(lx, ly, i % 2 === 0 ? this.cChain : this.cChainDark);
        }

        // 铁球 + 尖刺
        d.rect(ballX - 2, ballY - 2, 5, 5, this.cBall);
        d.pixel(ballX - 1, ballY - 1, this.cBallLight);
        d.pixel(ballX - 2, ballY - 3, this.cSpike);
        d.pixel(ballX + 3, ballY - 1, this.cSpike);
        d.pixel(ballX, ballY + 3, this.cSpike);
        d.pixel(ballX - 3, ballY + 1, this.cSpike);
        if (tension > 0.6) {
            // 高速拖影
            const tx = Math.round(centerX + Math.cos(angle - 0.5) * radius);
            const ty = Math.round(centerY + Math.sin(angle - 0.5) * radius * 0.7);
            d.pixel(tx, ty, this.cChain);
        }
    }
}
