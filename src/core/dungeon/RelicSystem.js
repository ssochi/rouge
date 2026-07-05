// RelicSystem.js
// 遗物运行时：以 DungeonRunState.relicIds 为唯一事实源，提供三类挂载点——
// ① 属性乘区查询（移速/开火间隔/伤害/磁吸/暴击/金币价值；含金币伤害/战意/收藏暴击/翻滚移速/波次开火动态项）
// ② 玩家子弹改造（modifyPlayerBullet：燃烧/冰冻/穿透/弹射/体积/暴击/伤害补偿/击退/弹速/满血首击）
// ③ 事件触发（onKill/onCritHit/onWaveSpawned/onPlayerHit/onPitKill/mitigateDamage/清房金币/开箱双倍）
// P8 起 tick() 内维护若干短时增益计时器（翻滚移速/波次开火/战意/护罩充能），并读取 player.state 检测翻滚结束下降沿。
// P9 追加 12 个机制型遗物：新挂载点 onRoomEnter（命运骰子）、tryRevive（保险柜）、tryBloodPactPurchase（血肉契约）、
//   orbitBladeCanHit（环绕护刃）；tick() 内驱动磁暴线圈蓄能放电、环绕护刃旋转与命中冷却、末日怀表定时暴击；
//   modifyPlayerBullet 追加幽灵弹头（复用 phaseThrough）与末日怀表保证暴击；mitigateDamage 追加金币护盾与命运骰子护盾。
// 纯逻辑模块，不依赖 Canvas；外部副作用（冲击波/爆炸/toast/荆棘反射/护罩闪光/放电/亡魂弹/散币/复活/掷骰）通过 handler 回调注入。

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
        // P9 新增副作用回调
        this._coinDropHandler = null;    // (amount) => void 金币护盾：脚下散落金币
        this._teslaHandler = null;       // (conf) => void 磁暴线圈：对最近敌人放电 + 视觉
        this._soulBurstHandler = null;   // (x, y, conf) => void 收割回响：尸体迸发亡魂弹
        this._ammoRefundHandler = null;  // () => void 弹壳回收：返还当前弹匣 1 发
        this._reviveHandler = null;      // () => void 保险柜：复活瞬间视觉
        this._bloodPactHandler = null;   // (hpCost) => void 血肉契约：以血支付提示
        this._fateHandler = null;        // (label) => void 命运骰子：掷骰结果 toast
        this._sacrificeHandler = null;   // (relic) => void 深渊之契：献祭遗物提示

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

        // P9 机制型遗物内部状态（clear 归零）
        this._ghostShotCount = 0;   // 幽灵弹头：累计发弹数（每第 7 发触发）
        this._coinWardCd = 0;       // 金币护盾：受击冷却剩余帧
        this._fateBuff = null;      // 命运骰子：本房增益类型 'damage'|'speed'|'crit'|'shield'|null
        this._fateShieldReady = false; // 命运骰子：护盾层是否可用（本房掷出护盾时）
        this._teslaStillFrames = 0; // 磁暴线圈：连续静止帧数
        this._teslaChargeTimer = 0; // 磁暴线圈：距下次放电剩余帧
        this._prevTeslaX = null;    // 磁暴线圈：上一帧玩家 X（判定静止）
        this._prevTeslaY = null;    // 磁暴线圈：上一帧玩家 Y
        this._bladeAngle = 0;       // 环绕护刃：当前旋转角
        this._bladeHitCd = new Map(); // 环绕护刃：每敌命中冷却（key=敌人引用/测试用 id）
        this._watchTimer = 0;       // 末日怀表：距下次保证暴击充能剩余帧
        this._watchCritReady = false; // 末日怀表：下一发是否已备暴击
        this._safeVaultUsed = false; // 保险柜：本局是否已复活
        this._depletedVersion = 0;  // 遗物耗尽版本号（供 UI 灰化重绘）
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
    addRelic(id, rng = Math.random) {
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

        // 深渊之契：拾取时随机献祭一件“其他”遗物（无其他遗物则无副作用）
        if (id === 'abyss_pact') this._abyssPactSacrifice(rng);

        if (this._pickupHandler) this._pickupHandler(relic);
        return true;
    }

    /**
     * 深渊之契：从当前持有的其他遗物中随机销毁一件，并回退其持久性即时效果（maxHp）。
     * @param {() => number} rng 随机源（测试注入）
     * @returns {string|null} 被销毁的遗物 id，无可销毁时 null
     */
    _abyssPactSacrifice(rng = Math.random) {
        const victims = this.runState.relicIds.filter(rid => rid !== 'abyss_pact');
        if (victims.length === 0) return null;
        const idx = Math.min(victims.length - 1, Math.floor(rng() * victims.length));
        const victimId = victims[idx];
        const victim = RELICS[victimId];

        // 回退被销毁遗物的持久性即时效果（vital_heart 类 maxHp）
        if (victim && victim.effect.maxHpBonus) {
            const bonus = victim.effect.maxHpBonus;
            this.player.maxHp -= bonus;
            this.player.hp = Math.min(this.player.hp, this.player.maxHp);
            this._maxHpGranted = Math.max(0, this._maxHpGranted - bonus);
        }
        // 若销毁能量护罩，撤销已充能的护罩状态
        if (victimId === 'energy_barrier') this._barrierReady = false;

        const arr = this.runState.relicIds;
        const pos = arr.indexOf(victimId);
        if (pos >= 0) arr.splice(pos, 1);

        if (this._sacrificeHandler) this._sacrificeHandler(victim || { id: victimId, name: victimId });
        return victimId;
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
        // P9
        this._ghostShotCount = 0;
        this._coinWardCd = 0;
        this._fateBuff = null;
        this._fateShieldReady = false;
        this._teslaStillFrames = 0;
        this._teslaChargeTimer = 0;
        this._prevTeslaX = null;
        this._prevTeslaY = null;
        this._bladeAngle = 0;
        this._bladeHitCd.clear();
        this._watchTimer = 0;
        this._watchCritReady = false;
        this._safeVaultUsed = false;
        this._depletedVersion = 0;
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

        // 金币护盾：受击冷却倒计时
        if (this._coinWardCd > 0) this._coinWardCd--;

        // 磁暴线圈：静止蓄能，达阈值后周期性放电（视觉与实际伤害走 handler）
        if (this.has('tesla_coil') && this.player && Number.isFinite(this.player.x)) {
            const conf = RELICS.tesla_coil.effect.tesla;
            const px = this.player.x, py = this.player.y;
            const moved = this._prevTeslaX != null &&
                (Math.abs(px - this._prevTeslaX) > 0.5 || Math.abs(py - this._prevTeslaY) > 0.5);
            this._prevTeslaX = px;
            this._prevTeslaY = py;
            if (moved) {
                this._teslaStillFrames = 0;
                this._teslaChargeTimer = 0;
            } else {
                this._teslaStillFrames++;
                if (this._teslaStillFrames >= conf.chargeFrames) {
                    if (this._teslaChargeTimer > 0) this._teslaChargeTimer--;
                    if (this._teslaChargeTimer <= 0) {
                        this._teslaChargeTimer = conf.zapInterval;
                        if (this._teslaHandler) this._teslaHandler(conf);
                    }
                }
            }
        }

        // 环绕护刃：推进旋转角，衰减每敌命中冷却
        if (this.has('orbit_blade')) {
            this._bladeAngle = (this._bladeAngle + RELICS.orbit_blade.effect.orbitBlade.spinSpeed) % (Math.PI * 2);
        }
        if (this._bladeHitCd.size > 0) {
            for (const [k, v] of this._bladeHitCd) {
                if (v <= 1) this._bladeHitCd.delete(k);
                else this._bladeHitCd.set(k, v - 1);
            }
        }

        // 末日怀表：定时为下一发子弹备好保证暴击
        if (this.has('doomsday_watch') && !this._watchCritReady) {
            const interval = RELICS.doomsday_watch.effect.doomsdayWatch.interval;
            this._watchTimer++;
            if (this._watchTimer >= interval) {
                this._watchTimer = 0;
                this._watchCritReady = true;
            }
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
        // 命运骰子：本房掷出「移速」增益
        if (this._fateBuff === 'speed') {
            m *= RELICS.fate_dice.effect.fateDice.moveSpeedMult;
        }
        // 深渊之契：全能强化（移速）
        if (this.has('abyss_pact')) {
            m *= RELICS.abyss_pact.effect.abyssPact.moveSpeedMult;
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
        // 深渊之契：全能强化（开火间隔）
        if (this.has('abyss_pact')) {
            m *= RELICS.abyss_pact.effect.abyssPact.fireIntervalMult;
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
        // 命运骰子：本房掷出「伤害」增益
        if (this._fateBuff === 'damage') {
            m *= RELICS.fate_dice.effect.fateDice.damageMult;
        }
        // 深渊之契：全能强化（伤害）
        if (this.has('abyss_pact')) {
            m *= RELICS.abyss_pact.effect.abyssPact.damageMult;
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
        // 命运骰子：本房掷出「暴击」增益
        if (this._fateBuff === 'crit') {
            c += RELICS.fate_dice.effect.fateDice.critChance;
        }
        // 深渊之契：全能强化（暴击）
        if (this.has('abyss_pact')) {
            c += RELICS.abyss_pact.effect.abyssPact.critChance;
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

        // 幽灵弹头：每第 7 发化为幽灵弹（穿墙穿敌、伤害 ×2、蓝光）
        if (this.has('ghost_rounds')) {
            this._ghostShotCount++;
            const g = RELICS.ghost_rounds.effect.ghost;
            if (this._ghostShotCount % g.everyNth === 0) {
                bullet.phaseThrough = true;   // 复用 BulletSystem M6：跳过墙体碰撞 + 穿透所有敌人
                bullet.ghostRelic = true;     // Renderer 幽灵蓝光标记
                bullet.color = g.color;
                dmgMult *= g.damageMult;
                if (!Array.isArray(bullet.hitList)) bullet.hitList = [];
            }
        }

        // 暴击 roll（随机暴击 或 末日怀表定时保证暴击，二者取或，仅结算一次 ×2）
        let isCrit = false;
        const crit = this.critChance();
        if (crit > 0 && rng() < crit) isCrit = true;
        if (this._watchCritReady && this.has('doomsday_watch')) {
            isCrit = true;
            this._watchCritReady = false;
        }
        if (isCrit) {
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

        // 收割回响：概率从尸体迸发亡魂弹袭击附近敌人（视觉/子弹走 handler）
        if (this.has('reaper_echo')) {
            const re = RELICS.reaper_echo.effect.reaperEcho;
            if (rng() < re.chance && this._soulBurstHandler) {
                this._soulBurstHandler(x, y, re);
            }
        }

        // 弹壳回收：概率返还 1 发当前弹匣子弹（视觉/弹药走 handler）
        if (this.has('shell_reclaim')) {
            const sc = RELICS.shell_reclaim.effect.shellReclaim;
            if (rng() < sc.chance && this._ammoRefundHandler) {
                this._ammoRefundHandler(sc.amount);
            }
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
        // 时间沙漏：对新生成敌人施加冻结（复用 frozenTimer，由 StatusEffectSystem 逐帧递减 + 蓝色渲染）
        if (this.has('time_hourglass') && Array.isArray(enemies)) {
            const dur = RELICS.time_hourglass.effect.timeFreeze.duration;
            for (const e of enemies) {
                if (!e) continue;
                e.frozenTimer = Math.max(e.frozenTimer || 0, dur);
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
        // 命运骰子：本房掷出的护盾层完全抵挡一次伤害
        if (this._fateShieldReady) {
            this._fateShieldReady = false;
            if (this._barrierBlockHandler) this._barrierBlockHandler();
            return 0;
        }
        // 金币护盾：持币 ≥ 阈值且冷却就绪时，散落金币护体、完全免伤（消耗金币 + 进入冷却）
        if (this.has('coin_ward') && this._coinWardCd <= 0) {
            const conf = RELICS.coin_ward.effect.coinWard;
            if (this.runState && this.runState.coins >= conf.minCoins) {
                this.runState.spendCoins(conf.dropCoins);
                this._coinWardCd = conf.cooldown;
                if (this._coinDropHandler) this._coinDropHandler(conf.dropCoins);
                return 0;
            }
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

    // ── P9 新增 handler 注入 ──
    setCoinDropHandler(fn) { this._coinDropHandler = fn; }
    setTeslaHandler(fn) { this._teslaHandler = fn; }
    setSoulBurstHandler(fn) { this._soulBurstHandler = fn; }
    setAmmoRefundHandler(fn) { this._ammoRefundHandler = fn; }
    setReviveHandler(fn) { this._reviveHandler = fn; }
    setBloodPactHandler(fn) { this._bloodPactHandler = fn; }
    setFateHandler(fn) { this._fateHandler = fn; }
    setSacrificeHandler(fn) { this._sacrificeHandler = fn; }

    // ── P9 新增挂载点 ──

    /**
     * 进入新房间（DungeonManager 房间切换处调用）。
     * 命运骰子：清空上一房增益并随机掷出本房临时增益（伤害/移速/暴击/护盾），离房时下次进房重掷。
     * @param {() => number} rng 随机源（测试注入）
     * @returns {string|null} 本次掷出的增益类型，无命运骰子时 null
     */
    onRoomEnter(rng = Math.random) {
        // 先清空上一房命运骰子增益（离房失效）
        this._fateBuff = null;
        this._fateShieldReady = false;
        if (!this.has('fate_dice')) return null;

        const kinds = ['damage', 'speed', 'crit', 'shield'];
        const kind = kinds[Math.min(kinds.length - 1, Math.floor(rng() * kinds.length))];
        this._fateBuff = kind;
        if (kind === 'shield') this._fateShieldReady = true;

        const labels = { damage: '伤害强化', speed: '疾风步伐', crit: '会心一击', shield: '护盾一层' };
        if (this._fateHandler) this._fateHandler(labels[kind]);
        return kind;
    }

    /**
     * 玩家死亡时尝试复活（Game 死亡路径调用）。
     * 保险柜：每局一次，以 maxHp 的固定比例复活并保留金币；触发后图标灰化。
     * @returns {boolean} 是否成功复活
     */
    tryRevive() {
        if (!this.has('safe_vault') || this._safeVaultUsed) return false;
        this._safeVaultUsed = true;
        this._depletedVersion++;
        const ratio = RELICS.safe_vault.effect.safeVault.reviveHpRatio;
        this.player.hp = Math.max(1, Math.ceil(this.player.maxHp * ratio));
        if (this._reviveHandler) this._reviveHandler();
        return true;
    }

    /**
     * 血肉契约：商店金币不足时以生命补足差额（1 金 = hpPerCoin HP，不会致死）。
     * 成功时扣除玩家现有全部金币 + 相应生命，返回 true；否则不做任何改动返回 false。
     * @param {import('./DungeonRunState.js').DungeonRunState} runState
     * @param {number} price 商品价格
     * @returns {boolean}
     */
    tryBloodPactPurchase(runState, price) {
        if (!this.has('blood_pact') || !runState) return false;
        const have = runState.coins || 0;
        if (have >= price) return false; // 金币充足无需以血支付（调用方应先走金币结算）
        const shortfall = price - have;
        const hpCost = shortfall * RELICS.blood_pact.effect.bloodPact.hpPerCoin;
        // 不能买到自杀：至少保留 1 点生命
        if (this.player.hp - hpCost < 1) return false;
        if (have > 0) runState.spendCoins(have);
        this.player.hp -= hpCost;
        if (this._bloodPactHandler) this._bloodPactHandler(hpCost);
        return true;
    }

    // ── 环绕护刃：供 Game/Renderer 读取旋转态与命中判定 ──

    /** 当前护刃旋转角（弧度）。 */
    orbitBladeAngle() { return this._bladeAngle; }

    /** 护刃配置（半径/伤害），供消费方计算位置与结算。 */
    orbitBladeConfig() { return RELICS.orbit_blade.effect.orbitBlade; }

    /**
     * 判定护刃本帧能否命中指定敌人：未在冷却内则登记冷却并返回 true。
     * @param {*} key 敌人引用（或测试用唯一 id）
     * @returns {boolean}
     */
    orbitBladeCanHit(key) {
        const cd = this._bladeHitCd.get(key) || 0;
        if (cd > 0) return false;
        this._bladeHitCd.set(key, RELICS.orbit_blade.effect.orbitBlade.hitCooldown);
        return true;
    }

    // ── UI 辅助 ──

    /** 指定遗物是否已耗尽（当前仅保险柜触发后灰化）。 */
    isRelicDepleted(id) {
        return id === 'safe_vault' && this._safeVaultUsed;
    }

    /** 遗物耗尽版本号（每次有遗物耗尽自增，供 UI 判定是否需要重绘灰化）。 */
    depletedVersion() { return this._depletedVersion; }
}
