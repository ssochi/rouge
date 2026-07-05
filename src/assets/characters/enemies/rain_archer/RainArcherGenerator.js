// RainArcherGenerator —— 雨幕射手：戴斗笠的骷髅弓手，背负箭筒，持一张长弓。
// 不打直线弹——攻击时弯弓朝天抛射（aimUp），2s 后在玩家区域落下箭雨。
// 斗笠压住颅顶只露下半骷髅面；背后箭筒斜插数支箭。32×32，默认朝左。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class RainArcherGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 骨（4 阶）
        this.cBone = '#d8d2c0';
        this.cBoneLight = '#ece7d8';
        this.cBoneShadow = '#aaa593';
        this.cBoneDark = '#7d7867';
        this.cSocket = '#241c14';

        // 独目幽蓝火（区别于 archer 的黄火）
        this.cEye = '#5ad2ff';
        this.cEyeDim = '#2b6f8c';

        // 斗笠（枯草编）
        this.cHat = '#c6a95e';
        this.cHatLight = '#e2c884';
        this.cHatDark = '#8a7038';
        this.cHatBand = '#5c4a2a';

        // 破布围裹
        this.cWrap = '#4a5540';
        this.cWrapDark = '#313a2b';

        // 长弓与箭
        this.cWood = '#6e4a2a';
        this.cWoodDark = '#4c3018';
        this.cString = '#e6e0cf';
        this.cArrow = '#c9bfa0';
        this.cArrowHead = '#9aa6b0';
        this.cFletch = '#8a3a3a';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodyY=0]     躯体升降
     * @param {number} [pose.legFrame=0]  步态相位 0~3
     * @param {number} [pose.aimUp=0]     弯弓朝天 0(垂弓)~1(满拉朝上)
     * @param {number} [pose.draw=0]      弓弦回拉 0~1
     * @param {number} [pose.headUp=0]    颅面仰起看天 0~1
     * @param {number} [pose.wrapWave=0]  破布摆动相位 0~1
     * @param {number} [pose.glow=0.5]    独目幽光 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const bodyY = Math.round(pose.bodyY || 0);
        const legFrame = Math.floor(pose.legFrame || 0) % 4;
        const aimUp = pose.aimUp || 0;
        const draw = pose.draw || 0;
        const headUp = pose.headUp || 0;
        const wrapWave = pose.wrapWave || 0;
        const glow = pose.glow ?? 0.5;

        const cx = 16;
        const bodyTop = 13 + bodyY;

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.28)');

        this.drawQuiver(d, cx, bodyTop, wrapWave);
        this.drawLegs(d, cx, legFrame);
        this.drawSpineRibs(d, cx, bodyTop);
        this.drawWrap(d, cx, bodyTop, wrapWave);
        this.drawSkullHat(d, cx, bodyTop - 5, headUp, glow);
        this.drawLongbow(d, cx, bodyTop, aimUp, draw);

        return d.getCanvas();
    }

    /** 背后箭筒：斜插数支箭，箭羽外露（画在躯体后方）。 */
    drawQuiver(d, cx, top, wave) {
        const qx = cx + 3;
        // 筒身（斜插右后）
        d.fillPath([
            { x: qx,     y: top + 1 },
            { x: qx + 4, y: top },
            { x: qx + 5, y: top + 7 },
            { x: qx + 1, y: top + 8 }
        ], this.cWoodDark);
        d.vLine(qx + 4, top + 1, 6, this.cWood);
        // 露出的箭（三支，箭羽在上）
        for (let k = 0; k < 3; k++) {
            const ax = qx + 1 + k * 2;
            const ay = top - 2 - k;
            d.vLine(ax, ay, 4, this.cArrow);
            d.pixel(ax, ay, this.cFletch);      // 箭羽
            d.pixel(ax, ay - 1, this.cFletch);
        }
    }

    /** 骨腿 + 破布裹胫：两腿交替抬步。 */
    drawLegs(d, cx, legFrame) {
        const leftLift = legFrame === 1 ? -1 : 0;
        const rightLift = legFrame === 3 ? -1 : 0;
        d.rect(cx - 4, 24 + leftLift, 2, 5 - leftLift, this.cBone);
        d.pixel(cx - 4, 26 + leftLift, this.cBoneShadow);
        d.rect(cx - 5, 28, 3, 1, this.cBoneDark);
        d.rect(cx + 2, 24 + rightLift, 2, 5 - rightLift, this.cBone);
        d.pixel(cx + 2, 26 + rightLift, this.cBoneShadow);
        d.rect(cx + 1, 28, 3, 1, this.cBoneDark);
        // 裹胫布
        d.hLine(cx - 4, 25, 2, this.cWrap);
        d.hLine(cx + 2, 25, 2, this.cWrap);
    }

    /** 脊柱 + 肋骨：中轴脊椎串起可数的肋。 */
    drawSpineRibs(d, cx, top) {
        for (let k = 0; k < 10; k++) {
            d.pixel(cx, top + k, k % 2 === 0 ? this.cBone : this.cBoneShadow);
        }
        const ribs = [
            { y: top + 1, len: 4 },
            { y: top + 3, len: 4 },
            { y: top + 5, len: 3 },
            { y: top + 7, len: 3 }
        ];
        for (const r of ribs) {
            d.hLine(cx - r.len, r.y, r.len, this.cBone);
            d.pixel(cx - r.len, r.y + 1, this.cBoneShadow);
            d.hLine(cx + 1, r.y, r.len, this.cBoneShadow);
            d.pixel(cx + r.len, r.y + 1, this.cBoneDark);
        }
        d.hLine(cx - 3, top + 9, 7, this.cBoneShadow);
    }

    /** 破布围裹（腰间），随相位轻摆。 */
    drawWrap(d, cx, top, wave) {
        const sway = Math.round(Math.sin(wave * Math.PI * 2) * 1.5);
        d.fillPath([
            { x: cx - 4,        y: top + 6 },
            { x: cx + 4,        y: top + 6 },
            { x: cx + 3 + sway, y: top + 12 },
            { x: cx - 4 + sway, y: top + 12 }
        ], this.cWrap);
        d.vLine(cx - 1, top + 7, 5, this.cWrapDark);
        d.pixel(cx - 4 + sway, top + 12, this.cWrapDark);
    }

    /** 斗笠 + 骷髅面：锥形草帽压住颅顶，露下半骷髅面；仰头(headUp)看天。 */
    drawSkullHat(d, cx, cy, headUp, glow) {
        const lift = Math.round(headUp * 1); // 仰头时面部略上移
        const fy = cy - lift;

        // 骷髅面（露在斗笠下，朝左）
        d.rect(cx - 4, fy - 1, 8, 5, this.cBone);
        d.vLine(cx + 3, fy, 3, this.cBoneShadow);
        // 眼窝 + 独目幽蓝火（朝左）
        d.rect(cx - 3, fy, 2, 2, this.cSocket);
        d.rect(cx + 1, fy, 2, 2, this.cSocket);
        const eyeCol = glow > 0.45 ? this.cEye : this.cEyeDim;
        d.pixel(cx - 3, fy, eyeCol);
        d.pixel(cx + 1, fy, this.cEyeDim);
        if (glow > 0.7) d.pixel(cx - 3, fy + 1, this.cEye);
        // 鼻腔 + 牙列
        d.pixel(cx - 1, fy + 2, this.cSocket);
        d.hLine(cx - 3, fy + 3, 6, this.cBoneShadow);
        for (let k = -2; k <= 2; k++) d.pixel(cx + k, fy + 3, k % 2 === 0 ? this.cBoneLight : this.cBoneShadow);

        // 斗笠（宽锥檐，压在颅顶上方）
        const hy = cy - 4;
        d.fillPath([
            { x: cx - 8, y: hy + 2 },
            { x: cx,     y: hy - 5 },
            { x: cx + 8, y: hy + 2 }
        ], this.cHat);
        // 檐口高光/暗边
        d.hLine(cx - 8, hy + 2, 17, this.cHatDark);
        d.line(cx - 8, hy + 2, cx, hy - 5, this.cHatLight);
        // 编纹（横向草线）
        d.hLine(cx - 5, hy, 10, this.cHatDark);
        d.hLine(cx - 3, hy - 2, 6, this.cHatBand);
        d.pixel(cx, hy - 5, this.cHatLight); // 笠顶尖
    }

    /** 长弓：默认垂持(aimUp=0)；攻击时弯弓朝天(aimUp=1)、弓弦回拉(draw)。 */
    drawLongbow(d, cx, bodyTop, aimUp, draw) {
        const armY = bodyTop + 2;

        if (aimUp < 0.15) {
            // 垂弓待机：长弓竖持于身前左侧
            const bx = cx - 6;
            d.line(bx, armY - 5, bx, armY + 6, this.cWood);
            d.line(bx + 1, armY - 4, bx + 1, armY + 5, this.cWoodDark);
            d.line(bx + 1, armY - 5, bx + 1, armY + 6, this.cString);
            // 持弓骨臂
            d.hLine(bx + 1, armY, cx - bx - 1, this.cBone);
            return;
        }

        // 弯弓朝天：弓身上翘成弧，弓弦回拉，箭镞指向天
        const px = cx - 5;                       // 弓把 X
        const topY = armY - 8 - Math.round(aimUp * 2);  // 上弓梢（朝天）
        const botY = armY + 3;                   // 下弓梢
        const belly = Math.round(3 + aimUp * 1); // 弓臂外张

        // 弓臂（两段弧，向左外张）
        d.line(px, botY, px - belly, (armY + topY) / 2, this.cWood);
        d.line(px - belly, (armY + topY) / 2, px, topY, this.cWood);
        d.pixel(px - belly, Math.round((armY + topY) / 2), this.cWoodDark);

        // 弓弦（回拉，拉点随 draw 靠向躯体）
        const nockX = px + Math.round(draw * 3);
        const nockY = Math.round((topY + botY) / 2);
        d.line(px, topY, nockX, nockY, this.cString);
        d.line(px, botY, nockX, nockY, this.cString);

        // 搭在弦上的箭：朝斜上方（抛射角）
        const arrTipX = px - 3;
        const arrTipY = topY - 3;
        d.line(nockX, nockY, arrTipX, arrTipY, this.cArrow);
        d.pixel(arrTipX, arrTipY, this.cArrowHead);
        d.pixel(arrTipX - 1, arrTipY - 1, this.cArrowHead);
        d.pixel(nockX, nockY, this.cFletch); // 箭尾羽

        // 拉弦骨臂（自躯体伸向弦钩）
        d.hLine(cx - 1, armY + 1, nockX - cx + 1, this.cBone);
        d.pixel(nockX, nockY, this.cBoneLight);
    }
}
