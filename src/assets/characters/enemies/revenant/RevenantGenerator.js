// RevenantGenerator —— 复生亡灵：绷带裹身的憔悴亡者。
// 灰绿枯瘦躯体缠满脏绷带，眼窝空洞（复活后转为血红）；散口绷带随动飘动。
// 32×32，默认朝左（脸/前爪偏 -x）。attack 时枯爪前挥（attackPhase 0~1 + drawAttackArms）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class RevenantGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 枯瘦皮肉（灰绿四阶）
        this.cSkin = '#9aa38c';
        this.cSkinDark = '#6f7862';
        this.cSkinShadow = '#4b5341';
        this.cSkinEdge = '#333a2b';
        // 脏绷带四阶
        this.cWrap = '#cfc3a8';
        this.cWrapShadow = '#a89a7c';
        this.cWrapDark = '#7c6e52';
        this.cWrapEdge = '#564b38';
        // 眼窝 / 眼火
        this.cSocket = '#1c1810';
        this.cEye = '#bfe0ff';     // 常态惨白幽光
        this.cEyeHot = '#eaffff';
        this.cEyeRed = '#ff3a2a';  // 复活后血红
        this.cEyeRedHot = '#ffb0a0';
        // 枯爪 / 牙
        this.cClaw = '#d8cbb0';
        this.cClawDark = '#9a8f74';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bob=0]        升降像素
     * @param {number} [pose.legPhase=-1]  跑动腿相位 0~1（<0 站立）
     * @param {number} [pose.armSwing=0]   手臂前后摆 -1~1
     * @param {number} [pose.attackPhase=-1] 挥爪相位 0~1（<0 不攻击）
     * @param {number} [pose.eyeRed=0]     眼火转红 0(惨白)~1(血红)
     * @param {number} [pose.wrapWave=0]   散口绷带摆动相位 0~1
     * @param {number} [pose.slump=0]      前倾/佝偻 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const bob = pose.bob || 0;
        const legPhase = pose.legPhase ?? -1;
        const armSwing = pose.armSwing || 0;
        const attackPhase = pose.attackPhase ?? -1;
        const eyeRed = pose.eyeRed || 0;
        const wrapWave = pose.wrapWave || 0;
        const slump = pose.slump || 0;

        const cx = 16;
        const groundY = 30;
        const lean = Math.round(slump * 2);

        d.ellipse(cx, groundY, 7, 2, 'rgba(0,0,0,0.28)');

        this.drawLegs(d, cx, groundY, legPhase, bob);
        // 后臂（身后）
        if (attackPhase < 0) this.drawBackArm(d, cx, bob, armSwing);
        this.drawBody(d, cx - lean, bob, wrapWave);
        this.drawHead(d, cx - lean, bob, eyeRed, wrapWave);
        // 前臂 / 攻击爪
        if (attackPhase >= 0) this.drawAttackArms(d, cx - lean, bob, attackPhase);
        else this.drawFrontArm(d, cx - lean, bob, armSwing);

        return d.getCanvas();
    }

    drawLegs(d, cx, groundY, legPhase, bob) {
        const top = 22 + bob;
        if (legPhase < 0) {
            d.rect(cx - 4, top, 3, groundY - top - 1, this.cWrapShadow);
            d.rect(cx + 1, top, 3, groundY - top - 1, this.cWrap);
            // 绷带缠脚
            d.rect(cx - 5, groundY - 1, 4, 2, this.cWrapDark);
            d.rect(cx + 1, groundY - 1, 4, 2, this.cWrapDark);
            return;
        }
        const s = Math.sin(legPhase * Math.PI * 2);
        const frontLift = s > 0 ? Math.round(s * 3) : 0;
        const frontX = cx - 4 - Math.round(s * 2);
        d.rect(frontX, top, 3, groundY - top - 1 - frontLift, this.cWrap);
        d.rect(frontX - 1, groundY - 1 - frontLift, 4, 2, this.cWrapDark);
        const backLift = s < 0 ? Math.round(-s * 3) : 0;
        const backX = cx + 1 + Math.round(s * 2);
        d.rect(backX, top, 3, groundY - top - 1 - backLift, this.cWrapShadow);
        d.rect(backX, groundY - 1 - backLift, 4, 2, this.cWrapDark);
    }

    drawBody(d, cx, bob, wrapWave) {
        const top = 13 + bob;
        // 枯瘦躯干
        d.fillPath([
            { x: cx - 4, y: top },
            { x: cx + 4, y: top },
            { x: cx + 4, y: top + 8 },
            { x: cx + 3, y: top + 10 },
            { x: cx - 4, y: top + 10 },
            { x: cx - 5, y: top + 6 }
        ], this.cSkin);
        // 胸腹受光/侧影
        d.vLine(cx - 3, top + 1, 8, this.cSkinDark);
        d.vLine(cx + 3, top + 1, 8, this.cSkinShadow);
        // 缠身绷带（多道横带 + 交叉）
        d.hLine(cx - 5, top + 1, 9, this.cWrap);
        d.hLine(cx - 4, top + 3, 8, this.cWrapShadow);
        d.hLine(cx - 5, top + 5, 9, this.cWrap);
        d.hLine(cx - 4, top + 7, 8, this.cWrapShadow);
        d.hLine(cx - 4, top + 9, 8, this.cWrap);
        // 斜交叉带
        for (let k = 0; k < 5; k++) d.pixel(cx - 3 + k, top + 1 + k * 2, this.cWrapDark);
        // 露出的肋骨暗隙
        d.pixel(cx - 1, top + 2, this.cSkinShadow);
        d.pixel(cx + 1, top + 4, this.cSkinShadow);
        // 散口绷带（腰侧飘带，随 wrapWave）
        const wx = cx + 4;
        const wy = top + 8;
        for (let k = 0; k < 5; k++) {
            const swing = Math.round(Math.sin(wrapWave * Math.PI * 2 + k * 0.5) * (1 + k * 0.4));
            d.pixel(wx + k, wy + k + swing, this.cWrapShadow);
            d.pixel(wx + k, wy + k + swing + 1, this.cWrapDark);
        }
    }

    drawHead(d, cx, bob, eyeRed, wrapWave) {
        const hx = cx - 1;
        const hy = 8 + bob;
        // 颅骨（瘦长椭圆）
        d.ellipse(hx, hy, 6, 6, this.cSkin);
        d.ellipse(hx - 1, hy - 1, 4, 4, this.cSkinDark);   // 面部凹陷
        d.hLine(hx - 5, hy + 5, 9, this.cSkinShadow);       // 下颌影
        // 缠头绷带（斜盖过右上）
        d.fillPath([
            { x: hx - 6, y: hy - 4 },
            { x: hx + 5, y: hy - 6 },
            { x: hx + 6, y: hy - 3 },
            { x: hx - 5, y: hy - 1 }
        ], this.cWrap);
        d.hLine(hx - 5, hy - 3, 10, this.cWrapShadow);
        d.pixel(hx + 4, hy - 5, this.cWrapDark);
        // 散口绷带垂在脸侧（-x）
        const dangle = Math.round(Math.sin(wrapWave * Math.PI * 2) * 1);
        d.pixel(hx - 6, hy, this.cWrap);
        d.pixel(hx - 6 + dangle, hy + 1, this.cWrapShadow);
        d.pixel(hx - 6 + dangle, hy + 2, this.cWrapDark);
        // 空洞眼窝 + 眼火
        d.rect(hx - 5, hy, 3, 2, this.cSocket);
        d.rect(hx - 1, hy, 2, 2, this.cSocket);
        const eye = eyeRed > 0.5 ? this.cEyeRed : this.cEye;
        const eyeHot = eyeRed > 0.5 ? this.cEyeRedHot : this.cEyeHot;
        d.pixel(hx - 4, hy, eye);
        d.pixel(hx - 4, hy + 1, eyeHot);
        d.pixel(hx, hy, eye);
        if (eyeRed > 0.5) {
            // 红瞳外溢
            d.pixel(hx - 5, hy, this.cEyeRed);
            d.pixel(hx + 1, hy + 1, this.cEyeRed);
        }
        // 龇牙（枯口）
        d.hLine(hx - 4, hy + 4, 5, this.cSkinEdge);
        d.pixel(hx - 3, hy + 4, this.cClaw);
        d.pixel(hx - 1, hy + 4, this.cClaw);
    }

    drawBackArm(d, cx, bob, swing) {
        const sx = cx + 2 + Math.round(swing * 2);
        const sy = 14 + bob;
        d.rect(sx, sy, 2, 6, this.cWrapShadow);
        d.pixel(sx, sy + 6, this.cClawDark);
    }

    drawFrontArm(d, cx, bob, swing) {
        const ax = cx - 5 + Math.round(swing * 2);
        const sy = 14 + bob;
        d.rect(ax, sy, 2, 6, this.cWrap);
        // 枯爪
        d.pixel(ax, sy + 6, this.cClaw);
        d.pixel(ax - 1, sy + 7, this.cClaw);
        d.pixel(ax + 1, sy + 7, this.cClawDark);
    }

    /** 攻击枯爪：attackPhase 0→0.5 后拉蓄力，0.5→1 前挥抓击张爪。 */
    drawAttackArms(d, cx, bob, attackPhase) {
        const sy = 13 + bob;
        // 蓄力（后拉）→ 挥击（前探）
        const swing = attackPhase < 0.5 ? -attackPhase * 4 : (attackPhase - 0.5) * 14 - 2;
        const ax = Math.round(cx - 4 - swing);
        // 上臂
        d.rect(Math.min(cx - 2, ax + 2), sy, 3, 2, this.cWrap);
        // 前臂
        d.rect(ax, sy + 1, 4, 2, this.cSkin);
        d.hLine(ax, sy + 1, 4, this.cWrapShadow); // 缠带
        // 张开三枯爪
        const clawX = ax - 1;
        d.pixel(clawX, sy, this.cClaw);
        d.pixel(clawX - 1, sy + 2, this.cClaw);
        d.pixel(clawX, sy + 3, this.cClaw);
        if (attackPhase > 0.5) {
            // 挥击残影
            d.pixel(clawX - 2, sy + 1, this.cClawDark);
            d.pixel(clawX - 2, sy + 2, this.cClawDark);
        }
    }
}
