// HellhoundGenerator —— 地牢狱火犬（低伏四足恶犬：炭黑体 + 橙红焰鬃/焰眼）。
// 32×32，默认朝左；四足横向站姿，冲锋预警由实体绘制。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class HellhoundGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        this.cBody = '#2f2c33';
        this.cBodyDark = '#1d1b21';
        this.cBodyLight = '#45414a';
        this.cEmber = '#ff6a1f';
        this.cEmberHot = '#ffd23e';
        this.cEmberDeep = '#c0361a';
        this.cEye = '#ff8a2a';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.legPhase=0] 步态相位 0~1（四足两相位交替）
     * @param {number} [pose.bob=0] 身体起伏
     * @param {number} [pose.lunge=0] 前扑量 0~1（攻击：低伏后蹬前扑）
     * @param {number} [pose.ember=0.5] 焰鬃/焰眼强度 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const legPhase = pose.legPhase || 0;
        const bob = pose.bob || 0;
        const lunge = pose.lunge || 0;
        const ember = pose.ember == null ? 0.5 : pose.ember;

        const bodyY = 16 + bob - Math.round(lunge * 2);
        const headX = 8 - Math.round(lunge * 3); // 前扑时头前探

        // 落影（低伏犬贴地长影）
        d.ellipse(16, 29, 10, 2, 'rgba(0,0,0,0.28)');

        this.drawLegs(d, bodyY, legPhase, lunge);
        this.drawBody(d, bodyY);
        this.drawTail(d, bodyY, ember);
        this.drawHead(d, headX, bodyY, ember);
        this.drawMane(d, headX, bodyY, ember);

        return d.getCanvas();
    }

    /** 四足：前后各一对，两相位交替（跑动/前扑蹬地）。 */
    drawLegs(d, bodyY, legPhase, lunge) {
        const swing = Math.round(Math.sin(legPhase * Math.PI * 2) * 3);
        const backLift = lunge > 0.3 ? 2 : 0; // 前扑：后腿蹬起

        // 后腿（右侧）
        d.rect(21 + swing, bodyY + 6, 2, 6 - backLift, this.cBodyDark);
        d.rect(23 - swing, bodyY + 6, 2, 6 - backLift, this.cBody);
        // 前腿（左侧）
        d.rect(10 - swing, bodyY + 6, 2, 6 + Math.round(lunge * 2), this.cBody);
        d.rect(12 + swing, bodyY + 6, 2, 6, this.cBodyDark);
        // 爪
        d.pixel(10 - swing, bodyY + 12 + Math.round(lunge * 2), this.cEmberDeep);
        d.pixel(23 - swing, bodyY + 12 - backLift, this.cEmberDeep);
    }

    /** 低伏犬躯干（横向）。 */
    drawBody(d, bodyY) {
        d.fillPath([
            { x: 9, y: bodyY + 2 },
            { x: 22, y: bodyY },
            { x: 25, y: bodyY + 3 },
            { x: 24, y: bodyY + 7 },
            { x: 10, y: bodyY + 8 },
            { x: 7, y: bodyY + 5 }
        ], this.cBody);
        // 背脊高光 / 腹部暗
        d.hLine(11, bodyY + 1, 11, this.cBodyLight);
        d.hLine(11, bodyY + 7, 12, this.cBodyDark);
    }

    /** 焰尾（右后翘起，末端火苗）。 */
    drawTail(d, bodyY, ember) {
        d.rect(24, bodyY + 1, 3, 2, this.cBody);
        d.pixel(26, bodyY - 1, this.cEmber);
        d.pixel(27, bodyY - 2, this.cEmberHot);
        if (ember > 0.5) d.pixel(27, bodyY - 3, this.cEmberHot);
    }

    /** 犬头（朝左）：吻部前伸 + 焰眼 + 尖耳。 */
    drawHead(d, headX, bodyY, ember) {
        // 头颅
        d.fillPath([
            { x: headX, y: bodyY + 1 },
            { x: headX + 6, y: bodyY },
            { x: headX + 7, y: bodyY + 6 },
            { x: headX - 3, y: bodyY + 6 },
            { x: headX - 4, y: bodyY + 3 }
        ], this.cBody);
        // 吻部
        d.rect(headX - 5, bodyY + 3, 3, 3, this.cBodyDark);
        d.pixel(headX - 5, bodyY + 4, this.cEmberDeep); // 鼻
        // 尖耳
        d.fillPath([
            { x: headX + 4, y: bodyY },
            { x: headX + 6, y: bodyY - 4 },
            { x: headX + 7, y: bodyY }
        ], this.cBodyDark);
        // 焰眼（朝左）
        const eye = ember > 0.35 ? this.cEmberHot : this.cEye;
        d.pixel(headX - 1, bodyY + 3, eye);
        d.pixel(headX, bodyY + 3, this.cEye);
        // 獠牙微露
        d.pixel(headX - 4, bodyY + 6, '#e8e2d2');
    }

    /** 焰鬃（沿颈背窜出的火苗，随 ember 起伏）。 */
    drawMane(d, headX, bodyY, ember) {
        const tips = [
            { x: headX + 5, y: bodyY - 2 },
            { x: headX + 8, y: bodyY - 3 },
            { x: headX + 11, y: bodyY - 2 },
            { x: headX + 14, y: bodyY - 1 }
        ];
        for (let i = 0; i < tips.length; i++) {
            const t = tips[i];
            const flick = Math.round(Math.sin((ember + i * 0.3) * Math.PI * 2) * 1);
            d.rect(t.x, t.y + flick, 2, 3, this.cEmberDeep);
            d.pixel(t.x, t.y - 1 + flick, this.cEmber);
            if (ember > 0.5) d.pixel(t.x, t.y - 2 + flick, this.cEmberHot);
        }
        // 眉心余烬
        d.pixel(headX + 2, bodyY - 1, this.cEmber);
    }
}
