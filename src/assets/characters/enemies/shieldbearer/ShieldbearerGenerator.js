// ShieldbearerGenerator —— 地牢盾卫（重甲塔盾兵：正面几乎全被塔盾覆盖）。
// 32×32，默认朝左（塔盾在左侧前方）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class ShieldbearerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 重甲
        this.cArmor = '#5c6470';
        this.cArmorDark = '#434a54';
        this.cArmorLight = '#7a8290';
        this.cVisor = '#1c2026';
        this.cVisorGlow = '#ffb347';
        // 塔盾
        this.cShield = '#7a5a34';
        this.cShieldDark = '#5c4326';
        this.cShieldLight = '#96703f';
        this.cRim = '#484855';
        this.cRimLight = '#5f5f6e';
        this.cBoss = '#8a8a96';
        // 腿
        this.cLeg = '#3a4048';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降（沉重步伐）
     * @param {number} [pose.step=0] 步行相位 0~3（腿交替）
     * @param {number} [pose.shieldForward=0] 盾前推像素（盾击 0~3）
     * @param {number} [pose.headBob=0] 头盔上下
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const step = pose.step || 0;
        const shieldForward = pose.shieldForward || 0;
        const headBob = pose.headBob || 0;

        const cx = 17; // 身体略靠右，给左侧塔盾留位
        const bodyTop = 12 + squash;

        d.ellipse(15, 29, 9, 3, 'rgba(0,0,0,0.32)');

        this.drawLegs(d, cx, step);
        this.drawBody(d, cx, bodyTop);
        this.drawHead(d, cx, bodyTop - 5 + headBob);
        this.drawShield(d, bodyTop, shieldForward, squash);

        return d.getCanvas();
    }

    /** 铁靴交替（沉重两步循环）。 */
    drawLegs(d, cx, step) {
        const phase = Math.floor(step) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        d.rect(cx - 4, 24 + leftLift, 3, 5 - leftLift, this.cLeg);
        d.rect(cx + 1, 24 + rightLift, 3, 5 - rightLift, this.cLeg);
        d.hLine(cx - 4, 24 + leftLift, 3, this.cArmorDark);
        d.hLine(cx + 1, 24 + rightLift, 3, this.cArmorDark);
    }

    /** 重甲躯干：宽胸甲 + 肩甲 + 板甲条纹。 */
    drawBody(d, cx, top) {
        d.rect(cx - 5, top, 10, 12, this.cArmor);
        d.hLine(cx - 5, top, 10, this.cArmorLight);
        d.vLine(cx + 4, top + 1, 11, this.cArmorDark);
        // 板甲横缝
        d.hLine(cx - 5, top + 4, 10, this.cArmorDark);
        d.hLine(cx - 5, top + 8, 10, this.cArmorDark);
        // 右肩甲（左肩被盾遮）
        d.rect(cx + 3, top - 1, 4, 3, this.cArmorLight);
        d.pixel(cx + 6, top + 1, this.cArmorDark);
    }

    /** 全盔头：一条橙色目缝。 */
    drawHead(d, cx, cy) {
        d.rect(cx - 4, cy - 3, 8, 6, this.cArmor);
        d.hLine(cx - 4, cy - 3, 8, this.cArmorLight);
        d.vLine(cx + 3, cy - 2, 5, this.cArmorDark);
        // 目缝（朝左）
        d.hLine(cx - 4, cy, 4, this.cVisor);
        d.pixel(cx - 3, cy, this.cVisorGlow);
        // 盔顶脊
        d.hLine(cx - 2, cy - 4, 4, this.cArmorDark);
    }

    /** 塔盾：左侧立面大盾（铁包边+木面+中央铁凸）。 */
    drawShield(d, bodyTop, forward, squash) {
        const sx = 5 - Math.round(forward); // 前推向左
        const top = 8 + squash;
        const h = 19;

        // 铁边框
        d.rect(sx, top, 6, h, this.cRim);
        d.hLine(sx, top, 6, this.cRimLight);
        d.vLine(sx, top, h, this.cRimLight);
        // 木盾面
        d.rect(sx + 1, top + 1, 4, h - 2, this.cShield);
        d.vLine(sx + 1, top + 1, h - 2, this.cShieldLight);
        d.vLine(sx + 4, top + 1, h - 2, this.cShieldDark);
        // 木纹
        d.hLine(sx + 1, top + 5, 4, this.cShieldDark);
        d.hLine(sx + 1, top + 12, 4, this.cShieldDark);
        // 中央铁凸
        d.rect(sx + 2, top + 8, 2, 2, this.cBoss);
        // 底部接地暗
        d.hLine(sx, top + h - 1, 6, this.cArmorDark);
        // 持盾臂连接
        d.hLine(sx + 6, top + 9, 3, this.cArmorDark);
    }
}
