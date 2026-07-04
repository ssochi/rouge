// LobberGenerator —— 地牢投弹手（矮壮皮甲兵：背负炸弹桶+抡臂掷弹）。
// 32×32，默认朝左。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class LobberGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 皮甲与身体
        this.cSkin = '#b5906a';
        this.cSkinShadow = '#8f6e4e';
        this.cLeather = '#6e4a2a';
        this.cLeatherDark = '#523620';
        this.cLeatherLight = '#8a5f38';
        this.cHood = '#4a4038';
        this.cEye = '#ffd23e';
        // 炸弹与桶
        this.cBomb = '#33333e';
        this.cBombLight = '#484855';
        this.cFuse = '#c9a227';
        this.cSpark = '#ff8a3c';
        this.cBarrel = '#7a5a34';
        this.cBarrelDark = '#5c4326';
        this.cHoop = '#484855';
        // 腿
        this.cBoots = '#3a3028';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降
     * @param {number} [pose.legFrame=0] 步行相位 0~3
     * @param {number} [pose.armPhase=0] 抡臂 0~1（0 持弹腰间 → 1 过肩释放）
     * @param {boolean} [pose.spark=false] 引线火花
     * @param {number} [pose.lean=0] 前倾
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const legFrame = pose.legFrame || 0;
        const armPhase = pose.armPhase || 0;
        const spark = pose.spark || false;
        const lean = pose.lean || 0;

        const cx = 16 - lean;
        const bodyTop = 15 + squash;

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.3)');

        this.drawBarrelPack(d, cx, bodyTop);
        this.drawLegs(d, cx, legFrame);
        this.drawBody(d, cx, bodyTop);
        this.drawHead(d, cx, bodyTop - 5);
        this.drawThrowArm(d, cx, bodyTop, armPhase, spark);

        return d.getCanvas();
    }

    /** 背后的炸弹桶（右侧背负，露出两颗弹球）。 */
    drawBarrelPack(d, cx, bodyTop) {
        const bx = cx + 4;
        const by = bodyTop - 4;
        d.rect(bx, by, 6, 9, this.cBarrel);
        d.vLine(bx, by, 9, this.cBarrelDark);
        d.hLine(bx, by + 2, 6, this.cHoop);
        d.hLine(bx, by + 6, 6, this.cHoop);
        // 桶口露出的弹球
        d.rect(bx + 1, by - 2, 2, 2, this.cBomb);
        d.rect(bx + 4, by - 1, 2, 2, this.cBombLight);
    }

    /** 短腿步行。 */
    drawLegs(d, cx, legFrame) {
        const phase = Math.floor(legFrame) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        d.rect(cx - 4, 25 + leftLift, 3, 4 - leftLift, this.cBoots);
        d.rect(cx + 1, 25 + rightLift, 3, 4 - rightLift, this.cBoots);
    }

    /** 矮壮皮甲躯干。 */
    drawBody(d, cx, top) {
        d.rect(cx - 5, top, 9, 10, this.cLeather);
        d.hLine(cx - 5, top, 9, this.cLeatherLight);
        d.vLine(cx + 3, top + 1, 9, this.cLeatherDark);
        // 斜背带
        for (let i = 0; i < 6; i++) {
            d.pixel(cx - 3 + i, top + 1 + i, this.cLeatherDark);
        }
        // 腰带
        d.hLine(cx - 5, top + 7, 9, this.cLeatherDark);
        d.pixel(cx - 1, top + 7, this.cFuse);
    }

    /** 兜帽圆脸：独眼亮黄。 */
    drawHead(d, cx, cy) {
        d.rect(cx - 5, cy - 4, 8, 6, this.cHood);
        d.hLine(cx - 5, cy - 4, 8, this.cLeatherLight);
        // 脸
        d.rect(cx - 5, cy, 5, 3, this.cSkin);
        d.pixel(cx - 5, cy + 2, this.cSkinShadow);
        // 独眼
        d.pixel(cx - 4, cy + 1, this.cEye);
        d.pixel(cx - 3, cy + 1, this.cEye);
    }

    /** 投掷臂 + 手中炸弹：腰间持弹 → 抡臂过肩。 */
    drawThrowArm(d, cx, bodyTop, armPhase, spark) {
        // 手臂轨迹：腰间 (cx-6, bodyTop+5) → 过肩 (cx-4, bodyTop-7)
        const armX = cx - 6 + Math.round(armPhase * 2);
        const armY = bodyTop + 5 - Math.round(armPhase * 12);

        // 手臂
        d.rect(cx - 5, bodyTop + 2, 2, 2, this.cSkin);
        d.pixel(armX + 1, armY + 1, this.cSkin);

        // 炸弹球
        d.rect(armX - 1, armY - 2, 3, 3, this.cBomb);
        d.pixel(armX - 1, armY - 2, this.cBombLight);
        // 引线
        d.pixel(armX, armY - 3, this.cFuse);
        if (spark) {
            d.pixel(armX + 1, armY - 4, this.cSpark);
            d.pixel(armX - 1, armY - 4, this.cSpark);
        }
    }
}
