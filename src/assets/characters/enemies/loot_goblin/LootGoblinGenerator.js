// LootGoblinGenerator —— 盗宝地精：绿皮尖耳小个子，背一只鼓鼓的赃物麻袋。
// 大头 chibi、贼眉鼠眼、龅牙坏笑；跑动张扬（大摆臂、麻袋乱晃、金币外溢）。
// 32×32，默认朝左（脸/前臂偏 -x，麻袋背在 +x 后背）。attack 时前爪探出抓取。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class LootGoblinGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 绿皮四阶
        this.cSkin = '#6ab04c';
        this.cSkinDark = '#47823a';
        this.cSkinLight = '#8fd15f';
        this.cSkinEdge = '#2c521f';
        // 贼眼
        this.cEyeWhite = '#f4f1d0';
        this.cEyeGold = '#ffd24a';
        this.cPupil = '#1c1206';
        // 龅牙
        this.cTooth = '#eae2c2';
        // 破布腰裙
        this.cRag = '#7a4a2a';
        this.cRagDark = '#553219';
        // 麻袋（粗麻布）
        this.cSack = '#b89b6a';
        this.cSackDark = '#8a7048';
        this.cSackLight = '#d4bb8c';
        this.cSackTie = '#5c4a2e';
        // 金币（麻袋口外溢 + 抖落）
        this.cCoin = '#ffcf3e';
        this.cCoinDark = '#d4a017';
        this.cCoinHot = '#fff2b0';
    }

    /**
     * @param {Object} pose
     * @param {number} [pose.bob=0]       整体升降像素（呼吸 / 跑动颠簸）
     * @param {number} [pose.legPhase=0]  跑动腿相位 0~1（<0 表示待机站立）
     * @param {number} [pose.armSwing=0]  手臂前后摆 -1~1（跑动大摆臂）
     * @param {number} [pose.grab=0]      抓取探爪 0~1（attack）
     * @param {number} [pose.sackSway=0]  麻袋横摆像素（跑动乱晃）
     * @param {number} [pose.grin=0.4]    坏笑张嘴 0~1
     * @param {number} [pose.earFlick=0]  耳朵抽动 0~1
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const bob = pose.bob || 0;
        const legPhase = pose.legPhase ?? -1;
        const armSwing = pose.armSwing || 0;
        const grab = pose.grab || 0;
        const sackSway = pose.sackSway || 0;
        const grin = pose.grin ?? 0.4;
        const earFlick = pose.earFlick || 0;

        const cx = 16;
        const groundY = 30;

        // 投影（跑动时略扁）
        d.ellipse(cx, groundY, 7, 2, 'rgba(0,0,0,0.30)');

        // 后腿 / 前腿（站立或奔跑）
        this.drawLegs(d, cx, groundY, legPhase, bob);
        // 麻袋（背在后背 +x，先于身体绘制被身体压住根部）
        this.drawSack(d, cx, bob, sackSway);
        // 后臂（甩在身后 +x）
        this.drawBackArm(d, cx, bob, armSwing);
        // 身体
        this.drawBody(d, cx, bob);
        // 头
        this.drawHead(d, cx, bob, grin, earFlick);
        // 前臂（抓取 / 前摆，压在身体上）
        this.drawFrontArm(d, cx, bob, armSwing, grab);

        return d.getCanvas();
    }

    /** 两条细腿：legPhase<0 站立；否则交替前后蹬。 */
    drawLegs(d, cx, groundY, legPhase, bob) {
        const top = 22 + bob;
        if (legPhase < 0) {
            // 站立叉腿
            d.rect(cx - 4, top, 3, groundY - top - 1, this.cSkinDark);
            d.rect(cx + 1, top, 3, groundY - top - 1, this.cSkin);
            d.rect(cx - 5, groundY - 1, 4, 2, this.cSkinEdge); // 后脚
            d.rect(cx + 1, groundY - 1, 4, 2, this.cSkinEdge); // 前脚
            return;
        }
        const s = Math.sin(legPhase * Math.PI * 2);
        // 前腿（-x 侧，亮）随相位前伸/后收
        const frontLift = s > 0 ? Math.round(s * 3) : 0;
        const frontX = cx - 4 - Math.round(s * 2);
        d.rect(frontX, top, 3, groundY - top - 1 - frontLift, this.cSkin);
        d.rect(frontX - 1, groundY - 1 - frontLift, 4, 2, this.cSkinEdge);
        // 后腿（+x 侧，暗）反相
        const backLift = s < 0 ? Math.round(-s * 3) : 0;
        const backX = cx + 1 + Math.round(s * 2);
        d.rect(backX, top, 3, groundY - top - 1 - backLift, this.cSkinDark);
        d.rect(backX, groundY - 1 - backLift, 4, 2, this.cSkinEdge);
    }

    /** 赃物麻袋：鼓胀布袋 + 扎口 + 缝线 + 袋口外溢金币。 */
    drawSack(d, cx, bob, sway) {
        const bx = cx + 5 + sway;
        const by = 13 + bob;
        // 袋身（水滴形）
        d.fillPath([
            { x: bx - 3, y: by - 4 },
            { x: bx + 4, y: by - 3 },
            { x: bx + 6, y: by + 3 },
            { x: bx + 3, y: by + 8 },
            { x: bx - 3, y: by + 7 },
            { x: bx - 5, y: by + 1 }
        ], this.cSack);
        // 受光 / 阴影
        d.hLine(bx - 2, by - 3, 5, this.cSackLight);
        d.vLine(bx + 5, by, 5, this.cSackDark);
        d.pixel(bx + 3, by + 7, this.cSackDark);
        // 缝补丁十字线
        d.pixel(bx, by + 1, this.cSackDark);
        d.pixel(bx + 1, by + 1, this.cSackDark);
        d.pixel(bx, by + 2, this.cSackDark);
        // 扎口（顶部收束）
        d.rect(bx - 2, by - 6, 5, 2, this.cSackTie);
        d.pixel(bx - 1, by - 7, this.cSackTie);
        // 袋口外溢金币
        d.rect(bx - 2, by - 8, 2, 2, this.cCoin);
        d.pixel(bx, by - 9, this.cCoinHot);
        d.pixel(bx + 1, by - 7, this.cCoinDark);
        d.pixel(bx - 3, by - 6, this.cCoin);
    }

    /** 后臂：身后甩动（暗绿），随 armSwing 前后。 */
    drawBackArm(d, cx, bob, swing) {
        const sx = cx + 2 + Math.round(swing * 2);
        const sy = 15 + bob;
        d.rect(sx, sy, 2, 5, this.cSkinDark);
        d.rect(sx - Math.round(swing * 2), sy + 5, 2, 2, this.cSkinDark);
        d.pixel(sx - Math.round(swing * 2), sy + 7, this.cSkinEdge); // 拳
    }

    /** 矮壮小身子 + 破布腰裙。 */
    drawBody(d, cx, bob) {
        const top = 14 + bob;
        // 躯干
        d.fillPath([
            { x: cx - 4, y: top },
            { x: cx + 4, y: top },
            { x: cx + 5, y: top + 6 },
            { x: cx + 3, y: top + 9 },
            { x: cx - 4, y: top + 9 },
            { x: cx - 5, y: top + 5 }
        ], this.cSkin);
        // 胸腹受光 / 侧影
        d.vLine(cx - 3, top + 1, 6, this.cSkinLight);
        d.vLine(cx + 4, top + 1, 6, this.cSkinDark);
        // 肋骨暗纹（瘦削感）
        d.pixel(cx - 1, top + 3, this.cSkinDark);
        d.pixel(cx + 1, top + 4, this.cSkinDark);
        // 破布腰裙
        d.rect(cx - 5, top + 8, 10, 3, this.cRag);
        d.hLine(cx - 5, top + 10, 10, this.cRagDark);
        d.pixel(cx - 3, top + 11, this.cRagDark);
        d.pixel(cx + 2, top + 11, this.cRagDark);
    }

    /** 大头 + 尖耳 + 大鼻 + 贼眼 + 龅牙坏笑。 */
    drawHead(d, cx, bob, grin, earFlick) {
        const hx = cx - 1;
        const hy = 8 + bob;
        // 后耳（+x，暗）
        this.drawEar(d, hx + 6, hy, earFlick, this.cSkinDark, 1);
        // 头颅（略朝左的椭圆）
        d.ellipse(hx, hy, 7, 6, this.cSkin);
        d.ellipse(hx - 1, hy - 1, 5, 4, this.cSkinLight); // 额面受光
        d.pixel(hx + 6, hy + 2, this.cSkinDark);
        d.hLine(hx - 6, hy + 5, 10, this.cSkinDark); // 下颌阴影
        // 前耳（-x，亮，招风大尖耳）
        this.drawEar(d, hx - 7, hy - 1, earFlick, this.cSkin, -1);
        // 大钩鼻（朝左突出）
        d.fillPath([
            { x: hx - 6, y: hy },
            { x: hx - 9, y: hy + 1 },
            { x: hx - 8, y: hy + 3 },
            { x: hx - 6, y: hy + 2 }
        ], this.cSkin);
        d.pixel(hx - 8, hy + 2, this.cSkinDark);
        // 贼眼（金瞳，聚拢在鼻侧显狡黠）
        d.rect(hx - 5, hy - 2, 3, 3, this.cEyeWhite);
        d.rect(hx - 4, hy - 1, 2, 2, this.cEyeGold);
        d.pixel(hx - 4, hy - 1, this.cPupil);
        d.pixel(hx - 1, hy - 1, this.cEyeGold);   // 后眼一点点
        d.pixel(hx - 1, hy, this.cPupil);
        // 粗眉（阴险下压）
        d.hLine(hx - 5, hy - 3, 3, this.cSkinEdge);
        d.pixel(hx - 1, hy - 2, this.cSkinEdge);
        // 坏笑大嘴 + 龅牙
        const mouthW = 4 + Math.round(grin * 2);
        d.hLine(hx - 5, hy + 4, mouthW, this.cSkinEdge);
        for (let t = 0; t < mouthW - 1; t += 2) {
            d.pixel(hx - 5 + t, hy + 4, this.cTooth);
        }
        if (grin > 0.5) d.pixel(hx - 4, hy + 5, this.cTooth); // 下龅牙
    }

    /** 招风尖耳：dir=-1 朝左前 / dir=1 朝右后，earFlick 抽动上挑。 */
    drawEar(d, ex, ey, flick, col, dir) {
        const up = Math.round(flick * 2);
        d.fillPath([
            { x: ex, y: ey - 1 },
            { x: ex + dir * 4, y: ey - 3 - up },
            { x: ex + dir * 3, y: ey + 2 },
            { x: ex, y: ey + 2 }
        ], col);
        d.pixel(ex + dir * 2, ey - 1 - up, this.cSkinLight);
    }

    /** 前臂：grab>0 探爪抓取；否则随 armSwing 前摆。 */
    drawFrontArm(d, cx, bob, swing, grab) {
        const sy = 16 + bob;
        if (grab > 0.05) {
            // 探出抓取：肩 → 前伸小臂 → 张开三指爪
            const reach = Math.round(grab * 6);
            d.rect(cx - 5, sy, 2, 3, this.cSkin);
            d.rect(cx - 6 - reach, sy + 1, 3 + reach, 2, this.cSkin);
            const gx = cx - 7 - reach;
            d.pixel(gx, sy, this.cSkinLight);
            d.pixel(gx, sy + 1, this.cSkin);
            d.pixel(gx, sy + 3, this.cSkin);   // 三爪
            d.pixel(gx - 1, sy + 1, this.cSkinEdge);
            return;
        }
        // 前摆手臂（-x 侧，随 swing）
        const ax = cx - 5 + Math.round(swing * 2);
        d.rect(ax, sy, 2, 5, this.cSkin);
        d.rect(ax + Math.round(swing * 2), sy + 5, 2, 2, this.cSkin);
        d.pixel(ax + Math.round(swing * 2), sy + 7, this.cSkinLight); // 拳
    }
}
