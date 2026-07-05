// GargoyleGenerator —— 地牢石像鬼（石灰色带翼小魔像，伏击怪）。
// 32×32，默认朝左；dormant 态=收翼低头雕像（混于石雕），苏醒后眼亮橙红、展翼扑击。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class GargoyleGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 石色（与 dungeon_statue 的 #5d6370 系一致以混淆）
        this.cStone = '#5d6370';
        this.cStoneDark = '#454b56';
        this.cStoneLight = '#727986';
        this.cStoneMoss = '#4a5a4f';
        this.cCrack = '#2f333b';
        this.cEyeDim = '#3a3f48';
        this.cEye = '#ff6a2a';
        this.cEyeHot = '#ffd23e';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降
     * @param {number} [pose.legFrame=0] 步态相位 0~3
     * @param {number} [pose.wingSpread=0] 展翼 0~1（0 收翼雕像 / 1 全展）
     * @param {number} [pose.headBow=0] 低头 0~1（雕像低垂）
     * @param {number} [pose.eyeGlow=0] 眼发光 0~1（苏醒后）
     * @param {number} [pose.crack=0] 破石裂纹/尘 0~1（苏醒动画）
     * @param {boolean} [pose.dormant=false] 雕像态（灰岩配色、无光）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const legFrame = pose.legFrame || 0;
        const wingSpread = pose.wingSpread || 0;
        const headBow = pose.headBow || 0;
        const eyeGlow = pose.eyeGlow || 0;
        const crack = pose.crack || 0;
        const dormant = pose.dormant || false;

        const cx = 16;
        const bodyTop = 14 + squash;

        d.ellipse(16, 29, 8, 3, dormant ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.3)');

        this.drawWings(d, cx, bodyTop, wingSpread);
        this.drawLegs(d, cx, legFrame);
        this.drawBody(d, cx, bodyTop);
        this.drawHead(d, cx, bodyTop - 5, headBow, eyeGlow, dormant);
        if (crack > 0.05) this.drawCracks(d, cx, bodyTop, crack);

        return d.getCanvas();
    }

    /** 蝠翼（收拢贴背 → 向两侧展开）。 */
    drawWings(d, cx, top, spread) {
        const ext = Math.round(spread * 6);
        // 左翼
        d.fillPath([
            { x: cx - 3, y: top },
            { x: cx - 6 - ext, y: top - 3 - ext },
            { x: cx - 7 - ext, y: top + 4 },
            { x: cx - 3, y: top + 6 }
        ], this.cStoneDark);
        // 右翼
        d.fillPath([
            { x: cx + 3, y: top },
            { x: cx + 6 + ext, y: top - 3 - ext },
            { x: cx + 7 + ext, y: top + 4 },
            { x: cx + 3, y: top + 6 }
        ], this.cStoneDark);
        // 翼骨脊线
        d.line(cx - 3, top + 1, cx - 6 - ext, top - 2 - ext, this.cStone);
        d.line(cx + 3, top + 1, cx + 6 + ext, top - 2 - ext, this.cStone);
    }

    drawLegs(d, cx, legFrame) {
        const phase = Math.floor(legFrame) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        d.rect(cx - 4, 24 + leftLift, 3, 5, this.cStoneDark);
        d.rect(cx + 1, 24 + rightLift, 3, 5, this.cStoneDark);
        // 石爪
        d.pixel(cx - 4, 29 + leftLift, this.cStoneLight);
        d.pixel(cx + 3, 29 + rightLift, this.cStoneLight);
    }

    /** 蹲伏石躯（宽肩收腹）。 */
    drawBody(d, cx, top) {
        d.fillPath([
            { x: cx - 5, y: top },
            { x: cx + 5, y: top },
            { x: cx + 6, y: top + 4 },
            { x: cx + 4, y: top + 11 },
            { x: cx - 4, y: top + 11 },
            { x: cx - 6, y: top + 4 }
        ], this.cStone);
        d.vLine(cx - 5, top + 1, 9, this.cStoneLight);
        d.vLine(cx + 5, top + 1, 9, this.cStoneDark);
        // 胸口凿纹 + 苔痕
        d.hLine(cx - 3, top + 4, 6, this.cStoneDark);
        d.pixel(cx + 2, top + 7, this.cStoneMoss);
        d.pixel(cx - 3, top + 8, this.cStoneMoss);
    }

    /** 角头（朝左）：双角 + 眼（雕像暗 / 苏醒橙红）。 */
    drawHead(d, cx, cy, headBow, eyeGlow, dormant) {
        const bow = Math.round(headBow * 2);
        const hy = cy + bow;
        d.rect(cx - 4, hy - 1, 8, 6, this.cStone);
        d.hLine(cx - 4, hy - 1, 8, this.cStoneLight);
        d.vLine(cx + 3, hy, 5, this.cStoneDark);
        // 双角
        d.pixel(cx - 3, hy - 3, this.cStoneLight);
        d.pixel(cx - 4, hy - 4, this.cStoneLight);
        d.pixel(cx + 2, hy - 3, this.cStoneLight);
        d.pixel(cx + 3, hy - 4, this.cStoneLight);
        // 眉弓深凿
        d.hLine(cx - 3, hy + 1, 6, this.cStoneDark);
        // 眼（朝左）
        if (dormant || eyeGlow <= 0.05) {
            d.pixel(cx - 2, hy + 2, this.cEyeDim);
            d.pixel(cx + 1, hy + 2, this.cEyeDim);
        } else {
            const c = eyeGlow > 0.6 ? this.cEyeHot : this.cEye;
            d.pixel(cx - 2, hy + 2, c);
            d.pixel(cx + 1, hy + 2, c);
            if (eyeGlow > 0.6) {
                d.pixel(cx - 3, hy + 2, this.cEye);
            }
        }
        // 獠嘴
        d.pixel(cx - 1, hy + 4, this.cStoneDark);
    }

    /** 破石裂纹 + 剥落（苏醒瞬间）。 */
    drawCracks(d, cx, top, crack) {
        d.pixel(cx - 2, top + 2, this.cCrack);
        d.pixel(cx - 1, top + 4, this.cCrack);
        d.pixel(cx + 1, top + 3, this.cCrack);
        if (crack > 0.4) {
            d.pixel(cx + 3, top + 6, this.cCrack);
            d.pixel(cx - 4, top + 7, this.cCrack);
            d.pixel(cx, top + 9, this.cCrack);
        }
    }
}
