// SentryGenerator —— 地牢哨戒炮（三脚机械炮塔：扫描待机+蓄力弹流压制）。
// 32×32，默认炮管朝左；固定点敌人，无 Run 动画。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class SentryGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        this.cFrame = '#484855';
        this.cFrameDark = '#33333e';
        this.cFrameLight = '#5f5f6e';
        this.cBody = '#6b6b78';
        this.cBodyDark = '#525260';
        this.cBarrel = '#3a3a46';
        this.cLens = '#ff5040';
        this.cLensIdle = '#ffb347';
        this.cCharge = '#ffd23e';
        this.cChargeCore = '#fff3b0';
        this.cVent = '#2a2a34';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.scanOffset=0] 炮管扫描上下摆（-2..2）
     * @param {number} [pose.charge=0] 蓄力发光 0~1
     * @param {number} [pose.recoil=0] 开火后坐（炮管右移 px 0~2）
     * @param {boolean} [pose.firing=false] 开火中（炮口焰）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const scan = pose.scanOffset || 0;
        const charge = pose.charge || 0;
        const recoil = pose.recoil || 0;
        const firing = pose.firing || false;

        d.ellipse(16, 29, 10, 3, 'rgba(0,0,0,0.3)');

        // 三脚架
        d.vLine(9, 22, 6, this.cFrameDark);
        d.vLine(23, 22, 6, this.cFrameDark);
        d.vLine(16, 23, 5, this.cFrameDark);
        d.pixel(8, 28, this.cFrame);
        d.pixel(24, 28, this.cFrame);
        d.pixel(15, 28, this.cFrame);
        d.pixel(10, 21, this.cFrame);
        d.pixel(22, 21, this.cFrame);

        // 云台关节
        d.rect(13, 19, 6, 4, this.cFrame);
        d.hLine(13, 19, 6, this.cFrameLight);

        // 炮塔主体（随扫描微倾）
        const bodyY = 12 + Math.round(scan * 0.5);
        d.rect(11, bodyY, 12, 8, this.cBody);
        d.hLine(11, bodyY, 12, this.cFrameLight);
        d.vLine(22, bodyY + 1, 7, this.cBodyDark);
        // 散热格
        d.vLine(19, bodyY + 2, 4, this.cVent);
        d.vLine(21, bodyY + 2, 4, this.cVent);

        // 炮管（朝左，随 scan 上下 / recoil 后坐）
        const barrelY = bodyY + 3 + scan;
        const barrelX = 3 + recoil;
        d.rect(barrelX, barrelY, 9, 3, this.cBarrel);
        d.hLine(barrelX, barrelY, 9, this.cFrameLight);
        // 炮口
        d.vLine(barrelX, barrelY, 3, this.cFrameDark);

        // 目镜（索敌红点/待机橙点）
        const lensColor = charge > 0.3 || firing ? this.cLens : this.cLensIdle;
        d.pixel(12, bodyY + 3, lensColor);
        d.pixel(13, bodyY + 3, lensColor);

        // 蓄力发光（炮口聚能）
        if (charge > 0.15) {
            d.pixel(barrelX - 1, barrelY + 1, this.cCharge);
            if (charge > 0.5) {
                d.pixel(barrelX - 2, barrelY + 1, this.cCharge);
                d.pixel(barrelX - 1, barrelY, this.cChargeCore);
                d.pixel(barrelX - 1, barrelY + 2, this.cChargeCore);
            }
            if (charge > 0.85) {
                d.pixel(barrelX - 3, barrelY, this.cCharge);
                d.pixel(barrelX - 3, barrelY + 2, this.cCharge);
            }
        }

        // 开火炮口焰
        if (firing) {
            d.pixel(barrelX - 2, barrelY + 1, this.cChargeCore);
            d.pixel(barrelX - 3, barrelY, this.cCharge);
            d.pixel(barrelX - 3, barrelY + 2, this.cCharge);
            d.pixel(barrelX - 4, barrelY + 1, this.cCharge);
        }

        return d.getCanvas();
    }
}
