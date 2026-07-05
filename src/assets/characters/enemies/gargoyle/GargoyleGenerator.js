// GargoyleGenerator —— 地牢石像鬼：石灰色带翼小魔像（伏击怪）。
// 性格=双态反差。dormant=收翼低头的真雕像（基座 + 风化裂纹 + 青苔，混于石雕）；
// 苏醒后=分层石翼（翼骨 + 翼膜）、眼眶橙红发光渐变、半飞行扇翼、俯冲翼后掠。
// 32×32，默认朝左；色系与 dungeon_statue（#5d6370）一致。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class GargoyleGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 石色（4 阶，与 dungeon_statue 一致）
        this.cStone = '#5d6370';
        this.cStoneLight = '#727986';
        this.cStoneDark = '#454b56';
        this.cStoneEdge = '#363b44';

        // 青苔 / 风化
        this.cStoneMoss = '#4a5a4f';
        this.cMossLight = '#5f7a5c';
        this.cWeather = '#6b7078';

        // 翼膜（较石身更暗透）
        this.cMembrane = '#3f3a48';
        this.cMembraneLight = '#514b5c';
        this.cWingBone = '#727986';

        // 裂纹 / 基座
        this.cCrack = '#2f333b';
        this.cPedestal = '#525863';
        this.cPedestalDark = '#3c414b';

        // 眼（暗 / 橙红炯炯）
        this.cEyeDim = '#3a3f48';
        this.cEye = '#ff6a2a';
        this.cEyeHot = '#ffd23e';
        this.cEyeGlow = 'rgba(255,120,50,0.45)'; // 眼眶辉光渐变
    }

    /**
     * @param {Object} pose
     * @param {number}  [pose.bodySquash=0] 躯体升降
     * @param {number}  [pose.legFrame=0]   步态相位 0~3
     * @param {number}  [pose.wingSpread=0] 展翼 0~1（0 收翼 / 1 全展）
     * @param {number}  [pose.wingFlap=0]   扇翼相位 -1~1（翼尖升降）
     * @param {number}  [pose.diveSweep=0]  俯冲翼后掠 0~1
     * @param {number}  [pose.headBow=0]    低头 0~1（雕像低垂）
     * @param {number}  [pose.eyeGlow=0]    眼发光 0~1（苏醒后）
     * @param {number}  [pose.eyeFlicker=0] 雕像态眼缝闪红 0~1（伪装破绽）
     * @param {number}  [pose.hover=0]      半飞行离地 0~1
     * @param {number}  [pose.crack=0]      破石裂纹/抖尘 0~1（苏醒）
     * @param {boolean} [pose.dormant=false] 雕像态（含基座/风化/无光眼）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const legFrame = pose.legFrame || 0;
        const wingSpread = pose.wingSpread || 0;
        const wingFlap = pose.wingFlap || 0;
        const diveSweep = pose.diveSweep || 0;
        const headBow = pose.headBow || 0;
        const eyeGlow = pose.eyeGlow || 0;
        const eyeFlicker = pose.eyeFlicker || 0;
        const hover = pose.hover || 0;
        const crack = pose.crack || 0;
        const dormant = pose.dormant || false;

        const cx = 16;
        const bodyTop = 14 + squash - Math.round(hover * 2); // 半飞行时整体上浮

        // 投影：雕像态实、半飞行时缩小（腾空）
        const shX = dormant ? 9 : 8 - Math.round(hover * 3);
        d.ellipse(16, 29, shX, dormant ? 3 : 2, dormant ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.3)');

        if (dormant) this.drawPedestal(d, cx);
        this.drawWings(d, cx, bodyTop, wingSpread, wingFlap, diveSweep);
        this.drawLegs(d, cx, legFrame, hover, dormant);
        this.drawBody(d, cx, bodyTop, dormant);
        this.drawHead(d, cx, bodyTop - 5, headBow, eyeGlow, dormant, eyeFlicker);
        if (crack > 0.05) this.drawCracks(d, cx, bodyTop, crack);

        return d.getCanvas();
    }

    /** 雕像基座：风化石台（含青苔与裂缝），使 dormant 态像真石雕。 */
    drawPedestal(d, cx) {
        d.rect(cx - 7, 27, 14, 3, this.cPedestalDark); // 底板
        d.rect(cx - 6, 26, 12, 2, this.cPedestal);
        d.hLine(cx - 6, 26, 12, this.cStoneLight);     // 台面高光
        // 青苔沿基座蔓生
        d.pixel(cx - 5, 27, this.cStoneMoss);
        d.pixel(cx - 4, 28, this.cMossLight);
        d.pixel(cx + 4, 28, this.cStoneMoss);
        // 风化裂缝
        d.pixel(cx - 1, 28, this.cCrack);
        d.pixel(cx + 2, 29, this.cCrack);
        d.pixel(cx - 6, 29, this.cCrack);
    }

    /** 分层石翼：翼膜（填充）+ 翼骨（放射脊线），随展开/扇动/后掠变形。 */
    drawWings(d, cx, top, spread, flap, sweep) {
        this.drawWing(d, cx, top, spread, flap, sweep, -1); // 左翼
        this.drawWing(d, cx, top, spread, flap, sweep, 1);  // 右翼
    }

    drawWing(d, cx, top, spread, flap, sweep, side) {
        const ext = Math.round(spread * 7);       // 外展量
        const flapY = Math.round(flap * 2);        // 扇动：翼尖升降
        const back = Math.round(sweep * 3);        // 俯冲：翼尖后掠下压
        const jx = cx + side * 3;                  // 肩关节 X
        const jy = top + 1;

        // 三翼尖（上/中/下）
        const t1 = { x: cx + side * (5 + ext) - side * back, y: top - 3 - Math.round(ext * 0.5) + flapY + back };
        const t2 = { x: cx + side * (7 + ext) - side * back, y: top + 2 + flapY + back };
        const t3 = { x: cx + side * (5 + ext) - side * back, y: top + 6 + back };

        // 翼膜
        d.fillPath([
            { x: jx, y: jy - 1 },
            t1, t2, t3,
            { x: jx, y: jy + 5 }
        ], this.cMembrane);
        // 近脊侧膜高光
        d.fillPath([
            { x: jx, y: jy },
            { x: (jx + t2.x) / 2, y: (jy + t2.y) / 2 },
            { x: jx, y: jy + 3 }
        ], this.cMembraneLight);

        // 翼骨脊（关节放射至各翼尖）
        d.line(jx, jy, t1.x, t1.y, this.cWingBone);
        d.line(jx, jy + 2, t2.x, t2.y, this.cWingBone);
        d.line(jx, jy + 4, t3.x, t3.y, this.cStone);
        // 翼尖石爪
        d.pixel(t1.x, t1.y, this.cStoneLight);
        d.pixel(t2.x, t2.y, this.cStoneLight);
    }

    /** 石腿：地面站姿两腿交替；半飞行时上收垂爪离地。 */
    drawLegs(d, cx, legFrame, hover, dormant) {
        const phase = Math.floor(legFrame) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        const off = Math.round(hover * 3);   // 半飞行上收
        const footY = 24 - off;
        const legH = 5 - Math.round(hover * 2);

        d.rect(cx - 4, footY + leftLift, 3, legH, this.cStoneDark);
        d.rect(cx + 1, footY + rightLift, 3, legH, this.cStoneDark);
        d.vLine(cx - 4, footY + leftLift, legH, this.cStone); // 腿侧高光

        if (hover > 0.3) {
            // 悬空垂爪
            d.pixel(cx - 4, footY + legH, this.cStoneLight);
            d.pixel(cx - 3, footY + legH + 1, this.cStoneDark);
            d.pixel(cx + 3, footY + legH, this.cStoneLight);
            d.pixel(cx + 2, footY + legH + 1, this.cStoneDark);
        } else {
            d.pixel(cx - 4, 29 + leftLift, this.cStoneLight);
            d.pixel(cx + 3, 29 + rightLift, this.cStoneLight);
            if (dormant) d.pixel(cx + 1, 28, this.cStoneMoss); // 足踝青苔
        }
    }

    /** 蹲伏石躯（宽肩收腹）：含凿纹与青苔；dormant 追加风化。 */
    drawBody(d, cx, top, dormant) {
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
        // 胸口凿纹
        d.hLine(cx - 3, top + 4, 6, this.cStoneDark);
        d.pixel(cx - 2, top + 6, this.cStoneDark);
        // 青苔（肩/胸/腹）
        d.pixel(cx - 4, top + 1, this.cStoneMoss);
        d.pixel(cx + 3, top + 2, this.cMossLight);
        d.pixel(cx - 3, top + 8, this.cStoneMoss);

        if (dormant) this.drawWeathering(d, cx, top);
    }

    /** 风化：淡斑 + 静态裂纹（伪装成久经风霜的石雕）。 */
    drawWeathering(d, cx, top) {
        d.pixel(cx - 2, top + 3, this.cWeather);
        d.pixel(cx + 1, top + 6, this.cWeather);
        d.pixel(cx - 4, top + 5, this.cWeather);
        // 静态裂纹
        d.pixel(cx + 2, top + 3, this.cCrack);
        d.pixel(cx - 1, top + 7, this.cCrack);
        d.pixel(cx + 3, top + 9, this.cCrack);
        // 苔痕加重
        d.pixel(cx + 4, top + 7, this.cMossLight);
    }

    /** 角头（朝左）：双角 + 眉弓深凿 + 眼（暗/橙红发光渐变）+ 獠嘴。 */
    drawHead(d, cx, cy, headBow, eyeGlow, dormant, eyeFlicker) {
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
        // 眼
        this.drawEyes(d, cx, hy, eyeGlow, dormant, eyeFlicker);
        // 獠嘴
        d.pixel(cx - 1, hy + 4, this.cStoneDark);
        d.pixel(cx, hy + 4, this.cStoneDark);
        // 头顶青苔（dormant）
        if (dormant) d.pixel(cx + 2, hy, this.cStoneMoss);
    }

    /** 眼：无光死眼 / 橙红眼芯 + 眼眶辉光渐变。 */
    drawEyes(d, cx, hy, eyeGlow, dormant, eyeFlicker) {
        const ex1 = cx - 2, ex2 = cx + 1, ey = hy + 2;
        const g = dormant ? eyeFlicker : eyeGlow;

        if (g <= 0.05) {
            // 无光死眼（与石雕无异）
            d.pixel(ex1, ey, this.cEyeDim);
            d.pixel(ex2, ey, this.cEyeDim);
            return;
        }

        const core = g > 0.6 ? this.cEyeHot : this.cEye;
        // 眼眶辉光渐变（先铺半透明橙晕，再叠眼芯）
        d.pixel(ex1 - 1, ey, this.cEyeGlow);
        d.pixel(ex1, ey - 1, this.cEyeGlow);
        d.pixel(ex2 + 1, ey, this.cEyeGlow);
        d.pixel(ex2, ey - 1, this.cEyeGlow);
        d.pixel(ex1, ey + 1, this.cEyeGlow);
        d.pixel(ex2, ey + 1, this.cEyeGlow);
        // 眼芯
        d.pixel(ex1, ey, core);
        d.pixel(ex2, ey, core);
        // 高光更盛时眉心透光 + 外圈亮橙
        if (g > 0.6) {
            d.pixel(cx - 1, ey, this.cEye);
            d.pixel(ex1 - 1, ey, this.cEye);
            d.pixel(ex2 + 1, ey, this.cEye);
        }
    }

    /** 破石裂纹 + 剥落抖尘（苏醒瞬间）。 */
    drawCracks(d, cx, top, crack) {
        d.pixel(cx - 2, top + 2, this.cCrack);
        d.pixel(cx - 1, top + 4, this.cCrack);
        d.pixel(cx + 1, top + 3, this.cCrack);
        if (crack > 0.4) {
            d.pixel(cx + 3, top + 6, this.cCrack);
            d.pixel(cx - 4, top + 7, this.cCrack);
            d.pixel(cx, top + 9, this.cCrack);
            // 剥落石屑（抖尘）
            d.pixel(cx - 5, top + 11, this.cStoneLight);
            d.pixel(cx + 5, top + 10, this.cWeather);
            d.pixel(cx - 6, top + 9, this.cWeather);
        }
    }
}
