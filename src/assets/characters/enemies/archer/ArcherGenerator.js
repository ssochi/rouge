// ArcherGenerator —— 地牢骷髅弩手（狱卒亡骨）：残甲骷髅 + 重弩，蓄力直线箭。
// 性格=机械刻板。头骨转向瞄准 + 下颌咬合、逐根肋骨 + 脊柱、残甲肩板 + 破布披肩、
// 弩含绞盘/箭匣/弓片蓄力形变/弩弦张放。32×32，默认朝左。
import { PixelDraw } from '../../../../utils/PixelDraw.js';

export class ArcherGenerator {
    constructor() {
        this.width = 32;
        this.height = 32;

        // 骨（4 阶）
        this.cBone = '#d8d2c0';
        this.cBoneLight = '#ece7d8';
        this.cBoneShadow = '#aaa593';
        this.cBoneDark = '#7d7867';
        this.cSocket = '#241c14';

        // 独目黄火
        this.cEye = '#ffd23e';
        this.cEyeDim = '#9a7414';

        // 残甲
        this.cArmor = '#5c6470';
        this.cArmorLight = '#79818d';
        this.cArmorDark = '#3a4049';
        this.cRivet = '#2b2f36';

        // 破布披肩
        this.cCloak = '#4a3a4e';
        this.cCloakDark = '#31283a';
        this.cCloakEdge = '#5e4d62';

        // 重弩
        this.cWood = '#6e4a2a';
        this.cWoodDark = '#4c3018';
        this.cIron = '#565663';
        this.cIronLight = '#767688';
        this.cString = '#d8d2c0';
        this.cBolt = '#ffd23e';
        this.cBoltHot = '#fff3b0';
    }

    /**
     * @param {Object} pose
     * @param {number}  [pose.bodySquash=0]  躯体升降
     * @param {number}  [pose.legFrame=0]    步态相位 0~3
     * @param {number}  [pose.aim=0]          举弩瞄准 0~1（垂放→水平前指）
     * @param {number}  [pose.charge=0]       蓄力发光 0~1（弩槽箭矢亮起）
     * @param {boolean} [pose.recoil=false]   击发后坐
     * @param {number}  [pose.jawClench=0]    下颌咬合 0=张 / 1=合
     * @param {number}  [pose.headTurn=0]     头骨转向 -1~1（瞄准偏摆）
     * @param {number}  [pose.stringDraw=0]   弩弦张开 0=松弛 / 1=满张
     * @param {number}  [pose.cloakWave=0]    披肩摆动相位 0~1
     * @param {number}  [pose.partPhase=0]    部件错相 -1~1（奔跑骨架咔嗒感）
     */
    generateFrame(pose = {}) {
        const d = new PixelDraw(this.width, this.height);

        const squash = pose.bodySquash || 0;
        const legFrame = pose.legFrame || 0;
        const aim = pose.aim || 0;
        const charge = pose.charge || 0;
        const recoil = pose.recoil || false;
        const jawClench = pose.jawClench || 0;
        const headTurn = pose.headTurn || 0;
        const stringDraw = pose.stringDraw || 0;
        const cloakWave = pose.cloakWave || 0;
        const partPhase = pose.partPhase || 0;

        const cx = 16;
        const bodyTop = 13 + squash;
        // 部件错相：头/肩比躯体慢半拍（骨架松散的咔嗒感）
        const partBob = Math.round(partPhase);

        d.ellipse(16, 29, 8, 3, 'rgba(0,0,0,0.28)');

        this.drawCloak(d, cx, bodyTop, cloakWave);
        this.drawLegs(d, cx, legFrame);
        this.drawSpineRibs(d, cx, bodyTop);
        this.drawPauldron(d, cx, bodyTop + partBob);
        this.drawSkull(d, cx, bodyTop - 5 + partBob, headTurn, jawClench);
        this.drawCrossbow(d, cx, bodyTop, aim, charge, recoil, stringDraw);

        return d.getCanvas();
    }

    /** 破布披肩：躯体后方随相位摆动的残破斗篷（分两片、末端撕裂）。 */
    drawCloak(d, cx, top, wave) {
        const sway = Math.round(Math.sin(wave * Math.PI * 2) * 2);
        const flare = Math.abs(sway);
        // 主披肩（罩肩至腰）
        d.fillPath([
            { x: cx - 3,          y: top - 1 },
            { x: cx + 4,          y: top - 1 },
            { x: cx + 5 + sway,   y: top + 8 },
            { x: cx + 2 + sway,   y: top + 11 + flare },
            { x: cx - 4 + sway,   y: top + 11 + flare },
            { x: cx - 5,          y: top + 6 }
        ], this.cCloak);
        // 褶皱暗部
        d.vLine(cx + 2, top + 1, 8, this.cCloakDark);
        d.vLine(cx - 3, top + 1, 7, this.cCloakDark);
        // 撕裂下摆碎片
        d.pixel(cx - 4 + sway, top + 12 + flare, this.cCloakEdge);
        d.pixel(cx + 2 + sway, top + 12 + flare, this.cCloakDark);
        d.pixel(cx - 1 + sway, top + 11 + flare, this.cCloakEdge);
    }

    /** 骨腿 + 残甲护胫：两腿交替抬步。 */
    drawLegs(d, cx, legFrame) {
        const phase = Math.floor(legFrame) % 4;
        const leftLift = phase === 1 ? -1 : 0;
        const rightLift = phase === 3 ? -1 : 0;

        // 左腿（后）
        d.rect(cx - 4, 24 + leftLift, 2, 5 - leftLift, this.cBone);
        d.pixel(cx - 4, 26 + leftLift, this.cBoneShadow);
        d.rect(cx - 5, 28, 3, 1, this.cBoneDark); // 骨足
        // 右腿（前）+ 胫甲
        d.rect(cx + 2, 24 + rightLift, 2, 5 - rightLift, this.cBone);
        d.rect(cx + 1, 25 + rightLift, 1, 2, this.cArmor); // 护胫甲片
        d.pixel(cx + 2, 26 + rightLift, this.cBoneShadow);
        d.rect(cx + 1, 28, 3, 1, this.cBoneDark);
    }

    /** 脊柱 + 逐根肋骨：中轴脊椎串起可数的肋。 */
    drawSpineRibs(d, cx, top) {
        // 脊柱（带节感：明暗交替）
        for (let k = 0; k < 10; k++) {
            d.pixel(cx, top + k, k % 2 === 0 ? this.cBone : this.cBoneShadow);
        }
        // 肋骨：四对，逐根弯向两侧，越下越短
        const ribs = [
            { y: top + 1, len: 4 },
            { y: top + 3, len: 4 },
            { y: top + 5, len: 3 },
            { y: top + 7, len: 3 }
        ];
        for (const r of ribs) {
            // 左肋
            d.hLine(cx - r.len, r.y, r.len, this.cBone);
            d.pixel(cx - r.len, r.y + 1, this.cBoneShadow); // 肋端下弯
            // 右肋
            d.hLine(cx + 1, r.y, r.len, this.cBoneShadow);
            d.pixel(cx + r.len, r.y + 1, this.cBoneDark);
        }
        // 骨盆
        d.hLine(cx - 3, top + 9, 7, this.cBoneShadow);
        d.pixel(cx - 3, top + 10, this.cBoneDark);
        d.pixel(cx + 3, top + 10, this.cBoneDark);
    }

    /** 残甲肩板：左肩一块铆钉护甲（弩托肩）。 */
    drawPauldron(d, cx, top) {
        // 弧形肩甲
        d.fillPath([
            { x: cx - 6, y: top - 1 },
            { x: cx - 1, y: top - 2 },
            { x: cx,     y: top + 2 },
            { x: cx - 6, y: top + 3 }
        ], this.cArmor);
        d.hLine(cx - 6, top - 1, 5, this.cArmorLight); // 顶缘高光
        d.vLine(cx - 1, top - 1, 3, this.cArmorDark);  // 内缘暗
        // 铆钉
        d.pixel(cx - 5, top, this.cRivet);
        d.pixel(cx - 2, top + 1, this.cRivet);
        // 肩甲下的锁骨
        d.pixel(cx + 1, top, this.cBone);
    }

    /** 骷髅头：可转向瞄准，下颌开合咬齿，独目（朝左）亮火。 */
    drawSkull(d, cx, cy, headTurn, jawClench) {
        const tx = Math.round(headTurn * 2); // 转向横移
        const hx = cx + tx;

        // 颅顶
        d.rect(hx - 4, cy - 4, 8, 6, this.cBone);
        d.hLine(hx - 4, cy - 4, 8, this.cBoneLight); // 顶缘高光
        d.vLine(hx + 3, cy - 3, 5, this.cBoneShadow); // 右暗
        // 颞侧凹陷
        d.pixel(hx - 4, cy - 1, this.cBoneShadow);
        d.pixel(hx + 3, cy - 1, this.cBoneDark);

        // 眼窝（双）
        d.rect(hx - 3, cy - 2, 2, 2, this.cSocket);
        d.rect(hx + 1, cy - 2, 2, 2, this.cSocket);
        // 独目黄火：朝向 = headTurn，靠左侧亮
        const leftBright = headTurn <= 0;
        d.pixel(hx - 3, cy - 2, leftBright ? this.cEye : this.cEyeDim);
        d.pixel(hx + 1, cy - 2, leftBright ? this.cEyeDim : this.cEye);

        // 鼻腔
        d.pixel(hx - 1, cy, this.cSocket);
        d.pixel(hx, cy, this.cSocket);

        // 下颌：jawClench=1 咬合、=0 张开（露齿缝）
        const gap = Math.round((1 - jawClench) * 2); // 张口下移量
        const jawY = cy + 2 + gap;
        d.hLine(hx - 3, jawY, 6, this.cBone);
        // 牙列
        for (let k = -2; k <= 2; k++) {
            d.pixel(hx + k, cy + 2, this.cBoneLight); // 上齿
            if (gap > 0) d.pixel(hx + k, jawY, this.cBoneShadow); // 下齿
        }
    }

    /** 重弩：绞盘 + 箭匣 + 弓片（蓄力弯曲）+ 弩弦（张放形变）。 */
    drawCrossbow(d, cx, bodyTop, aim, charge, recoil, stringDraw) {
        const armY = bodyTop + 2;
        const reach = Math.round(4 + aim * 6) - (recoil ? 2 : 0);
        const bowX = cx - reach; // 弩身前端 X（朝左）

        // 持弩骨臂（自躯体伸向弩托）
        d.hLine(bowX + 2, armY, cx - bowX - 1, this.cBone);
        d.pixel(cx - 2, armY, this.cBoneShadow);

        // 弩身木托（水平）
        d.rect(bowX - 5, armY - 1, 10, 2, this.cWood);
        d.hLine(bowX - 5, armY, 10, this.cWoodDark); // 底缘暗
        d.pixel(bowX + 4, armY - 1, this.cWoodDark);

        // 绞盘（弩尾的上弦齿轮）
        d.rect(bowX + 3, armY - 2, 2, 2, this.cIron);
        d.pixel(bowX + 3, armY - 2, this.cIronLight);
        d.pixel(bowX + 4, armY - 1, this.cRivet);

        // 箭匣（托上小箭盒）
        d.rect(bowX - 1, armY - 3, 4, 2, this.cIron);
        d.hLine(bowX - 1, armY - 3, 4, this.cIronLight);
        d.pixel(bowX, armY - 2, this.cBolt); // 匣中备箭端

        // 弓片（垂直，蓄力/张弦时向后弯曲形变）
        const bend = Math.round(stringDraw * 2);
        // 上弓片
        d.fillPath([
            { x: bowX - 5,        y: armY - 5 },
            { x: bowX - 4,        y: armY - 5 },
            { x: bowX - 4 + bend, y: armY - 1 }
        ], this.cIron);
        d.pixel(bowX - 5, armY - 5, this.cIronLight);
        // 下弓片
        d.fillPath([
            { x: bowX - 5,        y: armY + 5 },
            { x: bowX - 4,        y: armY + 5 },
            { x: bowX - 4 + bend, y: armY + 1 }
        ], this.cIron);
        d.pixel(bowX - 5, armY + 5, this.cIronLight);

        // 弩弦：满张(stringDraw=1)贴近弩身、松弛(0)前凸
        const stringX = bowX - 5 + bend + Math.round((1 - stringDraw) * 2);
        d.line(bowX - 4 + bend, armY - 4, stringX, armY, this.cString);
        d.line(bowX - 4 + bend, armY + 4, stringX, armY, this.cString);

        // 蓄力箭矢（沿弩槽亮起，蓄满更长更亮）
        if (charge > 0.15) {
            const len = Math.round(2 + charge * 5);
            d.hLine(bowX - 5 - len, armY, len, this.cBolt);
            d.pixel(bowX - 5, armY, this.cBoltHot);
            if (charge > 0.7) {
                d.pixel(bowX - 6 - len, armY, this.cBoltHot); // 箭镞过亮
                d.pixel(bowX - 5 - len, armY - 1, this.cBolt);
                d.pixel(bowX - 5 - len, armY + 1, this.cBolt);
            }
        }
    }
}
