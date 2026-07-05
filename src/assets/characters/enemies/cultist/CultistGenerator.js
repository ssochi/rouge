// CultistGenerator —— 地牢炼狱僧侣（暗青灰袍 + 兜帽 + 烛台，蓄力放幽焰弹）。
// 32×32，默认朝左；长袍盖腿，攻击时举烛台、幽焰充能。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class CultistGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 暗青灰长袍
        this.cRobe = '#33494a';
        this.cRobeDark = '#243637';
        this.cRobeLight = '#456163';
        this.cTrim = '#7d8a6c';
        this.cBelt = '#1f2e2e';
        // 兜帽与脸
        this.cHoodShadow = '#122020';
        this.cEye = '#7ef7d4';
        // 烛台与幽焰
        this.cCandle = '#c9c2ae';
        this.cStick = '#4a4a52';
        this.cStickDark = '#33333a';
        this.cFlame = '#7ef7d4';
        this.cFlameCore = '#d6fff0';
        this.cFlameGlow = '#4fbfa2';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降（呼吸/bob）
     * @param {{x:number,y:number}} [pose.headOffset] 头部偏移
     * @param {number} [pose.robeWave=0] 袍摆相位 0~1
     * @param {number} [pose.lean=0] 前倾像素
     * @param {number} [pose.cast=0] 举烛台程度 0~1（攻击）
     * @param {number} [pose.flamePulse=0] 幽焰充能 0~1（攻击发光）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const headOff = pose.headOffset || { x: 0, y: 0 };
        const robeWave = pose.robeWave || 0;
        const lean = pose.lean || 0;
        const cast = pose.cast || 0;
        const flamePulse = pose.flamePulse || 0;

        const cx = 16 - lean;
        const bodyTop = 14 + squash;

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.3)');

        this.drawRobe(d, cx, bodyTop, robeWave);
        this.drawHead(d, cx + headOff.x - lean, 9 + squash + headOff.y);
        this.drawCandle(d, cx, bodyTop, cast, flamePulse);

        return d.getCanvas();
    }

    /** 钟形长袍：肩→裙摆，摆缘随 robeWave 波动。 */
    drawRobe(d, cx, top, robeWave) {
        const hemY = 28;
        d.fillPath([
            { x: cx, y: top - 2 },
            { x: cx + 5, y: top + 2 },
            { x: cx + 7, y: hemY },
            { x: cx - 7, y: hemY },
            { x: cx - 5, y: top + 2 }
        ], this.cRobe);

        d.vLine(cx - 5, top + 3, hemY - top - 3, this.cRobeLight);
        d.vLine(cx - 4, top + 2, hemY - top - 2, this.cRobeLight);
        d.vLine(cx + 5, top + 3, hemY - top - 3, this.cRobeDark);
        d.vLine(cx + 6, top + 5, hemY - top - 5, this.cRobeDark);

        // 素绳腰带
        d.hLine(cx - 4, top + 5, 9, this.cBelt);
        d.pixel(cx - 1, top + 5, this.cTrim);

        // 波动裙摆
        for (let i = -7; i <= 7; i++) {
            const wave = Math.sin(robeWave * Math.PI * 2 + i * 0.9);
            const dy = wave > 0.3 ? -1 : 0;
            d.pixel(cx + i, hemY + dy, this.cRobeDark);
            if (dy === 0) d.pixel(cx + i, hemY - 1, this.cRobe);
        }
        d.pixel(cx - 5, hemY, this.cTrim);
        d.pixel(cx + 4, hemY, this.cTrim);
    }

    /** 兜帽头：开口朝左，帽内阴影 + 幽绿亮眼。 */
    drawHead(d, cx, cy) {
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

        d.rect(cx - 5, cy, 6, 4, this.cHoodShadow);
        d.pixel(cx - 4, cy + 1, this.cEye);
        d.pixel(cx - 1, cy + 1, this.cEye);
    }

    /** 烛台：垂持（cast 0）→ 前举（1），烛焰随 flamePulse 幽绿充能。 */
    drawCandle(d, cx, bodyTop, cast, flamePulse) {
        const handX = cx - 7;
        const handY = bodyTop + 6 - Math.round(cast * 4);
        d.rect(handX, handY, 3, 2, this.cRobeDark); // 袖口

        // 烛台杆（垂直 → 随 cast 前举）
        const tiltX = Math.round(cast * 3);
        const stickX = handX + 1 - tiltX;
        const topY = handY - 7 - Math.round(cast * 2);
        // 杆
        d.vLine(stickX, topY, handY - topY, this.cStick);
        d.pixel(stickX + 1, topY + 1, this.cStickDark);
        // 烛台底盘
        d.hLine(stickX - 1, handY, 3, this.cStickDark);
        // 蜡烛
        d.rect(stickX - 1, topY - 2, 3, 2, this.cCandle);

        // 幽焰
        const flX = stickX;
        const flY = topY - 3;
        d.pixel(flX, flY, this.cFlameCore);
        d.pixel(flX, flY + 1, this.cFlame);
        if (flamePulse > 0.15) {
            d.pixel(flX - 1, flY + 1, this.cFlameGlow);
            d.pixel(flX + 1, flY + 1, this.cFlameGlow);
            d.pixel(flX, flY - 1, this.cFlame);
        }
        if (flamePulse > 0.6) {
            d.pixel(flX - 2, flY, this.cFlameGlow);
            d.pixel(flX + 2, flY, this.cFlameGlow);
            d.pixel(flX, flY - 2, this.cFlameCore);
            // 掌心汇聚的幽焰球
            d.rect(cx - 9, bodyTop + 2 - Math.round(cast * 3), 3, 3, this.cFlame);
            d.pixel(cx - 8, bodyTop + 3 - Math.round(cast * 3), this.cFlameCore);
        }
    }
}
