// SummonerGenerator —— 地牢召唤师（骨袍萨满：骨面具+骨珠链+举手施法绿焰）。
// 32×32，默认朝左，长袍盖腿。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class SummonerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 骨褐袍
        this.cRobe = '#8a8172';
        this.cRobeDark = '#6b6357';
        this.cRobeLight = '#a49a86';
        this.cBelt = '#55483a';
        // 骨面具
        this.cSkull = '#e8e0cc';
        this.cSkullShadow = '#bfb49c';
        this.cSocket = '#241c14';
        this.cEyeGlow = '#7eff8e';
        // 施法绿焰
        this.cRune = '#7eff8e';
        this.cRuneCore = '#d8ffd8';
        this.cBone = '#d8cfb6';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降
     * @param {{x:number,y:number}} [pose.headOffset] 头部偏移
     * @param {number} [pose.robeWave=0] 袍摆相位 0~1
     * @param {number} [pose.lean=0] 前倾
     * @param {number} [pose.armRaise=0] 双手举起程度 0~1（施法）
     * @param {number} [pose.runeGlow=0] 施法绿焰强度 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const headOff = pose.headOffset || { x: 0, y: 0 };
        const robeWave = pose.robeWave || 0;
        const lean = pose.lean || 0;
        const armRaise = pose.armRaise || 0;
        const runeGlow = pose.runeGlow || 0;

        const cx = 16 - lean;
        const bodyTop = 14 + squash;

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.3)');

        this.drawRobe(d, cx, bodyTop, robeWave);
        this.drawArms(d, cx, bodyTop, armRaise, runeGlow);
        this.drawHead(d, cx + headOff.x - lean, 9 + squash + headOff.y);

        return d.getCanvas();
    }

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

        // 骨珠腰链
        d.hLine(cx - 4, top + 5, 9, this.cBelt);
        d.pixel(cx - 3, top + 6, this.cBone);
        d.pixel(cx, top + 6, this.cBone);
        d.pixel(cx + 3, top + 6, this.cBone);

        // 波动裙摆
        for (let i = -7; i <= 7; i++) {
            const wave = Math.sin(robeWave * Math.PI * 2 + i * 0.9);
            const dy = wave > 0.3 ? -1 : 0;
            d.pixel(cx + i, hemY + dy, this.cRobeDark);
        }
    }

    /** 双臂：垂放 → 举过头顶托举绿焰。 */
    drawArms(d, cx, bodyTop, armRaise, runeGlow) {
        const raisePx = Math.round(armRaise * 8);
        const handY = bodyTop + 5 - raisePx;
        const spread = 6 + Math.round(armRaise * 2);

        // 袖臂（两侧斜上）
        d.rect(cx - spread, handY, 2, 2, this.cRobeDark);
        d.rect(cx + spread - 1, handY, 2, 2, this.cRobeDark);
        d.pixel(cx - spread + 1, handY + 2, this.cRobe);
        d.pixel(cx + spread - 2, handY + 2, this.cRobe);
        // 骨白手
        d.pixel(cx - spread, handY - 1, this.cSkull);
        d.pixel(cx + spread - 1, handY - 1, this.cSkull);

        // 施法绿焰（双手上方汇聚）
        if (runeGlow > 0.1) {
            const fy = handY - 3;
            d.pixel(cx - spread, fy, this.cRune);
            d.pixel(cx + spread - 1, fy, this.cRune);
            if (runeGlow > 0.45) {
                d.pixel(cx - spread + 1, fy - 1, this.cRune);
                d.pixel(cx + spread - 2, fy - 1, this.cRune);
                d.pixel(cx - spread, fy - 1, this.cRuneCore);
            }
            if (runeGlow > 0.75) {
                // 头顶汇聚符环
                d.rect(cx - 2, fy - 3, 4, 1, this.cRune);
                d.pixel(cx, fy - 4, this.cRuneCore);
                d.pixel(cx - 3, fy - 2, this.cRune);
                d.pixel(cx + 2, fy - 2, this.cRune);
            }
        }
    }

    /** 骨面具头：兜帽 + 骷髅面 + 绿瞳。 */
    drawHead(d, cx, cy) {
        // 兜帽
        d.fillPath([
            { x: cx - 5, y: cy },
            { x: cx - 3, y: cy - 4 },
            { x: cx + 2, y: cy - 5 },
            { x: cx + 6, y: cy - 2 },
            { x: cx + 6, y: cy + 4 },
            { x: cx - 5, y: cy + 4 }
        ], this.cRobeDark);
        d.hLine(cx - 3, cy - 4, 5, this.cRobe);

        // 骨面具（朝左露出）
        d.rect(cx - 5, cy - 1, 6, 5, this.cSkull);
        d.vLine(cx - 5, cy - 1, 5, this.cSkullShadow);
        // 眼窝 + 绿瞳
        d.pixel(cx - 4, cy, this.cSocket);
        d.pixel(cx - 1, cy, this.cSocket);
        d.pixel(cx - 4, cy + 1, this.cEyeGlow);
        d.pixel(cx - 1, cy + 1, this.cEyeGlow);
        // 鼻孔与齿缝
        d.pixel(cx - 3, cy + 2, this.cSkullShadow);
        d.hLine(cx - 5, cy + 3, 5, this.cSkullShadow);
    }
}
