import { WEAPONS } from '../../assets/weapons/WeaponData.js';

let weaponInstanceCounter = 1;

function resolveWeaponConfigIdFromRawKey(rawKey) {
    if (!rawKey) return null;
    if (WEAPONS[rawKey]) return rawKey;

    const defaultKey = `default_${rawKey}`;
    if (WEAPONS[defaultKey]) return defaultKey;

    return null;
}

export function weaponConfigIdFromItemId(itemId) {
    if (!itemId || !itemId.startsWith('weapon:')) return null;
    const rawKey = itemId.slice('weapon:'.length);
    return resolveWeaponConfigIdFromRawKey(rawKey);
}

export function weaponItemIdFromConfigId(weaponConfigId) {
    if (!weaponConfigId) return null;
    const key = weaponConfigId.startsWith('default_')
        ? weaponConfigId.slice('default_'.length)
        : weaponConfigId;
    return `weapon:${key}`;
}

export function createWeaponAmmoState(weaponConfigId) {
    const weapon = WEAPONS[weaponConfigId];
    if (!weapon) return null;

    const maxAmmo = weapon.magazineSize || 0;
    const maxReserve = weapon.maxReserve || 0;
    return {
        currentAmmo: maxAmmo,
        reserveAmmo: maxReserve,
        maxAmmo,
        maxReserve
    };
}

function cloneAmmoState(ammo) {
    if (!ammo) return null;
    return {
        currentAmmo: Number.isFinite(ammo.currentAmmo) ? ammo.currentAmmo : 0,
        reserveAmmo: Number.isFinite(ammo.reserveAmmo) ? ammo.reserveAmmo : 0,
        maxAmmo: Number.isFinite(ammo.maxAmmo) ? ammo.maxAmmo : 0,
        maxReserve: Number.isFinite(ammo.maxReserve) ? ammo.maxReserve : 0
    };
}

export function cloneWeaponInstanceData(instanceData) {
    if (!instanceData) return null;
    return {
        ...instanceData,
        ammo: cloneAmmoState(instanceData.ammo)
    };
}

export function createWeaponInstanceData({ weaponConfigId, ammo = null } = {}) {
    if (!weaponConfigId || !WEAPONS[weaponConfigId]) {
        return null;
    }

    const ammoState = cloneAmmoState(ammo) || createWeaponAmmoState(weaponConfigId);
    return {
        weaponInstanceId: `weapon_inst_${Date.now()}_${weaponInstanceCounter++}`,
        weaponConfigId,
        ammo: ammoState
    };
}
