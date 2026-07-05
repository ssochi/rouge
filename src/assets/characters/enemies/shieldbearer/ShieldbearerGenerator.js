// ShieldbearerGenerator —— 地牢盾卫（重甲塔盾兵：铆钉纹章塔盾 + 分层甲片 + 盾后探眼 + 沉重踏步）。
// 32×32，默认朝左（塔盾立于左前方，几乎遮住躯干）。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class ShieldbearerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 重甲（四阶）
        this.cArmor = '#5c6470';
        this.cArmorDark = '#434a54';
        this.cArmorLight = '#7c8492';
        this.cArmorEdge = '#31363f';
        this.cVisor = '#1b1f25';
        this.cEye = '#ff9038';
        this.cEyeHot = '#ffd07a';
        // 塔盾木面
        this.cShield = '#7c5c35';
        this.cShieldDark = '#5c4326';
        this.cShieldLight = '#9a7442';
        this.cShieldEdge = '#3d2c17';
        this.cScratch = '#b67742'; // 战损刻痕（浅木）
        // 塔盾铁包边 / 铆钉 / 盾凸
        this.cRim = '#565664';
        this.cRimLight = '#757586';
        this.cRimDark = '#393943';
        this.cRivet = '#9a9aa8';
        this.cBoss = '#8e8e9c';
        this.cBossDark = '#5f5f6c';
        // 纹章（红十字狮盾）
        this.cEmblem = '#b23636';
        this.cEmblemDark = '#7c2020';
        this.cEmblemLight = '#d85c5c';
        // 腿 / 尘土
        this.cLeg = '#3a4048';
        this.cLegDark = '#282d33';
        this.cDust = '#948a78';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降（沉重步伐）
     * @param {number} [pose.step=0] 步行相位 0~3（铁靴交替）
     * @param {number} [pose.shieldForward=0] 盾前推像素（盾击 -2..4）
     * @param {number} [pose.headBob=0] 头盔上下
     * @param {number} [pose.peek=0] 盾后探头 0~1（idle 头略探出盾缘观察）
     * @param {number} [pose.dust=0] 踏步扬尘 0~1
     * @param {number} [pose.flash=0] 盾面闪光 0~1（盾击瞬间）
     * @param {number} [pose.lean=0] 前压前倾像素（盾击）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const step = pose.step || 0;
        const shieldForward = pose.shieldForward || 0;
        const headBob = pose.headBob || 0;
        const peek = pose.peek || 0;
        const dust = pose.dust || 0;
        const flash = pose.flash || 0;
        const lean = pose.lean || 0;

        const cx = 18 - lean; // 躯干偏右，前压时左移
        const bodyTop = 12 + squash;

        d.ellipse(15, 29, 9, 3, 'rgba(0,0,0,0.32)');
        if (dust > 0.05) this.drawDust(d, dust);

        this.drawLegs(d, cx, step);
        this.drawBody(d, cx, bodyTop);
        this.drawHead(d, cx, bodyTop - 5 + headBob, peek);
        this.drawShield(d, bodyTop, shieldForward, squash, flash);

        return d.getCanvas();
    }

    /** 踏步扬尘（盾缘/脚边的浅色尘粒）。 */
    drawDust(d, dust) {
        const a = Math.min(0.7, dust * 0.7).toFixed(2);
        d.pixel(6, 28, `rgba(148,138,120,${a})`);
        d.pixel(4, 27, `rgba(148,138,120,${a})`);
        d.pixel(22, 28, `rgba(148,138,120,${a})`);
        if (dust > 0.5) {
            d.pixel(8, 27, this.cDust);
            d.pixel(23, 27, this.cDust);
        }
    }

    /** 铁靴交替（沉重两步循环）。 */
    drawLegs(d, cx, step) {
        const phase = Math.floor(step) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;
        d.rect(cx - 4, 24 + leftLift, 3, 5 - leftLift, this.cLeg);
        d.rect(cx + 1, 24 + rightLift, 3, 5 - rightLift, this.cLeg);
        d.vLine(cx - 4, 24 + leftLift, 5 - leftLift, this.cLegDark);
        d.vLine(cx + 1, 24 + rightLift, 5 - rightLift, this.cLegDark);
        // 铁靴头
        d.hLine(cx - 4, 28, 3, this.cArmorDark);
        d.hLine(cx + 1, 28, 3, this.cArmorDark);
    }

    /** 分层重甲躯干：裙甲 + 胸甲 + 右肩甲，各自受光。 */
    drawBody(d, cx, top) {
        // 裙甲（下摆梯形）
        d.fillPath([
            { x: cx - 5, y: top + 8 },
            { x: cx + 5, y: top + 8 },
            { x: cx + 6, y: top + 14 },
            { x: cx - 6, y: top + 14 }
        ], this.cArmorDark);
        d.hLine(cx - 5, top + 8, 10, this.cArmor);
        // 裙甲竖条
        for (let k = -4; k <= 4; k += 2) d.vLine(cx + k, top + 9, 5, this.cArmorEdge);

        // 胸甲主体
        d.rect(cx - 5, top, 10, 9, this.cArmor);
        d.hLine(cx - 5, top, 10, this.cArmorLight);       // 顶缘受光
        d.vLine(cx - 5, top, 9, this.cArmorLight);
        d.vLine(cx + 4, top + 1, 8, this.cArmorDark);     // 右缘压暗
        // 胸甲中脊 + 横缝
        d.vLine(cx, top + 1, 7, this.cArmorLight);
        d.hLine(cx - 4, top + 4, 9, this.cArmorEdge);
        // 颈护
        d.hLine(cx - 3, top - 1, 6, this.cArmorDark);

        // 右肩甲（左肩被塔盾遮）
        d.fillPath([
            { x: cx + 3, y: top - 1 },
            { x: cx + 7, y: top },
            { x: cx + 7, y: top + 3 },
            { x: cx + 3, y: top + 3 }
        ], this.cArmorLight);
        d.pixel(cx + 6, top + 2, this.cArmorDark);
        d.hLine(cx + 4, top - 1, 3, this.cArmorLight);
    }

    /** 全盔头：目缝红光 + 盔顶脊；peek 时头略左探出盾缘。 */
    drawHead(d, cx, cy, peek) {
        const px = Math.round(peek * 2); // 探头左移
        const hx = cx - px;
        d.rect(hx - 4, cy - 3, 8, 6, this.cArmor);
        d.hLine(hx - 4, cy - 3, 8, this.cArmorLight);
        d.vLine(hx - 4, cy - 3, 6, this.cArmorLight);
        d.vLine(hx + 3, cy - 2, 5, this.cArmorDark);
        // 盔顶脊
        d.hLine(hx - 2, cy - 4, 4, this.cArmorDark);
        d.pixel(hx, cy - 5, this.cArmorLight);
        // 目缝（朝左）+ 探视红光
        d.hLine(hx - 4, cy, 5, this.cVisor);
        const eye = peek > 0.3 ? this.cEyeHot : this.cEye;
        d.pixel(hx - 3, cy, eye);
        if (peek > 0.5) d.pixel(hx - 4, cy, this.cEye); // 探头时露更多光
        // 面甲铆钉
        d.pixel(hx + 2, cy + 1, this.cRivet);
        d.pixel(hx - 3, cy + 2, this.cArmorEdge);
    }

    /** 塔盾：铁包边 + 铆钉 + 木面木纹 + 红纹章 + 中央盾凸 + 战损刻痕。 */
    drawShield(d, bodyTop, forward, squash, flash) {
        const sx = 4 - Math.round(forward); // 前推向左
        const top = 6 + squash;
        const w = 7;
        const h = 21;

        // 塔盾外形（塔盾：直边 + 尖底）
        d.fillPath([
            { x: sx, y: top },
            { x: sx + w, y: top },
            { x: sx + w, y: top + h - 4 },
            { x: sx + Math.floor(w / 2), y: top + h },  // 尖底
            { x: sx, y: top + h - 4 }
        ], this.cRim);

        // 木盾面（内缩一圈）
        d.fillPath([
            { x: sx + 1, y: top + 1 },
            { x: sx + w - 1, y: top + 1 },
            { x: sx + w - 1, y: top + h - 5 },
            { x: sx + Math.floor(w / 2), y: top + h - 2 },
            { x: sx + 1, y: top + h - 5 }
        ], this.cShield);
        // 木面左亮右暗
        d.vLine(sx + 1, top + 2, h - 6, this.cShieldLight);
        d.vLine(sx + w - 2, top + 2, h - 7, this.cShieldDark);
        // 木纹横线
        d.hLine(sx + 2, top + 4, w - 3, this.cShieldDark);
        d.hLine(sx + 2, top + 16, w - 3, this.cShieldDark);
        // 战损刻痕（斜向浅木划痕）
        d.pixel(sx + 2, top + 9, this.cScratch);
        d.pixel(sx + 3, top + 10, this.cScratch);
        d.pixel(sx + 4, top + 11, this.cScratch);
        d.pixel(sx + w - 2, top + 6, this.cScratch);

        // 铁包边铆钉（四角 + 边中）
        const rivets = [
            [sx + 1, top + 1], [sx + w - 1, top + 1],
            [sx + 1, top + h - 5], [sx + w - 1, top + h - 5],
            [sx, top + 10], [sx + w, top + 10]
        ];
        for (const [rx, ry] of rivets) d.pixel(rx, ry, this.cRivet);

        // 红纹章（中上部十字盾徽）
        const ex = sx + Math.floor(w / 2), ey = top + 8;
        d.vLine(ex, ey - 2, 5, this.cEmblem);
        d.hLine(ex - 2, ey, 5, this.cEmblem);
        d.pixel(ex, ey, this.cEmblemLight);
        d.pixel(ex - 2, ey, this.cEmblemDark);
        d.pixel(ex + 2, ey, this.cEmblemDark);

        // 中央盾凸（铁半球）
        d.rect(ex - 1, top + 13, 3, 3, this.cBoss);
        d.pixel(ex - 1, top + 15, this.cBossDark);
        d.pixel(ex + 1, top + 15, this.cBossDark);
        d.pixel(ex, top + 13, this.cRimLight);

        // 底尖接地暗
        d.pixel(sx + Math.floor(w / 2), top + h, this.cShieldEdge);

        // 盾击瞬间盾面闪光
        if (flash > 0.1) {
            const a = Math.min(0.75, flash * 0.75).toFixed(2);
            d.fillPath([
                { x: sx + 1, y: top + 1 },
                { x: sx + w - 1, y: top + 1 },
                { x: sx + w - 1, y: top + h - 5 },
                { x: sx + Math.floor(w / 2), y: top + h - 2 },
                { x: sx + 1, y: top + h - 5 }
            ], `rgba(255,240,200,${a})`);
            d.hLine(sx + 2, top + 3, w - 3, this.cEyeHot);
            d.pixel(ex, top + 6, '#ffffff');
        }
    }
}
