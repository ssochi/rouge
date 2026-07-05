// SentryGenerator —— 地牢哨戒炮（液压三脚机械炮塔：警示条纹 + 线缆铆钉 + 联动扫描 + 散热发光蒸汽 + 后坐抛壳）。
// 32×32，默认炮管朝左；固定点敌人，无 Run 动画。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class SentryGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        this.cFrame = '#4a4a56';
        this.cFrameDark = '#31313b';
        this.cFrameLight = '#61616f';
        this.cBody = '#6b6b78';
        this.cBodyDark = '#51515e';
        this.cBodyLight = '#84848f';
        this.cBarrel = '#3a3a46';
        this.cBarrelLight = '#565662';
        this.cMuzzle = '#2a2a32';
        // 目镜
        this.cLens = '#ff5040';
        this.cLensIdle = '#ffb347';
        this.cLensRim = '#2a2a32';
        // 蓄力 / 散热
        this.cCharge = '#ffd23e';
        this.cChargeCore = '#fff3b0';
        this.cVent = '#242430';
        this.cVentGlow = '#ff7a2e';
        this.cVentHot = '#ffd060';
        // 机械细节
        this.cCable = '#26262e';
        this.cHydraulic = '#8e8e9a';
        this.cRivet = '#9a9aa6';
        this.cWarn = '#f0b422';
        this.cWarnDark = '#2a2a32';
        this.cIndicator = '#4aff6a';
        this.cIndicatorDim = '#1e5e2c';
        this.cShell = '#d8a838';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.scanOffset=0] 炮管/目镜联动扫描上下摆（-2..2）
     * @param {number} [pose.charge=0] 蓄力发光 0~1（散热格渐亮）
     * @param {number} [pose.recoil=0] 开火后坐（炮管右移 px 0~3）
     * @param {boolean} [pose.firing=false] 开火中（炮口焰）
     * @param {number} [pose.indicator=0] idle 指示灯相位 0~1（闪烁）
     * @param {number} [pose.steam=0] 散热蒸汽强度 0~1
     * @param {number} [pose.shellEject=0] 抛壳飞行进度 0~1（0=无壳）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const scan = pose.scanOffset || 0;
        const charge = pose.charge || 0;
        const recoil = pose.recoil || 0;
        const firing = pose.firing || false;
        const indicator = pose.indicator || 0;
        const steam = pose.steam || 0;
        const shellEject = pose.shellEject || 0;

        d.ellipse(16, 29, 10, 3, 'rgba(0,0,0,0.3)');

        this.drawTripod(d);
        const bodyY = 12 + Math.round(scan * 0.5);
        this.drawBarrel(d, bodyY, scan, recoil, charge, firing);
        this.drawBody(d, bodyY, charge, indicator, steam);
        // 抛壳（飞出的黄铜弹壳）
        if (shellEject > 0.02) this.drawShell(d, bodyY, shellEject);

        return d.getCanvas();
    }

    /** 液压三脚架：三条带活塞的腿 + 脚垫。 */
    drawTripod(d) {
        const legs = [
            { x: 9, foot: 7 },   // 左腿
            { x: 23, foot: 25 }, // 右腿
            { x: 16, foot: 15 }  // 中腿（略前）
        ];
        for (const l of legs) {
            // 上段支杆
            d.vLine(l.x, 20, 4, this.cFrameDark);
            d.vLine(l.x + 1, 20, 4, this.cFrame);
            // 液压活塞（亮钢中段）
            d.vLine(l.x, 24, 3, this.cHydraulic);
            d.pixel(l.x + 1, 25, this.cFrameLight);
            // 脚垫
            d.rect(l.foot - 1, 27, 3, 2, this.cFrameDark);
            d.hLine(l.foot - 1, 27, 3, this.cFrame);
        }
        // 中央枢轴云台
        d.rect(13, 18, 6, 4, this.cFrame);
        d.hLine(13, 18, 6, this.cFrameLight);
        d.vLine(18, 18, 4, this.cFrameDark);
        d.pixel(14, 19, this.cRivet);
        d.pixel(17, 19, this.cRivet);
        // 线缆（从云台垂到地）
        d.pixel(19, 21, this.cCable);
        d.pixel(20, 22, this.cCable);
        d.pixel(20, 23, this.cCable);
        d.pixel(21, 24, this.cCable);
    }

    /** 炮塔主体：装甲盒 + 警示条纹 + 铆钉 + 散热格（充能发光）+ 目镜 + 指示灯。 */
    drawBody(d, bodyY, charge, indicator, steam) {
        d.rect(11, bodyY, 12, 8, this.cBody);
        d.hLine(11, bodyY, 12, this.cBodyLight);        // 顶缘受光
        d.vLine(11, bodyY, 8, this.cBodyLight);
        d.vLine(22, bodyY + 1, 7, this.cBodyDark);      // 右缘压暗
        d.hLine(11, bodyY + 7, 12, this.cFrameDark);

        // 顶部警示条纹（黄黑斜纹）
        for (let k = 0; k < 5; k++) {
            const c = k % 2 === 0 ? this.cWarn : this.cWarnDark;
            d.pixel(13 + k * 2, bodyY + 1, c);
            d.pixel(14 + k * 2, bodyY + 1, c);
        }
        // 四角铆钉
        d.pixel(12, bodyY + 1, this.cRivet);
        d.pixel(21, bodyY + 1, this.cRivet);
        d.pixel(12, bodyY + 6, this.cRivet);
        d.pixel(21, bodyY + 6, this.cRivet);

        // 散热格（右侧竖格，充能时由暗渐亮）
        const ventCol = charge > 0.7 ? this.cVentHot : (charge > 0.25 ? this.cVentGlow : this.cVent);
        d.vLine(18, bodyY + 3, 4, charge > 0.5 ? this.cVentGlow : this.cVent);
        d.vLine(20, bodyY + 3, 4, ventCol);
        if (charge > 0.4) {
            d.pixel(19, bodyY + 4, this.cVentHot);
            d.pixel(19, bodyY + 5, this.cVentGlow);
        }

        // 散热蒸汽（充能高热时从顶格冒出）
        if (steam > 0.15) {
            const a = Math.min(0.6, steam * 0.6).toFixed(2);
            d.pixel(19, bodyY - 1, `rgba(230,230,235,${a})`);
            d.pixel(20, bodyY - 2, `rgba(230,230,235,${(a * 0.7).toFixed(2)})`);
            if (steam > 0.6) d.pixel(18, bodyY - 3, `rgba(230,230,235,0.3)`);
        }

        // 目镜（圆罩透镜，索敌红/待机橙，随充能变红）
        const lensColor = charge > 0.3 ? this.cLens : this.cLensIdle;
        d.rect(12, bodyY + 3, 3, 3, this.cLensRim);
        d.rect(12, bodyY + 3, 2, 2, lensColor);
        d.pixel(12, bodyY + 3, this.cChargeCore); // 镜面高光

        // idle 指示灯（绿灯闪烁）
        const ind = Math.sin(indicator * Math.PI * 2) > 0 ? this.cIndicator : this.cIndicatorDim;
        d.pixel(21, bodyY + 3, ind);
    }

    /** 炮管：从枢轴向左伸出，随 scan 抬俯、随 recoil 后坐；开火喷焰。 */
    drawBarrel(d, bodyY, scan, recoil, charge, firing) {
        const pivotX = 15;
        const pivotY = bodyY + 4;
        const tipX = 3 + Math.round(recoil);
        const tipY = pivotY + scan;
        // 沿枢轴→炮口打点，3px 粗
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(pivotX + (tipX - pivotX) * t);
            const y = Math.round(pivotY + (tipY - pivotY) * t);
            d.pixel(x, y - 1, this.cBarrelLight);
            d.pixel(x, y, this.cBarrel);
            d.pixel(x, y + 1, this.cMuzzle);
        }
        // 炮口配重环
        d.vLine(tipX, tipY - 1, 3, this.cFrameDark);
        d.pixel(tipX - 1, tipY, this.cMuzzle);
        // 炮管上导轨/线缆
        d.pixel(pivotX - 2, pivotY - 2, this.cCable);
        d.pixel(pivotX - 4, pivotY - 2, this.cCable);

        // 蓄力聚能（炮口前）
        if (charge > 0.5 && !firing) {
            d.pixel(tipX - 1, tipY, this.cCharge);
            if (charge > 0.85) {
                d.pixel(tipX - 2, tipY, this.cChargeCore);
                d.pixel(tipX - 1, tipY - 1, this.cCharge);
                d.pixel(tipX - 1, tipY + 1, this.cCharge);
            }
        }
        // 开火炮口焰
        if (firing) {
            d.pixel(tipX - 1, tipY, this.cChargeCore);
            d.pixel(tipX - 2, tipY - 1, this.cCharge);
            d.pixel(tipX - 2, tipY + 1, this.cCharge);
            d.pixel(tipX - 3, tipY, this.cCharge);
            d.pixel(tipX - 4, tipY, this.cChargeCore);
        }
    }

    /** 抛出的黄铜弹壳（从机身顶部弹出口飞出，抛物线上升翻落）。 */
    drawShell(d, bodyY, p) {
        const x = 16 + Math.round(p * 7);
        const y = bodyY - Math.round(Math.sin(p * Math.PI) * 5); // 抛物线
        d.pixel(x, y, this.cShell);
        d.pixel(x, y + 1, this.cChargeCore);
    }
}
