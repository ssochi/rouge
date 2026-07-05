// LootGoblin —— 盗宝地精：绿皮小贼，追着玩家偷金币，偷够或超时便原地钻地遁走。
// 不主动造成伤害；被杀掉落"所偷金币 ×2 + 固定奖励"，逼玩家在它逃走前抢先击杀。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';
import { steerAwayFromPlayer } from './behaviors/BehaviorUtils.js';

const STEAL_RANGE = 24;      // 碰触偷窃判定半径
const STEAL_MIN = 3;         // 单次最少偷
const STEAL_MAX = 6;         // 单次最多偷
const STEAL_COOLDOWN = 60;   // 偷窃冷却（1s）
const ESCAPE_STOLEN = 10;    // 偷满该数额立即遁走
const LIFE_LIMIT = 900;      // 存活 15s 强制遁走
const FLEE_DURATION = 66;    // 得手后短暂逃窜（再回头继续偷）
const BURROW_DURATION = 42;  // 钻地消失动画时长
const BONUS_COIN = 5;        // 击杀固定奖励金币

export class LootGoblin extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 24, 30, 2.4);

        this.spriteScale = 1.15;
        this.chase = new ChaseBehavior();
        this.phase = 'chase';        // chase | flee | burrow
        this.stolenCoins = 0;
        this.stealCooldown = 0;
        this.lifeTimer = 0;
        this.fleeTimer = 0;
        this.burrowTimer = 0;
        this.escaped = false;        // WorldSystem 据此无掉落移除
        this.attackAnimTimer = 0;
        this.combatSystem = null;
    }

    /** 地牢死亡金币覆盖：所偷 ×2 + 固定奖励（WorldSystem 死亡清扫读取）。 */
    getDungeonCoinValue() {
        return this.stolenCoins * 2 + BONUS_COIN;
    }

    /**
     * 尝试从运行状态偷金币。抽 3~6，但不超过现有金币。
     * @returns {number} 实际偷到的金额
     */
    _trySteal(runState) {
        if (!runState || runState.active === false) return 0;
        const want = STEAL_MIN + Math.floor(Math.random() * (STEAL_MAX - STEAL_MIN + 1));
        const got = Math.max(0, Math.min(want, runState.coins || 0));
        if (got > 0) {
            runState.coins -= got;
            this.stolenCoins += got;
        }
        return got;
    }

    /** 钻地遁走 / 金币抖落粒子（若接入了 combatSystem 粒子）。 */
    _spawnDirtBurst(n = 8) {
        const particles = this.combatSystem && this.combatSystem.particles;
        if (!particles) return;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = Math.random() * 1.6 + 0.4;
            particles.push({
                x: this.x + (Math.random() - 0.5) * 10,
                y: this.y + 10,
                vx: Math.cos(a) * spd,
                vy: -Math.random() * 1.8 - 0.4,
                life: 18 + Math.random() * 12,
                color: Math.random() > 0.5 ? '#8a7048' : '#5c4a2e',
                size: Math.random() * 2 + 1,
                gravity: 0.14,
                friction: 0.96
            });
        }
    }

    _spawnCoinPop(n = 5) {
        const particles = this.combatSystem && this.combatSystem.particles;
        if (!particles) return;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = Math.random() * 1.4 + 0.6;
            particles.push({
                x: this.x + (Math.random() - 0.5) * 8,
                y: this.y - 4,
                vx: Math.cos(a) * spd,
                vy: -Math.random() * 1.5 - 0.6,
                life: 16 + Math.random() * 8,
                color: Math.random() > 0.4 ? '#ffcf3e' : '#fff2b0',
                size: Math.random() * 2 + 1,
                gravity: 0.16,
                friction: 0.95
            });
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0 || this.escaped) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        if (this.stealCooldown > 0) this.stealCooldown--;
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;
        this.lifeTimer++;

        const ctx = {
            enemy: this, player, walls, wallQuery,
            getFlowDirection, getNavDirection, moveResolver, combatSystem
        };

        // 钻地遁走阶段：不再移动，播放下沉动画后标记 escaped
        if (this.phase === 'burrow') {
            this.burrowTimer++;
            if (this.burrowTimer % 6 === 0) this._spawnDirtBurst(4);
            if (this.burrowTimer >= BURROW_DURATION) {
                this._spawnDirtBurst(10);
                this.escaped = true;
            }
            return;
        }

        // 触发遁走：偷满阈值或超时
        if (this.stolenCoins >= ESCAPE_STOLEN || this.lifeTimer >= LIFE_LIMIT) {
            this.phase = 'burrow';
            this.burrowTimer = 0;
            return;
        }

        // 偷窃判定（碰触 + 冷却就绪）
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy < STEAL_RANGE * STEAL_RANGE && this.stealCooldown <= 0) {
            const runState = this.worldSystem ? this.worldSystem.dungeonRunState : null;
            this._trySteal(runState);
            this.stealCooldown = STEAL_COOLDOWN;
            this.attackAnimTimer = 26;
            this.fleeTimer = FLEE_DURATION;
            this.phase = 'flee';
            this._spawnCoinPop();
        }

        // 移动：得手后逃窜一段，否则贴身追偷
        if (this.phase === 'flee') {
            this.fleeTimer--;
            steerAwayFromPlayer(ctx, 1.05);
            this.facingRight = dx < 0; // 背对玩家跑
            if (this.fleeTimer <= 0) this.phase = 'chase';
        } else {
            this.chase.update(ctx);
            this.facingRight = dx > 0;
        }
        this.state = 'run';
    }

    _currentFrames() {
        const assets = Assets.lootGoblin;
        if (!assets) return null;
        if (this.attackAnimTimer > 0) return assets.attack;
        if (this.phase === 'chase' || this.phase === 'flee') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0 || this.escaped) return;

        const frames = this._currentFrames();
        if (!frames || frames.length === 0) return;

        let frameIndex;
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / 26;
            frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
        } else {
            frameIndex = Math.floor(this.animationTimer / 5) % frames.length;
        }
        const sprite = frames[frameIndex];

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(this.facingRight ? -s : s, s);

        if (this.phase === 'burrow') {
            // 下沉：裁掉地面以下部分并整体下移，露出土堆
            const prog = Math.min(1, this.burrowTimer / BURROW_DURATION);
            ctx.save();
            ctx.beginPath();
            ctx.rect(-16, -16, 32, 16 - Math.floor(prog * 14)); // 逐渐只剩头顶
            ctx.clip();
            ctx.globalAlpha = 1 - prog * 0.4;
            ctx.drawImage(sprite, -16, -16 + Math.floor(prog * 6));
            ctx.restore();
        } else {
            ctx.drawImage(sprite, -16, -16);
            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(sprite, -16, -16);
                ctx.restore();
            }
        }
        ctx.restore();

        // 钻地土堆（世界坐标，不翻转）
        if (this.phase === 'burrow') {
            const prog = Math.min(1, this.burrowTimer / BURROW_DURATION);
            ctx.save();
            ctx.fillStyle = '#5c4a2e';
            ctx.beginPath();
            ctx.ellipse(Math.floor(this.x), Math.floor(this.y) + 12, 6 + prog * 5, 2 + prog * 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#8a7048';
            ctx.beginPath();
            ctx.ellipse(Math.floor(this.x), Math.floor(this.y) + 11, 4 + prog * 3, 1.5 + prog * 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        this.drawHpBar(ctx);
    }

    getLightOccluderSprites() {
        return []; // 小个子且频繁移动，跳过遮挡以省开销
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0 || this.phase === 'burrow') return;
        const barWidth = 22;
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 22);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#8fd15f';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
    }
}
