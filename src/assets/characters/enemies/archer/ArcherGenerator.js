// ArcherGenerator —— 地牢骷髅弩手（狱卒亡骨：残甲骷髅+重弩，蓄力直线箭）。
// 32×32，默认朝左。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class ArcherGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        this.cBone = '#d8d2c0';
        this.cBoneShadow = '#aaa593';
        this.cSocket = '#241c14';
        this.cEye = '#ffd23e';
        this.cArmor = '#5c6470';
        this.cArmorDark = '#434a54';
        this.cCross = '#6e4a2a';
        this.cCrossDark = '#523620';
        this.cCrossIron = '#484855';
        this.cString = '#c8c2ae';
        this.cBolt = '#ffd23e';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降
     * @param {number} [pose.legFrame=0] 步行相位 0~3
     * @param {number} [pose.aim=0] 举弩瞄准 0~1（弩从垂放到水平前指）
     * @param {number} [pose.charge=0] 蓄力发光 0~1（弩槽箭矢亮起）
     * @param {boolean} [pose.recoil=false] 击发后坐
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const legFrame = pose.legFrame || 0;
        const aim = pose.aim || 0;
        const charge = pose.charge || 0;
        const recoil = pose.recoil || false;

        const cx = 16;
        const bodyTop = 13 + squash;

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.28)');

        this.drawLegs(d, cx, legFrame);
        this.drawBody(d, cx, bodyTop);
        this.drawHead(d, cx, bodyTop - 5);
        this.drawCrossbow(d, cx, bodyTop, aim, charge, recoil);

        return d.getCanvas();
    }

    /** 骨腿+残甲护胫。 */
    drawLegs(d, cx, legFrame) {
        const phase = Math.floor(legFrame) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        d.rect(cx - 4, 24 + leftLift, 2, 5 - leftLift, this.cBone);
        d.rect(cx + 2, 24 + rightLift, 2, 5 + rightLift > 5 ? 5 : 5 - rightLift, this.cBone);
        d.pixel(cx - 4, 26 + leftLift, this.cBoneShadow);
        d.pixel(cx + 2, 26 + rightLift, this.cBoneShadow);
    }

    /** 肋骨躯干+残甲胸板。 */
    drawBody(d, cx, top) {
        // 脊柱与肋
        d.vLine(cx, top, 10, this.cBone);
        d.hLine(cx - 3, top + 2, 7, this.cBone);
        d.hLine(cx - 3, top + 5, 7, this.cBoneShadow);
        d.hLine(cx - 2, top + 8, 5, this.cBone);
        // 残甲胸板（半边）
        d.rect(cx - 4, top, 4, 6, this.cArmor);
        d.vLine(cx - 4, top, 6, this.cArmorDark);
    }

    /** 骷髅头+独目黄光。 */
    drawHead(d, cx, cy) {
        d.rect(cx - 4, cy - 4, 8, 7, this.cBone);
        d.vLine(cx + 3, cy - 3, 6, this.cBoneShadow);
        // 眼窝
        d.rect(cx - 3, cy - 2, 2, 2, this.cSocket);
        d.rect(cx + 1, cy - 2, 2, 2, this.cSocket);
        d.pixel(cx - 3, cy - 2, this.cEye); // 左目亮（朝左瞄准）
        // 鼻/齿
        d.pixel(cx - 1, cy, this.cSocket);
        d.hLine(cx - 3, cy + 2, 6, this.cBoneShadow);
    }

    /** 重弩：垂放 → 水平前指（朝左），蓄力时弩槽箭矢亮起。 */
    drawCrossbow(d, cx, bodyTop, aim, charge, recoil) {
        const armY = bodyTop + 3;
        const reach = Math.round(4 + aim * 6) - (recoil ? 2 : 0);
        const bowX = cx - reach;

        // 持弩臂（骨臂）
        d.hLine(cx - 3, armY, 4, this.cBone);

        // 弩身（水平）
        d.rect(bowX - 6, armY - 1, 9, 2, this.cCross);
        d.hLine(bowX - 6, armY - 1, 9, this.cCrossDark);
        // 弩臂（垂直弓片）
        d.vLine(bowX - 5, armY - 4, 3, this.cCrossIron);
        d.vLine(bowX - 5, armY + 1, 3, this.cCrossIron);
        // 弦
        d.pixel(bowX - 4, armY - 3, this.cString);
        d.pixel(bowX - 3, armY - 2, this.cString);
        d.pixel(bowX - 4, armY + 3, this.cString);
        d.pixel(bowX - 3, armY + 2, this.cString);

        // 蓄力箭矢（亮黄，蓄满更长）
        if (charge > 0.15) {
            const len = Math.round(2 + charge * 4);
            d.hLine(bowX - 5 - len, armY, len, this.cBolt);
            if (charge > 0.7) d.pixel(bowX - 6 - len, armY, '#fff3b0');
        }
    }
}
