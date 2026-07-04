// WarlockGenerator —— 地牢弹幕法师（紫袍+兜帽+法杖宝珠）。
// 32×32，默认朝左，长袍盖腿（跑动 = 袍摆+前倾+bob，无独立腿帧）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class WarlockGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 长袍
        this.cRobe = '#5d3a8f';
        this.cRobeDark = '#462b6e';
        this.cRobeLight = '#7650ab';
        this.cTrim = '#c9a227';
        this.cBelt = '#3a2a55';
        // 兜帽与脸
        this.cHoodShadow = '#1e1430';
        this.cEye = '#9ef0ff';
        // 法杖
        this.cStaff = '#5a4029';
        this.cStaffDark = '#42301e';
        this.cOrb = '#d86eff';
        this.cOrbCore = '#ffe6ff';
        this.cOrbGlow = '#a34fd1';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降（呼吸/bob）
     * @param {{x:number,y:number}} [pose.headOffset] 头部偏移
     * @param {number} [pose.robeWave=0] 袍摆相位 0~1
     * @param {number} [pose.lean=0] 前倾像素（跑动，朝左为负方向语义上取正值左倾）
     * @param {number} [pose.staffRaise=0] 举杖程度 0~1（攻击）
     * @param {number} [pose.orbPulse=0] 宝珠充能 0~1（攻击发光）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const headOff = pose.headOffset || { x: 0, y: 0 };
        const robeWave = pose.robeWave || 0;
        const lean = pose.lean || 0;
        const staffRaise = pose.staffRaise || 0;
        const orbPulse = pose.orbPulse || 0;

        const cx = 16 - lean;
        const bodyTop = 14 + squash;

        // 落影
        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.3)');

        this.drawRobe(d, cx, bodyTop, robeWave);
        this.drawHead(d, cx + headOff.x - lean, 9 + squash + headOff.y);
        this.drawStaff(d, cx, bodyTop, staffRaise, orbPulse);

        return d.getCanvas();
    }

    /** 钟形长袍：肩→裙摆，摆缘随 robeWave 波动。 */
    drawRobe(d, cx, top, robeWave) {
        const hemY = 28;
        // 主体钟形
        d.fillPath([
            { x: cx, y: top - 2 },
            { x: cx + 5, y: top + 2 },
            { x: cx + 7, y: hemY },
            { x: cx - 7, y: hemY },
            { x: cx - 5, y: top + 2 }
        ], this.cRobe);

        // 左亮右暗（默认朝左，左侧受光）
        d.vLine(cx - 5, top + 3, hemY - top - 3, this.cRobeLight);
        d.vLine(cx - 4, top + 2, hemY - top - 2, this.cRobeLight);
        d.vLine(cx + 5, top + 3, hemY - top - 3, this.cRobeDark);
        d.vLine(cx + 6, top + 5, hemY - top - 5, this.cRobeDark);

        // 腰带 + 金扣
        d.hLine(cx - 4, top + 5, 9, this.cBelt);
        d.pixel(cx - 1, top + 5, this.cTrim);

        // 波动裙摆（错落 1px）
        for (let i = -7; i <= 7; i++) {
            const wave = Math.sin(robeWave * Math.PI * 2 + i * 0.9);
            const dy = wave > 0.3 ? -1 : 0;
            d.pixel(cx + i, hemY + dy, this.cRobeDark);
            if (dy === 0) d.pixel(cx + i, hemY - 1, this.cRobe);
        }
        // 摆底金边点缀
        d.pixel(cx - 5, hemY, this.cTrim);
        d.pixel(cx + 4, hemY, this.cTrim);
    }

    /** 兜帽头：开口朝左，帽内阴影 + 亮眼。 */
    drawHead(d, cx, cy) {
        // 兜帽轮廓（后侧略垂）
        d.fillPath([
            { x: cx - 5, y: cy },
            { x: cx - 3, y: cy - 4 },
            { x: cx + 2, y: cy - 5 },
            { x: cx + 6, y: cy - 2 },
            { x: cx + 6, y: cy + 4 },
            { x: cx - 5, y: cy + 4 }
        ], this.cRobe);
        d.hLine(cx - 3, cy - 4, 5, this.cRobeLight);
        d.vLine(cx + 5, cy - 2, 6, this.cRobeDark);

        // 帽内阴影脸（朝左开口）
        d.rect(cx - 5, cy, 6, 4, this.cHoodShadow);
        // 双眼（朝左）
        d.pixel(cx - 4, cy + 1, this.cEye);
        d.pixel(cx - 1, cy + 1, this.cEye);
    }

    /** 法杖：垂持（staffRaise 0）→ 前举（1），杖头宝珠随 orbPulse 发光。 */
    drawStaff(d, cx, bodyTop, staffRaise, orbPulse) {
        // 持杖手（袍袖伸出，朝左前方）
        const handX = cx - 7;
        const handY = bodyTop + 6 - Math.round(staffRaise * 4);
        d.rect(handX, handY, 3, 2, this.cRobeDark); // 袖口

        // 杖身：垂直 → 随 raise 前倾
        const tiltX = Math.round(staffRaise * 3);
        const topX = handX + 1 - tiltX;
        const topY = handY - 9 - Math.round(staffRaise * 2);
        const botX = handX + 1 + Math.round(tiltX * 0.6);
        const botY = handY + 8;
        // 简化两段直线杆
        const steps = 9;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const sx = Math.round(topX + (botX - topX) * t);
            const sy = Math.round(topY + (botY - topY) * t);
            d.pixel(sx, sy, this.cStaff);
            d.pixel(sx + 1, sy, this.cStaffDark);
        }

        // 杖头宝珠
        const orbX = topX;
        const orbY = topY - 2;
        d.rect(orbX - 1, orbY - 1, 3, 3, this.cOrb);
        d.pixel(orbX, orbY, this.cOrbCore);
        if (orbPulse > 0.15) {
            // 充能光晕
            d.pixel(orbX - 2, orbY, this.cOrbGlow);
            d.pixel(orbX + 2, orbY, this.cOrbGlow);
            d.pixel(orbX, orbY - 2, this.cOrbGlow);
            d.pixel(orbX, orbY + 2, this.cOrbGlow);
        }
        if (orbPulse > 0.6) {
            d.pixel(orbX - 3, orbY - 1, this.cOrb);
            d.pixel(orbX + 3, orbY + 1, this.cOrb);
            d.pixel(orbX - 1, orbY - 3, this.cOrb);
            d.pixel(orbX + 1, orbY + 3, this.cOrbCore);
        }
    }
}
