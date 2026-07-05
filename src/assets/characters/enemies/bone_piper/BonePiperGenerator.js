// BonePiperGenerator —— 骨笛吹手：披风骨裔乐师，持一支金纹骨笛。
// 兜帽长袍露出骷髅面 + 一对枯骨臂持笛；吹奏(play)时骨笛抬至嘴前、指孔透出金光并浮出音符。
// 支援/唤潮生态位 → 通体点缀「淡金」（金瞳/金笛纹/脚下光环由实体绘制）。32×32，默认朝左。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class BonePiperGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 骨（骷髅面/枯臂）
        this.cBone = '#e0dac6';
        this.cBoneLight = '#f2eddd';
        this.cBoneShadow = '#b3ab92';
        this.cBoneDark = '#847c65';
        this.cSocket = '#1e1810';

        // 兜帽长袍（深靛青，支援法系）
        this.cRobe = '#3a4a5c';
        this.cRobeDark = '#26313d';
        this.cRobeLight = '#546a80';
        this.cRobeEdge = '#1a222c';

        // 金饰/金纹（唤潮主题色）
        this.cGold = '#e8c260';
        this.cGoldDim = '#a37e2c';
        this.cGoldHot = '#fff0b8';

        // 骨笛
        this.cFlute = '#d8d2bd';
        this.cFluteDark = '#9a9078';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodyY=0]     躯体升降（呼吸/落步）
     * @param {number} [pose.legPhase=0]  步态相位 0~3
     * @param {number} [pose.cloakWave=0] 袍摆相位 0~1
     * @param {number} [pose.play=0]      吹奏 0(垂笛)~1(抵唇满吹，指孔金光)
     * @param {number} [pose.headBob=0]   头部俯仰 -1~1
     * @param {number} [pose.glow=0.5]    金光强度 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const bodyY = Math.round(pose.bodyY || 0);
        const legPhase = Math.floor(pose.legPhase || 0) % 4;
        const cloakWave = pose.cloakWave || 0;
        const play = pose.play || 0;
        const headBob = pose.headBob || 0;
        const glow = pose.glow ?? 0.5;

        const cx = 16;
        const bodyTop = 13 + bodyY;

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.28)');

        this.drawRobeHem(d, cx, bodyTop, cloakWave);
        this.drawLegs(d, cx, legPhase);
        this.drawRobeBody(d, cx, bodyTop);
        this.drawHoodSkull(d, cx, bodyTop - 4 + Math.round(headBob), headBob, glow);
        this.drawArmsAndFlute(d, cx, bodyTop, play, glow);

        return d.getCanvas();
    }

    /** 袍下摆：随相位摆动的长袍裙裾（分片 + 撕口）。 */
    drawRobeHem(d, cx, top, wave) {
        const sway = Math.round(Math.sin(wave * Math.PI * 2) * 2);
        const flare = Math.abs(sway);
        d.fillPath([
            { x: cx - 5,        y: top + 6 },
            { x: cx + 5,        y: top + 6 },
            { x: cx + 6 + sway, y: top + 15 + flare },
            { x: cx + sway,     y: top + 16 },
            { x: cx - 6 + sway, y: top + 15 + flare }
        ], this.cRobeDark);
        d.vLine(cx - 2, top + 8, 7, this.cRobeEdge);
        d.vLine(cx + 2, top + 8, 7, this.cRobeEdge);
        // 金色下摆缝边
        d.pixel(cx - 5 + sway, top + 14 + flare, this.cGoldDim);
        d.pixel(cx + 5 + sway, top + 14 + flare, this.cGoldDim);
    }

    /** 骨腿（袍下微露）。 */
    drawLegs(d, cx, legPhase) {
        const leftLift = legPhase === 1 ? -1 : 0;
        const rightLift = legPhase === 3 ? -1 : 0;
        d.rect(cx - 3, 25 + leftLift, 2, 3 - leftLift, this.cBone);
        d.rect(cx + 1, 25 + rightLift, 2, 3 - rightLift, this.cBoneShadow);
        d.rect(cx - 4, 27, 3, 1, this.cRobeEdge);
        d.rect(cx, 27, 3, 1, this.cRobeEdge);
    }

    /** 长袍上身：立领罩肩，前襟金纹。 */
    drawRobeBody(d, cx, top) {
        d.fillPath([
            { x: cx - 5, y: top + 1 },
            { x: cx + 5, y: top + 1 },
            { x: cx + 4, y: top + 8 },
            { x: cx - 4, y: top + 8 }
        ], this.cRobe);
        // 受光/暗襟
        d.vLine(cx - 4, top + 2, 6, this.cRobeLight);
        d.vLine(cx + 3, top + 2, 6, this.cRobeDark);
        // 前襟金纹（竖列点）
        d.pixel(cx, top + 2, this.cGold);
        d.pixel(cx, top + 4, this.cGoldDim);
        d.pixel(cx, top + 6, this.cGold);
        // 立领
        d.hLine(cx - 3, top, 6, this.cRobeLight);
        d.pixel(cx - 3, top, this.cGoldDim);
        d.pixel(cx + 2, top, this.cGoldDim);
    }

    /** 兜帽 + 骷髅面：帽檐压住颅顶只露下半脸，眼窝深陷 + 金瞳，颊侧凹陷 + 下颌，读作骷髅而非白团。 */
    drawHoodSkull(d, cx, cy, headBob, glow) {
        // 兜帽（罩住颅顶与两颊后方，尖顶偏后）
        d.fillPath([
            { x: cx - 6, y: cy + 3 },
            { x: cx - 5, y: cy - 4 },
            { x: cx,     y: cy - 6 },
            { x: cx + 5, y: cy - 2 },
            { x: cx + 6, y: cy + 3 }
        ], this.cRobe);
        d.pixel(cx, cy - 6, this.cRobeLight);   // 帽尖高光
        d.vLine(cx + 5, cy - 1, 4, this.cRobeDark);
        d.ellipse(cx - 1, cy, 4, 4, this.cRobeEdge); // 帽内阴影

        // 骷髅面（下探的小椭圆脸，朝左）
        const fx = cx - 1;
        d.ellipse(fx, cy + 1, 3, 3, this.cBone);
        // 帽檐压住颅顶（切掉上缘 → 只露下半脸 + 眉骨）
        d.hLine(fx - 3, cy - 2, 7, this.cRobeDark);
        d.pixel(fx - 3, cy - 1, this.cRobeEdge);
        d.pixel(fx + 3, cy - 1, this.cRobeEdge);
        // 颊侧凹陷（骷髅结构）
        d.pixel(fx - 3, cy + 2, this.cBoneShadow);
        d.pixel(fx + 3, cy + 1, this.cBoneDark);
        // 眼窝（双，深陷）+ 金瞳（朝左更亮）
        const eyeCol = glow > 0.45 ? this.cGold : this.cGoldDim;
        d.rect(fx - 3, cy, 2, 2, this.cSocket);
        d.rect(fx + 1, cy, 2, 2, this.cSocket);
        d.pixel(fx - 3, cy, eyeCol);
        d.pixel(fx + 1, cy, this.cGoldDim);
        if (glow > 0.7) d.pixel(fx - 2, cy, this.cGoldHot);
        // 鼻腔 + 牙列 + 下颌
        d.pixel(fx, cy + 2, this.cSocket);
        d.hLine(fx - 2, cy + 3, 5, this.cBoneShadow);
        d.pixel(fx - 1, cy + 3, this.cBoneLight);
        d.pixel(fx + 1, cy + 3, this.cBoneLight);
        d.pixel(fx, cy + 4, this.cBoneDark); // 下巴
    }

    /** 双臂持骨笛：吹奏(play)时笛身抬至嘴前、指孔金光、末端浮金符。 */
    drawArmsAndFlute(d, cx, top, play, glow) {
        const raise = Math.round(play * 3); // 抬笛量
        // 骨笛沿朝左方向斜置，末端在头前
        const fx = cx - 3;               // 笛后端（近躯体）
        const fy = top + 4 - raise;       // 抬起后更高（贴近嘴）
        const tipX = fx - 8;              // 笛前端（朝左伸出）
        const tipY = fy - 2;

        // 持笛双臂（自袖口伸向笛身）
        d.rect(cx - 5, top + 2, 2, 3, this.cRobe);      // 后臂袖
        d.rect(cx - 6, top + 4 - raise, 2, 2, this.cBone); // 后手
        d.rect(cx - 2, top + 3, 2, 3 - raise, this.cRobe); // 前臂袖
        d.pixel(fx - 3, fy - 1, this.cBone);            // 前手指

        // 笛身（斜线）
        d.line(fx, fy, tipX, tipY, this.cFlute);
        d.line(fx, fy + 1, tipX, tipY + 1, this.cFluteDark);
        // 金纹环（两道）
        d.pixel(fx - 3, fy - 1, this.cGold);
        d.pixel(tipX + 3, tipY, this.cGoldDim);
        // 笛端喇叭口
        d.pixel(tipX - 1, tipY, this.cFluteDark);
        d.pixel(tipX - 1, tipY + 1, this.cFlute);

        // 吹奏金光：指孔亮起 + 前方浮出音符
        if (play > 0.4) {
            const hot = glow > 0.6 ? this.cGoldHot : this.cGold;
            d.pixel(fx - 5, fy - 1, hot);
            d.pixel(fx - 7, fy - 1, this.cGold);
            // 浮动音符（笛口斜上方）
            d.pixel(tipX - 3, tipY - 2, this.cGold);
            d.pixel(tipX - 3, tipY - 3, this.cGold);
            d.pixel(tipX - 2, tipY - 3, this.cGoldHot);
        }
    }
}
