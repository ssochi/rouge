// WraithGenerator —— 地牢幽魂（囚魂：飘浮裹布怨灵，无腿拖尾+锁链残段）。
// 32×32，默认朝左；浮游体无 Run 腿帧（run = 加速漂移+拖尾拉长）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class WraithGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        this.cBody = '#8f9bb5';
        this.cBodyDark = '#6f7a94';
        this.cBodyLight = '#b0bdd6';
        this.cCore = '#3a4258';
        this.cEye = '#9ef0ff';
        this.cChain = '#484855';
        this.cWisp = '#c8d8f0';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.floatY=0] 浮沉偏移
     * @param {number} [pose.tailWave=0] 拖尾波动相位 0~1
     * @param {number} [pose.lean=0] 前倾（追击）
     * @param {number} [pose.flare=0] 怨气外放 0~1（攻击/濒死）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const floatY = pose.floatY || 0;
        const tailWave = pose.tailWave || 0;
        const lean = pose.lean || 0;
        const flare = pose.flare || 0;

        const cx = 16 - lean;
        const top = 8 + floatY;

        // 无落影（浮游体投淡影）
        d.ellipse(16, 29, 6, 2, 'rgba(0,0,0,0.18)');

        // 裹布躯体（上圆下散）
        d.fillPath([
            { x: cx, y: top },
            { x: cx + 5, y: top + 4 },
            { x: cx + 6, y: top + 11 },
            { x: cx + 4, y: top + 15 },
            { x: cx - 4, y: top + 15 },
            { x: cx - 6, y: top + 11 },
            { x: cx - 5, y: top + 4 }
        ], this.cBody);
        d.vLine(cx - 5, top + 4, 8, this.cBodyLight);
        d.vLine(cx + 5, top + 5, 8, this.cBodyDark);

        // 拖尾布条（三缕，随相位摆动）
        for (let i = -1; i <= 1; i++) {
            const sway = Math.round(Math.sin(tailWave * Math.PI * 2 + i * 1.4) * 2);
            const tx = cx + i * 4 + sway;
            const baseY = top + 15;
            d.rect(tx, baseY, 2, 4 + Math.abs(i), this.cBodyDark);
            d.pixel(tx, baseY + 5 + Math.abs(i), this.cBody);
        }

        // 面部空洞 + 亮眼（朝左）
        d.rect(cx - 5, top + 3, 6, 4, this.cCore);
        d.pixel(cx - 4, top + 4, this.cEye);
        d.pixel(cx - 1, top + 4, this.cEye);

        // 断链（囚魂的镣铐残段）
        d.pixel(cx + 5, top + 9, this.cChain);
        d.pixel(cx + 6, top + 11, this.cChain);
        d.pixel(cx + 7, top + 13, this.cChain);

        // 怨气外放（攻击时环绕光点）
        if (flare > 0.2) {
            d.pixel(cx - 8, top + 6, this.cWisp);
            d.pixel(cx + 8, top + 8, this.cWisp);
            d.pixel(cx - 6, top + 14, this.cWisp);
        }
        if (flare > 0.6) {
            d.pixel(cx - 9, top + 10, this.cEye);
            d.pixel(cx + 9, top + 4, this.cEye);
        }

        return d.getCanvas();
    }
}
