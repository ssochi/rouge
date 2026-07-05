// RelicAltar.js
// [tension-batch:power] 遗物三选一祭坛：三个石质底座一字排开，各悬浮展示一个遗物图标。
// 玩家靠近某底座 → 显示该遗物名 + 描述；按 E 选定 → 该遗物入手（走 RelicSystem.addRelic 拾取 toast），
// 另外两座熄灭碎裂。选一后锁定，不可再选。
// 纯逻辑（选一灭二 / 排除已持有）在 RelicAltarCore；本实体负责摆位、悬浮动画与绘制。
// 不参与移动碰撞（可穿过），不可被子弹破坏。

import { Assets } from '../../graphics/Assets.js';
import { RELICS } from '../../assets/relics/RelicData.js';
import { RARITY_COLORS } from '../dungeon/RarityConfig.js';
import { RelicAltarCore } from '../dungeon/RelicAltarCore.js';
import { PEDESTAL_W, PEDESTAL_TOP } from '../../assets/objects/dungeon/RelicAltarSprite.js';

const PEDESTAL_SPACING = 46; // 相邻底座中心间距（px）
const INTERACT_RADIUS = 42;  // 单座交互 / 提示半径
const BREAK_FRAMES = 36;     // 选定后碎裂动画时长
const ICON_HOVER = 17;       // 悬浮图标中心相对顶盘的抬升高度
const ICON_SCALE = 2;        // 12×12 图标放大倍数

export class RelicAltar {
    /**
     * @param {number} x 祭坛几何中心 X（三座横排的中点）
     * @param {number} y 顶盘所在世界 Y（图标悬浮于其上、底座向下延伸）
     * @param {string[]} relicIds 三个候选遗物 id（由 LootTable.pickRelicChoices 抽取）
     */
    constructor(x, y, relicIds = []) {
        this.x = x;
        this.y = y;
        this.core = new RelicAltarCore(relicIds);

        this.animTimer = 0;
        this.activeIndex = -1; // 玩家当前靠近的底座（展示名字/描述）
        this.breakTimer = 0;

        // 各底座中心 X（横排居中）
        const n = this.core.count;
        this.pedestalX = [];
        this.floatPhase = [];
        for (let i = 0; i < n; i++) {
            this.pedestalX.push(x + (i - (n - 1) / 2) * PEDESTAL_SPACING);
            this.floatPhase.push(i * 0.9);
        }
    }

    get resolved() { return this.core.resolved; }

    /** 第 i 座顶盘中心世界坐标（交互接近判定 / 图标定位）。 */
    pedestalCenter(i) {
        return { x: this.pedestalX[i], y: this.y };
    }

    /**
     * 玩家半径内最近的未熄灭底座下标；无则 -1。
     * @param {number} px 玩家世界 X
     * @param {number} py 玩家世界 Y
     * @returns {number}
     */
    nearestPedestal(px, py) {
        if (this.resolved) return -1;
        let best = -1;
        let bestD = INTERACT_RADIUS * INTERACT_RADIUS;
        for (let i = 0; i < this.core.count; i++) {
            const dx = px - this.pedestalX[i];
            const dy = py - this.y;
            const d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; best = i; }
        }
        return best;
    }

    /**
     * 每帧更新：推进动画计时，并计算玩家当前靠近的底座（供提示展示）。
     * @param {number} px 玩家世界 X
     * @param {number} py 玩家世界 Y
     */
    update(px, py) {
        this.animTimer++;
        if (this.breakTimer > 0) this.breakTimer--;

        if (this.resolved) { this.activeIndex = -1; return; }
        this.activeIndex = this.nearestPedestal(px, py);
    }

    /**
     * 选定玩家当前靠近的底座：授予遗物 + 其余两座熄灭碎裂。
     * 无靠近底座 / 已选定则不消费本次交互。
     * @param {import('../systems/WorldSystem.js').WorldSystem} worldSystem
     * @param {number} [px] 玩家世界 X（传入则以此重算最近底座，避免依赖上一帧缓存）
     * @param {number} [py] 玩家世界 Y
     * @returns {boolean} 是否消费了本次交互
     */
    tryChoose(worldSystem, px, py) {
        if (this.resolved) return false;
        const i = (px != null && py != null) ? this.nearestPedestal(px, py) : this.activeIndex;
        if (i < 0) return false;
        const relicId = this.core.choose(i);
        if (!relicId) return false;

        this.breakTimer = BREAK_FRAMES;
        this.activeIndex = -1;

        // 授予遗物：优先走 RelicSystem.addRelic（含即时效果 + 拾取 toast）；
        // 无 relicSystem 时回退直接写 runState（已持有则 addRelic 自身幂等）。
        const rs = worldSystem && worldSystem.relicSystem;
        if (rs && typeof rs.addRelic === 'function') {
            rs.addRelic(relicId);
        } else if (worldSystem && worldSystem.dungeonRunState) {
            worldSystem.dungeonRunState.addRelic(relicId);
        }
        return true;
    }

    // 不可被子弹破坏（占位以兼容通用受击框查询）
    getHurtbox() { return null; }

    draw(ctx) {
        const sprites = Assets.relicAltar;
        if (!sprites) return;
        const litFrame = sprites.lit[Math.floor(this.animTimer / 24) % sprites.lit.length];

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        for (let i = 0; i < this.core.count; i++) {
            const cx = this.pedestalX[i];
            const drawX = Math.floor(cx - PEDESTAL_TOP.x);
            const drawY = Math.floor(this.y - PEDESTAL_TOP.y);
            const extinguished = this.core.isExtinguished(i);

            const frame = extinguished ? sprites.broken : litFrame;
            if (extinguished && this.breakTimer > 0) {
                // 碎裂瞬间：轻微下沉 + 闪白
                ctx.drawImage(frame, drawX, drawY + 1);
            } else {
                ctx.drawImage(frame, drawX, drawY);
            }

            if (!extinguished) {
                this._drawFloatingRelic(ctx, i, cx);
            }
        }

        // 名字 / 描述 / 选择提示（当前靠近的一座）
        if (!this.resolved && this.activeIndex >= 0) {
            this._drawInfo(ctx, this.activeIndex);
        }

        ctx.restore();
    }

    /** 绘制第 i 座顶盘上方悬浮的遗物图标 + 底光。 */
    _drawFloatingRelic(ctx, i, cx) {
        const relicId = this.core.relicIds[i];
        const relic = RELICS[relicId];
        const icon = Assets.relicIcons && Assets.relicIcons[relicId];
        if (!icon) return;

        const rarityColor = RARITY_COLORS[(relic && relic.rarity) || 'common'] || '#b0b0b0';
        const float = Math.sin(this.animTimer * 0.06 + this.floatPhase[i]) * 3;
        const iconCY = this.y - ICON_HOVER + float;
        const size = 12 * ICON_SCALE;

        // 顶盘底光（稀有度色，随悬浮呼吸）
        const glowA = 0.28 + 0.12 * Math.sin(this.animTimer * 0.08 + this.floatPhase[i]);
        ctx.globalAlpha = Math.max(0, glowA);
        ctx.fillStyle = rarityColor;
        ctx.beginPath();
        ctx.ellipse(cx, this.y - 1, 9, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 图标下方竖直光柱（微弱）
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = rarityColor;
        ctx.fillRect(cx - 5, iconCY, 10, this.y - 1 - iconCY);
        ctx.globalAlpha = 1;

        // 图标（放大 2×，像素对齐）
        ctx.drawImage(icon, Math.floor(cx - size / 2), Math.floor(iconCY - size / 2), size, size);
    }

    /** 绘制当前靠近底座的遗物名 + 描述 + [E] 选择提示。 */
    _drawInfo(ctx, i) {
        const relicId = this.core.relicIds[i];
        const relic = RELICS[relicId];
        if (!relic) return;
        const cx = this.pedestalX[i];
        const topY = this.y - ICON_HOVER - 16; // 图标之上

        const rarityColor = RARITY_COLORS[relic.rarity || 'common'] || '#e0e0e0';
        ctx.textAlign = 'center';

        // 名字
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = rarityColor;
        ctx.fillText(relic.name || relicId, cx, topY);

        // 描述
        ctx.font = '7px monospace';
        ctx.fillStyle = '#cfd3da';
        ctx.fillText(relic.desc || '', cx, topY + 9);

        // 选择提示
        ctx.font = 'bold 7px monospace';
        ctx.fillStyle = '#f1c40f';
        ctx.fillText('[E] 选择', cx, topY + 19);

        ctx.textAlign = 'left';
    }
}
