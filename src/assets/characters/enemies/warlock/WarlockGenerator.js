// WarlockGenerator —— 地牢弹幕法师（分层紫袍 + 垂角兜帽 + 符袋挂坠 + 充能法杖宝珠）。
// 32×32，默认朝左（面/兜帽开口偏左，法杖持于左前方）。长袍盖腿，跑动 = 袍摆+前倾+浮沉。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class WarlockGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 外袍（紫，四阶）
        this.cRobe = '#5d3a8f';
        this.cRobeDark = '#3c245e';
        this.cRobeLight = '#7d5ab8';
        this.cRobeEdge = '#271640';
        // 内衬（洋红，露于前襟开口）
        this.cLining = '#b23a8f';
        this.cLiningDark = '#7a1f63';
        this.cLiningLight = '#e06ec0';
        // 金边符纹
        this.cTrim = '#d9b038';
        this.cTrimDark = '#9c7a1c';
        // 腰带与符袋
        this.cBelt = '#2b1e42';
        this.cPouch = '#5a4326';
        this.cPouchDark = '#3a2a13';
        this.cPouchStrap = '#7a5a30';
        // 挂坠（发光）
        this.cCharm = '#8fe4ff';
        this.cCharmCore = '#e6fbff';
        // 兜帽内与脸
        this.cHoodShadow = '#160e28';
        this.cSkin = '#c9b3b8';
        this.cSkinShadow = '#9a828c';
        this.cEye = '#a6f0ff';
        this.cEyeCore = '#ffffff';
        // 法杖
        this.cStaff = '#6a4a2c';
        this.cStaffDark = '#452e19';
        this.cStaffWrap = '#8a6a3a';
        // 宝珠
        this.cOrb = '#d86eff';
        this.cOrbCore = '#ffe9ff';
        this.cOrbDark = '#8a34b8';
        this.cOrbSwirl = '#f0b8ff';
        this.cArc = '#d9c0ff';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降（呼吸/bob，正值下沉）
     * @param {{x:number,y:number}} [pose.headOffset] 头部偏移
     * @param {number} [pose.robeWave=0] 袍摆相位 0~1（裙摆与兜帽垂角联动）
     * @param {number} [pose.lean=0] 前倾像素（跑动）
     * @param {number} [pose.staffRaise=0] 举杖程度 0~1（攻击时前举）
     * @param {number} [pose.orbPulse=0] 宝珠充能 0~1（暗→亮→溢出电弧）
     * @param {number} [pose.swirlPhase=0] 宝珠内漩涡相位 0~1（idle 旋转）
     * @param {number} [pose.castArm=0] 施法时第二只手抬起 + 袍袖上卷 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const headOff = pose.headOffset || { x: 0, y: 0 };
        const robeWave = pose.robeWave || 0;
        const lean = pose.lean || 0;
        const staffRaise = pose.staffRaise || 0;
        const orbPulse = pose.orbPulse || 0;
        const swirlPhase = pose.swirlPhase || 0;
        const castArm = pose.castArm || 0;

        const cx = 16 - lean;
        const bodyTop = 13 + squash;

        // 落影（前倾时略前移）
        d.ellipse(16 - Math.round(lean * 0.5), 29, 8, 3, 'rgba(0,0,0,0.32)');

        this.drawRobe(d, cx, bodyTop, robeWave);
        // 施法时抬起的第二只手（右手，在身前）
        if (castArm > 0.05) this.drawCastHand(d, cx, bodyTop, castArm, orbPulse);
        this.drawHood(d, cx + headOff.x - lean, 8 + squash + headOff.y, robeWave);
        this.drawStaff(d, cx, bodyTop, staffRaise, orbPulse, swirlPhase, castArm);

        return d.getCanvas();
    }

    /** 分层钟形长袍：外袍 + 前襟内衬开口 + 金边 + 腰带符袋挂坠 + 波动裙摆。 */
    drawRobe(d, cx, top, robeWave) {
        const hemY = 28;
        const swing = Math.sin(robeWave * Math.PI * 2); // -1..1 裙摆摆动
        const hemShift = Math.round(swing * 1.5);        // 摆缘整体偏移

        // 外袍主体（钟形，肩窄摆宽）
        d.fillPath([
            { x: cx - 3, y: top - 1 },
            { x: cx - 6, y: top + 3 },
            { x: cx - 8 + hemShift, y: hemY },
            { x: cx + 8 + hemShift, y: hemY },
            { x: cx + 6, y: top + 3 },
            { x: cx + 3, y: top - 1 }
        ], this.cRobe);

        // 左侧受光高光（光来自左上）
        d.vLine(cx - 6, top + 4, hemY - top - 4, this.cRobeLight);
        d.vLine(cx - 5, top + 5, hemY - top - 6, this.cRobeLight);
        d.pixel(cx - 7 + Math.round(hemShift * 0.5), hemY - 2, this.cRobeLight);
        // 右侧压暗
        d.vLine(cx + 6, top + 4, hemY - top - 4, this.cRobeDark);
        d.vLine(cx + 5, top + 6, hemY - top - 7, this.cRobeDark);
        d.vLine(cx + 7 + hemShift, hemY - 3, 3, this.cRobeEdge);

        // 前襟内衬开口（洋红楔形，随摆动微张）
        const slitBot = cx + Math.round(swing * 1.5);
        d.fillPath([
            { x: cx - 1, y: top + 3 },
            { x: cx + 2, y: top + 3 },
            { x: slitBot + 3, y: hemY - 1 },
            { x: slitBot - 3, y: hemY - 1 }
        ], this.cLining);
        // 内衬明暗
        d.vLine(cx - 1, top + 4, hemY - top - 5, this.cLiningDark);
        d.pixel(cx + 1, top + 5, this.cLiningLight);
        d.pixel(slitBot, hemY - 3, this.cLiningLight);
        // 前襟金边（两道竖向符线）
        d.vLine(cx - 2, top + 3, hemY - top - 4, this.cTrim);
        d.vLine(cx + 3, top + 3, hemY - top - 5, this.cTrimDark);
        // 金符点缀
        d.pixel(cx, top + 8, this.cTrim);
        d.pixel(cx, top + 13, this.cTrim);
        d.pixel(cx, top + 18, this.cTrimDark);

        // 腰带
        d.hLine(cx - 6, top + 6, 12, this.cBelt);
        d.hLine(cx - 6, top + 5, 12, this.cRobeDark);
        d.pixel(cx, top + 6, this.cTrim); // 束扣

        // 左髋符袋（皮质 + 束绳）
        const px = cx - 7, py = top + 7;
        d.rect(px, py, 3, 4, this.cPouch);
        d.vLine(px, py, 4, this.cPouchDark);
        d.hLine(px, py, 3, this.cPouchStrap);      // 袋盖
        d.pixel(px + 1, py + 2, this.cPouchDark);   // 束口

        // 右侧挂坠（发光小符，随袍摆轻晃）
        const cX = cx + 6 + Math.round(swing);
        const cY = top + 8;
        d.pixel(cX, cY, this.cCharm);
        d.pixel(cX, cY + 1, this.cCharmCore);
        d.pixel(cX, cY - 1, this.cBelt); // 挂绳
        d.pixel(cX + 1, cY + 1, this.cCharm);

        // 波动裙摆（逐列错落 + 金边点）
        for (let i = -8; i <= 8; i++) {
            const wave = Math.sin(robeWave * Math.PI * 2 + i * 0.8);
            const dy = wave > 0.35 ? -1 : (wave < -0.55 ? 1 : 0);
            d.pixel(cx + i + hemShift, hemY + dy, this.cRobeEdge);
            if (dy <= 0) d.pixel(cx + i + hemShift, hemY - 1 + dy, this.cRobe);
        }
        // 摆底金边
        d.pixel(cx - 6 + hemShift, hemY, this.cTrimDark);
        d.pixel(cx + 5 + hemShift, hemY, this.cTrimDark);
    }

    /** 兜帽头：帽体 + 垂角（随袍摆摆动）+ 帽内阴影 + 发光双眼。开口偏左。 */
    drawHood(d, cx, cy, robeWave) {
        const swing = Math.sin(robeWave * Math.PI * 2);
        const tipSway = Math.round(swing * 1.5); // 兜帽后垂角摆动

        // 帽体外形（尖顶，后侧下垂）
        d.fillPath([
            { x: cx - 5, y: cy + 1 },
            { x: cx - 3, y: cy - 4 },
            { x: cx, y: cy - 6 },        // 帽尖
            { x: cx + 4, y: cy - 3 },
            { x: cx + 6, y: cy + 2 },
            { x: cx + 5, y: cy + 5 },
            { x: cx - 5, y: cy + 5 }
        ], this.cRobe);
        // 帽顶受光棱
        d.pixel(cx - 1, cy - 5, this.cRobeLight);
        d.pixel(cx - 2, cy - 3, this.cRobeLight);
        d.hLine(cx - 3, cy - 2, 3, this.cRobeLight);
        // 右后压暗
        d.vLine(cx + 5, cy - 1, 5, this.cRobeDark);
        d.pixel(cx + 4, cy + 4, this.cRobeDark);

        // 帽后垂角（尖布条，随 swing 摆动）
        d.fillPath([
            { x: cx + 4, y: cy - 1 },
            { x: cx + 6, y: cy },
            { x: cx + 7 + tipSway, y: cy + 5 },
            { x: cx + 5 + tipSway, y: cy + 5 }
        ], this.cRobeDark);
        d.pixel(cx + 6 + tipSway, cy + 4, this.cRobeEdge);

        // 帽内阴影（开口偏左的深腔）
        d.fillPath([
            { x: cx - 5, y: cy },
            { x: cx + 1, y: cy - 1 },
            { x: cx + 2, y: cy + 4 },
            { x: cx - 5, y: cy + 4 }
        ], this.cHoodShadow);

        // 帽檐下微露面颊
        d.pixel(cx - 5, cy + 2, this.cSkinShadow);
        d.pixel(cx - 5, cy + 3, this.cSkin);

        // 发光双眼（帽内幽光细目，朝左；近眼略亮）
        d.pixel(cx - 4, cy + 2, this.cEye);
        d.pixel(cx - 1, cy + 2, this.cEye);
        d.pixel(cx - 4, cy + 1, this.cEyeCore); // 近眼高光点
        d.pixel(cx - 3, cy + 2, this.cEyeCore); // 眼尾拖光
        // 帽内金边符
        d.pixel(cx + 1, cy - 1, this.cTrimDark);
    }

    /** 施法抬起的第二只手（右手结印于身前，掌心透宝珠色微光）。 */
    drawCastHand(d, cx, bodyTop, castArm, orbPulse) {
        const raise = Math.round(castArm * 5);
        const hx = cx + 4;
        const hy = bodyTop + 4 - raise;
        // 上卷的袍袖（露出前臂）
        d.rect(hx - 1, hy + 2, 3, 3, this.cRobeDark);
        d.hLine(hx - 1, hy + 2, 3, this.cRobeLight); // 卷口高光
        // 手（骨白）
        d.rect(hx, hy, 2, 2, this.cSkin);
        d.pixel(hx, hy, this.cSkinShadow);
        // 掌心微光（随充能）
        if (orbPulse > 0.3) {
            d.pixel(hx, hy - 1, this.cOrb);
            if (orbPulse > 0.7) d.pixel(hx + 1, hy - 1, this.cOrbSwirl);
        }
    }

    /** 法杖：垂持（raise 0）→ 前举（1）；杖头宝珠随 orbPulse 分阶充能、随 swirlPhase 内漩涡旋转。 */
    drawStaff(d, cx, bodyTop, staffRaise, orbPulse, swirlPhase, castArm) {
        // 持杖左手（袍袖伸出左前方，施法时上卷）
        const handX = cx - 8;
        const handY = bodyTop + 6 - Math.round(staffRaise * 5);
        d.rect(handX, handY, 3, 3, this.cRobeDark); // 袖口
        if (castArm > 0.4) d.hLine(handX, handY, 3, this.cRobeLight); // 上卷高光
        d.pixel(handX + 1, handY + 1, this.cRobe);

        // 杖身：垂直 → 随 raise 前倾（顶端向左上）
        const tilt = Math.round(staffRaise * 3);
        const topX = handX + 1 - tilt;
        const topY = handY - 11 - Math.round(staffRaise * 2);
        const botX = handX + 1 + Math.round(tilt * 0.5);
        const botY = handY + 6;
        const steps = 12;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const sx = Math.round(topX + (botX - topX) * t);
            const sy = Math.round(topY + (botY - topY) * t);
            d.pixel(sx, sy, this.cStaff);
            d.pixel(sx + 1, sy, this.cStaffDark);
            // 缠绳纹（每 3 格一道）
            if (i % 3 === 1) d.pixel(sx, sy, this.cStaffWrap);
        }
        // 杖头爪托（三叉夹持宝珠）
        d.pixel(topX - 1, topY + 1, this.cStaffWrap);
        d.pixel(topX + 2, topY + 1, this.cStaffWrap);
        d.pixel(topX, topY + 2, this.cStaff);

        // 杖头宝珠（5x5 核心）
        const ox = topX, oy = topY - 2;
        const stage = orbPulse; // 充能强度
        // 底色：暗时偏 cOrbDark，亮时偏 cOrb
        const shell = stage < 0.35 ? this.cOrbDark : this.cOrb;
        d.rect(ox - 1, oy - 1, 3, 3, shell);
        d.pixel(ox - 2, oy, shell);
        d.pixel(ox + 2, oy, shell);
        d.pixel(ox, oy - 2, shell);
        d.pixel(ox, oy + 2, shell);
        // 核心
        d.pixel(ox, oy, stage < 0.35 ? this.cOrb : this.cOrbCore);

        // 内漩涡（两点绕核心旋转，相位驱动）
        const a = swirlPhase * Math.PI * 2;
        const s1x = ox + Math.round(Math.cos(a));
        const s1y = oy + Math.round(Math.sin(a));
        const s2x = ox + Math.round(Math.cos(a + Math.PI));
        const s2y = oy + Math.round(Math.sin(a + Math.PI));
        d.pixel(s1x, s1y, this.cOrbSwirl);
        d.pixel(s2x, s2y, this.cOrbSwirl);

        // 充能光晕（分阶）
        if (stage > 0.35) {
            d.pixel(ox - 3, oy, this.cOrb);
            d.pixel(ox + 3, oy, this.cOrb);
            d.pixel(ox, oy - 3, this.cOrb);
            d.pixel(ox, oy + 3, this.cOrb);
        }
        if (stage > 0.65) {
            // 外环 + 更亮核
            d.pixel(ox - 2, oy - 2, this.cOrbSwirl);
            d.pixel(ox + 2, oy - 2, this.cOrbSwirl);
            d.pixel(ox - 2, oy + 2, this.cOrbSwirl);
            d.pixel(ox + 2, oy + 2, this.cOrbSwirl);
        }
        if (stage > 0.85) {
            // 溢出电弧（四向锯齿）
            d.pixel(ox - 4, oy - 1, this.cArc);
            d.pixel(ox - 5, oy, this.cArc);
            d.pixel(ox + 4, oy + 1, this.cArc);
            d.pixel(ox + 5, oy, this.cArc);
            d.pixel(ox - 1, oy - 4, this.cArc);
            d.pixel(ox + 1, oy + 4, this.cArc);
            d.pixel(ox + 3, oy - 3, this.cOrbCore);
        }
    }
}
