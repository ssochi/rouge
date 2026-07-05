// PlagueRatGenerator —— 地牢瘟疫鼠（灰褐大鼠：红眼、长尾、拱背）。
// 32×32，默认朝左；四足小兽，死亡时喷毒（由实体处理）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class PlagueRatGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        this.cBody = '#6b5d4f';
        this.cBodyDark = '#4c4136';
        this.cBodyLight = '#87796a';
        this.cEar = '#8a6d6a';
        this.cEye = '#e23b2a';
        this.cTeeth = '#e6dccb';
        this.cTail = '#9a8574';
        this.cTailDark = '#5f5044';
        this.cPox = '#8fae5a'; // 病斑
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.legPhase=0] 步态相位 0~1
     * @param {number} [pose.bob=0] 拱背起伏
     * @param {number} [pose.tailWave=0] 尾摆相位 0~1
     * @param {number} [pose.twitch=0] 抽搐（耳/须）0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const legPhase = pose.legPhase || 0;
        const bob = pose.bob || 0;
        const tailWave = pose.tailWave || 0;
        const twitch = pose.twitch || 0;

        const bodyY = 17 + bob;

        d.ellipse(16, 28, 8, 2, 'rgba(0,0,0,0.25)');

        this.drawTail(d, bodyY, tailWave);
        this.drawLegs(d, bodyY, legPhase);
        this.drawBody(d, bodyY);
        this.drawHead(d, bodyY, twitch);

        return d.getCanvas();
    }

    /** 长尾（右后甩出，S 形随相位摆动）。 */
    drawTail(d, bodyY, tailWave) {
        let tx = 24;
        let ty = bodyY + 4;
        for (let i = 0; i < 7; i++) {
            const wave = Math.round(Math.sin(tailWave * Math.PI * 2 + i * 0.7) * 1.5);
            d.pixel(tx, ty + wave, i < 4 ? this.cTail : this.cTailDark);
            tx += 1;
            ty -= (i < 3 ? 1 : 0);
        }
    }

    drawLegs(d, bodyY, legPhase) {
        const swing = Math.round(Math.sin(legPhase * Math.PI * 2) * 2);
        d.rect(10 - swing, bodyY + 5, 2, 4, this.cBodyDark); // 前腿
        d.rect(19 + swing, bodyY + 5, 2, 4, this.cBodyDark); // 后腿
        d.pixel(10 - swing, bodyY + 9, this.cBodyLight);
        d.pixel(19 + swing, bodyY + 9, this.cBodyLight);
    }

    /** 拱背躯干（右高左低）。 */
    drawBody(d, bodyY) {
        d.fillPath([
            { x: 9, y: bodyY + 3 },
            { x: 14, y: bodyY - 1 },
            { x: 21, y: bodyY - 2 },
            { x: 24, y: bodyY + 2 },
            { x: 22, y: bodyY + 6 },
            { x: 10, y: bodyY + 6 }
        ], this.cBody);
        d.hLine(13, bodyY - 1, 8, this.cBodyLight); // 背脊高光
        d.hLine(11, bodyY + 5, 12, this.cBodyDark);
        // 病斑
        d.pixel(16, bodyY + 1, this.cPox);
        d.pixel(19, bodyY + 3, this.cPox);
    }

    /** 鼠头（朝左）：尖吻 + 大耳 + 红眼 + 门牙。 */
    drawHead(d, bodyY, twitch) {
        const earLift = twitch > 0.5 ? -1 : 0;
        // 头
        d.fillPath([
            { x: 5, y: bodyY + 2 },
            { x: 10, y: bodyY },
            { x: 11, y: bodyY + 5 },
            { x: 6, y: bodyY + 5 }
        ], this.cBody);
        // 尖吻
        d.rect(3, bodyY + 3, 3, 2, this.cBodyDark);
        d.pixel(3, bodyY + 4, this.cEye); // 鼻尖偏红
        // 大圆耳
        d.rect(8, bodyY - 3 + earLift, 3, 3, this.cEar);
        d.pixel(9, bodyY - 2 + earLift, this.cBodyDark);
        // 红眼（朝左）
        d.pixel(6, bodyY + 2, this.cEye);
        // 门牙
        d.pixel(4, bodyY + 5, this.cTeeth);
        // 须（抽搐时外扬）
        d.pixel(2, bodyY + 3 - (twitch > 0.5 ? 1 : 0), this.cBodyLight);
    }
}
