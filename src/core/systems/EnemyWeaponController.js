import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { createWeaponAmmoState, createWeaponInstanceData } from './WeaponInstanceUtils.js';

function cloneAmmoState(state) {
    if (!state) return null;
    return {
        currentAmmo: Number.isFinite(state.currentAmmo) ? state.currentAmmo : 0,
        reserveAmmo: Number.isFinite(state.reserveAmmo) ? state.reserveAmmo : 0,
        maxAmmo: Number.isFinite(state.maxAmmo) ? state.maxAmmo : 0,
        maxReserve: Number.isFinite(state.maxReserve) ? state.maxReserve : 0
    };
}

function normalizeAmmoState(state, fallback) {
    const next = cloneAmmoState(state) || cloneAmmoState(fallback);
    if (!next) return null;

    const maxAmmo = Number.isFinite(fallback?.maxAmmo) ? fallback.maxAmmo : Math.max(0, next.maxAmmo);
    const maxReserve = Number.isFinite(fallback?.maxReserve) ? fallback.maxReserve : Math.max(0, next.maxReserve);
    next.maxAmmo = maxAmmo;
    next.maxReserve = maxReserve;
    next.currentAmmo = Math.max(0, Math.min(next.currentAmmo, maxAmmo));
    next.reserveAmmo = Math.max(0, Math.min(next.reserveAmmo, maxReserve));

    return next;
}

function clamp01(v) {
    if (!Number.isFinite(v)) return 0;
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
}

export class EnemyWeaponController {
    constructor({ owner = null, handSystem = null, weaponConfigId = 'default_pistol', weaponInstanceData = null } = {}) {
        this.owner = owner;
        this.handSystem = handSystem;

        this.weaponConfigId = null;
        this.weapon = null;
        this.ammoState = null;

        this.isReloading = false;
        this.reloadStartAt = 0;
        this.reloadEndAt = 0;
        this.reloadDuration = 0;
        this.nextShotAt = 0;

        this.setWeapon(weaponConfigId, weaponInstanceData);
    }

    _commitInstanceData(seed = null) {
        if (!this.owner || !this.weaponConfigId || !this.ammoState) return;

        const existing = seed || this.owner.weaponInstanceData;
        let nextInstance = existing;

        if (!nextInstance || nextInstance.weaponConfigId !== this.weaponConfigId) {
            nextInstance = createWeaponInstanceData({
                weaponConfigId: this.weaponConfigId,
                ammo: this.ammoState
            });
        }

        if (!nextInstance) return;
        nextInstance.weaponConfigId = this.weaponConfigId;
        nextInstance.ammo = cloneAmmoState(this.ammoState);
        this.owner.weaponInstanceData = nextInstance;
    }

    setWeapon(weaponConfigId, weaponInstanceData = null) {
        if (!weaponConfigId || !WEAPONS[weaponConfigId]) return false;

        this.weaponConfigId = weaponConfigId;
        this.weapon = WEAPONS[weaponConfigId];

        const fallback = createWeaponAmmoState(weaponConfigId);
        const instance = weaponInstanceData || this.owner?.weaponInstanceData || null;
        this.ammoState = normalizeAmmoState(instance?.ammo, fallback) || fallback;

        this.isReloading = false;
        this.reloadStartAt = 0;
        this.reloadEndAt = 0;
        this.reloadDuration = 0;
        this.nextShotAt = 0;

        this._commitInstanceData(instance);
        return true;
    }

    update(now = Date.now()) {
        // 首发延迟递减（R4 平衡：地牢锁门后给玩家反应窗口，DungeonManager 出怪时赋值）
        if (this.owner && this.owner.holdFireTimer > 0) {
            this.owner.holdFireTimer--;
        }
        if (!this.isReloading) return false;
        if (now < this.reloadEndAt) return false;
        this.completeReload(now);
        return true;
    }

    getReloadProgress(now = Date.now()) {
        if (!this.isReloading) return 0;
        if (this.reloadDuration <= 0) return 1;
        return clamp01((now - this.reloadStartAt) / this.reloadDuration);
    }

    startReload(now = Date.now()) {
        if (!this.weapon || !this.ammoState) return false;
        if (this.isReloading) return false;

        if (this.ammoState.currentAmmo >= this.ammoState.maxAmmo) return false;
        if (this.ammoState.reserveAmmo <= 0) return false;

        this.isReloading = true;
        this.reloadStartAt = now;
        this.reloadDuration = Math.max(0, this.weapon.reloadTime || 0);
        this.reloadEndAt = now + this.reloadDuration;

        if (this.reloadDuration === 0) {
            this.completeReload(now);
        }

        return true;
    }

    completeReload(now = Date.now()) {
        if (!this.weapon || !this.ammoState) return false;

        const needed = Math.max(0, this.ammoState.maxAmmo - this.ammoState.currentAmmo);
        const loaded = Math.min(needed, this.ammoState.reserveAmmo);
        this.ammoState.currentAmmo += loaded;
        this.ammoState.reserveAmmo -= loaded;

        this.isReloading = false;
        this.reloadStartAt = now;
        this.reloadEndAt = now;
        this.reloadDuration = 0;

        this._commitInstanceData();
        return loaded > 0;
    }

    tryFire({ combatSystem, shooter, target = null, aimAngleOverride = null, fireIntervalMultiplier = 1 } = {}) {
        if (!combatSystem || !shooter || !this.weapon || !this.handSystem) {
            return { fired: false, reason: 'invalid' };
        }
        if (this.owner && this.owner.holdFireTimer > 0) {
            return { fired: false, reason: 'holdfire' };
        }

        const now = Date.now();
        this.update(now);

        const preMuzzle = this.handSystem.getMuzzleWorldPosition();
        if (combatSystem.canShootFrom && !combatSystem.canShootFrom(shooter, preMuzzle, target)) {
            return { fired: false, reason: 'blocked' };
        }

        if (this.isReloading) {
            return { fired: false, reason: 'reloading' };
        }

        if (!this.ammoState || this.ammoState.currentAmmo <= 0) {
            this.startReload(now);
            return { fired: false, reason: 'no_ammo' };
        }

        if (now < this.nextShotAt) {
            return { fired: false, reason: 'cooldown', waitMs: this.nextShotAt - now };
        }

        this.handSystem.triggerShoot();
        const muzzle = this.handSystem.getMuzzleWorldPosition();
        const fired = combatSystem.spawnEnemyWeaponShot({
            shooter,
            weapon: this.weapon,
            muzzle,
            aimAngleOverride
        });

        if (!fired) {
            return { fired: false, reason: 'spawn_failed' };
        }

        this.ammoState.currentAmmo = Math.max(0, this.ammoState.currentAmmo - 1);
        const safeMultiplier = Number.isFinite(fireIntervalMultiplier) && fireIntervalMultiplier > 0
            ? fireIntervalMultiplier
            : 1;
        this.nextShotAt = now + Math.max(0, (this.weapon.fireRate || 0) * safeMultiplier);
        this._commitInstanceData();

        if (this.ammoState.currentAmmo <= 0) {
            this.startReload(now);
        }

        return { fired: true, reason: 'ok' };
    }
}
