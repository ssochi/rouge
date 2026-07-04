// Chest.js
// 地牢分级宝箱实体：E 键交互开启，按档位消耗钥匙，产出武器/金币。
// 不参与移动碰撞（可穿过），不可被子弹破坏。

import { Assets } from '../../graphics/Assets.js';
import { CHEST_TIERS } from '../dungeon/EconomyConfig.js';
import { rollChest } from '../dungeon/LootTable.js';
import { weaponItemIdFromConfigId, createWeaponInstanceData } from '../systems/WeaponInstanceUtils.js';
import { DroppedItem } from './DroppedItem.js';
import { CHEST_W, CHEST_H } from '../../assets/dungeon/ChestSprites.js';

export class Chest {
    /**
     * @param {number} x 左上角世界 X
     * @param {number} y 左上角世界 Y
     * @param {'wood'|'iron'|'mithril'|'dragon'} tier
     */
    constructor(x, y, tier) {
        this.x = x;
        this.y = y;
        this.tier = tier;
        this.width = CHEST_W;
        this.height = CHEST_H;
        this.isOpen = false;
        this.guaranteedRelic = false; // Boss 保底箱：未全收集时必出遗物
        this.showHint = false;    // 靠近提示（WorldSystem.updateChests 维护）
        this.deniedTimer = 0;     // NEED KEY 红字提示剩余帧数
    }

    get needsKey() {
        const conf = CHEST_TIERS[this.tier];
        return !!(conf && conf.needsKey);
    }

    /**
     * 尝试开箱。
     * @returns {'opened'|'need_key'|'already_open'}
     */
    tryOpen(runState, worldSystem) {
        if (this.isOpen) return 'already_open';
        if (this.needsKey) {
            if (!runState || !runState.useKey()) {
                this.deniedTimer = 90; // 约 1.5 秒红字提示
                return 'need_key';
            }
        }
        this.isOpen = true;

        const ownedRelicIds = runState ? runState.relicIds : [];
        const result = rollChest(this.tier, Math.random, {
            ownedRelicIds,
            forceRelic: this.guaranteedRelic,
        });
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        this._spawnLoot(result, cx, cy, worldSystem);
        worldSystem.spawnCoinBurst(cx, cy, result.coins);

        // 寻宝透镜：概率双倍产出（追加一次独立抽取）
        if (worldSystem.relicSystem && worldSystem.relicSystem.chestDoubleRoll()) {
            const bonus = rollChest(this.tier, Math.random, {
                ownedRelicIds: runState ? runState.relicIds : [],
            });
            this._spawnLoot(bonus, cx - 20, cy, worldSystem);
            worldSystem.spawnCoinBurst(cx, cy, bonus.coins);
        }
        return 'opened';
    }

    _spawnLoot(result, cx, cy, worldSystem) {
        if (result.kind === 'relic' && result.relicId) {
            worldSystem.droppedItems.push(
                new DroppedItem(cx, cy + 16, `relic:${result.relicId}`)
            );
            return;
        }
        if (result.weaponConfigId) {
            const weaponItemId = weaponItemIdFromConfigId(result.weaponConfigId);
            if (weaponItemId) {
                const instanceData = createWeaponInstanceData({ weaponConfigId: result.weaponConfigId });
                worldSystem.droppedItems.push(
                    new DroppedItem(cx, cy + 16, weaponItemId, 1, instanceData)
                );
            }
        }
    }

    // 不可被子弹破坏（占位以兼容通用受击框查询）
    getHurtbox() {
        return null;
    }

    update() {
        if (this.deniedTimer > 0) this.deniedTimer--;
    }

    draw(ctx) {
        const set = Assets.dungeonChests && Assets.dungeonChests[this.tier];
        const sprite = set ? (this.isOpen ? set.open : set.closed) : null;
        const drawX = Math.floor(this.x);
        const drawY = Math.floor(this.y);

        // 地面阴影
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(drawX + this.width / 2, drawY + this.height - 1, this.width / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (sprite) {
            ctx.drawImage(sprite, drawX, drawY);
        }

        // 未开且需钥匙：头顶小钥匙图标
        if (!this.isOpen && this.needsKey && Assets.dungeonKey) {
            ctx.drawImage(Assets.dungeonKey, drawX + Math.floor((this.width - 14) / 2), drawY - 12);
        }

        // 交互提示（风格与门/传送门一致）
        if (!this.isOpen && this.showHint) {
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            const cx = drawX + this.width / 2;
            if (this.deniedTimer > 0) {
                ctx.fillStyle = '#e74c3c';
                ctx.fillText('NEED KEY', cx, drawY - 16);
            } else {
                ctx.fillStyle = '#f1c40f';
                ctx.fillText('[E] OPEN CHEST', cx, drawY - 16);
            }
            ctx.textAlign = 'left';
        }
    }
}
