// ShamblerGenerator —— 尸群蹒跚者：干瘪佝偻的小个子腐尸（人潮炮灰）。
// 比普通僵尸矮瘦一号：缩脖含胸、脊背驼起、双臂枯长下垂、细腿东倒西歪。
// 32×32，默认朝左（含胸偏 -x）。sway 控制左右踉跄，attackPhase 驱动扑抓。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class ShamblerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 腐肉（灰败绿，比僵尸更死气、偏灰）
        this.cSkin = '#7e9a6e';
        this.cSkinDark = '#4f6544';
        this.cSkinLight = '#9fb98a';
        // 暴露骨/牙
        this.cBone = '#d8d2bd';
        this.cBoneDark = '#9a9078';
        // 破裹尸布（脏麻色）
        this.cRag = '#8a806a';
        this.cRagDark = '#5c5442';
        this.cRagLight = '#a89d82';
        // 血污
        this.cBlood = '#7a241c';
        // 凹陷眼窝与死瞳
        this.cSocket = '#20180f';
        this.cEye = '#c9d94a';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodyY=0]      躯体升降（呼吸/落步）
     * @param {number} [pose.sway=0]       左右踉跄 -1(左倾)~1(右倾)
     * @param {number} [pose.legPhase=0]   步态相位 0~3
     * @param {number} [pose.armSwing=0]   垂臂摆动相位 0~1
     * @param {number} [pose.headTilt=0]   头颅耷拉 -1~1
     * @param {number} [pose.mouthOpen=0]  张嘴 0~1
     * @param {number} [pose.attackPhase=-1] 扑抓 0~1（<0 表示非攻击帧）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const bodyY = Math.round(pose.bodyY || 0);
        const sway = pose.sway || 0;
        const legPhase = Math.floor(pose.legPhase || 0) % 4;
        const armSwing = pose.armSwing || 0;
        const headTilt = pose.headTilt || 0;
        const mouthOpen = pose.mouthOpen || 0;
        const attackPhase = pose.attackPhase ?? -1;

        // 含胸驼背 → 躯体重心整体偏左、上身矮塌
        const lean = Math.round(sway * 2);
        const cx = 16 + lean;
        const bodyTop = 15 + bodyY; // 比僵尸(13)更低矮

        // 地面投影
        d.ellipse(16, 29, 6, 2, 'rgba(0,0,0,0.28)');

        this.drawLegs(d, cx, legPhase, sway);
        this.drawTorso(d, cx, bodyTop);
        this.drawHead(d, cx, bodyTop - 4, headTilt, mouthOpen);

        if (attackPhase >= 0) {
            this.drawAttackArms(d, cx, bodyTop, attackPhase);
        } else {
            this.drawArms(d, cx, bodyTop, armSwing);
        }

        return d.getCanvas();
    }

    /** 细腿：两条枯瘦小腿交替拖步，落步侧微沉。 */
    drawLegs(d, cx, legPhase, sway) {
        const leftFwd = legPhase === 1 || legPhase === 2;
        const lx = cx - 3 + (leftFwd ? 1 : 0);
        const rx = cx + 1 - (leftFwd ? 0 : 1);
        const lLen = leftFwd ? 5 : 6;
        const rLen = leftFwd ? 6 : 5;

        // 左腿（后）
        d.rect(lx, 24, 2, lLen - 1, this.cSkinDark);
        d.rect(lx - 1, 23 + lLen - 1, 3, 1, this.cRagDark); // 烂脚掌
        // 右腿（前）
        d.rect(rx, 24, 2, rLen - 1, this.cSkin);
        d.pixel(rx, 26, this.cSkinDark);
        d.rect(rx - 1, 23 + rLen - 1, 3, 1, this.cRagDark);
        // 裹腿布条
        d.hLine(lx, 25, 2, this.cRag);
        d.hLine(rx, 26, 2, this.cRag);
    }

    /** 驼背躯干：裹尸布残片罩住佝偻的窄背，露出一根肋与血污。 */
    drawTorso(d, cx, top) {
        // 驼起的背脊（右上隆起）
        d.fillPath([
            { x: cx - 4, y: top + 1 },
            { x: cx + 2, y: top - 1 },
            { x: cx + 4, y: top + 3 },
            { x: cx + 3, y: top + 9 },
            { x: cx - 4, y: top + 9 }
        ], this.cRag);
        // 布料暗褶
        d.vLine(cx - 2, top + 2, 6, this.cRagDark);
        d.vLine(cx + 2, top + 1, 7, this.cRagDark);
        d.pixel(cx + 3, top, this.cRagLight); // 驼峰高光
        // 领口露出的脖颈/锁骨腐肉
        d.hLine(cx - 2, top, 4, this.cSkin);
        d.pixel(cx - 1, top, this.cSkinLight);
        // 破洞露肋 + 血污
        d.pixel(cx - 3, top + 4, this.cBone);
        d.pixel(cx - 3, top + 6, this.cBoneDark);
        d.pixel(cx, top + 7, this.cBlood);
        d.pixel(cx - 1, top + 8, this.cBlood);
    }

    /** 缩在肩里的小头颅：耷拉前倾、凹陷死瞳、豁牙张嘴。 */
    drawHead(d, cx, cy, tilt, mouthOpen) {
        const tx = Math.round(tilt * 2);
        const hx = cx - 3 + tx; // 头前探（朝左），缩在肩前
        const hy = cy;

        // 颅（偏小，椭圆）
        d.ellipse(hx, hy, 4, 4, this.cSkin);
        d.ellipse(hx - 1, hy - 1, 2, 2, this.cSkinLight);
        d.pixel(hx + 3, hy + 1, this.cSkinDark);
        // 稀发/头皮
        d.hLine(hx - 2, hy - 4, 4, this.cSkinDark);
        d.pixel(hx, hy - 4, this.cRagDark);
        // 凹陷眼窝 + 微光死瞳（朝左）
        d.rect(hx - 3, hy - 1, 2, 2, this.cSocket);
        d.pixel(hx - 3, hy - 1, this.cEye);
        d.pixel(hx, hy - 1, this.cSocket);
        // 张嘴豁牙
        const gap = Math.round(mouthOpen * 2);
        d.rect(hx - 3, hy + 2, 4, 1 + gap, this.cSocket);
        d.pixel(hx - 2, hy + 2, this.cBone);
        d.pixel(hx, hy + 2, this.cBone);
        if (gap > 0) d.pixel(hx - 1, hy + 2 + gap, this.cBlood);
    }

    /** 常态双臂：枯长手臂无力垂摆，指尖过膝（人潮踉跄感）。 */
    drawArms(d, cx, top, swing) {
        const s = Math.sin(swing * Math.PI * 2);
        const fdx = Math.round(s * 2);

        // 前臂（朝左，垂而前探）
        d.rect(cx - 5, top + 1, 2, 4, this.cSkin);
        d.rect(cx - 6 + fdx, top + 5, 2, 4, this.cSkinDark);
        this.drawClaw(d, cx - 6 + fdx, top + 9);
        // 后臂（较短，反相摆）
        d.rect(cx + 3, top + 1, 2, 4, this.cSkinDark);
        d.rect(cx + 3 - Math.round(s * 1), top + 5, 2, 3, this.cSkin);
        this.drawClaw(d, cx + 3 - Math.round(s * 1), top + 8);
    }

    /** 攻击臂：双臂猛地前伸扑抓（attackPhase 0 蓄→1 抓）。 */
    drawAttackArms(d, cx, top, phase) {
        const reach = Math.round(phase * 6); // 前探量
        const rise = Math.round(Math.sin(phase * Math.PI) * 2);

        // 双臂并拢前扑
        d.rect(cx - 5 - reach, top + 1 - rise, 4, 2, this.cSkin);
        d.rect(cx - 6 - reach, top + 2 - rise, 2, 3, this.cSkinDark);
        this.drawClaw(d, cx - 7 - reach, top + 4 - rise, true);

        d.rect(cx - 5 - reach, top + 4, 4, 2, this.cSkinDark);
        d.rect(cx - 6 - reach, top + 5, 2, 3, this.cSkin);
        this.drawClaw(d, cx - 7 - reach, top + 7, true);
    }

    /** 爪状手：三指枯爪（open=攻击时张开）。 */
    drawClaw(d, x, y, open = false) {
        d.pixel(x, y, this.cBone);
        d.pixel(x, y + 1, this.cSkinDark);
        if (open) {
            d.pixel(x - 1, y - 1, this.cBoneDark);
            d.pixel(x - 1, y + 2, this.cBoneDark);
        } else {
            d.pixel(x, y + 2, this.cBoneDark);
        }
    }
}
