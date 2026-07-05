// PlagueRatGenerator —— 地牢瘟疫鼠：灰褐大鼠（红眼、多段长尾、拱背、蓬松毛皮）。
// 性格=神经质。蛇形多段长尾 + 耳朵/胡须抽动 + 锯齿蓬松毛边 + 发光脓斑；
// Run 贴地窜行压低甩尾，Attack 龇牙后腿立起。32×32，默认朝左（头在左）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class PlagueRatGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 毛皮（4 阶）
        this.cFur = '#6b5d4f';
        this.cFurDark = '#4c4136';
        this.cFurLight = '#87796a';
        this.cFurEdge = '#3a3128';   // 锯齿毛边描线
        this.cBelly = '#9a8a76';     // 腹部浅毛

        // 耳/鼻
        this.cEar = '#8a6d6a';
        this.cEarInner = '#5c4644';
        this.cNose = '#c77b7b';

        // 红眼
        this.cEye = '#e23b2a';
        this.cEyeGlow = '#ff6a52';

        // 齿
        this.cTeeth = '#e6dccb';

        // 尾
        this.cTail = '#9a8574';
        this.cTailDark = '#5f5044';

        // 脓斑（发光）
        this.cPox = '#8fae5a';
        this.cPoxGlow = '#c4e07a';

        // 胡须
        this.cWhisker = '#d8cdb8';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.legPhase=0]  步态相位 0~1
     * @param {number} [pose.bob=0]       拱背起伏
     * @param {number} [pose.tailWave=0]  尾摆相位 0~1
     * @param {number} [pose.twitch=0]    抽搐 0~1（耳/须）
     * @param {number} [pose.rear=0]      后腿立起 0~1（龇牙攻击）
     * @param {number} [pose.crouch=0]    贴地压低 0~1（窜行）
     * @param {number} [pose.snarl=0]     龇牙 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const legPhase = pose.legPhase || 0;
        const bob = pose.bob || 0;
        const tailWave = pose.tailWave || 0;
        const twitch = pose.twitch || 0;
        const rear = pose.rear || 0;
        const crouch = pose.crouch || 0;
        const snarl = pose.snarl || 0;

        // 压低时整体下沉，立起时前身抬升
        const bodyY = 17 + bob + Math.round(crouch * 2);
        const frontLift = Math.round(rear * 6); // 立起时头/前身抬高量

        d.ellipse(16, 28, 8 + Math.round(crouch * 2), 2, 'rgba(0,0,0,0.25)');

        this.drawTail(d, bodyY, tailWave, crouch);
        this.drawLegs(d, bodyY, legPhase, rear);
        this.drawBody(d, bodyY, frontLift, twitch);
        this.drawHead(d, bodyY, frontLift, twitch, snarl);

        return d.getCanvas();
    }

    /** 长尾：蛇形多段（近粗远细），随相位摆动；窜行时甩幅更大。 */
    drawTail(d, bodyY, tailWave, crouch) {
        let tx = 23;
        let ty = bodyY + 4;
        const amp = 1.5 + crouch * 1.5; // 窜行甩尾更狂
        for (let i = 0; i < 9; i++) {
            // 逐段相位递进形成 S 形行波
            const wave = Math.round(Math.sin(tailWave * Math.PI * 2 + i * 0.8) * amp);
            const thick = i < 3 ? 2 : 1; // 近尾根粗
            const col = i < 4 ? this.cTail : this.cTailDark;
            d.rect(tx, ty + wave, thick, thick, col);
            tx += 1;
            if (i < 4) ty -= 1;       // 先上翘
            else if (i > 6) ty += 1;  // 末梢下垂
        }
    }

    /** 四足小腿：前后交替；立起时前腿离地举于胸前。 */
    drawLegs(d, bodyY, legPhase, rear) {
        const swing = Math.round(Math.sin(legPhase * Math.PI * 2) * 2);
        // 后腿（始终着地，立起时更蹬直）
        const backLen = 4 + Math.round(rear * 1);
        d.rect(19 + swing, bodyY + 5, 2, backLen, this.cFurDark);
        d.pixel(19 + swing, bodyY + 5 + backLen, this.cFurLight); // 后爪

        if (rear > 0.4) {
            // 立起：前腿收举于胸前（离地）
            const lift = Math.round(rear * 6);
            d.rect(9, bodyY + 2 - lift, 2, 3, this.cFurDark);
            d.pixel(8, bodyY + 4 - lift, this.cNose); // 前爪
            d.pixel(11, bodyY + 3 - lift, this.cFurLight);
        } else {
            // 常态前腿着地
            d.rect(10 - swing, bodyY + 5, 2, 4, this.cFurDark);
            d.pixel(10 - swing, bodyY + 9, this.cFurLight);
        }
    }

    /** 拱背躯干：蓬松锯齿毛边 + 发光脓斑；立起时前身抬升。 */
    drawBody(d, bodyY, frontLift, twitch) {
        // 主体（前部随 frontLift 抬起 → 拱背更陡峭）
        d.fillPath([
            { x: 9,  y: bodyY + 3 - frontLift },
            { x: 14, y: bodyY - 1 - frontLift },
            { x: 21, y: bodyY - 2 },
            { x: 24, y: bodyY + 2 },
            { x: 22, y: bodyY + 6 },
            { x: 10, y: bodyY + 6 - Math.round(frontLift * 0.4) }
        ], this.cFur);

        // 腹部浅毛
        d.hLine(12, bodyY + 5, 9, this.cBelly);
        // 背脊高光
        d.hLine(14, bodyY - 1 - frontLift, 7, this.cFurLight);
        d.hLine(13, bodyY + 4 - Math.round(frontLift * 0.6), 9, this.cFurDark);

        // 后胯肉团（拱背大鼠的臀肌隆起）
        d.fillPath([
            { x: 20, y: bodyY - 1 },
            { x: 24, y: bodyY + 2 },
            { x: 22, y: bodyY + 6 },
            { x: 20, y: bodyY + 5 }
        ], this.cFurLight);
        d.pixel(22, bodyY + 3, this.cFurDark); // 臀沟
        // 体侧毛流暗纹（数道短毛striation，强化蓬松体量）
        d.pixel(15, bodyY + 2, this.cFurDark);
        d.pixel(17, bodyY + 3, this.cFurDark);
        d.pixel(18, bodyY + 1, this.cFurLight);
        d.pixel(13, bodyY + 3, this.cFurDark);

        // 蓬松锯齿毛边（沿背脊起伏出针状毛）
        this.drawFurEdge(d, bodyY, frontLift);

        // 发光脓斑（暗芯 + 亮环，神经质地散布）
        this.drawPox(d, 16, bodyY + 1 - Math.round(frontLift * 0.5));
        this.drawPox(d, 20, bodyY + 3);
        if (twitch > 0.5) this.drawPox(d, 13, bodyY + 2 - Math.round(frontLift * 0.6));
    }

    /** 背脊锯齿蓬毛：沿轮廓交替挑出针状毛尖。 */
    drawFurEdge(d, bodyY, frontLift) {
        const spikes = [
            { x: 12, y: bodyY + 1 - frontLift },
            { x: 15, y: bodyY - 2 - frontLift },
            { x: 18, y: bodyY - 3 },
            { x: 21, y: bodyY - 3 },
            { x: 23, y: bodyY - 1 }
        ];
        for (let i = 0; i < spikes.length; i++) {
            const s = spikes[i];
            d.pixel(s.x, s.y, this.cFurLight);
            d.pixel(s.x, s.y - 1, this.cFurEdge); // 挑出的毛尖
            if (i % 2 === 0) d.pixel(s.x + 1, s.y - 1, this.cFurEdge);
        }
        // 臀部蓬毛
        d.pixel(23, bodyY + 4, this.cFurEdge);
        d.pixel(24, bodyY + 3, this.cFurEdge);
    }

    /** 发光脓斑：暗绿芯 + 亮绿点。 */
    drawPox(d, x, y) {
        d.pixel(x, y, this.cPox);
        d.pixel(x + 1, y, this.cPoxGlow);
        d.pixel(x, y + 1, this.cPoxGlow);
    }

    /** 鼠头（朝左）：尖吻 + 抽动大耳 + 红眼 + 门牙/龇牙 + 胡须。 */
    drawHead(d, bodyY, frontLift, twitch, snarl) {
        const hy = bodyY - frontLift; // 头随前身抬升
        const earLift = twitch > 0.5 ? -1 : 0;   // 耳朵抽动
        const earSwing = twitch > 0.5 ? 1 : 0;

        // 头颅
        d.fillPath([
            { x: 5,  y: hy + 2 },
            { x: 10, y: hy },
            { x: 11, y: hy + 5 },
            { x: 6,  y: hy + 5 }
        ], this.cFur);
        d.hLine(6, hy + 1, 4, this.cFurLight); // 额高光

        // 尖吻
        d.rect(3, hy + 3, 3, 2, this.cFurDark);
        d.pixel(2, hy + 4, this.cNose); // 鼻尖粉红

        // 大圆耳（抽动时上跳外摆）
        d.rect(8 + earSwing, hy - 3 + earLift, 3, 3, this.cEar);
        d.pixel(9 + earSwing, hy - 2 + earLift, this.cEarInner);
        d.pixel(8 + earSwing, hy - 3 + earLift, this.cFurLight);

        // 红眼（朝左，抽搐时泛亮）
        d.pixel(6, hy + 2, twitch > 0.5 ? this.cEyeGlow : this.cEye);
        d.pixel(7, hy + 2, this.cEye);

        // 门牙 / 龇牙
        if (snarl > 0.3) {
            // 龇牙：上下门牙外露、口张
            d.rect(3, hy + 5, 2, 1, '#2a1414'); // 口腔
            d.pixel(3, hy + 5, this.cTeeth); // 上门牙
            d.pixel(4, hy + 6, this.cTeeth); // 下门牙
            d.pixel(5, hy + 5, this.cTeeth);
        } else {
            d.pixel(3, hy + 5, this.cTeeth); // 静默微露门牙
        }

        // 胡须（三根，抽搐时外扬）
        const flick = twitch > 0.5 ? -1 : 0;
        d.pixel(1, hy + 3 + flick, this.cWhisker);
        d.pixel(0, hy + 2 + flick, this.cWhisker);
        d.pixel(1, hy + 5 - flick, this.cWhisker);
        d.pixel(0, hy + 6 - flick, this.cWhisker);
        d.pixel(1, hy + 4, this.cWhisker);
    }
}
