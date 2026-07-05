import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { BossPhaseController } from './bosses/BossPhaseController.js';
import { computeRingAngles, computeFanAngles } from './behaviors/RangedPatternBehavior.js';

// ── 弹幕/招式常量（数值红线：单发伤害 ≤12，前摇随伤害升高；见 COMBAT_BALANCE_METHODOLOGY §3.2/§3.4）──
const BULLET_DMG = 8;          // 环形/扇形弹单发伤害（≤12 红线）
const BULLET_SPEED = 2.8;      // 可读可躲弹速（对齐 Warlock/Spinner 弹幕）
const BULLET_LIFE = 140;

const ROAR_WINDUP = 36;        // 怒吼前摇 0.6s（身体后仰 + 音效预警）
const ROAR_COOLDOWN = 240;     // 怒吼独立冷却 ~4s
const ROAR_MIN = 10;           // 环形弹 10-12 发
const ROAR_MAX = 12;

const BARRAGE_WINDUP = 24;     // 横扫弹幕波前摇 0.4s
const BARRAGE_WAVE_GAP = 15;   // 三连发波间隔 0.25s
const BARRAGE_WAVES = 3;
const BARRAGE_PER_WAVE = 5;
const BARRAGE_SPREAD_DEG = 55;
const BARRAGE_COOLDOWN = 260;

const ROCKFALL_WARN = 48;      // 落石预警圈 0.8s 后落点结算
const ROCKFALL_RADIUS = 40;
const ROCKFALL_DMG = 12;
const ROCKFALL_COUNT = 3;

const HORDE_INTERVAL = 300;    // P3 唤潮周期 5s
const HORDE_BATCH = 2;         // 每次唤起 2 只
const HORDE_CAP = 6;           // 房内 Boss 小怪上限
const HORDE_POOL = ['wraith', 'plague_rat'];

const LEAP_RING_COUNT = 16;    // P3 跳劈落地全屏环形弹

// 相位配色（HP 条 + 弹幕 + 泛红）：P1 毒绿 / P2 橙红 / P3 紫
const PHASE_BULLET_COLOR = ['#8ef04a', '#ff7a3c', '#c04aff'];

// 招式调参汇总（供 vitest 断言，单一事实源）
export const MUTANT_BEAST_TUNING = {
    BULLET_DMG, BULLET_SPEED, BULLET_LIFE,
    ROAR_WINDUP, ROAR_COOLDOWN, ROAR_MIN, ROAR_MAX,
    BARRAGE_WINDUP, BARRAGE_WAVE_GAP, BARRAGE_WAVES, BARRAGE_PER_WAVE, BARRAGE_SPREAD_DEG, BARRAGE_COOLDOWN,
    ROCKFALL_WARN, ROCKFALL_RADIUS, ROCKFALL_DMG, ROCKFALL_COUNT,
    HORDE_INTERVAL, HORDE_BATCH, HORDE_CAP, HORDE_POOL,
    LEAP_RING_COUNT
};

export class MutantBeast extends Enemy {
    constructor(x, y) {
        super(x, y, 50, 50, 900, 0.5);
        this.hitboxWidth = 28;
        this.hitboxHeight = 16;
        this.hitboxOffsetY = 20;
        this.isBoss = true;
        this.name = '变异巨兽';
        this.dpsCap = 26; // 承伤上限：900HP/35s（COMBAT_BALANCE_METHODOLOGY §3.4）

        // Boss HP 条相位标记（Renderer.drawBossHpBar 读取）
        this.phaseColors = ['#4a7c59', '#c0392b', '#8e44ad'];
        this.phaseNames = ['I', 'II', 'III'];
        this.phaseMarkers = [0.6, 0.25];

        // Phase system — 调度走 BossPhaseController（优先级链表达距离带选招 + 弹幕招）
        this.phase = 1;
        this.phaseController = new BossPhaseController({
            phases: [
                {
                    threshold: 0.6,
                    phase: 2,
                    onEnter: () => {
                        this.speed = 0.7;
                        this._beginTransition();
                    }
                },
                {
                    threshold: 0.25,
                    phase: 3,
                    onEnter: () => {
                        this.speed = 0.75; // 狂暴提速 0.6→0.75
                        this._beginTransition();
                    }
                }
            ],
            attacks: [
                // 弹幕招（priority 6）：各自独立冷却，同层加权随机，逼玩家持续走位
                { id: 'roar_ring', priority: 6, minPhase: 1, condition: (ctx) => ctx.roarReady && ctx.rangedReady },
                { id: 'sweep_barrage', priority: 6, minPhase: 2, condition: (ctx) => ctx.barrageReady && ctx.rangedReady && ctx.dist > 60 },
                { id: 'summon', priority: 6, minPhase: 3, condition: (ctx) => ctx.summonReady && ctx.rangedReady && ctx.minionCount < HORDE_CAP },
                // 位移/近战招（低优先级填补弹幕冷却间隙）
                { id: 'leap_slam', priority: 4, minPhase: 2, condition: (ctx) => ctx.attackReady && ctx.dist > 150 },
                { id: 'charge', priority: 3, minPhase: 2, condition: (ctx) => ctx.attackReady && ctx.dist > 80 && ctx.dist < 150 },
                { id: 'stomp', priority: 2, condition: (ctx) => ctx.attackReady && ctx.dist < 80 && ctx.dist > 50 },
                { id: 'smash', priority: 1, weight: 1, condition: (ctx) => ctx.attackReady && ctx.dist <= 50 },
                { id: 'sweep', priority: 1, weight: 1, condition: (ctx) => ctx.attackReady && ctx.dist <= 50 }
            ]
        });
        this.isTransitioning = false;
        this.transitionTimer = 0;
        this.transitionDuration = 60; // 转阶段 ~1s 停顿演出
        this._transitionFxPending = false;

        // Attack system - multi-attack state machine
        this.currentAttack = null; // 'smash'|'sweep'|'stomp'|'charge'|'leap_slam'|'summon'|'roar_ring'|'sweep_barrage'
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.attackDuration = 60;

        // Attack configs
        this.attacks = {
            smash:         { range: 45, damage: 25, knockback: 15, duration: 60, hitFrame: 35, cooldown: 40 },
            sweep:         { range: 50, damage: 20, knockback: 10, duration: 60, hitFrame: 30, cooldown: 45 },
            stomp:         { range: 80, damage: 15, knockback: 10, duration: 60, hitFrame: 28, radius: 80 },
            charge:        { damage: 30, knockback: 20, duration: 90, speed: 4.0, maxDist: 200, windupFrames: 30, cooldown: 50 },
            leap_slam:     { damage: 20, knockback: 12, duration: 70, radius: 100, airStart: 20, airEnd: 50, cooldown: 60 },
            roar_ring:     { duration: ROAR_WINDUP + 30, windup: ROAR_WINDUP, cooldown: 40 },
            sweep_barrage: { duration: BARRAGE_WINDUP + BARRAGE_WAVES * BARRAGE_WAVE_GAP + 12, windup: BARRAGE_WINDUP, cooldown: 45 },
            summon:        { duration: 60, cooldown: 40 }
        };

        // Charge state
        this.chargeVx = 0;
        this.chargeVy = 0;
        this.chargeDistTraveled = 0;
        this.isCharging = false;

        // Leap state
        this.leapStartX = 0;
        this.leapStartY = 0;
        this.leapTargetX = 0;
        this.leapTargetY = 0;
        this.isAirborne = false;

        // 弹幕招独立冷却
        this.roarCooldown = ROAR_WINDUP; // 首吼略延，避免进房瞬间齐射
        this.barrageCooldown = 0;

        // 落石预警（延迟 AoE 结算）：{ x, y, timer, warn }
        this.rockfalls = [];

        // P3 唤潮：追踪存活小怪（上限 HORDE_CAP）
        this.summonedMinions = [];
        this.summonCooldown = 0;
        this._barrageWavesFired = 0;

        // Aggro
        this.aggroRange = 800;

        // External references set after spawn / passed via update
        this.worldSystem = null;
        this.combatSystem = null;

        // Offscreen canvas for sprite-shaped overlays（node/vitest 下无 document，跳过）
        if (typeof document !== 'undefined') {
            this._overlayCanvas = document.createElement('canvas');
            this._overlayCanvas.width = 80;
            this._overlayCanvas.height = 80;
            this._overlayCtx = this._overlayCanvas.getContext('2d');
        } else {
            this._overlayCanvas = null;
            this._overlayCtx = null;
        }
    }

    /** 转阶段起手：停顿 + 清空当前招 + 挂起演出（音效/震动在下一帧 update 消费）。 */
    _beginTransition() {
        this.isTransitioning = true;
        this.transitionTimer = 0;
        this.currentAttack = null;
        this.isCharging = false;
        this.isAirborne = false;
        this._transitionFxPending = true;
    }

    // Override: 90% knockback resistance + phase transition check
    takeDamage(amount, knockback) {
        amount = this._applyDpsCap(amount); // 承伤上限（COMBAT_BALANCE_METHODOLOGY §3.4）
        if (amount <= 0) return;
        this.hp -= amount;
        this.hitFlashTimer = 5;
        this.hpBarTimer = 120;
        if (knockback) {
            this.knockbackX = knockback.x * 0.1;
            this.knockbackY = knockback.y * 0.1;
        }
        this.checkPhaseTransition();
    }

    checkPhaseTransition() {
        const advanced = this.phaseController.updatePhase(this.hp / this.maxHp);
        if (advanced !== null) {
            this.phase = this.phaseController.phase;
            return true;
        }
        return false;
    }

    getPhaseSpeed() {
        if (this.phase === 1) return 0.5;
        if (this.phase === 2) return 0.7;
        return 0.75; // phase 3 狂暴提速
    }

    // Return null when airborne so bullets pass through
    getBulletHurtbox() {
        if (this.isAirborne) return null;
        // Sprite drawn at (-40,-40), body spans roughly sprite y=20..73
        // In world coords: this.y-20 (head) to this.y+33 (boots)
        const width = 44;
        const height = 50;
        const bottomY = this.y + 28;
        return {
            x: this.x - width / 2,
            y: bottomY - height,
            width,
            height
        };
    }

    startAttack(type, player) {
        this.currentAttack = type;
        this.attackTimer = 0;
        this.state = 'attack';

        if (type === 'charge') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.chargeVx = (dx / dist) * this.attacks.charge.speed;
                this.chargeVy = (dy / dist) * this.attacks.charge.speed;
            } else {
                this.chargeVx = this.attacks.charge.speed;
                this.chargeVy = 0;
            }
            this.chargeDistTraveled = 0;
            this.isCharging = false; // becomes true after windup
        }

        if (type === 'leap_slam') {
            this.leapStartX = this.x;
            this.leapStartY = this.y;
            this.leapTargetX = player.x;
            this.leapTargetY = player.y;
            this.isAirborne = false;
        }

        if (type === 'roar_ring') {
            // 独立冷却立即起算（前摇 + 齐射期间不再触发第二次吼）
            this.roarCooldown = ROAR_COOLDOWN;
            this._roarFired = false;
            // [horde:boss] 吼叫前摇音效
            this.combatSystem?.soundSystem?.play('boss_roar', { x: this.x, y: this.y });
        }

        if (type === 'sweep_barrage') {
            this.barrageCooldown = BARRAGE_COOLDOWN;
            this._barrageWavesFired = 0;
        }

        if (type === 'summon') {
            this.summonCooldown = HORDE_INTERVAL;
            this._summonFired = false;
        }
    }

    // --- Attack execution methods ---

    executeSmash(player, timer) {
        const cfg = this.attacks.smash;
        if (timer !== cfg.hitFrame) return;
        if (player.state === 'driving' || player.state === 'roll') return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < cfg.range) {
            const angle = Math.atan2(dy, dx);
            const knockback = {
                x: Math.cos(angle) * cfg.knockback,
                y: Math.sin(angle) * cfg.knockback
            };
            if (player.takeDamage) {
                player.takeDamage(cfg.damage, knockback);
            } else {
                player.hp -= cfg.damage;
            }
        }
    }

    executeSweep(player, timer) {
        const cfg = this.attacks.sweep;
        if (timer !== cfg.hitFrame) return;
        if (player.state === 'driving' || player.state === 'roll') return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < cfg.range) {
            // Check 60-degree arc facing direction
            const angle = Math.atan2(dy, dx);
            const facingAngle = this.facingRight ? 0 : Math.PI;
            let angleDiff = Math.abs(angle - facingAngle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            if (angleDiff < Math.PI / 3) { // 60 degrees = PI/3
                const kbAngle = Math.atan2(dy, dx);
                const knockback = {
                    x: Math.cos(kbAngle) * cfg.knockback,
                    y: Math.sin(kbAngle) * cfg.knockback
                };
                if (player.takeDamage) {
                    player.takeDamage(cfg.damage, knockback);
                } else {
                    player.hp -= cfg.damage;
                }
            }
        }
    }

    executeStomp(player, timer, combatSystem) {
        const cfg = this.attacks.stomp;
        if (timer !== cfg.hitFrame) return;

        // Create a ground slam shockwave (not explosion — no fire, no self-damage)
        if (combatSystem && combatSystem.spawnGroundSlam) {
            combatSystem.spawnGroundSlam(this.x, this.y, cfg.damage, cfg.radius, cfg.knockback, PHASE_BULLET_COLOR[this.phase - 1]);
        }
    }

    executeCharge(player, timer, walls, wallQuery, moveResolver, combatSystem) {
        const cfg = this.attacks.charge;

        // Windup phase: telegraph, no movement
        if (timer < cfg.windupFrames) {
            this.isCharging = false;
            return;
        }

        this.isCharging = true;

        // Move at charge speed in locked direction
        const nextX = this.x + this.chargeVx;
        const nextY = this.y + this.chargeVy;
        const prevX = this.x;
        const prevY = this.y;

        if (moveResolver) {
            moveResolver(this, nextX, nextY, this.chargeVx, this.chargeVy);
        } else {
            this.resolveWallCollision(nextX, nextY, walls, wallQuery);
        }

        // Track distance traveled
        const movedDist = Math.sqrt(
            (this.x - prevX) * (this.x - prevX) +
            (this.y - prevY) * (this.y - prevY)
        );
        this.chargeDistTraveled += movedDist;

        // Check if hit a wall (barely moved despite trying)
        const hitWall = movedDist < 0.1 && timer > cfg.windupFrames + 3;

        // Check player collision during charge
        let hitPlayer = false;
        if (player.state !== 'driving' && player.state !== 'roll') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 40) {
                hitPlayer = true;
                const angle = Math.atan2(dy, dx);
                const knockback = {
                    x: Math.cos(angle) * cfg.knockback,
                    y: Math.sin(angle) * cfg.knockback
                };
                if (player.takeDamage) {
                    player.takeDamage(cfg.damage, knockback);
                } else {
                    player.hp -= cfg.damage;
                }
            }
        }

        // 撞墙：P2+ 震落落石预警圈（把"躲开冲锋"升级为"躲开还有余震"）
        if (hitWall && this.phase >= 2) {
            const aheadX = this.x + (this.chargeVx / cfg.speed) * 20;
            const aheadY = this.y + (this.chargeVy / cfg.speed) * 20;
            this.scheduleRockfalls(aheadX, aheadY, ROCKFALL_COUNT);
            if (combatSystem) {
                combatSystem.soundSystem?.play('boss_rockfall_warn', { x: aheadX, y: aheadY }); // [horde:boss]
                if (combatSystem.camera) {
                    combatSystem.camera.x += (Math.random() - 0.5) * 8;
                    combatSystem.camera.y += (Math.random() - 0.5) * 8;
                }
            }
        }

        // Stop charge conditions
        if (hitWall || hitPlayer || this.chargeDistTraveled >= cfg.maxDist) {
            // End charge early by forcing timer to duration
            this.attackTimer = cfg.duration;
            this.isCharging = false;
        }
    }

    executeLeapSlam(player, timer, combatSystem) {
        const cfg = this.attacks.leap_slam;

        if (timer >= cfg.airStart && timer < cfg.airEnd) {
            // Airborne: interpolate position
            this.isAirborne = true;
            const progress = (timer - cfg.airStart) / (cfg.airEnd - cfg.airStart);
            this.x = this.leapStartX + (this.leapTargetX - this.leapStartX) * progress;
            this.y = this.leapStartY + (this.leapTargetY - this.leapStartY) * progress;
        }

        if (timer === cfg.airEnd) {
            // Land: create ground slam AOE (larger, more dramatic)
            this.isAirborne = false;
            this.x = this.leapTargetX;
            this.y = this.leapTargetY;

            if (combatSystem && combatSystem.spawnGroundSlam) {
                combatSystem.spawnGroundSlam(this.x, this.y, cfg.damage, cfg.radius, cfg.knockback, PHASE_BULLET_COLOR[this.phase - 1]);
            }
            // P3 狂暴：落地追加全屏环形弹幕
            if (this.phase === 3 && combatSystem) {
                this.fireRing(combatSystem, LEAP_RING_COUNT);
                if (combatSystem.camera) {
                    combatSystem.camera.x += (Math.random() - 0.5) * 10;
                    combatSystem.camera.y += (Math.random() - 0.5) * 10;
                }
            }
        }

        if (timer > cfg.airEnd) {
            this.isAirborne = false;
        }
    }

    /**
     * 怒吼环形弹幕：前摇结束的那一帧放 10-12 发放射弹。
     */
    executeRoarRing(player, timer, combatSystem) {
        const cfg = this.attacks.roar_ring;
        if (timer !== cfg.windup || this._roarFired) return;
        this._roarFired = true;
        if (!combatSystem) return;
        const count = ROAR_MIN + Math.floor(Math.random() * (ROAR_MAX - ROAR_MIN + 1));
        this.fireRing(combatSystem, count);
        if (combatSystem.camera) {
            combatSystem.camera.x += (Math.random() - 0.5) * 6;
            combatSystem.camera.y += (Math.random() - 0.5) * 6;
        }
    }

    /**
     * 横扫弹幕波：朝玩家扇形三连发（每波 5 发、55°、间隔 0.25s）。
     */
    executeSweepBarrage(player, timer, combatSystem) {
        const cfg = this.attacks.sweep_barrage;
        if (timer < cfg.windup) return;
        const since = timer - cfg.windup;
        if (since % BARRAGE_WAVE_GAP !== 0) return;
        if (this._barrageWavesFired >= BARRAGE_WAVES) return;
        this._barrageWavesFired++;
        if (!combatSystem) return;
        this.fireFan(combatSystem, player, BARRAGE_PER_WAVE, BARRAGE_SPREAD_DEG);
    }

    /** 环形齐射（复用 RangedPatternBehavior 的环形角度数学 → CombatSystem.spawnEnemyBullet）。 */
    fireRing(combatSystem, count) {
        const color = PHASE_BULLET_COLOR[this.phase - 1];
        const phase = Math.random() * Math.PI * 2;
        for (const angle of computeRingAngles(count, phase)) {
            combatSystem.spawnEnemyBullet({
                x: this.x, y: this.y - 10, angle,
                damage: BULLET_DMG, speed: BULLET_SPEED,
                color, size: 5, life: BULLET_LIFE, owner: this
            });
        }
    }

    /** 朝玩家扇形齐射（复用 computeFanAngles）。 */
    fireFan(combatSystem, player, count, spreadDeg) {
        const color = PHASE_BULLET_COLOR[this.phase - 1];
        const aim = Math.atan2(player.y - (this.y - 10), player.x - this.x);
        const spreadRad = (spreadDeg * Math.PI) / 180;
        for (const angle of computeFanAngles(aim, count, spreadRad)) {
            combatSystem.spawnEnemyBullet({
                x: this.x, y: this.y - 10, angle,
                damage: BULLET_DMG, speed: BULLET_SPEED,
                color, size: 5, life: BULLET_LIFE, owner: this
            });
        }
    }

    /** 排布 n 个落石预警圈（延迟 AoE），围绕撞击点散布。 */
    scheduleRockfalls(cx, cy, n) {
        for (let i = 0; i < n; i++) {
            const angle = (Math.PI * 2 * i) / n + Math.random() * 0.6;
            const dist = 20 + Math.random() * 44;
            this.rockfalls.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                timer: ROCKFALL_WARN,
                warn: ROCKFALL_WARN
            });
        }
    }

    /** 每帧结算落石预警：倒计时归零后落石 AoE（伤 12 / 半径 40），独立于攻击状态机。 */
    updateRockfalls(combatSystem) {
        if (this.rockfalls.length === 0) return;
        for (let i = this.rockfalls.length - 1; i >= 0; i--) {
            const rf = this.rockfalls[i];
            rf.timer--;
            if (rf.timer <= 0) {
                if (combatSystem && combatSystem.spawnGroundSlam) {
                    combatSystem.spawnGroundSlam(rf.x, rf.y, ROCKFALL_DMG, ROCKFALL_RADIUS, 8, '#8a5a2a');
                }
                this.rockfalls.splice(i, 1);
            }
        }
    }

    /** P3 唤潮：从房间边缘唤起 2 只（wraith/plague_rat），房内小怪不超 HORDE_CAP。 */
    summonHordeWave() {
        if (!this.worldSystem || typeof this.worldSystem.spawnEnemy !== 'function') return 0;
        this.summonedMinions = this.summonedMinions.filter(m => m && m.hp > 0);
        const room = HORDE_CAP - this.summonedMinions.length;
        if (room <= 0) return 0;
        const toSpawn = Math.min(HORDE_BATCH, room);
        let spawned = 0;
        for (let i = 0; i < toSpawn; i++) {
            const type = HORDE_POOL[Math.floor(Math.random() * HORDE_POOL.length)];
            const angle = Math.random() * Math.PI * 2;
            const dist = 200 + Math.random() * 70; // 房间边缘一带
            const minion = this.worldSystem.spawnEnemy(type, {
                x: this.x + Math.cos(angle) * dist,
                y: this.y + Math.sin(angle) * dist
            });
            if (minion) {
                this.summonedMinions.push(minion);
                spawned++;
            }
        }
        return spawned;
    }

    executeSummon(combatSystem) {
        // Spawn minions at frame 30
        if (this.attackTimer === 30 && !this._summonFired) {
            this._summonFired = true;
            const n = this.summonHordeWave();
            if (n > 0 && combatSystem) {
                combatSystem.soundSystem?.play('boss_roar', { x: this.x, y: this.y }); // [horde:boss]
            }
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        // Guard checks
        if (this.hp <= 0) return;
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        // Base update: knockback, timers
        super.update(player, walls, wallQuery);

        // 落石预警独立于攻击状态机结算（撞墙后玩家仍需躲余震）
        this.updateRockfalls(combatSystem);

        // 转阶段演出（音效 + 屏幕震动，在有 combatSystem 的帧消费挂起标记）
        if (this._transitionFxPending) {
            this._transitionFxPending = false;
            const sfx = this.phase === 3 ? 'boss_enrage' : 'boss_roar';
            combatSystem?.soundSystem?.play(sfx, { x: this.x, y: this.y });
            if (combatSystem?.camera) {
                combatSystem.camera.x += (Math.random() - 0.5) * 14;
                combatSystem.camera.y += (Math.random() - 0.5) * 14;
            }
        }

        // Phase transition animation (0.5s+ 停顿演出)
        if (this.isTransitioning) {
            this.transitionTimer++;
            if (this.transitionTimer >= this.transitionDuration) {
                this.isTransitioning = false;
                this.transitionTimer = 0;
            }
            return;
        }

        // 首发反应窗口（锁门后 ~0.75s，_applyFloorScaling 挂 holdFireTimer）
        if (this.holdFireTimer > 0) this.holdFireTimer--;

        // 独立冷却递减
        if (this.roarCooldown > 0) this.roarCooldown--;
        if (this.barrageCooldown > 0) this.barrageCooldown--;
        if (this.summonCooldown > 0) this.summonCooldown--;

        // Clean dead minions from tracking array
        this.summonedMinions = this.summonedMinions.filter(m => m && m.hp > 0);

        // Attack state machine
        if (this.currentAttack !== null) {
            this.attackTimer++;
            const cfg = this.attacks[this.currentAttack];

            switch (this.currentAttack) {
                case 'smash':
                    this.executeSmash(player, this.attackTimer);
                    break;
                case 'sweep':
                    this.executeSweep(player, this.attackTimer);
                    break;
                case 'stomp':
                    this.executeStomp(player, this.attackTimer, combatSystem);
                    break;
                case 'charge':
                    this.executeCharge(player, this.attackTimer, walls, wallQuery, moveResolver, combatSystem);
                    break;
                case 'leap_slam':
                    this.executeLeapSlam(player, this.attackTimer, combatSystem);
                    break;
                case 'roar_ring':
                    this.executeRoarRing(player, this.attackTimer, combatSystem);
                    break;
                case 'sweep_barrage':
                    this.executeSweepBarrage(player, this.attackTimer, combatSystem);
                    break;
                case 'summon':
                    this.executeSummon(combatSystem);
                    break;
            }

            // End attack when timer exceeds duration
            if (this.attackTimer >= (cfg ? cfg.duration : 60)) {
                const cooldown = cfg ? (cfg.cooldown || 30) : 30;
                this.attackCooldown = cooldown;
                this.currentAttack = null;
                this.isCharging = false;
                this.isAirborne = false;
                this.state = 'idle';
            }
            return; // Don't move during attacks (charge handles its own movement)
        }

        // Cooldown
        if (this.attackCooldown > 0) this.attackCooldown--;

        // AI - Attack selection
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.facingRight = dx > 0;

        if (dist < this.aggroRange) {
            // Priority-based attack selection（BossPhaseController 优先级链）
            const attackId = this.phaseController.pickAttack({
                dist,
                attackReady: this.attackCooldown <= 0,
                rangedReady: (this.holdFireTimer || 0) <= 0,
                roarReady: this.roarCooldown <= 0,
                barrageReady: this.barrageCooldown <= 0,
                summonReady: this.summonCooldown <= 0,
                minionCount: this.summonedMinions.length
            });
            if (attackId) {
                this.startAttack(attackId, player);
                return;
            }

            // Movement: use flow field with larger separation
            this.state = 'run';
            if (this.knockbackX === 0 && this.knockbackY === 0) {
                let moveX = 0;
                let moveY = 0;

                if (getFlowDirection) {
                    const flow = getFlowDirection(this.x, this.y);
                    if (flow && (flow.x !== 0 || flow.y !== 0)) {
                        moveX = flow.x;
                        moveY = flow.y;
                    }
                }

                // Direct pursuit if close and no flow
                if (moveX === 0 && moveY === 0 && dist > 0 && dist < 100) {
                    moveX = dx / dist;
                    moveY = dy / dist;
                }

                // Separation from other enemies (larger radius for boss)
                let sepX = 0;
                let sepY = 0;
                if (getNearbyEnemies) {
                    const neighbors = getNearbyEnemies(this);
                    const desiredSep = 40;
                    for (const other of neighbors) {
                        if (other === this) continue;
                        const ndx = this.x - other.x;
                        const ndy = this.y - other.y;
                        const ndist = Math.sqrt(ndx * ndx + ndy * ndy);
                        if (ndist > 0 && ndist < desiredSep) {
                            const strength = (desiredSep - ndist) / desiredSep;
                            sepX += (ndx / ndist) * strength;
                            sepY += (ndy / ndist) * strength;
                        }
                    }
                }

                let vx = moveX + sepX * 1.4;
                let vy = moveY + sepY * 1.4;
                const vLen = Math.sqrt(vx * vx + vy * vy);
                if (vLen > 0) {
                    vx /= vLen;
                    vy /= vLen;
                }

                if (getNavDirection) {
                    const nav = getNavDirection(this, vx, vy);
                    if (nav && (nav.x !== 0 || nav.y !== 0)) {
                        vx = nav.x;
                        vy = nav.y;
                    }
                }

                const spd = this.getEffectiveSpeed();
                const nextX = this.x + vx * spd;
                const nextY = this.y + vy * spd;

                if (moveResolver) {
                    moveResolver(this, nextX, nextY, vx, vy);
                } else {
                    this.resolveWallCollision(nextX, nextY, walls, wallQuery);
                }
            }
        } else {
            this.state = 'idle';
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        // 落石预警圈（世界坐标，绘于本体 translate 之前）
        this._drawRockfallTelegraphs(ctx);

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.facingRight) {
            ctx.scale(-1, 1);
        }

        // Shadow (large, at ground level)
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, 30, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Select frames based on phase and state
        const phaseKey = 'phase' + this.phase;
        const assets = Assets.mutantBeast ? Assets.mutantBeast[phaseKey] : null;
        if (!assets) {
            // Fallback: draw a placeholder rectangle if assets not yet created
            this._drawPlaceholder(ctx);
            ctx.restore();
            return;
        }

        let frames, frameIndex;
        if (this.isTransitioning && assets.roar) {
            frames = assets.roar;
            frameIndex = Math.min(
                Math.floor((this.transitionTimer / this.transitionDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.currentAttack && assets[this.currentAttack]) {
            frames = assets[this.currentAttack];
            const dur = this.attacks[this.currentAttack]?.duration || 60;
            frameIndex = Math.min(
                Math.floor((this.attackTimer / dur) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run' && assets.run) {
            frames = assets.run;
            frameIndex = Math.floor(this.animationTimer / 7) % frames.length;
        } else {
            frames = assets.idle;
            frameIndex = Math.floor(this.animationTimer / 7) % frames.length;
        }

        if (frames && frames[frameIndex]) {
            // Leap visual: offset Y during airborne
            let drawY = -40;
            if (this.isAirborne) {
                const leapCfg = this.attacks.leap_slam;
                const airProgress = (this.attackTimer - leapCfg.airStart) / (leapCfg.airEnd - leapCfg.airStart);
                const arcHeight = Math.sin(airProgress * Math.PI) * 40;
                drawY -= arcHeight;
            }

            // 怒吼前摇：身体后仰预警（沿背向玩家方向微移）
            let leanX = 0;
            if (this.currentAttack === 'roar_ring' && this.attackTimer < this.attacks.roar_ring.windup) {
                const t = this.attackTimer / this.attacks.roar_ring.windup;
                leanX = -Math.sin(t * Math.PI) * 4; // 本地坐标（facingRight 已翻转）
            }

            const sprite = frames[frameIndex];
            ctx.drawImage(sprite, -40 + leanX, drawY);

            // Hit flash
            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(sprite, -40 + leanX, drawY);
                ctx.restore();
            }

            // P3 狂暴：全身泛红
            if (this.phase === 3 && !this.isTransitioning) {
                const pulse = 0.18 + Math.sin(this.animationTimer * 0.15) * 0.08;
                this._drawSpriteOverlay(ctx, sprite, drawY, '#ff2a1a', pulse, leanX);
            }

            // 怒吼前摇：头顶蓄力红光环
            if (this.currentAttack === 'roar_ring' && this.attackTimer < this.attacks.roar_ring.windup) {
                this._drawRoarCharge(ctx, drawY);
            }

            // Phase transition effect (sprite-shaped)
            if (this.isTransitioning) {
                const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
                const color = this.phase === 2 ? '#ff3200' : '#a028ff';
                this._drawSpriteOverlay(ctx, sprite, drawY, color, alpha, leanX);
            }

            // Status effect overlays (sprite-shaped, handled here instead of Renderer)
            if (this.frozenTimer > 0) {
                this._drawSpriteOverlay(ctx, sprite, drawY, '#a8d8ea', 0.45, leanX);
            } else if (this.slowTimer > 0) {
                const slowAlpha = 0.1 + (this.slowAmount || 0) * 0.3;
                this._drawSpriteOverlay(ctx, sprite, drawY, '#a8d8ea', slowAlpha, leanX);
            }
            if (this.bleedTimer > 0) {
                const pulse = 0.15 + Math.sin(Date.now() / 150) * 0.1;
                this._drawSpriteOverlay(ctx, sprite, drawY, '#c0392b', pulse, leanX);
            }
        }

        ctx.restore();
    }

    /** 落石预警圈：红色收缩圈 + 落点阴影，倒计时越近越亮。 */
    _drawRockfallTelegraphs(ctx) {
        if (this.rockfalls.length === 0) return;
        for (const rf of this.rockfalls) {
            const t = 1 - rf.timer / rf.warn; // 0→1 越接近落石
            ctx.save();
            ctx.translate(Math.floor(rf.x), Math.floor(rf.y));
            // 落点阴影（渐深）
            ctx.fillStyle = `rgba(20,10,4,${0.15 + t * 0.35})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, ROCKFALL_RADIUS, ROCKFALL_RADIUS * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            // 收缩预警圈（半径随倒计时向内收）
            const r = ROCKFALL_RADIUS * (1 - t * 0.55);
            ctx.strokeStyle = `rgba(255,60,40,${0.5 + Math.sin(t * Math.PI * 6) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            // 外圈固定参考
            ctx.strokeStyle = 'rgba(255,90,60,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 0, ROCKFALL_RADIUS, ROCKFALL_RADIUS * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    /** 怒吼蓄力光环（头顶脉冲红环）。 */
    _drawRoarCharge(ctx, drawY) {
        const t = this.attackTimer / this.attacks.roar_ring.windup;
        const r = 10 + t * 18;
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(t * Math.PI * 8) * 0.2;
        ctx.strokeStyle = '#ff3a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, drawY + 24, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    getLightOccluderSprites() {
        if (this.hp <= 0 || this.blocksLight === false) return [];
        const phaseKey = 'phase' + this.phase;
        const assets = Assets.mutantBeast ? Assets.mutantBeast[phaseKey] : null;
        if (!assets) return [];

        let frames;
        let frameIndex = 0;
        if (this.isTransitioning && assets.roar) {
            frames = assets.roar;
            frameIndex = Math.min(
                Math.floor((this.transitionTimer / this.transitionDuration) * frames.length),
                frames.length - 1
            );
        } else if (this.currentAttack && assets[this.currentAttack]) {
            frames = assets[this.currentAttack];
            const dur = this.attacks[this.currentAttack]?.duration || 60;
            frameIndex = Math.min(
                Math.floor((this.attackTimer / dur) * frames.length),
                frames.length - 1
            );
        } else if (this.state === 'run' && assets.run) {
            frames = assets.run;
            frameIndex = Math.floor(this.animationTimer / 7) % frames.length;
        } else {
            frames = assets.idle;
            frameIndex = Math.floor(this.animationTimer / 7) % frames.length;
        }
        if (!frames || frames.length === 0) return [];

        const sprite = frames?.[frameIndex];
        if (!sprite) return [];

        let drawY = -40;
        if (this.isAirborne) {
            const leapCfg = this.attacks.leap_slam;
            const airProgress = (this.attackTimer - leapCfg.airStart) / (leapCfg.airEnd - leapCfg.airStart);
            const arcHeight = Math.sin(airProgress * Math.PI) * 40;
            drawY -= arcHeight;
        }

        return [{
            kind: 'sprite',
            sprite,
            pivotX: this.x,
            pivotY: this.y,
            originX: 40,
            originY: -drawY,
            rotation: 0,
            flipX: this.facingRight === true
        }];
    }

    /**
     * Draw a color overlay that matches the sprite silhouette (not a rectangle).
     */
    _drawSpriteOverlay(ctx, sprite, drawY, color, alpha, leanX = 0) {
        if (!this._overlayCtx) return;
        const oc = this._overlayCtx;
        oc.clearRect(0, 0, 80, 80);
        oc.globalCompositeOperation = 'source-over';
        oc.globalAlpha = 1;
        oc.drawImage(sprite, 0, 0);
        oc.globalCompositeOperation = 'source-atop';
        oc.fillStyle = color;
        oc.fillRect(0, 0, 80, 80);
        oc.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(this._overlayCanvas, -40 + leanX, drawY);
        ctx.restore();
    }

    /**
     * Fallback placeholder rendering when sprite assets are not yet registered.
     * Draws a simple colored rectangle so the boss is visible during development.
     */
    _drawPlaceholder(ctx) {
        // Body color based on phase
        const colors = ['#4a2', '#a42', '#62a'];
        ctx.fillStyle = colors[this.phase - 1] || '#4a2';
        ctx.fillRect(-20, -30, 40, 50);

        // Eyes
        ctx.fillStyle = '#f00';
        ctx.fillRect(-12, -22, 6, 6);
        ctx.fillRect(6, -22, 6, 6);

        // Airborne indicator
        if (this.isAirborne) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            ctx.strokeRect(-22, -32, 44, 54);
        }

        // Charge indicator
        if (this.isCharging) {
            ctx.strokeStyle = '#f80';
            ctx.lineWidth = 2;
            ctx.strokeRect(-22, -32, 44, 54);
        }

        // Hit flash
        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(-20, -30, 40, 50);
        }

        // P3 狂暴泛红（占位体也生效）
        if (this.phase === 3 && !this.isTransitioning) {
            const pulse = 0.18 + Math.sin(this.animationTimer * 0.15) * 0.08;
            ctx.fillStyle = `rgba(255, 42, 26, ${pulse})`;
            ctx.fillRect(-20, -30, 40, 50);
        }

        // Phase transition overlay
        if (this.isTransitioning) {
            const alpha = 0.3 + Math.sin(this.transitionTimer * 0.3) * 0.2;
            const color = this.phase === 2
                ? `rgba(255, 50, 0, ${alpha})`
                : `rgba(160, 40, 255, ${alpha})`;
            ctx.fillStyle = color;
            ctx.fillRect(-20, -30, 40, 50);
        }
    }
}
