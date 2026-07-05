// CultistGenerator —— 地牢炼狱僧侣（暗青袍 + 火色内衬 + 念珠 + 三枝烛台幽焰；蓄力周身浮焰，三连时袍摆后掀，idle 低语）。
// 32×32，默认朝左；长袍盖腿。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class CultistGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 暗青长袍（四阶，冷色）
        this.cRobe = '#2f4648';
        this.cRobeDark = '#1f3132';
        this.cRobeLight = '#436366';
        this.cRobeEdge = '#142425';
        // 火色内衬（冷袍内的热对比）
        this.cLining = '#d8622a';
        this.cLiningDark = '#a53f18';
        this.cLiningHot = '#ffa554';
        // 素绳与滚边
        this.cTrim = '#7d8a6c';
        this.cBelt = '#1a2827';
        // 骨念珠
        this.cBead = '#c2b088';
        this.cBeadDark = '#8f7d54';
        // 兜帽内与脸
        this.cHoodShadow = '#0f1c1c';
        this.cSkin = '#b6a08e';
        this.cSkinShadow = '#89725f';
        this.cEye = '#7ef7d4';
        // 烛台与幽焰
        this.cCandle = '#d8d0b8';
        this.cCandleDark = '#a89a7c';
        this.cStick = '#3a3a44';
        this.cStickLight = '#565662';
        this.cFlame = '#9dfce0';
        this.cFlameCore = '#eafff9';
        this.cFlameGlow = '#4fbfa2';
        this.cEmber = '#7ef7d4';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降（呼吸/bob）
     * @param {{x:number,y:number}} [pose.headOffset] 头部偏移
     * @param {number} [pose.robeWave=0] 袍摆相位 0~1
     * @param {number} [pose.lean=0] 前倾像素
     * @param {number} [pose.cast=0] 举烛台程度 0~1（攻击）
     * @param {number} [pose.flamePulse=0] 三枝烛焰充能 0~1
     * @param {number} [pose.whisper=0] 低语下颌微动 0~1（idle）
     * @param {number} [pose.emberCount=0] 周身幽焰浮点数量 0~1（蓄力渐增）
     * @param {number} [pose.hemFlip=0] 袍摆后掀 0~1（三连发射）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const headOff = pose.headOffset || { x: 0, y: 0 };
        const robeWave = pose.robeWave || 0;
        const lean = pose.lean || 0;
        const cast = pose.cast || 0;
        const flamePulse = pose.flamePulse || 0;
        const whisper = pose.whisper || 0;
        const emberCount = pose.emberCount || 0;
        const hemFlip = pose.hemFlip || 0;

        const cx = 16 - lean;
        const bodyTop = 14 + squash;

        d.ellipse(16 - Math.round(lean * 0.5), 29, 8, 3, 'rgba(0,0,0,0.3)');

        this.drawRobe(d, cx, bodyTop, robeWave, hemFlip);
        this.drawBeads(d, cx, bodyTop);
        this.drawHead(d, cx + headOff.x - lean, 9 + squash + headOff.y, whisper);
        this.drawCandelabra(d, cx, bodyTop, cast, flamePulse);
        // 周身幽焰浮点（蓄力渐增）
        if (emberCount > 0.05) this.drawEmbers(d, cx, bodyTop, emberCount, robeWave);

        return d.getCanvas();
    }

    /** 分层钟形暗青袍 + 前襟火色内衬 + 波动/后掀裙摆。 */
    drawRobe(d, cx, top, robeWave, hemFlip) {
        const hemY = 28;
        const swing = Math.sin(robeWave * Math.PI * 2);
        const hemShift = Math.round(swing * 1.2);
        const flip = Math.round(hemFlip * 3); // 后掀：摆缘向右后扬起

        // 外袍主体（后掀时右缘外扩）
        d.fillPath([
            { x: cx - 3, y: top - 1 },
            { x: cx - 6, y: top + 3 },
            { x: cx - 8 + hemShift, y: hemY },
            { x: cx + 8 + hemShift + flip, y: hemY },
            { x: cx + 6, y: top + 3 },
            { x: cx + 3, y: top - 1 }
        ], this.cRobe);

        // 受光 / 压暗
        d.vLine(cx - 6, top + 4, hemY - top - 4, this.cRobeLight);
        d.vLine(cx - 5, top + 5, hemY - top - 6, this.cRobeLight);
        d.vLine(cx + 6, top + 4, hemY - top - 4, this.cRobeDark);
        d.vLine(cx + 7 + hemShift, hemY - 3, 3, this.cRobeEdge);

        // 前襟火色内衬开口（冷袍透出的热光）
        const slitBot = cx + Math.round(swing * 1.2);
        d.fillPath([
            { x: cx - 1, y: top + 3 },
            { x: cx + 2, y: top + 3 },
            { x: slitBot + 3, y: hemY - 1 },
            { x: slitBot - 3, y: hemY - 1 }
        ], this.cLining);
        d.vLine(cx - 1, top + 4, hemY - top - 5, this.cLiningDark);
        d.pixel(cx + 1, top + 6, this.cLiningHot);
        d.pixel(slitBot, hemY - 3, this.cLiningHot);
        d.pixel(cx, top + 12, this.cLiningHot);

        // 素绳腰带
        d.hLine(cx - 6, top + 6, 12, this.cBelt);
        d.pixel(cx - 1, top + 6, this.cTrim);
        // 后掀时露出更多火色内衬（右下角）
        if (hemFlip > 0.3) {
            d.fillPath([
                { x: cx + 6, y: hemY - 4 },
                { x: cx + 8 + flip, y: hemY },
                { x: cx + 5, y: hemY }
            ], this.cLiningHot);
        }

        // 波动裙摆
        for (let i = -8; i <= 8; i++) {
            const wave = Math.sin(robeWave * Math.PI * 2 + i * 0.8);
            const dy = wave > 0.35 ? -1 : (wave < -0.55 ? 1 : 0);
            d.pixel(cx + i + hemShift, hemY + dy, this.cRobeEdge);
            if (dy <= 0) d.pixel(cx + i + hemShift, hemY - 1 + dy, this.cRobe);
        }
    }

    /** 骨念珠：绕颈垂于胸前的一串小珠。 */
    drawBeads(d, cx, top) {
        // 环绕胸前的珠链（弧形逐颗）
        const beads = [
            [cx - 4, top + 2], [cx - 3, top + 4], [cx - 2, top + 5],
            [cx, top + 6], [cx + 2, top + 5], [cx + 3, top + 4], [cx + 4, top + 2]
        ];
        for (const [bx, by] of beads) {
            d.pixel(bx, by, this.cBead);
            d.pixel(bx, by + 1, this.cBeadDark);
        }
        // 垂坠（胸前下垂两颗 + 十字坠）
        d.pixel(cx, top + 7, this.cBead);
        d.pixel(cx, top + 8, this.cBeadDark);
        d.pixel(cx, top + 9, this.cTrim);
    }

    /** 兜帽头：帽腔幽绿眼 + 微露下颌（whisper 低语时下颌开合）。 */
    drawHead(d, cx, cy, whisper) {
        // 帽体
        d.fillPath([
            { x: cx - 5, y: cy + 1 },
            { x: cx - 3, y: cy - 4 },
            { x: cx + 1, y: cy - 5 },
            { x: cx + 5, y: cy - 2 },
            { x: cx + 6, y: cy + 3 },
            { x: cx - 5, y: cy + 4 }
        ], this.cRobe);
        d.hLine(cx - 3, cy - 4, 4, this.cRobeLight);
        d.vLine(cx + 5, cy - 1, 4, this.cRobeDark);

        // 帽内深腔
        d.fillPath([
            { x: cx - 5, y: cy },
            { x: cx + 1, y: cy - 1 },
            { x: cx + 2, y: cy + 4 },
            { x: cx - 5, y: cy + 4 }
        ], this.cHoodShadow);

        // 幽绿双眼（朝左）
        d.pixel(cx - 4, cy + 1, this.cEye);
        d.pixel(cx - 1, cy + 1, this.cEye);
        d.pixel(cx - 4, cy + 2, this.cFlameGlow); // 眼下拖光

        // 下颌（露于帽檐下，低语时随 whisper 开合下移）
        const jawY = cy + 3 + Math.round(whisper);
        d.hLine(cx - 4, jawY, 3, this.cSkin);
        d.pixel(cx - 4, jawY, this.cSkinShadow);
        if (whisper > 0.4) {
            // 口部张开的暗缝
            d.pixel(cx - 3, jawY - 1, this.cHoodShadow);
        }
    }

    /** 三枝烛台：垂持（cast 0）→ 前举（1）；握于左前方胸高，三枝烛焰随 flamePulse 幽绿充能（对应三连）。 */
    drawCandelabra(d, cx, bodyTop, cast, flamePulse) {
        const handX = cx - 7;
        const handY = bodyTop + 7 - Math.round(cast * 5);
        d.rect(handX, handY, 3, 3, this.cRobeDark); // 袖口
        d.pixel(handX + 1, handY + 1, this.cRobe);

        // 主杆（垂直 → 随 cast 前举）
        const tilt = Math.round(cast * 3);
        const stickX = handX + 1 - tilt;
        const topY = handY - 6 - Math.round(cast * 2); // 顶端约胸高，不高过头
        for (let y = topY; y < handY; y++) {
            d.pixel(stickX, y, this.cStick);
            d.pixel(stickX + 1, y, this.cStickLight);
        }
        // 烛台底盘
        d.hLine(stickX - 1, handY, 3, this.cStick);

        // 三枝横臂（紧凑 5px：中 + 左右）
        d.hLine(stickX - 2, topY, 5, this.cStick);
        d.pixel(stickX - 2, topY - 1, this.cStickLight); // 侧枝微上翘
        d.pixel(stickX + 2, topY - 1, this.cStickLight);

        // 三根蜡烛 + 三簇幽焰（侧枝略低、中枝高，呈烛台层次）
        const candles = [
            { x: stickX - 2, base: topY - 1 },
            { x: stickX, base: topY - 2 },
            { x: stickX + 2, base: topY - 1 }
        ];
        for (const c of candles) {
            // 蜡烛
            d.pixel(c.x, c.base, this.cCandle);
            d.pixel(c.x, c.base + 1, this.cCandleDark);
            // 幽焰（随 flamePulse 分阶）
            const fy = c.base - 1;
            d.pixel(c.x, fy, this.cFlameCore);
            if (flamePulse > 0.15) {
                d.pixel(c.x, fy - 1, this.cFlame);
                d.pixel(c.x - 1, fy, this.cFlameGlow);
                d.pixel(c.x + 1, fy, this.cFlameGlow);
            }
            if (flamePulse > 0.6) {
                d.pixel(c.x, fy - 2, this.cFlame);
                d.pixel(c.x, fy - 1, this.cFlameCore);
            }
        }
    }

    /** 周身幽焰浮点：绕身体上升的鬼火点，数量随 emberCount 增加、相位随袍摆错动。 */
    drawEmbers(d, cx, bodyTop, emberCount, robeWave) {
        const spots = [
            { x: cx - 9, y: bodyTop + 8, ph: 0.0 },
            { x: cx + 9, y: bodyTop + 6, ph: 0.3 },
            { x: cx - 7, y: bodyTop + 1, ph: 0.6 },
            { x: cx + 8, y: bodyTop + 12, ph: 0.15 },
            { x: cx - 10, y: bodyTop + 14, ph: 0.8 },
            { x: cx + 6, y: bodyTop - 2, ph: 0.5 }
        ];
        const n = Math.ceil(spots.length * emberCount);
        for (let k = 0; k < n; k++) {
            const s = spots[k];
            const rise = Math.round(Math.sin((robeWave + s.ph) * Math.PI * 2) * 2); // 上下浮动
            d.pixel(s.x, s.y + rise, this.cEmber);
            if (emberCount > 0.6) d.pixel(s.x, s.y + rise - 1, this.cFlameCore);
        }
    }
}
