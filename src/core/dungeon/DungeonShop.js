// DungeonShop.js
// 商店房商品生成与定价（纯逻辑）。商品实体为 ShopItem，购买交互在 PlayerSystem。

import { pickRarity, pickWeaponByRarity, pickRelic } from './LootTable.js';
import { SHOP } from './EconomyConfig.js';
import { WEAPONS } from '../../assets/weapons/WeaponData.js';

/**
 * 生成一层商店的商品清单。
 * 结构：1 武器（稀有度加权）+ 2 遗物（排除已持有）+ 1 钥匙 + 1 medkit。
 * @param {number} floor 楼层（决定价格系数）
 * @param {string[]} ownedRelicIds 已持有遗物
 * @param {() => number} rng
 * @returns {Array<{kind: string, payloadId: string|null, price: number}>}
 */
export function generateShopInventory(floor, ownedRelicIds = [], rng = Math.random) {
    const items = [];
    const mult = SHOP.floorPriceMult[floor] || 1;
    const price = (base) => Math.round(base * mult);

    // 1 武器
    const rarity = pickRarity(SHOP.weaponRarityWeights, rng);
    const weaponConfigId = pickWeaponByRarity(rarity, rng);
    if (weaponConfigId) {
        const actualRarity = WEAPONS[weaponConfigId].rarity || 'common';
        items.push({
            kind: 'weapon',
            payloadId: weaponConfigId,
            price: price(SHOP.weaponPriceByRarity[actualRarity] || 20),
        });
    }

    // 2 遗物（互不重复且排除已持有）
    const excluded = [...ownedRelicIds];
    for (let i = 0; i < 2; i++) {
        const relicId = pickRelic(excluded, rng);
        if (!relicId) break;
        excluded.push(relicId);
        items.push({ kind: 'relic', payloadId: relicId, price: price(SHOP.relicPrice) });
    }

    // 钥匙 + 补给
    items.push({ kind: 'key', payloadId: null, price: price(SHOP.keyPrice) });
    items.push({ kind: 'medkit', payloadId: null, price: price(SHOP.medkitPrice) });

    return items;
}
