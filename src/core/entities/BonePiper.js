// BonePiper —— 骨笛吹手：不直接攻击的唤潮支援。制造「先杀奶妈」的目标优先级决策。
// 技能①加速光环：周围 120px 内敌人移速 ×1.25（固定倍率、不叠乘，piper 死后自然消退）。
// 技能②唤潮：每 6s 吹笛（1s 前摇明显动作）从地面唤起 2 只 shambler（土堆钻出演出），
//   自身唤起的 shambler 上限 6，且不占房间出怪计数（scaleUncountedSpawn）。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';
import { SummonBehavior } from './behaviors/SummonBehavior.js';
import { TILE_SIZE } from '../../utils/Constants.js';

const AURA_RADIUS = 120;      // 加速光环半径
const AURA_MULT = 1.25;       // 光环移速倍率（固定值，多 piper 不叠乘）
const AURA_REFRESH = 12;      // 受光环敌人的续期帧数（>1 防抖，piper 停吹/死亡后自然消退）

export class BonePiper extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 30, 0.7);

        this.spriteScale = 1.3; // 体型与角色同级
        this.kite = new KiteBehavior({ near: 140, far: 240 });
        this.summon = new SummonBehavior({
            interval: 360,   // 6s
            batch: 2,
            cap: 6,          // 房内由它唤起的 shambler 上限
            castTime: 60,    // 1s 吹笛前摇
            range: 460,
            onSummon: (index) => this._summonShambler(index)
        });
        this.auraPhase = 0;      // 脚下金环脉冲相位
        this.combatSystem = null;
        this.worldSystem = null; // spawnEnemy 统一注入
    }

    /** 加速光环：为半径内其它敌人续期限时提速（Enemy.getEffectiveSpeed 消费）。 */
    _applySpeedAura() {
        const ws = this.worldSystem;
        if (!ws || !ws.enemies) return;
        const r2 = AURA_RADIUS * AURA_RADIUS;
        for (const e of ws.enemies) {
            if (e === this || e.hp <= 0) continue;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            if (dx * dx + dy * dy <= r2) {
                e.speedAuraTimer = AURA_REFRESH;
                e.speedAuraMult = AURA_MULT; // 固定倍率覆写：多 piper 不叠乘
            }
        }
    }

    /** 唤起一只 shambler（自身周围找落点），钻出土堆演出；楼层缩放但不计房间配额。 */
    _summonShambler(index) {
        const ws = this.worldSystem;
        if (!ws) return null;

        for (let attempt = 0; attempt < 6; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 36;
            const tx = Math.floor((this.x + Math.cos(angle) * dist) / TILE_SIZE);
            const ty = Math.floor((this.y + Math.sin(angle) * dist) / TILE_SIZE);
            const minion = ws.spawnEnemy('shambler', { tileX: tx, tileY: ty, strict: true });
            if (minion) {
                // [horde:enemies] 唤起物应用楼层缩放但不计入房间清除（人潮补充，非出怪配额）
                if (ws.dungeonManager && ws.dungeonManager.scaleUncountedSpawn) {
                    ws.dungeonManager.scaleUncountedSpawn(minion);
                }
                this._spawnEmergeDirt(minion.x, minion.y);
                return minion;
            }
        }
        return null;
    }

    /** 破土钻出的泥屑爆（唤潮落点演出，参考 Burrower/LootGoblin 钻地粒子）。 */
    _spawnEmergeDirt(x, y) {
        const particles = this.combatSystem && this.combatSystem.particles;
        if (!particles) return;
        for (let i = 0; i < 10; i++) {
            const a = Math.PI + (i / 10) * Math.PI - 0.2; // 上半圈迸溅
            const spd = Math.random() * 1.8 + 0.5;
            particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + 8,
                vx: Math.cos(a) * spd,
                vy: -Math.random() * 2 - 0.4,
                life: 18 + Math.random() * 10,
                color: Math.random() > 0.5 ? '#6b573b' : '#463726',
                size: Math.random() * 2 + 1,
                gravity: 0.14,
                friction: 0.95
            });
        }
    }

    /** 吹奏时向笛口斜上方喷出金色音符粒子（唤潮氛围）。 */
    _spawnNoteParticles() {
        const particles = this.combatSystem && this.combatSystem.particles;
        if (!particles) return;
        const a = -Math.PI * 0.65 + (Math.random() - 0.5) * 0.5;
        particles.push({
            x: this.x - 10,
            y: this.y - 8,
            vx: Math.cos(a) * 0.8,
            vy: Math.sin(a) * 0.8,
            life: 24 + Math.random() * 8,
            color: Math.random() > 0.4 ? '#e8c260' : '#fff0b8',
            size: 2,
            friction: 0.96
        });
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        this.auraPhase = (this.auraPhase + 0.04) % 1;

        // 加速光环持续生效（含施法/冰冻时；自身被冻不影响对他怪的增益）
        this._applySpeedAura();

        if (this.frozenTimer > 0) return;
        this.facingRight = player.x > this.x;

        const ctx = {
            enemy: this, player, walls, wallQuery,
            getFlowDirection, getNavDirection, moveResolver, combatSystem
        };

        const casting = this.summon.update(ctx);
        if (casting) {
            this.state = 'combat'; // 吹笛前摇定身
            if (this.summon.castProgress > 0.4 && this.animationTimer % 5 === 0) {
                this._spawnNoteParticles();
            }
            return;
        }

        this.kite.update(ctx);
        this.state = 'run';
    }

    _currentFrames() {
        const assets = Assets.bonePiper;
        if (!assets) return null;
        if (this.summon.isCasting) return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        // 脚下加速光环（金色脉冲椭圆，画在本体之下）
        this._drawAuraRing(ctx);

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(this.facingRight ? -s : s, s);

        const frames = this._currentFrames();
        if (frames) {
            let frameIndex;
            if (this.summon.isCasting) {
                frameIndex = Math.min(frames.length - 1, Math.floor(this.summon.castProgress * frames.length));
            } else {
                frameIndex = Math.floor(this.animationTimer / 8) % frames.length;
            }
            ctx.drawImage(frames[frameIndex], -16, -16);

            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(frames[frameIndex], -16, -16);
                ctx.restore();
            }
        }
        ctx.restore();

        this.drawHpBar(ctx);
    }

    /** 脚下加速光环：淡金脉冲圈（唤潮/增益的可读标识）。 */
    _drawAuraRing(ctx) {
        const x = Math.floor(this.x);
        const y = Math.floor(this.y) + 12;
        const pulse = 0.5 + 0.5 * Math.sin(this.auraPhase * Math.PI * 2);
        const r = AURA_RADIUS * (0.92 + pulse * 0.08);
        ctx.save();
        ctx.globalAlpha = 0.10 + pulse * 0.08;
        ctx.strokeStyle = '#e8c260';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        // 内圈微光填充
        ctx.globalAlpha = 0.04 + pulse * 0.04;
        ctx.fillStyle = '#e8c260';
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    getLightOccluderSprites() {
        if (this.hp <= 0 || this.blocksLight === false) return [];
        const frames = this._currentFrames();
        if (!frames || frames.length === 0) return [];
        const sprite = frames[Math.floor(this.animationTimer / 8) % frames.length];
        if (!sprite) return [];
        return [{
            kind: 'sprite',
            sprite,
            pivotX: this.x,
            pivotY: this.y,
            originX: 16,
            originY: 16,
            rotation: 0,
            flipX: this.facingRight === true
        }];
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;
        const barWidth = 24;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 24);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#e8c260';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
