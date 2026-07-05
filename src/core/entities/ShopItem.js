// ShopItem.js
// 商店货品实体：陈列在商店房，E 键购买。
// 武器/medkit 购买后在原地生成 DroppedItem（走既有拾取流），
// 遗物购买即生效（RelicSystem.addRelic），钥匙直接入账。

import { Assets } from '../../graphics/Assets.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { RELICS } from '../../assets/relics/RelicData.js';
import { RARITY_COLORS } from '../dungeon/RarityConfig.js';
import { weaponItemIdFromConfigId, createWeaponInstanceData } from '../systems/WeaponInstanceUtils.js';
import { DroppedItem } from './DroppedItem.js';

export class ShopItem {
    /**
     * @param {number} x 陈列中心世界 X
     * @param {number} y 陈列中心世界 Y
     * @param {{kind: string, payloadId: string|null, price: number}} offer
     */
    constructor(x, y, offer) {
        this.x = x;
        this.y = y;
        this.kind = offer.kind;         // 'weapon' | 'relic' | 'key' | 'medkit'
        this.payloadId = offer.payloadId;
        this.price = offer.price;
        this.sold = false;
        this.showHint = false;
        this.deniedTimer = 0;           // NEED GOLD / OWNED 红字剩余帧
        this.deniedReason = null;
        this.floatTimer = Math.random() * 100;
        this.width = 20;
        this.height = 20;
    }

    get displayName() {
        if (this.kind === 'weapon') return (WEAPONS[this.payloadId] || {}).name || 'Weapon';
        if (this.kind === 'relic') return (RELICS[this.payloadId] || {}).name || 'Relic';
        if (this.kind === 'key') return 'KEY';
        return 'MEDKIT';
    }

    /**
     * 尝试购买。
     * @returns {'bought'|'sold_out'|'no_gold'|'owned'}
     */
    tryBuy(runState, worldSystem) {
        if (this.sold) return 'sold_out';

        // 遗物已持有（本局宝箱先开出了同款）
        if (this.kind === 'relic' && worldSystem.relicSystem && worldSystem.relicSystem.has(this.payloadId)) {
            this.deniedTimer = 90;
            this.deniedReason = 'OWNED';
            return 'owned';
        }

        if (!runState || !runState.spendCoins(this.price)) {
            // [depth-batch:relics] 血肉契约：金币不足时以 HP 补足差额（不会致死）
            const relics = worldSystem && worldSystem.relicSystem;
            if (!(relics && relics.tryBloodPactPurchase(runState, this.price))) {
                this.deniedTimer = 90;
                this.deniedReason = 'NEED GOLD';
                return 'no_gold';
            }
        }

        this.sold = true;
        switch (this.kind) {
            case 'weapon': {
                const itemId = weaponItemIdFromConfigId(this.payloadId);
                if (itemId) {
                    const instanceData = createWeaponInstanceData({ weaponConfigId: this.payloadId });
                    worldSystem.droppedItems.push(new DroppedItem(this.x, this.y + 8, itemId, 1, instanceData));
                }
                break;
            }
            case 'relic':
                if (worldSystem.relicSystem) worldSystem.relicSystem.addRelic(this.payloadId);
                break;
            case 'key':
                runState.addKeys(1);
                break;
            case 'medkit':
                worldSystem.droppedItems.push(new DroppedItem(this.x, this.y + 8, 'consumable:medkit'));
                break;
        }
        return 'bought';
    }

    _sprite() {
        if (this.kind === 'weapon') {
            const conf = WEAPONS[this.payloadId];
            return conf ? Assets[conf.sprite] : null;
        }
        if (this.kind === 'relic') return Assets.relicIcons && Assets.relicIcons[this.payloadId];
        if (this.kind === 'key') return Assets.dungeonKey;
        return Assets.medkit;
    }

    update() {
        this.floatTimer += 0.05;
        if (this.deniedTimer > 0) this.deniedTimer--;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} playerCoins 用于价格标签颜色（买得起金色/买不起灰红）
     */
    draw(ctx, playerCoins = 0) {
        const dx = Math.floor(this.x);
        const dy = Math.floor(this.y);

        // 陈列座
        ctx.fillStyle = '#3a3244';
        ctx.fillRect(dx - 12, dy + 8, 24, 5);
        ctx.fillStyle = '#4a4058';
        ctx.fillRect(dx - 12, dy + 8, 24, 2);

        if (this.sold) {
            ctx.font = 'bold 7px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(160,160,160,0.8)';
            ctx.fillText('SOLD', dx, dy + 2);
            ctx.textAlign = 'left';
            return;
        }

        // 悬浮商品
        const floatY = Math.sin(this.floatTimer) * 2;
        const sprite = this._sprite();
        if (sprite) {
            const w = Math.min(24, sprite.width);
            const h = Math.min(24, sprite.height);
            ctx.drawImage(sprite, dx - w / 2, dy - h / 2 + floatY - 4, w, h);
        }

        // 稀有度描边点（武器）
        if (this.kind === 'weapon') {
            const rarity = (WEAPONS[this.payloadId] || {}).rarity;
            if (rarity && RARITY_COLORS[rarity]) {
                ctx.fillStyle = RARITY_COLORS[rarity];
                ctx.fillRect(dx - 12, dy + 8, 3, 2);
            }
        }

        // 价格标签
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        if (this.deniedTimer > 0) {
            ctx.fillStyle = '#e74c3c';
            ctx.fillText(this.deniedReason || 'NEED GOLD', dx, dy - 14);
        } else if (this.showHint) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`[E] BUY ${this.displayName}`, dx, dy - 14);
        }
        ctx.fillStyle = playerCoins >= this.price ? '#f1c40f' : '#9a8577';
        ctx.fillText(`$${this.price}`, dx, dy + 20);
        ctx.textAlign = 'left';
    }
}
