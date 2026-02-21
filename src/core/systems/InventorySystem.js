import { Assets } from '../../graphics/Assets.js';
import { BreakableObject } from '../entities/BreakableObject.js';
import { FLOOR_TYPES } from '../../utils/FloorTypes.js';
import {
    cloneWeaponInstanceData,
    createWeaponInstanceData,
    weaponConfigIdFromItemId
} from './WeaponInstanceUtils.js';

export const SLOT_COUNT = 117; // 9 Hotbar + 108 Backpack (12 rows)
export const HOTBAR_SIZE = 9;

export class InventorySystem {
    constructor() {
        this.items = new Map(); // id -> ItemDefinition
        this.slots = new Array(SLOT_COUNT).fill(null).map(() => ({
            itemId: null,
            count: 0,
            instanceData: null
        }));
        
        this.selectedHotbarIndex = 0;
        
        this._initItemDefinitions();
    }

    _initItemDefinitions() {
        // 1. Register Weapons (Manual for now, based on Assets.gun/rocket_launcher)
        this.registerItem({
            id: 'weapon:rifle',
            type: 'weapon',
            name: 'Rifle',
            icon: 'gun', // Key in Assets
            maxStack: 1,
            data: { weaponConfigId: 'default_rifle' }
        });

        this.registerItem({
            id: 'weapon:rocket_launcher',
            type: 'weapon',
            name: 'RPG',
            icon: 'rocket_launcher',
            maxStack: 1,
            data: { weaponConfigId: 'rocket_launcher' }
        });
        
        this.registerItem({
            id: 'weapon:pistol',
            type: 'weapon',
            name: 'Pistol',
            icon: 'pistol',
            maxStack: 1,
            data: { weaponConfigId: 'default_pistol' }
        });

        this.registerItem({
            id: 'weapon:smg',
            type: 'weapon',
            name: 'SMG',
            icon: 'smg',
            maxStack: 1,
            data: { weaponConfigId: 'smg' }
        });

        this.registerItem({
            id: 'weapon:shotgun',
            type: 'weapon',
            name: 'Shotgun',
            icon: 'shotgun',
            maxStack: 1,
            data: { weaponConfigId: 'shotgun' }
        });

        this.registerItem({
            id: 'weapon:sniper',
            type: 'weapon',
            name: 'Sniper Rifle',
            icon: 'sniper',
            maxStack: 1,
            data: { weaponConfigId: 'sniper' }
        });

        this.registerItem({
            id: 'weapon:crossbow',
            type: 'weapon',
            name: 'Crossbow',
            icon: 'crossbow',
            maxStack: 1,
            data: { weaponConfigId: 'crossbow' }
        });

        this.registerItem({
            id: 'weapon:grenade_launcher',
            type: 'weapon',
            name: 'Grenade Launcher',
            icon: 'grenade_launcher',
            maxStack: 1,
            data: { weaponConfigId: 'grenade_launcher' }
        });

        this.registerItem({
            id: 'weapon:laser_gun',
            type: 'weapon',
            name: 'Laser Gun',
            icon: 'laser_gun',
            maxStack: 1,
            data: { weaponConfigId: 'laser_gun' }
        });

        this.registerItem({
            id: 'weapon:flamethrower',
            type: 'weapon',
            name: 'Flamethrower',
            icon: 'flamethrower',
            maxStack: 1,
            data: { weaponConfigId: 'flamethrower' }
        });

        this.registerItem({
            id: 'weapon:black_hole_gun',
            type: 'weapon',
            name: 'Black Hole Gun',
            icon: 'black_hole_gun',
            maxStack: 1,
            data: { weaponConfigId: 'black_hole_gun' }
        });

        this.registerItem({
            id: 'weapon:teleport_gun',
            type: 'weapon',
            name: 'Teleport Gun',
            icon: 'teleport_gun',
            maxStack: 1,
            data: { weaponConfigId: 'teleport_gun' }
        });

        this.registerItem({
            id: 'weapon:lightning_gun',
            type: 'weapon',
            name: 'Lightning Gun',
            icon: 'lightning_gun',
            maxStack: 1,
            data: { weaponConfigId: 'lightning_gun' }
        });

        this.registerItem({
            id: 'weapon:freeze_ray',
            type: 'weapon',
            name: 'Freeze Ray',
            icon: 'freeze_ray',
            maxStack: 1,
            data: { weaponConfigId: 'freeze_ray' }
        });

        this.registerItem({
            id: 'weapon:ricochet_gun',
            type: 'weapon',
            name: 'Ricochet Gun',
            icon: 'ricochet_gun',
            maxStack: 1,
            data: { weaponConfigId: 'ricochet_gun' }
        });

        this.registerItem({
            id: 'weapon:boomerang',
            type: 'weapon',
            name: 'Boomerang',
            icon: 'boomerang',
            maxStack: 1,
            data: { weaponConfigId: 'boomerang' }
        });

        this.registerItem({
            id: 'weapon:katana',
            type: 'weapon',
            name: 'Katana',
            icon: 'katana',
            maxStack: 1,
            data: { weaponConfigId: 'katana' }
        });

        this.registerItem({
            id: 'weapon:dagger',
            type: 'weapon',
            name: 'Dagger',
            icon: 'dagger',
            maxStack: 1,
            data: { weaponConfigId: 'dagger' }
        });

        this.registerItem({
            id: 'weapon:greatsword',
            type: 'weapon',
            name: 'Greatsword',
            icon: 'greatsword',
            maxStack: 1,
            data: { weaponConfigId: 'greatsword' }
        });

        this.registerItem({
            id: 'weapon:spear',
            type: 'weapon',
            name: 'Spear',
            icon: 'spear',
            maxStack: 1,
            data: { weaponConfigId: 'spear' }
        });

        this.registerItem({
            id: 'weapon:battle_axe',
            type: 'weapon',
            name: 'Battle Axe',
            icon: 'battle_axe',
            maxStack: 1,
            data: { weaponConfigId: 'battle_axe' }
        });

        this.registerItem({
            id: 'weapon:plasma_rifle',
            type: 'weapon',
            name: 'Plasma Rifle',
            icon: 'plasma_rifle',
            maxStack: 1,
            data: { weaponConfigId: 'plasma_rifle' }
        });
        this.registerItem({
            id: 'weapon:homing_launcher',
            type: 'weapon',
            name: 'Homing Launcher',
            icon: 'homing_launcher',
            maxStack: 1,
            data: { weaponConfigId: 'homing_launcher' }
        });
        this.registerItem({
            id: 'weapon:acid_gun',
            type: 'weapon',
            name: 'Acid Gun',
            icon: 'acid_gun',
            maxStack: 1,
            data: { weaponConfigId: 'acid_gun' }
        });
        this.registerItem({
            id: 'weapon:cluster_gun',
            type: 'weapon',
            name: 'Cluster Gun',
            icon: 'cluster_gun',
            maxStack: 1,
            data: { weaponConfigId: 'cluster_gun' }
        });
        this.registerItem({
            id: 'weapon:force_gun',
            type: 'weapon',
            name: 'Force Gun',
            icon: 'force_gun',
            maxStack: 1,
            data: { weaponConfigId: 'force_gun' }
        });

        this.registerItem({
            id: 'weapon:vampyre_gun',
            type: 'weapon',
            name: 'Vampyre',
            icon: 'vampyre_gun',
            maxStack: 1,
            data: { weaponConfigId: 'vampyre_gun' }
        });

        this.registerItem({
            id: 'weapon:needle_gun',
            type: 'weapon',
            name: 'Needle Gun',
            icon: 'needle_gun',
            maxStack: 1,
            data: { weaponConfigId: 'needle_gun' }
        });

        this.registerItem({
            id: 'weapon:railgun',
            type: 'weapon',
            name: 'Railgun',
            icon: 'railgun',
            maxStack: 1,
            data: { weaponConfigId: 'railgun' }
        });

        this.registerItem({
            id: 'weapon:turret_deployer',
            type: 'weapon',
            name: '炮塔部署器',
            icon: 'turret_deployer',
            maxStack: 1,
            data: { weaponConfigId: 'turret_deployer' }
        });

        this.registerItem({
            id: 'consumable:recovery_needle',
            type: 'consumable',
            name: 'Recovery Needle',
            description: 'Left click to increase max HP by 50% and fully heal.',
            icon: 'recovery_needle',
            maxStack: 5,
            data: {
                maxHpBoostPercent: 50,
                holdWeaponKey: 'recovery_needle'
            }
        });

        this.registerItem({
            id: 'consumable:medkit',
            type: 'consumable',
            name: 'Medkit',
            description: 'Left click to recover 35 HP.',
            icon: 'medkit',
            maxStack: 5,
            data: {
                healAmount: 35,
                holdWeaponKey: 'medkit'
            }
        });

        this.registerItem({
            id: 'consumable:hamburger',
            type: 'consumable',
            name: 'Hamburger',
            description: 'Left click to recover 75 HP.',
            icon: 'hamburger',
            maxStack: 3,
            data: {
                healAmount: 75,
                holdWeaponKey: 'hamburger'
            }
        });

        this.registerItem({
            id: 'consumable:pet_dog',
            type: 'consumable',
            name: 'Pet Dog',
            description: 'Left click to summon a pet dog.',
            icon: 'pet_dog_item',
            maxStack: 1,
            data: { petType: 'dog' }
        });

        this.registerItem({
            id: 'consumable:pet_cat',
            type: 'consumable',
            name: 'Pet Cat',
            description: 'Left click to summon a pet cat.',
            icon: 'pet_cat_item',
            maxStack: 1,
            data: { petType: 'cat' }
        });

        this.registerItem({
            id: 'consumable:pet_2b',
            type: 'consumable',
            name: '2B',
            description: 'Left click to summon 2B.',
            icon: 'pet_2b_item',
            maxStack: 1,
            data: { petType: '2b' }
        });

        // 2. Register Costumes
        // Hairstyles (including defaults)
        this.registerItem({
            id: 'costume:hair_long', type: 'costume', name: '长发',
            icon: 'costume_hair_long', maxStack: 1,
            data: { costumeSlot: 'hairstyle', costumePieceId: 'hair_long' }
        });
        this.registerItem({
            id: 'costume:hair_messy', type: 'costume', name: '乱发',
            icon: 'costume_hair_messy', maxStack: 1,
            data: { costumeSlot: 'hairstyle', costumePieceId: 'hair_messy' }
        });
        this.registerItem({
            id: 'costume:hair_short', type: 'costume', name: '短发',
            icon: 'costume_hair_short', maxStack: 1,
            data: { costumeSlot: 'hairstyle', costumePieceId: 'hair_short' }
        });
        // Hats
        this.registerItem({
            id: 'costume:hat_beret', type: 'costume', name: '贝雷帽',
            icon: 'costume_hat_beret', maxStack: 1,
            data: { costumeSlot: 'hat', costumePieceId: 'hat_beret' }
        });
        this.registerItem({
            id: 'costume:hat_bandana', type: 'costume', name: '头巾',
            icon: 'costume_hat_bandana', maxStack: 1,
            data: { costumeSlot: 'hat', costumePieceId: 'hat_bandana' }
        });
        // Clothes (including defaults)
        this.registerItem({
            id: 'costume:clothes_coat', type: 'costume', name: '风衣',
            icon: 'costume_clothes_coat', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_coat' }
        });
        this.registerItem({
            id: 'costume:clothes_hoodie', type: 'costume', name: '帽衫',
            icon: 'costume_clothes_hoodie', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_hoodie' }
        });
        this.registerItem({
            id: 'costume:clothes_vest', type: 'costume', name: '战术背心',
            icon: 'costume_clothes_vest', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_vest' }
        });
        // Glasses (including defaults)
        this.registerItem({
            id: 'costume:glasses_sun', type: 'costume', name: '墨镜',
            icon: 'costume_glasses_sun', maxStack: 1,
            data: { costumeSlot: 'glasses', costumePieceId: 'glasses_sun' }
        });
        this.registerItem({
            id: 'costume:glasses_round', type: 'costume', name: '圆眼镜',
            icon: 'costume_glasses_round', maxStack: 1,
            data: { costumeSlot: 'glasses', costumePieceId: 'glasses_round' }
        });
        this.registerItem({
            id: 'costume:glasses_goggles', type: 'costume', name: '护目镜',
            icon: 'costume_glasses_goggles', maxStack: 1,
            data: { costumeSlot: 'glasses', costumePieceId: 'glasses_goggles' }
        });
        // Beard
        this.registerItem({
            id: 'costume:beard_full', type: 'costume', name: '大胡子',
            icon: 'costume_beard_full', maxStack: 1,
            data: { costumeSlot: 'beard', costumePieceId: 'beard_full' }
        });
        // Santa Series
        this.registerItem({
            id: 'costume:hat_santa', type: 'costume', name: '圣诞帽',
            icon: 'costume_hat_santa', maxStack: 1,
            data: { costumeSlot: 'hat', costumePieceId: 'hat_santa' }
        });
        this.registerItem({
            id: 'costume:clothes_santa', type: 'costume', name: '圣诞服',
            icon: 'costume_clothes_santa', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_santa' }
        });
        this.registerItem({
            id: 'costume:beard_santa', type: 'costume', name: '圣诞白胡子',
            icon: 'costume_beard_santa', maxStack: 1,
            data: { costumeSlot: 'beard', costumePieceId: 'beard_santa' }
        });
        // Clown Series
        this.registerItem({
            id: 'costume:hat_clown', type: 'costume', name: '小丑帽',
            icon: 'costume_hat_clown', maxStack: 1,
            data: { costumeSlot: 'hat', costumePieceId: 'hat_clown' }
        });
        this.registerItem({
            id: 'costume:clothes_clown', type: 'costume', name: '小丑服',
            icon: 'costume_clothes_clown', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_clown' }
        });
        this.registerItem({
            id: 'costume:hair_clown', type: 'costume', name: '小丑假发',
            icon: 'costume_hair_clown', maxStack: 1,
            data: { costumeSlot: 'hairstyle', costumePieceId: 'hair_clown' }
        });
        // Cyberpunk Series
        this.registerItem({
            id: 'costume:hair_cyber', type: 'costume', name: '赛博莫霍克',
            icon: 'costume_hair_cyber', maxStack: 1,
            data: { costumeSlot: 'hairstyle', costumePieceId: 'hair_cyber' }
        });
        this.registerItem({
            id: 'costume:clothes_cyber', type: 'costume', name: '赛博夹克',
            icon: 'costume_clothes_cyber', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_cyber' }
        });
        this.registerItem({
            id: 'costume:glasses_cyber', type: 'costume', name: '全息护目镜',
            icon: 'costume_glasses_cyber', maxStack: 1,
            data: { costumeSlot: 'glasses', costumePieceId: 'glasses_cyber' }
        });
        // Knight Series
        this.registerItem({
            id: 'costume:hat_knight', type: 'costume', name: '骑士头盔',
            icon: 'costume_hat_knight', maxStack: 1,
            data: { costumeSlot: 'hat', costumePieceId: 'hat_knight' }
        });
        this.registerItem({
            id: 'costume:clothes_knight', type: 'costume', name: '骑士铠甲',
            icon: 'costume_clothes_knight', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_knight' }
        });
        // Ninja Series
        this.registerItem({
            id: 'costume:hat_ninja', type: 'costume', name: '忍者头巾',
            icon: 'costume_hat_ninja', maxStack: 1,
            data: { costumeSlot: 'hat', costumePieceId: 'hat_ninja' }
        });
        this.registerItem({
            id: 'costume:clothes_ninja', type: 'costume', name: '忍者装',
            icon: 'costume_clothes_ninja', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_ninja' }
        });
        // Pirate Series
        this.registerItem({
            id: 'costume:hat_pirate', type: 'costume', name: '海盗三角帽',
            icon: 'costume_hat_pirate', maxStack: 1,
            data: { costumeSlot: 'hat', costumePieceId: 'hat_pirate' }
        });
        this.registerItem({
            id: 'costume:clothes_pirate', type: 'costume', name: '海盗大衣',
            icon: 'costume_clothes_pirate', maxStack: 1,
            data: { costumeSlot: 'clothes', costumePieceId: 'clothes_pirate' }
        });
        this.registerItem({
            id: 'costume:glasses_eyepatch', type: 'costume', name: '眼罩',
            icon: 'costume_glasses_eyepatch', maxStack: 1,
            data: { costumeSlot: 'glasses', costumePieceId: 'glasses_eyepatch' }
        });

        // 3. Register Placeables from Assets.objects
        // Filter out implementation details like _flash, _frame, _panel
        const objectKeys = Object.keys(Assets.objects).filter(k => 
            !k.endsWith('_flash') && 
            !k.includes('_frame') && 
            !k.includes('_panel')
        );

        // Add special handling for doors which are composite in Assets but single type in Logic
        // We will manually register door_h and door_v using frame as icon
        if (!objectKeys.includes('door_h')) {
            this.registerItem({
                id: 'placeable:door_h',
                type: 'placeable',
                name: 'Horizontal Door',
                icon: 'door_h_frame', // Use frame as icon for now
                maxStack: 64,
                data: { 
                    breakableType: 'door_h',
                    footprint: { w: 32, h: 12 }, // Approx
                }
            });
        }
        
        if (!objectKeys.includes('door_v')) {
            this.registerItem({
                id: 'placeable:door_v',
                type: 'placeable',
                name: 'Vertical Door',
                icon: 'door_v_frame',
                maxStack: 64,
                data: { 
                    breakableType: 'door_v',
                    footprint: { w: 12, h: 32 },
                }
            });
        }

        // 3. Register Floor Tiles
        const floorTiles = [
            { id: 'floor:grass', name: 'Grass', icon: 'floor_grass', floorType: FLOOR_TYPES.GRASS },
            { id: 'floor:wood', name: 'Wood Floor', icon: 'floor_wood', floorType: FLOOR_TYPES.WOOD },
            { id: 'floor:concrete', name: 'Concrete', icon: 'floor_concrete', floorType: FLOOR_TYPES.CONCRETE },
            { id: 'floor:dirt', name: 'Dirt', icon: 'floor_dirt', floorType: FLOOR_TYPES.DIRT },
        ];
        for (const ft of floorTiles) {
            this.registerItem({
                id: ft.id,
                type: 'placeable',
                name: ft.name,
                icon: ft.icon,
                maxStack: 64,
                data: { isFloorTile: true, floorType: ft.floorType }
            });
        }

        // Auto-register others
        objectKeys.forEach(key => {
            // Skip if already registered (like doors if we did above, or excluded ones)
            if (this.items.has(`placeable:${key}`)) return;

            // Create a temporary instance to get hitbox/stats if possible?
            // For now, we rely on BreakableObject logic.
            // We use the key as breakableType.
            
            // Name formatting: box -> Box, explosive_barrel -> Explosive Barrel
            const name = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            this.registerItem({
                id: `placeable:${key}`,
                type: 'placeable',
                name: name,
                icon: key, // Key in Assets.objects
                maxStack: 64,
                data: { 
                    breakableType: key,
                    // We can refine footprint later by instantiating BreakableObject(0,0,key)
                }
            });
        });
    }

    registerItem(def) {
        this.items.set(def.id, def);
    }

    getItemDef(id) {
        return this.items.get(id);
    }

    isConsumableItem(itemId) {
        if (!itemId) return false;
        const def = this.getItemDef(itemId);
        return !!def && def.type === 'consumable';
    }

    _isWeaponSlot(slot) {
        if (!slot || !slot.itemId) return false;
        const def = this.getItemDef(slot.itemId);
        return !!def && def.type === 'weapon';
    }

    ensureWeaponInstanceForSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return null;
        const slot = this.slots[slotIndex];
        if (!this._isWeaponSlot(slot)) return null;

        if (slot.instanceData && slot.instanceData.weaponInstanceId && slot.instanceData.ammo) {
            return slot.instanceData;
        }

        const configId = weaponConfigIdFromItemId(slot.itemId) || this.getItemDef(slot.itemId)?.data?.weaponConfigId;
        if (!configId) return null;

        slot.instanceData = createWeaponInstanceData({ weaponConfigId: configId });
        return slot.instanceData;
    }

    updateWeaponInstanceState({ itemId, weaponInstanceId, ammo }) {
        if (!itemId || !weaponInstanceId || !ammo) return false;

        for (const slot of this.slots) {
            if (slot.itemId !== itemId || !slot.instanceData) continue;
            if (slot.instanceData.weaponInstanceId !== weaponInstanceId) continue;

            const cloned = cloneWeaponInstanceData(slot.instanceData) || {};
            cloned.ammo = {
                currentAmmo: Number.isFinite(ammo.currentAmmo) ? ammo.currentAmmo : 0,
                reserveAmmo: Number.isFinite(ammo.reserveAmmo) ? ammo.reserveAmmo : 0,
                maxAmmo: Number.isFinite(ammo.maxAmmo) ? ammo.maxAmmo : 0,
                maxReserve: Number.isFinite(ammo.maxReserve) ? ammo.maxReserve : 0
            };
            slot.instanceData = cloned;
            return true;
        }

        return false;
    }

    // --- Inventory Operations ---

    /**
     * Move or Swap item between two slots.
     * Handles merging if items are the same type.
     * @param {number} fromIndex 
     * @param {number} toIndex 
     * @returns {boolean} true if something changed
     */
    moveOrSwap(fromIndex, toIndex) {
        if (fromIndex === toIndex) return false;
        if (fromIndex < 0 || fromIndex >= this.slots.length) return false;
        if (toIndex < 0 || toIndex >= this.slots.length) return false;

        const slotFrom = this.slots[fromIndex];
        const slotTo = this.slots[toIndex];

        // 1. If source is empty, nothing to do
        if (!slotFrom.itemId) return false;

        // 2. If target is empty, move
        if (!slotTo.itemId) {
            slotTo.itemId = slotFrom.itemId;
            slotTo.count = slotFrom.count;
            slotTo.instanceData = slotFrom.instanceData;

            slotFrom.itemId = null;
            slotFrom.count = 0;
            slotFrom.instanceData = null;
            return true;
        }

        // 3. If same item type, try to merge
        if (slotFrom.itemId === slotTo.itemId) {
            const def = this.getItemDef(slotFrom.itemId);
            if (def.maxStack > 1 && slotTo.count < def.maxStack) {
                const space = def.maxStack - slotTo.count;
                const toMove = Math.min(space, slotFrom.count);
                
                slotTo.count += toMove;
                slotFrom.count -= toMove;
                
                if (slotFrom.count <= 0) {
                    slotFrom.itemId = null;
                    slotFrom.count = 0;
                    slotFrom.instanceData = null;
                }
                return true;
            }
        }

        // 4. Different items or full stack -> Swap
        const temp = { 
            itemId: slotFrom.itemId,
            count: slotFrom.count,
            instanceData: slotFrom.instanceData
        };

        slotFrom.itemId = slotTo.itemId;
        slotFrom.count = slotTo.count;
        slotFrom.instanceData = slotTo.instanceData;

        slotTo.itemId = temp.itemId;
        slotTo.count = temp.count;
        slotTo.instanceData = temp.instanceData;

        return true;
    }

    // Add item to inventory. Returns remaining count that couldn't be added.
    add(itemId, count, instanceData = null) {
        const def = this.getItemDef(itemId);
        if (!def) {
            console.error(`Item ${itemId} not found`);
            return count;
        }

        // Weapon items are non-stackable and always tracked by unique instance data.
        if (def.type === 'weapon' && def.maxStack === 1) {
            let remainingWeapon = count;
            while (remainingWeapon > 0) {
                const emptySlot = this.slots.find(slot => slot.itemId === null);
                if (!emptySlot) break;

                let dataToStore = null;
                if (remainingWeapon === count && instanceData) {
                    dataToStore = cloneWeaponInstanceData(instanceData);
                    if (!dataToStore.weaponInstanceId || !dataToStore.weaponConfigId || !dataToStore.ammo) {
                        dataToStore = null;
                    }
                }
                if (!dataToStore) {
                    const configId = weaponConfigIdFromItemId(itemId) || def.data?.weaponConfigId;
                    dataToStore = createWeaponInstanceData({ weaponConfigId: configId });
                }

                emptySlot.itemId = itemId;
                emptySlot.count = 1;
                emptySlot.instanceData = dataToStore;
                remainingWeapon--;
            }
            return remainingWeapon;
        }

        let remaining = count;

        // 1. Try to stack into existing slots
        if (def.maxStack > 1) {
            for (let i = 0; i < this.slots.length; i++) {
                const slot = this.slots[i];
                if (slot.itemId === itemId && slot.count < def.maxStack) {
                    const space = def.maxStack - slot.count;
                    const toAdd = Math.min(space, remaining);
                    slot.count += toAdd;
                    remaining -= toAdd;
                    if (remaining <= 0) return 0;
                }
            }
        }

        // 2. Add to empty slots
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot.itemId === null) {
                const toAdd = Math.min(def.maxStack, remaining);
                slot.itemId = itemId;
                slot.count = toAdd;
                slot.instanceData = instanceData ? cloneWeaponInstanceData(instanceData) : null;
                remaining -= toAdd;
                if (remaining <= 0) return 0;
            }
        }

        return remaining;
    }

    remove(slotIndex, count) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return 0;
        const slot = this.slots[slotIndex];
        if (!slot.itemId) return 0;

        const removed = Math.min(slot.count, count);
        slot.count -= removed;
        
        if (slot.count <= 0) {
            slot.itemId = null;
            slot.count = 0;
            slot.instanceData = null;
        }
        
        return removed;
    }

    /**
     * Remove item from slot and return it as data object for dropping
     * @param {number} slotIndex 
     * @param {number} count 
     * @returns {Object|null} { itemId, count, instanceData } or null
     */
    drop(slotIndex, count) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return null;
        const slot = this.slots[slotIndex];
        if (!slot.itemId) return null;

        const toDrop = Math.min(slot.count, count);
        const itemData = {
            itemId: slot.itemId,
            count: toDrop,
            instanceData: cloneWeaponInstanceData(slot.instanceData)
        };

        slot.count -= toDrop;
        if (slot.count <= 0) {
            slot.itemId = null;
            slot.count = 0;
            slot.instanceData = null;
        }

        return itemData;
    }

    // --- Hotbar Operations ---

    selectHotbarSlot(index) {
        if (index >= 0 && index < HOTBAR_SIZE) {
            this.selectedHotbarIndex = index;
            // Toggle logic: if already selected, maybe unselect? 
            // For now, simple selection.
            return true;
        }
        return false;
    }

    getSelectedSlotIndex() {
        return this.selectedHotbarIndex;
    }

    getSelectedSlot() {
        return this.slots[this.selectedHotbarIndex];
    }
    
    getSelectedItem() {
        const slot = this.getSelectedSlot();
        if (slot && slot.itemId) {
            return {
                ...slot,
                def: this.getItemDef(slot.itemId)
            };
        }
        return null;
    }
    
    // Helper to get all placeables (for Test autofill)
    getAllPlaceableIds() {
        const ids = [];
        for (const [id, def] of this.items) {
            if (def.type === 'placeable') {
                ids.push(id);
            }
        }
        return ids;
    }
}
