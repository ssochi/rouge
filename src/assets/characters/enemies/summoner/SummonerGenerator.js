// SummonerGenerator —— 地牢召唤师（骨面萨满：带角骨面具 + 逐颗骨珠链 + 袍上符文暗纹 + 分段法印 + 脚下召唤光圈）。
// 32×32，默认朝左（面具/珠链偏左），长袍盖腿。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class SummonerGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 骨褐袍（四阶）
        this.cRobe = '#8a8172';
        this.cRobeDark = '#655c50';
        this.cRobeLight = '#a89c86';
        this.cRobeEdge = '#463f36';
        this.cRobeInner = '#57493a';
        this.cBelt = '#54473a';
        // 骨珠链
        this.cBead = '#dcd3ba';
        this.cBeadDark = '#a89a7c';
        // 骨面具
        this.cSkull = '#ede4cf';
        this.cSkullShadow = '#c4b69a';
        this.cSkullDark = '#9a8c70';
        this.cHorn = '#d4c8a8';
        this.cHornDark = '#a89778';
        this.cSocket = '#1e160e';
        this.cEyeGlow = '#7eff8e';
        this.cEyeCore = '#d8ffd8';
        // 符文与绿焰
        this.cRune = '#7eff8e';
        this.cRuneCore = '#e0ffe0';
        this.cRuneDim = '#39633e';   // 未点亮的暗纹
        this.cFlame = '#9dffa8';
        this.cFlameCore = '#eaffea';
        this.cCircle = '#7eff8e';
        this.cCircleDim = '#3d6b44';
        // 骨白手
        this.cHand = '#e2d8c1';
        this.cHandShadow = '#b6a888';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bodySquash=0] 身体升降
     * @param {{x:number,y:number}} [pose.headOffset] 头部偏移
     * @param {number} [pose.robeWave=0] 袍摆相位 0~1
     * @param {number} [pose.lean=0] 前倾
     * @param {number} [pose.armStage=0] 法印分段 0~1（0 垂手→0.4 抬手→0.7 结印→1 展开）
     * @param {number} [pose.runeGlow=0] 袍上符文点亮进度 0~1（逐个亮起）
     * @param {number} [pose.circleProgress=0] 脚下召唤光圈显现 0~1
     * @param {number} [pose.eyeFlicker=1] 眼焰强度 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const headOff = pose.headOffset || { x: 0, y: 0 };
        const robeWave = pose.robeWave || 0;
        const lean = pose.lean || 0;
        const armStage = pose.armStage || 0;
        const runeGlow = pose.runeGlow || 0;
        const circleProgress = pose.circleProgress || 0;
        const eyeFlicker = pose.eyeFlicker == null ? 1 : pose.eyeFlicker;

        const cx = 16 - lean;
        const bodyTop = 14 + squash;

        // 脚下召唤光圈（先画在地面）
        if (circleProgress > 0.02) this.drawSummonCircle(d, 16, 29, circleProgress);

        d.ellipse(16 - Math.round(lean * 0.5), 29, 8, 3, 'rgba(0,0,0,0.28)');

        this.drawRobe(d, cx, bodyTop, robeWave, runeGlow);
        this.drawArms(d, cx, bodyTop, armStage, runeGlow);
        this.drawHead(d, cx + headOff.x - lean, 9 + squash + headOff.y, eyeFlicker);

        return d.getCanvas();
    }

    /** 脚下召唤法阵：外环 + 三角 + 内符，随进度显现。 */
    drawSummonCircle(d, cx, cy, p) {
        const rx = 9, ry = 3;
        const col = p > 0.6 ? this.cCircle : this.cCircleDim;
        // 外椭圆环（打点，按进度补全）
        const pts = 16;
        const n = Math.floor(pts * p);
        for (let k = 0; k < n; k++) {
            const a = (k / pts) * Math.PI * 2;
            d.pixel(cx + Math.round(Math.cos(a) * rx), cy + Math.round(Math.sin(a) * ry), col);
        }
        // 内三角符（后期出现）
        if (p > 0.55) {
            d.pixel(cx, cy - 2, this.cRune);
            d.pixel(cx - 4, cy + 1, this.cRune);
            d.pixel(cx + 4, cy + 1, this.cRune);
            d.pixel(cx, cy, this.cRuneCore);
        }
    }

    /** 分层钟形骨袍 + 前襟符文暗纹（逐个点亮）。 */
    drawRobe(d, cx, top, robeWave, runeGlow) {
        const hemY = 28;
        const swing = Math.sin(robeWave * Math.PI * 2);
        const hemShift = Math.round(swing * 1.2);

        d.fillPath([
            { x: cx - 3, y: top - 1 },
            { x: cx - 6, y: top + 3 },
            { x: cx - 8 + hemShift, y: hemY },
            { x: cx + 8 + hemShift, y: hemY },
            { x: cx + 6, y: top + 3 },
            { x: cx + 3, y: top - 1 }
        ], this.cRobe);

        // 受光 / 压暗
        d.vLine(cx - 6, top + 4, hemY - top - 4, this.cRobeLight);
        d.vLine(cx - 5, top + 5, hemY - top - 6, this.cRobeLight);
        d.vLine(cx + 6, top + 4, hemY - top - 4, this.cRobeDark);
        d.vLine(cx + 7 + hemShift, hemY - 3, 3, this.cRobeEdge);

        // 前襟暗缝
        d.vLine(cx, top + 3, hemY - top - 4, this.cRobeInner);

        // 前襟符文暗纹（4 个，逐个点亮）
        const runeYs = [top + 5, top + 10, top + 15, top + 20];
        const litCount = Math.round(runeGlow * runeYs.length);
        for (let k = 0; k < runeYs.length; k++) {
            const ry = runeYs[k];
            const lit = k < litCount;
            const col = lit ? this.cRune : this.cRuneDim;
            // 简易符号（十字/菱形交替）
            if (k % 2 === 0) {
                d.pixel(cx, ry, col);
                d.pixel(cx - 1, ry + 1, col);
                d.pixel(cx + 1, ry + 1, col);
                d.pixel(cx, ry + 2, col);
            } else {
                d.hLine(cx - 1, ry + 1, 3, col);
                d.pixel(cx, ry, col);
                d.pixel(cx, ry + 2, col);
            }
            if (lit) d.pixel(cx, ry + 1, this.cRuneCore);
        }

        // 腰带
        d.hLine(cx - 6, top + 6, 12, this.cBelt);
        d.hLine(cx - 6, top + 5, 12, this.cRobeDark);

        // 骨珠腰链（逐颗）
        for (let k = 0; k < 5; k++) {
            const bx = cx - 5 + k * 2;
            const by = top + 7 + (k % 2);
            d.pixel(bx, by, this.cBead);
            d.pixel(bx, by + 1, this.cBeadDark);
        }

        // 波动裙摆
        for (let i = -8; i <= 8; i++) {
            const wave = Math.sin(robeWave * Math.PI * 2 + i * 0.8);
            const dy = wave > 0.35 ? -1 : (wave < -0.55 ? 1 : 0);
            d.pixel(cx + i + hemShift, hemY + dy, this.cRobeEdge);
            if (dy <= 0) d.pixel(cx + i + hemShift, hemY - 1 + dy, this.cRobe);
        }
    }

    /** 双臂分段法印：垂手 → 抬手 → 胸前结印 → 双掌展开托绿焰。 */
    drawArms(d, cx, bodyTop, armStage, runeGlow) {
        // 三段插值手位（左手/右手）
        let lx, ly, rx, ry, palmOut;
        if (armStage < 0.4) {
            // 抬手：从体侧升到肩高
            const t = armStage / 0.4;
            lx = cx - 6; ly = Math.round(bodyTop + 5 - t * 4);
            rx = cx + 5; ry = Math.round(bodyTop + 5 - t * 4);
            palmOut = false;
        } else if (armStage < 0.7) {
            // 结印：双手向中心靠拢
            const t = (armStage - 0.4) / 0.3;
            lx = Math.round(cx - 6 + t * 4); ly = bodyTop + 1;
            rx = Math.round(cx + 5 - t * 4); ry = bodyTop + 1;
            palmOut = false;
        } else {
            // 展开：双手向两侧上方张开，掌心朝前
            const t = (armStage - 0.7) / 0.3;
            lx = Math.round(cx - 2 - t * 6); ly = Math.round(bodyTop + 1 - t * 3);
            rx = Math.round(cx + 1 + t * 6); ry = Math.round(bodyTop + 1 - t * 3);
            palmOut = true;
        }

        // 袖臂（从肩连到手）
        this.drawSleeve(d, cx - 3, bodyTop + 2, lx, ly);
        this.drawSleeve(d, cx + 2, bodyTop + 2, rx, ry);

        // 骨白手
        d.rect(lx, ly - 1, 2, 2, this.cHand);
        d.pixel(lx, ly - 1, this.cHandShadow);
        d.rect(rx, ry - 1, 2, 2, this.cHand);
        d.pixel(rx + 1, ry - 1, this.cHandShadow);

        // 手间/掌上绿焰（随符文进度增强）
        if (runeGlow > 0.15) {
            if (!palmOut) {
                // 结印期：双手之间凝聚小焰
                const mx = Math.round((lx + rx) / 2);
                const my = Math.min(ly, ry) - 1;
                d.pixel(mx, my, this.cFlame);
                if (runeGlow > 0.5) {
                    d.pixel(mx, my - 1, this.cFlameCore);
                    d.pixel(mx - 1, my, this.cFlame);
                    d.pixel(mx + 1, my, this.cFlame);
                }
            } else {
                // 展开期：双掌各托焰苗 + 头顶汇聚符环
                d.pixel(lx, ly - 2, this.cFlame);
                d.pixel(rx + 1, ry - 2, this.cFlame);
                if (runeGlow > 0.6) {
                    d.pixel(lx, ly - 3, this.cFlameCore);
                    d.pixel(rx + 1, ry - 3, this.cFlameCore);
                    // 头顶汇聚符环
                    const ay = bodyTop - 6;
                    d.hLine(cx - 2, ay, 4, this.cRune);
                    d.pixel(cx, ay - 1, this.cRuneCore);
                    d.pixel(cx - 3, ay + 1, this.cRune);
                    d.pixel(cx + 3, ay + 1, this.cRune);
                }
            }
        }
    }

    /** 骨袍袖：肩点到手点的斜向短袖。 */
    drawSleeve(d, sx, sy, hx, hy) {
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = Math.round(sx + (hx - sx) * t);
            const y = Math.round(sy + (hy - sy) * t);
            d.pixel(x, y, this.cRobe);
            d.pixel(x, y + 1, this.cRobeDark);
        }
    }

    /** 兜帽 + 带角骨面具（裂纹）+ 绿瞳。 */
    drawHead(d, cx, cy, eyeFlicker) {
        // 兜帽
        d.fillPath([
            { x: cx - 5, y: cy + 1 },
            { x: cx - 3, y: cy - 4 },
            { x: cx + 1, y: cy - 5 },
            { x: cx + 5, y: cy - 2 },
            { x: cx + 6, y: cy + 3 },
            { x: cx - 5, y: cy + 4 }
        ], this.cRobeDark);
        d.hLine(cx - 3, cy - 4, 4, this.cRobe);
        d.vLine(cx + 5, cy - 1, 4, this.cRobeEdge);

        // 骨面具主体（朝左露出）
        d.rect(cx - 5, cy - 1, 7, 6, this.cSkull);
        d.vLine(cx - 5, cy - 1, 6, this.cSkullShadow);
        d.hLine(cx - 5, cy + 4, 7, this.cSkullDark);
        // 面具裂纹（对角）
        d.pixel(cx - 1, cy - 1, this.cSkullDark);
        d.pixel(cx, cy, this.cSkullDark);
        d.pixel(cx + 1, cy + 1, this.cSkullDark);
        // 两侧短角
        d.pixel(cx - 4, cy - 2, this.cHorn);
        d.pixel(cx - 4, cy - 3, this.cHorn);
        d.pixel(cx - 5, cy - 4, this.cHornDark);
        d.pixel(cx + 1, cy - 2, this.cHorn);
        d.pixel(cx + 2, cy - 3, this.cHornDark);
        // 眼窝 + 绿瞳（随 flicker）
        const eye = eyeFlicker > 0.5 ? this.cEyeCore : this.cEyeGlow;
        d.rect(cx - 4, cy, 2, 2, this.cSocket);
        d.rect(cx - 1, cy, 2, 2, this.cSocket);
        d.pixel(cx - 4, cy + 1, this.cEyeGlow);
        d.pixel(cx - 1, cy + 1, eye);
        // 鼻裂 + 齿列
        d.pixel(cx - 2, cy + 2, this.cSocket);
        for (let k = 0; k < 5; k++) {
            d.pixel(cx - 5 + k + 1, cy + 3, k % 2 ? this.cSkullShadow : this.cSkull);
        }
    }
}
