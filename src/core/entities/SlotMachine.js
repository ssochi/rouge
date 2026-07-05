// SlotMachine.js
// 地牢老虎机交互实体（对标以撒的结合的老虎机）。
// 状态机：idle → spinning(约 1s 滚轮) → result(展示) → idle；耐久耗尽后 busting(冒烟) → dead(废机)。
// 核心赌博逻辑在 GambleTable.SlotMachineCore（纯逻辑、可单测）；本实体只负责绘制 + 世界效果。
// 不参与移动碰撞（可穿过），不可被子弹破坏。

import { Assets } from '../../graphics/Assets.js';
import { GAMBLE } from '../dungeon/EconomyConfig.js';
import { SlotMachineCore, SLOT_SYMBOLS } from '../dungeon/GambleTable.js';
import { REEL, SLOT_W, SLOT_H } from '../../assets/objects/dungeon/SlotMachineSprite.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { RARITY_COLORS } from '../dungeon/RarityConfig.js';
import { weaponItemIdFromConfigId, createWeaponInstanceData } from '../systems/WeaponInstanceUtils.js';
import { DroppedItem } from './DroppedItem.js';

// 时序常量（60fps 语义）
const SPIN_FRAMES = 60;    // 滚轮转动 ≈ 1s
const RESULT_FRAMES = 96;  // 结果展示 ≈ 1.6s
const BUST_FRAMES = 66;    // 爆机冒烟 ≈ 1.1s

// 三滚轮逐个锁定的进度阈值（p = 已转动比例），营造依次停轮手感
const REEL_LOCK_AT = [0.58, 0.78, 0.94];

export class SlotMachine {
    /**
     * @param {number} x 左上角世界 X
     * @param {number} y 左上角世界 Y
     * @param {() => number} [rng] 随机源（默认 Math.random，测试可注入）
     */
    constructor(x, y, rng = Math.random) {
        this.x = x;
        this.y = y;
        this.width = SLOT_W;
        this.height = SLOT_H;

        this.core = new SlotMachineCore(rng);

        this.state = 'idle';       // idle | spinning | result | busting | dead
        this.animTimer = 0;        // 通用动画计时（灯闪 / 帧切换）
        this.spinTimer = 0;
        this.resultTimer = 0;
        this.bustTimer = 0;

        this.reward = null;        // 本次待结算奖励（beginSpin 预抽）
        this.finalSymbols = ['bar', 'bar', 'bar'];
        this.reelSymbols = ['bar', 'bar', 'bar'];
        this.reelLocked = [false, false, false];
        this.reelCycleTimer = 0;

        this.resultText = '';
        this.resultColor = '#f1c40f';

        this.showHint = false;     // 靠近提示（WorldSystem.updateSlotMachines 维护）
        this.deniedTimer = 0;      // 红字提示剩余帧
        this.deniedReason = null;
    }

    /** 交互中心（供接近判定 / 掉落定位）。 */
    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }

    /**
     * 尝试投币启动一次抽奖。金币不足 / 已爆机 / 忙碌均给红字提示并消费本次交互。
     * @param {import('../dungeon/DungeonRunState.js').DungeonRunState} runState
     * @param {import('../systems/WorldSystem.js').WorldSystem} worldSystem
     * @returns {'spinning'|'busy'|'no_gold'|'dead'}
     */
    tryUse(runState, worldSystem) {
        if (this.core.dead || this.state === 'dead' || this.state === 'busting') {
            this.deniedTimer = 60;
            this.deniedReason = 'BUSTED';
            return 'dead';
        }
        if (this.state !== 'idle') {
            return 'busy'; // 转动 / 展示中，忽略但仍算一次交互
        }

        const owned = runState ? runState.relicIds : [];
        const res = this.core.beginSpin(runState, owned);
        if (!res.ok) {
            if (res.reason === 'no_gold') {
                this.deniedTimer = 90;
                this.deniedReason = 'NEED GOLD';
            } else {
                this.deniedTimer = 60;
                this.deniedReason = 'BUSTED';
            }
            return res.reason;
        }

        // 启动转动
        this.reward = res.reward;
        this.finalSymbols = res.reward.symbols;
        this.reelLocked = [false, false, false];
        this.state = 'spinning';
        this.spinTimer = SPIN_FRAMES;
        this.reelCycleTimer = 0;
        this._scatterReels();
        worldSystem?.soundSystem?.play('slot_spin', { x: this.centerX, y: this.centerY }); // [audio-p1] 投币/滚轮启动
        return 'spinning';
    }

    _scatterReels() {
        for (let i = 0; i < 3; i++) {
            this.reelSymbols[i] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        }
    }

    update(worldSystem) {
        this.animTimer++;
        if (this.deniedTimer > 0) this.deniedTimer--;

        switch (this.state) {
            case 'spinning': {
                this.spinTimer--;
                const p = 1 - this.spinTimer / SPIN_FRAMES;
                // 依进度逐个锁定滚轮到最终图案
                for (let i = 0; i < 3; i++) {
                    if (!this.reelLocked[i] && p >= REEL_LOCK_AT[i]) {
                        this.reelLocked[i] = true;
                        this.reelSymbols[i] = this.finalSymbols[i];
                    }
                }
                // 未锁定的滚轮快速滚动
                this.reelCycleTimer++;
                if (this.reelCycleTimer >= 3) {
                    this.reelCycleTimer = 0;
                    for (let i = 0; i < 3; i++) {
                        if (!this.reelLocked[i]) {
                            this.reelSymbols[i] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
                        }
                    }
                }
                if (this.spinTimer <= 0) this._reveal(worldSystem);
                break;
            }
            case 'result': {
                this.resultTimer--;
                if (this.resultTimer <= 0) {
                    if (this.core.dead) {
                        this.state = 'busting';
                        this.bustTimer = BUST_FRAMES;
                    } else {
                        this.state = 'idle';
                        this.reward = null;
                    }
                }
                break;
            }
            case 'busting': {
                this.bustTimer--;
                if (this.bustTimer <= 0) this.state = 'dead';
                break;
            }
            default:
                break;
        }
    }

    /** 滚轮停稳：结算奖励 + 世界效果，并推进耐久。 */
    _reveal(worldSystem) {
        for (let i = 0; i < 3; i++) this.reelSymbols[i] = this.finalSymbols[i];
        // [audio-p1] 中奖上行琶音（显著奖励：遗物/武器/大金币）；爆炸奖励由 spawnExplosion 自带轰声
        if (this.reward && ['relic', 'weapon', 'coins_big'].includes(this.reward.kind)) {
            worldSystem?.soundSystem?.play('slot_win', { x: this.centerX, y: this.centerY });
        }
        this._enactReward(this.reward, worldSystem);
        this.core.settle(); // 耐久 -1，归零则爆机
        this.state = 'result';
        this.resultTimer = RESULT_FRAMES;
    }

    /** 依据奖励类型产出掉落 / 触发爆炸，并设置结果横幅文案。 */
    _enactReward(reward, worldSystem) {
        if (!reward || !worldSystem) return;
        // 掉落点推到柜体正前方 40px 外：既不被机身碰撞挡住拾取路径，
        // 也脱离老虎机 50px 交互半径（用户反馈：掉落物与机身判定重叠无法拾取）
        const cx = this.centerX + (Math.random() - 0.5) * 16;
        const dropY = this.y + this.height + 40;
        const topY = this.y + 8;

        switch (reward.kind) {
            case 'coins_small':
            case 'coins_big':
                worldSystem.spawnCoinBurst(cx, topY, reward.coins);
                this.resultText = `+${reward.coins}`;
                this.resultColor = reward.kind === 'coins_big' ? '#f6dd8b' : '#f1c40f';
                break;
            case 'medkit':
                worldSystem.droppedItems.push(new DroppedItem(cx, dropY, 'consumable:medkit'));
                this.resultText = 'MEDKIT';
                this.resultColor = '#4ade80';
                break;
            case 'key':
                worldSystem.spawnKeyDrop(cx, dropY);
                this.resultText = 'KEY';
                this.resultColor = '#d9c27a';
                break;
            case 'weapon': {
                const itemId = reward.weaponConfigId ? weaponItemIdFromConfigId(reward.weaponConfigId) : null;
                if (itemId) {
                    const instanceData = createWeaponInstanceData({ weaponConfigId: reward.weaponConfigId });
                    worldSystem.droppedItems.push(new DroppedItem(cx, dropY, itemId, 1, instanceData));
                    const rarity = (WEAPONS[reward.weaponConfigId] || {}).rarity;
                    this.resultColor = (rarity && RARITY_COLORS[rarity]) || '#f1c40f';
                    this.resultText = 'WEAPON!';
                } else {
                    worldSystem.spawnCoinBurst(cx, topY, 4);
                    this.resultText = '+4';
                    this.resultColor = '#f1c40f';
                }
                break;
            }
            case 'relic':
                if (reward.relicId) {
                    worldSystem.droppedItems.push(new DroppedItem(cx, dropY, `relic:${reward.relicId}`));
                    // 三个 7！大奖：额外撒一小把金币火花庆祝
                    worldSystem.spawnCoinBurst(cx, topY, 5);
                    this.resultText = 'JACKPOT 777!';
                    this.resultColor = '#e0b0ff';
                }
                break;
            case 'bomb':
                if (worldSystem.combatSystem && worldSystem.combatSystem.spawnExplosion) {
                    worldSystem.combatSystem.spawnExplosion(
                        cx, this.y + this.height - 8, reward.damage, reward.radius, reward.knockback
                    );
                }
                this.resultText = 'BOOM!';
                this.resultColor = '#e74c3c';
                break;
            default: // empty
                this.resultText = 'TRY AGAIN';
                this.resultColor = '#9aa0aa';
                break;
        }
    }

    // 不可被子弹破坏（占位以兼容通用受击框查询）
    getHurtbox() { return null; }

    _currentFrame() {
        const set = Assets.slotMachine && Assets.slotMachine.frames;
        if (!set) return null;
        switch (this.state) {
            case 'spinning':
                return set.spin[Math.floor(this.animTimer / 4) % set.spin.length];
            case 'result': {
                const k = this.reward ? this.reward.kind : 'empty';
                const isWin = k !== 'empty' && k !== 'bomb';
                if (isWin) return set.win[Math.floor(this.animTimer / 6) % set.win.length];
                return set.idle[0];
            }
            case 'busting':
                return set.bust[Math.floor(this.animTimer / 8) % set.bust.length];
            case 'dead':
                return set.dead;
            default: // idle：缓慢灯闪
                return set.idle[Math.floor(this.animTimer / 30) % set.idle.length];
        }
    }

    draw(ctx) {
        const drawX = Math.floor(this.x);
        const drawY = Math.floor(this.y);

        // 地面阴影
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(drawX + this.width / 2, drawY + this.height - 1, this.width / 2 - 1, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const frame = this._currentFrame();
        if (frame) ctx.drawImage(frame, drawX, drawY);

        // 滚轮图案（cream 窗口态才叠绘：idle / spinning / result）
        const showReels = this.state === 'idle' || this.state === 'spinning' || this.state === 'result';
        const symbols = Assets.slotMachine && Assets.slotMachine.symbols;
        if (showReels && symbols) {
            for (let i = 0; i < 3; i++) {
                const glyph = symbols[this.reelSymbols[i]];
                if (glyph) ctx.drawImage(glyph, drawX + REEL.x0 + i * REEL.cellW, drawY + REEL.y0);
            }
        }

        this._drawHud(ctx, drawX, drawY);
    }

    _drawHud(ctx, drawX, drawY) {
        const cx = drawX + this.width / 2;
        ctx.textAlign = 'center';

        // 结果横幅（上浮淡出）
        if (this.state === 'result' && this.resultText) {
            const t = this.resultTimer / RESULT_FRAMES;
            const rise = (1 - t) * 12;
            ctx.globalAlpha = Math.min(1, this.resultTimer / 24);
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = this.resultColor;
            ctx.fillText(this.resultText, cx, drawY - 12 - rise);
            ctx.globalAlpha = 1;
        }

        // 交互 / 拒绝提示
        ctx.font = 'bold 7px monospace';
        if (this.deniedTimer > 0) {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(this.deniedReason || 'NEED GOLD', cx, drawY - 4);
        } else if (this.state === 'dead') {
            if (this.showHint) {
                ctx.fillStyle = '#9aa0aa';
                ctx.fillText('BUSTED', cx, drawY - 4);
            }
        } else if (this.state === 'idle' && this.showHint) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`[E] SPIN $${GAMBLE.coinCost}`, cx, drawY - 4);
        }
        ctx.textAlign = 'left';
    }
}
