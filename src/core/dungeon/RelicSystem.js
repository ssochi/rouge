// RelicSystem.js
// 遗物运行时：以 DungeonRunState.relicIds 为唯一事实源，提供三类挂载点——
// ① 属性乘区查询（移速/开火间隔/伤害/磁吸/暴击）
// ② 玩家子弹改造（modifyPlayerBullet：燃烧/冰冻/穿透/弹射/体积/暴击/伤害补偿）
// ③ 事件触发（onKill/onPlayerHit/清房金币/开箱双倍）
// 纯逻辑模块，不依赖 Canvas；外部副作用（冲击波/爆炸/toast）通过 handler 回调注入。

import { RELICS } from '../../assets/relics/RelicData.js';

export class RelicSystem {
    /**
     * @param {{runState: import('./DungeonRunState.js').DungeonRunState, player: {hp:number, maxHp:number}}} refs
     */
    constructor({ runState, player }) {
        this.runState = runState;
        this.player = player;

        // 触发效果的外部副作用回调（由 Game 接线时注入）
        this._shockwaveHandler = null;   // () => void 受击冲击波
        this._killExplosionHandler = null; // (x, y, conf) => void 击杀爆炸
        this._pickupHandler = null;      // (relic) => void 拾取 toast/UI

        // 冷却与记账
        this._shockwaveCd = 0;
        this._maxHpGranted = 0; // vital_heart 类 maxHp 增量记账（clear 时回退）
    }

    // ── 基础 ──

    has(id) {
        return this.runState.hasRelic(id);
    }

    _ownedEffects() {
        const effects = [];
        for (const id of this.runState.relicIds) {
            const relic = RELICS[id];
            if (relic) effects.push(relic.effect);
        }
        return effects;
    }

    _isRaging() {
        const rage = RELICS.berserker_totem.effect.lowHpRage;
        return this.has('berserker_totem') &&
            this.player.hp < this.player.maxHp * rage.threshold;
    }

    /**
     * 拾取遗物：写入 runState、应用即时效果、通知 UI。
     * @returns {boolean} 是否为新获得（重复拾取返回 false）
     */
    addRelic(id) {
        const relic = RELICS[id];
        if (!relic || this.has(id)) return false;
        this.runState.addRelic(id);

        // 即时效果：maxHp 加成（记账以便退局回退）
        if (relic.effect.maxHpBonus) {
            this.player.maxHp += relic.effect.maxHpBonus;
            this.player.hp += relic.effect.maxHpBonus;
            this._maxHpGranted += relic.effect.maxHpBonus;
        }

        if (this._pickupHandler) this._pickupHandler(relic);
        return true;
    }

    /**
     * 单局清算：回退 maxHp 等持久性即时效果。
     * 在 runState.end() 前调用（顺序无关，但需在整页存续期间成对出现）。
     */
    clear() {
        if (this._maxHpGranted > 0) {
            this.player.maxHp -= this._maxHpGranted;
            this.player.hp = Math.min(this.player.hp, this.player.maxHp);
            this._maxHpGranted = 0;
        }
        this._shockwaveCd = 0;
    }

    /** 每帧递减内部冷却。 */
    tick() {
        if (this._shockwaveCd > 0) this._shockwaveCd--;
    }

    // ── ① 属性乘区 ──

    moveSpeedMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.moveSpeedMult) m *= e.moveSpeedMult;
        }
        return m;
    }

    fireIntervalMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.fireIntervalMult) m *= e.fireIntervalMult;
        }
        if (this._isRaging()) {
            m *= RELICS.berserker_totem.effect.lowHpRage.fireIntervalMult;
        }
        return m;
    }

    damageMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.damageMult) m *= e.damageMult;
        }
        if (this._isRaging()) {
            m *= RELICS.berserker_totem.effect.lowHpRage.damageMult;
        }
        return m;
    }

    magnetMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.magnetMult) m *= e.magnetMult;
        }
        return m;
    }

    critChance() {
        let c = 0;
        for (const e of this._ownedEffects()) {
            if (e.critChance) c += e.critChance;
        }
        return c;
    }

    extraPellets() {
        let n = 0;
        for (const e of this._ownedEffects()) {
            if (e.extraPellets) n += e.extraPellets;
        }
        return n;
    }

    bulletSizeMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.bulletSizeMult) m *= e.bulletSizeMult;
        }
        return m;
    }

    piercingBonus() {
        let n = 0;
        for (const e of this._ownedEffects()) {
            if (e.piercingBonus) n += e.piercingBonus;
        }
        return n;
    }

    bounceBonus() {
        let n = 0;
        for (const e of this._ownedEffects()) {
            if (e.bounceBonus) n += e.bounceBonus;
        }
        return n;
    }

    // ── ② 玩家子弹改造 ──

    /**
     * 对刚创建的玩家子弹注入遗物弹道效果。
     * @param {Object} bullet CombatSystem._pushWeaponProjectiles 创建的子弹对象
     * @param {() => number} rng 随机源（测试注入）
     */
    modifyPlayerBullet(bullet, rng = Math.random) {
        if (this.runState.relicIds.length === 0) return;

        // 伤害乘区（含 split_chamber 全弹丸补偿、狂暴）
        let dmgMult = this.damageMult();
        for (const e of this._ownedEffects()) {
            if (e.pelletDamageMult) dmgMult *= e.pelletDamageMult;
        }

        // 暴击 roll
        const crit = this.critChance();
        if (crit > 0 && rng() < crit) {
            dmgMult *= 2;
            bullet.isCrit = true;
        }
        bullet.damage = Math.max(1, Math.round(bullet.damage * dmgMult));

        // 体积
        const sizeMult = this.bulletSizeMult();
        if (sizeMult !== 1) {
            bullet.size = Math.max(1, Math.round(bullet.size * sizeMult));
        }

        // 穿透
        const pierce = this.piercingBonus();
        if (pierce > 0) {
            bullet.piercing = (bullet.piercing || 0) + pierce;
        }

        // 弹射（沿用 ricochet 的 bounceCount/maxBounces 通用字段）
        const bounce = this.bounceBonus();
        if (bounce > 0) {
            bullet.bounceCount = (bullet.bounceCount || 0) + bounce;
            bullet.maxBounces = (bullet.maxBounces || 0) + bounce;
        }

        // 燃烧（泛化 flame 的 burnDamage 字段，不覆盖武器自带更强的燃烧）
        for (const e of this._ownedEffects()) {
            if (e.burn && !bullet.burnDamage) {
                bullet.burnDamage = e.burn.damage;
                bullet.burnDuration = e.burn.duration;
                bullet.burnTickInterval = e.burn.tickInterval;
            }
            if (e.freezeStack && bullet.type !== 'ice_shard') {
                bullet.applyFreezeStack = true;
                bullet.slowAmount = bullet.slowAmount || e.freezeStack.slowAmount;
                bullet.slowDuration = bullet.slowDuration || e.freezeStack.slowDuration;
                bullet.freezeThreshold = bullet.freezeThreshold || e.freezeStack.freezeThreshold;
                bullet.freezeDuration = bullet.freezeDuration || e.freezeStack.freezeDuration;
            }
        }
    }

    // ── ③ 事件触发 ──

    setShockwaveHandler(fn) { this._shockwaveHandler = fn; }
    setKillExplosionHandler(fn) { this._killExplosionHandler = fn; }
    setPickupHandler(fn) { this._pickupHandler = fn; }

    /** 敌人被击杀（地牢内由 WorldSystem 死亡清扫调用）。 */
    onKill(x, y, rng = Math.random) {
        if (this.runState.relicIds.length === 0) return;

        const blast = RELICS.blast_powder.effect.killExplosion;
        if (this.has('blast_powder') && this._killExplosionHandler) {
            this._killExplosionHandler(x, y, blast);
        }

        const heal = RELICS.leech_fang.effect.killHeal;
        if (this.has('leech_fang') && rng() < heal.chance) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal.amount);
        }
    }

    /** 玩家受击（Game.damagePlayer 调用）。 */
    onPlayerHit() {
        if (!this.has('reactive_plate')) return;
        if (this._shockwaveCd > 0) return;
        const conf = RELICS.reactive_plate.effect.hitShockwave;
        this._shockwaveCd = conf.cooldown;
        if (this._shockwaveHandler) this._shockwaveHandler(conf);
    }

    /** 清房金币乘数。 */
    roomClearCoinMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.roomClearCoinMult) m *= e.roomClearCoinMult;
        }
        return m;
    }

    /** 开箱是否触发双倍产出。 */
    chestDoubleRoll(rng = Math.random) {
        let chance = 0;
        for (const e of this._ownedEffects()) {
            if (e.chestDoubleChance) chance += e.chestDoubleChance;
        }
        return chance > 0 && rng() < chance;
    }
}
