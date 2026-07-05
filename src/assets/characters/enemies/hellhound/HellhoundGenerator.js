// HellhoundGenerator —— 地牢狱火犬：低伏四足恶犬（炭黑体 + 橙红焰鬃/焰眼/焰尾）。
// 性格=狂暴。四足双相位奔跑 + 背脊起伏、多簇独立摆动的焰鬃、拖曳尾焰、
// 狂喘吐舌（胸腔起伏）、前扑压低爪张开焰鬃暴涨。32×32，默认朝左（头在左）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class HellhoundGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 炭黑体（4 阶）
        this.cBody = '#2f2c33';
        this.cBodyDark = '#1d1b21';
        this.cBodyLight = '#45414a';
        this.cBodyEdge = '#0f0e12';
        this.cBelly = '#241f26';   // 焦黑腹部

        // 地狱焰（自暗到亮 5 阶）
        this.cEmberDeep = '#c0361a';
        this.cEmber = '#ff6a1f';
        this.cEmberHot = '#ffd23e';
        this.cEmberCore = '#fff3b0';

        // 眼与齿
        this.cEye = '#ff8a2a';
        this.cEyeHot = '#ffd23e';
        this.cFang = '#e8e2d2';
        // 舌
        this.cTongue = '#d0453a';
        this.cTongueDark = '#8f2b26';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.legPhase=0]    步态相位 0~1（前后腿双相位）
     * @param {number} [pose.bob=0]         身体起伏
     * @param {number} [pose.lunge=0]       前扑量 0~1（低伏后蹬前扑）
     * @param {number} [pose.ember=0.5]     焰鬃/焰眼/焰尾强度 0~1
     * @param {number} [pose.spineArc=0]    背脊拱伸 -1~1（奔跑伸展/收拢）
     * @param {number} [pose.pant=0]        狂喘 0~1（胸腔起伏 + 吐舌）
     * @param {number} [pose.clawSpread=0]  前爪张开 0~1（扑击）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const legPhase = pose.legPhase || 0;
        const bob = pose.bob || 0;
        const lunge = pose.lunge || 0;
        const ember = pose.ember == null ? 0.5 : pose.ember;
        const spineArc = pose.spineArc || 0;
        const pant = pose.pant || 0;
        const clawSpread = pose.clawSpread || 0;

        const bodyY = 16 + bob - Math.round(lunge * 2);
        const headX = 8 - Math.round(lunge * 3); // 前扑时头前探

        // 贴地长影（前扑时更长）
        d.ellipse(16, 29, 10 + Math.round(lunge * 2), 2, 'rgba(0,0,0,0.28)');

        this.drawTail(d, bodyY, ember, spineArc);
        this.drawLegs(d, bodyY, legPhase, lunge, clawSpread);
        this.drawBody(d, bodyY, spineArc, pant);
        this.drawHead(d, headX, bodyY, ember, pant);
        this.drawMane(d, headX, bodyY, ember, spineArc);

        return d.getCanvas();
    }

    /** 四足双相位：前腿对 / 后腿对反相摆动，含远近腿深度错层。 */
    drawLegs(d, bodyY, legPhase, lunge, clawSpread) {
        const frontPh = legPhase * Math.PI * 2;
        const backPh = legPhase * Math.PI * 2 + Math.PI; // 后腿反相
        const hipY = bodyY + 6;

        // 后腿对（右，近深远浅错层）
        this.drawLeg(d, 22, hipY, backPh + 0.3, false, lunge, 0);
        this.drawLeg(d, 20, hipY, backPh, true, lunge, 0);
        // 前腿对（左）——扑击时前爪张开
        this.drawLeg(d, 13, hipY, frontPh + 0.3, false, lunge, clawSpread);
        this.drawLeg(d, 11, hipY, frontPh, true, lunge, clawSpread);
    }

    /** 单腿：随相位前后摆 + 抬落，落地爪泛余烬。 */
    drawLeg(d, hipX, hipY, ph, near, lunge, clawSpread) {
        const swing = Math.round(Math.sin(ph) * 3);
        const lift = Math.max(0, Math.round(Math.cos(ph) * 2));
        const col = near ? this.cBody : this.cBodyDark;
        const legLen = 6 - lift + Math.round(lunge * 2);

        d.rect(hipX, hipY - lift, 2, 3, col);                 // 大腿
        d.rect(hipX + swing, hipY + 3 - lift, 2, legLen - 3, col); // 小腿（随摆偏移）
        // 爪 + 余烬
        const pawX = hipX + swing;
        const pawY = hipY - lift + legLen;
        d.pixel(pawX, pawY, this.cEmberDeep);
        d.pixel(pawX + 1, pawY, near ? this.cBodyEdge : this.cBodyDark);
        // 扑击张爪：前爪撑开三趾
        if (clawSpread > 0.4) {
            d.pixel(pawX - 1, pawY, this.cEmberDeep);
            d.pixel(pawX + 2, pawY, this.cEmber);
            d.pixel(pawX, pawY + 1, this.cEmberDeep);
        }
    }

    /** 低伏犬躯干：背脊随 spineArc 拱伸，腹部随 pant 起伏。 */
    drawBody(d, bodyY, spineArc, pant) {
        const arch = Math.round(spineArc * 2);   // 背脊拱起量
        const chest = Math.round(pant * 1);       // 胸腔鼓动
        d.fillPath([
            { x: 9,  y: bodyY + 2 },
            { x: 15, y: bodyY - arch },
            { x: 22, y: bodyY - 1 },
            { x: 25, y: bodyY + 3 },
            { x: 24, y: bodyY + 7 },
            { x: 10, y: bodyY + 8 + chest },
            { x: 7,  y: bodyY + 5 }
        ], this.cBody);

        // 背脊高光（随拱伸移动）
        d.hLine(12, bodyY + 1 - arch, 10, this.cBodyLight);
        d.pixel(15, bodyY - arch, this.cBodyLight);
        // 腹部焦黑暗部（随喘息鼓动）
        d.hLine(11, bodyY + 7 + chest, 12, this.cBelly);
        d.hLine(11, bodyY + 8 + chest, 10, this.cBodyDark);
        // 后胯肌团（隆起的奔跑腿肌）
        d.fillPath([
            { x: 20, y: bodyY + 1 },
            { x: 24, y: bodyY + 2 },
            { x: 23, y: bodyY + 6 },
            { x: 20, y: bodyY + 6 }
        ], this.cBodyLight);
        d.pixel(22, bodyY + 4, this.cBody); // 肌沟
        // 肩胛肌团（前腿驱动）
        d.pixel(12, bodyY + 2, this.cBodyLight);
        d.pixel(13, bodyY + 3, this.cBodyDark);
        // 肋腹striation（数道肌理暗纹）
        d.pixel(15, bodyY + 4, this.cBodyDark);
        d.pixel(17, bodyY + 5, this.cBodyDark);
        d.pixel(19, bodyY + 4, this.cBodyDark);
        // 脊背余温（焰鬃根部透出的暗红热纹）
        d.pixel(16, bodyY - arch, this.cEmberDeep);
        d.pixel(19, bodyY - 1, this.cEmberDeep);
    }

    /** 焰尾：右后翘起的火束，随 ember 拖曳三段渐亮。 */
    drawTail(d, bodyY, ember, spineArc) {
        const arch = Math.round(spineArc * 1);
        // 尾根（炭黑）
        d.rect(24, bodyY + 1 - arch, 3, 2, this.cBody);
        // 火束三段（自暗到亮，末梢随 ember 拉长）
        const flick = Math.round(Math.sin(ember * Math.PI * 2) * 1);
        d.pixel(26, bodyY - 1 - arch, this.cEmberDeep);
        d.pixel(27, bodyY - 2 - arch + flick, this.cEmber);
        d.pixel(28, bodyY - 3 - arch + flick, this.cEmberHot);
        if (ember > 0.5) {
            d.pixel(28, bodyY - 4 - arch + flick, this.cEmberHot);
            d.pixel(29, bodyY - 4 - arch, this.cEmberCore);
        }
    }

    /** 犬头（朝左）：吻部前伸 + 焰眼 + 尖耳 + 狂喘吐舌露牙。 */
    drawHead(d, headX, bodyY, ember, pant) {
        // 头颅
        d.fillPath([
            { x: headX,     y: bodyY + 1 },
            { x: headX + 6, y: bodyY },
            { x: headX + 7, y: bodyY + 6 },
            { x: headX - 3, y: bodyY + 6 },
            { x: headX - 4, y: bodyY + 3 }
        ], this.cBody);
        d.hLine(headX, bodyY + 1, 5, this.cBodyLight); // 额高光
        // 吻部
        d.rect(headX - 5, bodyY + 3, 3, 3, this.cBodyDark);
        d.pixel(headX - 5, bodyY + 4, this.cEmberDeep); // 鼻

        // 尖耳（后掠，狂暴时压低）
        const earDrop = pant > 0.5 ? 1 : 0;
        d.fillPath([
            { x: headX + 4, y: bodyY + earDrop },
            { x: headX + 6, y: bodyY - 4 + earDrop },
            { x: headX + 7, y: bodyY + earDrop }
        ], this.cBodyDark);
        d.pixel(headX + 6, bodyY - 2 + earDrop, this.cEmberDeep); // 耳内余烬

        // 焰眼（朝左），ember 高时转白热
        const eye = ember > 0.35 ? this.cEyeHot : this.cEye;
        d.pixel(headX - 1, bodyY + 3, eye);
        d.pixel(headX, bodyY + 3, this.cEye);
        d.pixel(headX - 1, bodyY + 2, this.cEmberDeep); // 眼上焰纹

        // 狂喘：下颌张开吐舌 + 露獠牙
        if (pant > 0.2) {
            const gape = Math.round(pant * 2);
            d.rect(headX - 4, bodyY + 6, 4, 1 + gape, '#160d0d'); // 口腔
            d.pixel(headX - 4, bodyY + 6, this.cFang); // 上獠牙
            d.pixel(headX - 1, bodyY + 6, this.cFang);
            // 吐舌（垂出并随喘动）
            d.pixel(headX - 3, bodyY + 6 + gape, this.cTongue);
            d.pixel(headX - 3, bodyY + 7 + gape, this.cTongueDark);
            d.pixel(headX - 2, bodyY + 7 + gape, this.cTongue);
        } else {
            d.pixel(headX - 4, bodyY + 6, this.cFang); // 静默时仅微露牙
        }
    }

    /** 焰鬃：颈背 4 簇火苗，各自独立相位摆动；spineArc/ember 高时整体暴涨。 */
    drawMane(d, headX, bodyY, ember, spineArc) {
        const surge = Math.max(0, spineArc) + ember; // 暴涨系数
        const tips = [
            { x: headX + 5,  base: bodyY - 1 },
            { x: headX + 8,  base: bodyY - 2 },
            { x: headX + 11, base: bodyY - 1 },
            { x: headX + 14, base: bodyY - 1 }
        ];
        for (let i = 0; i < tips.length; i++) {
            const t = tips[i];
            // 每簇独立相位（错开 1.1rad）+ 高度随 surge 增长
            const ph = (ember + i * 0.35) * Math.PI * 2;
            const flick = Math.round(Math.sin(ph) * 1.5);
            const h = 3 + Math.round(surge * 2);
            const y0 = t.base - h + flick;
            // 火苗（深→亮）
            d.rect(t.x, y0 + 2, 2, h - 1, this.cEmberDeep);
            d.pixel(t.x, y0 + 1, this.cEmber);
            d.pixel(t.x, y0, this.cEmberHot);
            if (ember > 0.5) d.pixel(t.x, y0 - 1, this.cEmberCore); // 白热尖
        }
        // 眉心与鼻梁余烬
        d.pixel(headX + 2, bodyY - 1, this.cEmber);
        d.pixel(headX + 3, bodyY, this.cEmberDeep);
    }
}
