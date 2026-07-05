// Chest.js
// 地牢分级宝箱实体：E 键交互开启，按档位消耗钥匙，产出武器/金币。
// 不参与移动碰撞（可穿过），不可被子弹破坏。

import { Assets } from '../../graphics/Assets.js';
import { CHEST_TIERS } from '../dungeon/EconomyConfig.js';
import { rollChest, PET_ITEM_IDS } from '../dungeon/LootTable.js';
import { weaponItemIdFromConfigId, createWeaponInstanceData } from '../systems/WeaponInstanceUtils.js';
import { DroppedItem } from './DroppedItem.js';
import { CHEST_W, CHEST_H } from '../../assets/dungeon/ChestSprites.js';

// 宠物实体 petType → 召唤凭证物品 id，用于判定"已召唤同类宠物"。
const PET_TYPE_TO_ITEM_ID = { dog: 'consumable:pet_dog', cat: 'consumable:pet_cat', '2b': 'consumable:pet_2b' };

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
        const ownedPetItemIds = this._gatherOwnedPetItemIds(worldSystem);
        const result = rollChest(this.tier, Math.random, {
            ownedRelicIds,
            ownedPetItemIds,
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
                // 首抽已产宠物则并入去重集，避免双倍抽出重复宠物
                ownedPetItemIds: result.kind === 'pet'
                    ? [...ownedPetItemIds, result.petItemId]
                    : ownedPetItemIds,
            });
            this._spawnLoot(bonus, cx - 20, cy, worldSystem);
            worldSystem.spawnCoinBurst(cx, cy, bonus.coins);
        }
        return 'opened';
    }

    /**
     * 汇总玩家已"拥有"的宠物物品 id：背包中持有的宠物凭证 + 已召唤的同类宠物。
     * 供 rollChest 去重，避免掉落无用的重复宠物。
     * @returns {string[]}
     */
    _gatherOwnedPetItemIds(worldSystem) {
        const owned = new Set();
        const inv = worldSystem && worldSystem.inventorySystem;
        if (inv && inv.slots) {
            for (const slot of inv.slots) {
                if (slot && slot.itemId && PET_ITEM_IDS.includes(slot.itemId)) {
                    owned.add(slot.itemId);
                }
            }
        }
        const pets = worldSystem && worldSystem.pets;
        if (pets) {
            for (const pet of pets) {
                const id = PET_TYPE_TO_ITEM_ID[pet.petType];
                if (id) owned.add(id);
            }
        }
        return Array.from(owned);
    }

    _spawnLoot(result, cx, cy, worldSystem) {
        if (result.kind === 'relic' && result.relicId) {
            worldSystem.droppedItems.push(
                new DroppedItem(cx, cy + 16, `relic:${result.relicId}`)
            );
            return;
        }
        if (result.kind === 'pet' && result.petItemId) {
            // 宠物凭证落地为可拾取物，入背包后走现有 useSelectedConsumable 召唤流。
            worldSystem.droppedItems.push(
                new DroppedItem(cx, cy + 16, result.petItemId)
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
