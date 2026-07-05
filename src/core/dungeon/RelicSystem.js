// RelicSystem.js
// 遗物运行时：以 DungeonRunState.relicIds 为唯一事实源，提供三类挂载点——
// ① 属性乘区查询（移速/开火间隔/伤害/磁吸/暴击/金币价值；含金币伤害/战意/收藏暴击/翻滚移速/波次开火动态项）
// ② 玩家子弹改造（modifyPlayerBullet：燃烧/冰冻/穿透/弹射/体积/暴击/伤害补偿/击退/弹速/满血首击）
// ③ 事件触发（onKill/onCritHit/onWaveSpawned/onPlayerHit/onPitKill/mitigateDamage/清房金币/开箱双倍）
// P8 起 tick() 内维护若干短时增益计时器（翻滚移速/波次开火/战意/护罩充能），并读取 player.state 检测翻滚结束下降沿。
// 纯逻辑模块，不依赖 Canvas；外部副作用（冲击波/爆炸/toast/荆棘反射/护罩闪光）通过 handler 回调注入。

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
        this._thornBurstHandler = null;  // (conf) => void 受击荆棘反射（荆棘胸甲）
        this._barrierBlockHandler = null; // () => void 护罩抵挡瞬间的闪光（能量护罩）

        // 冷却与记账
        this._shockwaveCd = 0;
        this._maxHpGranted = 0; // vital_heart 类 maxHp 增量记账（clear 时回退）

        // P8 短时增益计时器（帧，tick 递减；clear 归零）
        this._rollSpeedTimer = 0;   // 疾风斗篷：翻滚后移速 buff 剩余帧
        this._prevPlayerState = null; // 上一帧 player.state（用于检测翻滚结束下降沿）
        this._waveHasteTimer = 0;   // 战鼓号角：波次刷新后开火加速剩余帧
        this._momentumStacks = 0;   // 战意图腾：当前战意层数
        this._momentumTimer = 0;    // 战意图腾：距清空剩余帧
        this._barrierReady = false; // 能量护罩：护罩是否已充能可用
        this._barrierTimer = 0;     // 能量护罩：距下次充能剩余帧
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

        // 能量护罩：拾取即充满第一层护罩（后续由 tick 周期充能）
        if (id === 'energy_barrier') this._barrierReady = true;

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
        this._rollSpeedTimer = 0;
        this._prevPlayerState = null;
        this._waveHasteTimer = 0;
        this._momentumStacks = 0;
        this._momentumTimer = 0;
        this._barrierReady = false;
        this._barrierTimer = 0;
    }

    /** 每帧递减内部冷却与短时增益计时器，并驱动翻滚检测 / 护罩充能。 */
    tick() {
        if (this._shockwaveCd > 0) this._shockwaveCd--;

        // 疾风斗篷：检测 player.state 由 'roll' 变为非 'roll' 的下降沿（翻滚结束）
        const state = this.player ? this.player.state : null;
        if (this._prevPlayerState === 'roll' && state !== 'roll' && this.has('windrunner_cloak')) {
            this._rollSpeedTimer = RELICS.windrunner_cloak.effect.rollSpeedBuff.duration;
        }
        this._prevPlayerState = state;
        if (this._rollSpeedTimer > 0) this._rollSpeedTimer--;

        // 战鼓号角：波次开火加速倒计时
        if (this._waveHasteTimer > 0) this._waveHasteTimer--;

        // 战意图腾：无击杀则计时清空层数
        if (this._momentumStacks > 0) {
            if (this._momentumTimer > 0) this._momentumTimer--;
            if (this._momentumTimer <= 0) this._momentumStacks = 0;
        }

        // 能量护罩：未充能时倒计时充能
        if (this.has('energy_barrier') && !this._barrierReady) {
            if (this._barrierTimer > 0) this._barrierTimer--;
            if (this._barrierTimer <= 0) this._barrierReady = true;
        }
    }

    // ── ① 属性乘区 ──

    moveSpeedMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.moveSpeedMult) m *= e.moveSpeedMult;
        }
        // 疾风斗篷：翻滚结束后短时移速爆发
        if (this._rollSpeedTimer > 0) {
            m *= RELICS.windrunner_cloak.effect.rollSpeedBuff.moveSpeedMult;
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
        // 战鼓号角：波次刷新后短时开火加速
        if (this._waveHasteTimer > 0) {
            m *= RELICS.war_horn.effect.waveHaste.fireIntervalMult;
        }
        return m;
    }

    damageMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.damageMult) m *= e.damageMult;
        }
        // 贪狼之戒：按当前持有金币阶梯加伤（花钱会削弱，鼓励囤积）
        if (this.has('tycoon_ring')) {
            const c = RELICS.tycoon_ring.effect.coinDamage;
            const coins = this.runState ? (this.runState.coins || 0) : 0;
            const bonus = Math.min(c.maxBonus, Math.floor(coins / c.per) * c.mult);
            m *= 1 + bonus;
        }
        // 战意图腾：连续击杀战意层数加伤
        if (this._momentumStacks > 0) {
            const c = RELICS.momentum_totem.effect.killMomentum;
            m *= 1 + Math.min(c.maxStacks, this._momentumStacks) * c.perStack;
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
        // 收藏家之瞳：暴击率随持有遗物数量增长（含自身，封顶）
        if (this.has('collector_eye')) {
            const cc = RELICS.collector_eye.effect.collectionCrit;
            const owned = this.runState ? this.runState.relicIds.length : 0;
            c += Math.min(cc.maxBonus, owned * cc.perRelic);
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

    /** 金币拾取价值乘区（金羊羔毛）。 */
    coinValueMult() {
        let m = 1;
        for (const e of this._ownedEffects()) {
            if (e.coinValueMult) m *= e.coinValueMult;
        }
        return m;
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

        // 弹射（沿用 ricochet 的 bounceCount/maxBounces 通用字段；
        // relicBounce 标记让 BulletSystem 对非 ricochet 类型也走墙反弹分支）
        const bounce = this.bounceBonus();
        if (bounce > 0) {
            bullet.bounceCount = (bullet.bounceCount || 0) + bounce;
            bullet.maxBounces = (bullet.maxBounces || 0) + bounce;
            bullet.relicBounce = true;
        }

        // 巨人腰带 / 迅捷箭袋 / 深渊之眼：弹道字段注入
        for (const e of this._ownedEffects()) {
            // 巨人腰带：专用击退字段（不复用 bullet.knockback，避免改变武器自带击退的直击手感）
            if (e.knockbackBonus) bullet.relicKnockback = (bullet.relicKnockback || 0) + e.knockbackBonus;
            // 迅捷箭袋：提升飞行速度
            if (e.bulletSpeedMult) {
                bullet.vx *= e.bulletSpeedMult;
                bullet.vy *= e.bulletSpeedMult;
            }
            // 深渊之眼：标记满血敌人首击伤害倍率（BulletSystem 命中处消费）
            if (e.firstStrikeMult) bullet.firstStrikeMult = e.firstStrikeMult;
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
    setThornBurstHandler(fn) { this._thornBurstHandler = fn; }
    setBarrierBlockHandler(fn) { this._barrierBlockHandler = fn; }

    /**
     * 敌人被击杀（地牢内由 WorldSystem 死亡清扫调用）。
     * @returns {{bonusCoin:number}} 额外掉落信息（白骨护符），无触发时 bonusCoin 为 0
     */
    onKill(x, y, rng = Math.random) {
        const result = { bonusCoin: 0 };
        if (this.runState.relicIds.length === 0) return result;

        // 战意图腾：每次击杀叠加一层战意并刷新计时
        if (this.has('momentum_totem')) {
            const c = RELICS.momentum_totem.effect.killMomentum;
            this._momentumStacks = Math.min(c.maxStacks, this._momentumStacks + 1);
            this._momentumTimer = c.duration;
        }

        const blast = RELICS.blast_powder.effect.killExplosion;
        if (this.has('blast_powder') && this._killExplosionHandler) {
            this._killExplosionHandler(x, y, blast);
        }

        const heal = RELICS.leech_fang.effect.killHeal;
        if (this.has('leech_fang') && rng() < heal.chance) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal.amount);
        }

        // 白骨护符：概率额外掉落金币（由 WorldSystem 依返回值生成拾取物）
        const bonus = RELICS.bone_charm.effect.bonusCoin;
        if (this.has('bone_charm') && rng() < bonus.chance) {
            result.bonusCoin = bonus.amount;
        }
        return result;
    }

    /**
     * 子弹暴击命中敌人（BulletSystem 玩家子弹命中处调用）。
     * @returns {number} 本次回血量（血牙冠冕），无触发时为 0
     */
    onCritHit() {
        if (!this.has('vampiric_crown')) return 0;
        const amount = RELICS.vampiric_crown.effect.critHeal;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
        return amount;
    }

    /**
     * 房间出怪波刷新（DungeonManager._spawnEncounterWave 调用）。
     * 冷血怀表：对新生成敌人施加短暂减速（消费 Enemy.getEffectiveSpeed 的 slowTimer/slowAmount）。
     * @param {Array<{slowTimer:number, slowAmount:number}>} enemies 本波生成的敌人
     */
    onWaveSpawned(enemies) {
        // 冷血怀表：对新生成敌人施加减速
        if (this.has('chrono_watch') && Array.isArray(enemies)) {
            const conf = RELICS.chrono_watch.effect.waveSlow;
            for (const e of enemies) {
                if (!e) continue;
                e.slowTimer = Math.max(e.slowTimer || 0, conf.duration);
                e.slowAmount = Math.max(e.slowAmount || 0, conf.slowAmount);
            }
        }
        // 战鼓号角：波次刷新后启动玩家开火加速窗口
        if (this.has('war_horn')) {
            this._waveHasteTimer = RELICS.war_horn.effect.waveHaste.duration;
        }
    }

    /**
     * 敌人坠坑坠杀（WorldSystem 坠坑判定处调用）。
     * 深渊回响：回复生命。与常规 onKill 独立（坠杀同样会走 onKill 的战意/掉落逻辑）。
     * @returns {number} 本次回血量，无触发时为 0
     */
    onPitKill() {
        if (!this.has('abyss_echo')) return 0;
        const heal = RELICS.abyss_echo.effect.pitKillHeal;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        return heal;
    }

    /**
     * 玩家受到伤害前的减免/抵挡（Game.player.takeDamage 调用，返回实际扣血量）。
     * 能量护罩优先完全抵挡并消耗充能；否则石肤护符按比例减伤（至少保留 1 点）。
     * @param {number} amount 原始伤害
     * @returns {number} 减免后的实际伤害
     */
    mitigateDamage(amount) {
        if (this.runState.relicIds.length === 0) return amount;
        // 能量护罩：满层护罩完全抵挡本次伤害并进入充能冷却
        if (this.has('energy_barrier') && this._barrierReady) {
            this._barrierReady = false;
            this._barrierTimer = RELICS.energy_barrier.effect.barrier.cooldown;
            if (this._barrierBlockHandler) this._barrierBlockHandler();
            return 0;
        }
        // 石肤护符：百分比减伤（原伤害 >1 时保底 1 点，避免完全免疫）
        if (this.has('stoneskin_charm')) {
            const reduced = amount * (1 - RELICS.stoneskin_charm.effect.damageReduction);
            return amount > 1 ? Math.max(1, reduced) : amount;
        }
        return amount;
    }

    /** 玩家受击（Game.damagePlayer 调用）。 */
    onPlayerHit() {
        // 反应装甲：击退冲击波（带冷却）
        if (this.has('reactive_plate') && this._shockwaveCd <= 0) {
            const conf = RELICS.reactive_plate.effect.hitShockwave;
            this._shockwaveCd = conf.cooldown;
            if (this._shockwaveHandler) this._shockwaveHandler(conf);
        }

        // 荆棘胸甲：向 8 方向反射荆棘小刺弹（无冷却，每次受击触发）
        if (this.has('thorn_mail') && this._thornBurstHandler) {
            this._thornBurstHandler(RELICS.thorn_mail.effect.thornBurst);
        }
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
