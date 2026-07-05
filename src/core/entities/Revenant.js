// Revenant —— 复生亡灵：绷带裹身的憔悴近战亡者。
// 第一次"死亡"不掉落：倒地成尸 3s（尸体可被补刀，尸体 HP 15，打碎则真死）；
// 未被打碎则半血复活并加速 20%（仅一次，复活爆发黑雾）。
// 关键：尸体阶段保持 hp>0 → WorldSystem 死亡清扫跳过，不触发 onKill/掉落；真死才 hp<=0。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';
import { PounceChargeBehavior } from './behaviors/PounceChargeBehavior.js';

const CORPSE_DURATION = 180;   // 尸体存续 3s
const CORPSE_HP = 15;          // 尸体血量（补刀阈值）
const TOUCH_DAMAGE = 10;
const TOUCH_RANGE = 24;
const TOUCH_COOLDOWN = 55;
const REVIVE_HP_FRAC = 0.5;
const REVIVE_SPEED_MULT = 1.2;

export class Revenant extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 26, 40, 1.4);

        this.spriteScale = 1.2;
        this.chase = new ChaseBehavior();
        // [tension-batch:ai] 冲刺扑击：憔悴亡者在距离带内蓄力后直线扑咬
        this.pounce = new PounceChargeBehavior();
        this.baseSpeed = 1.4;
        this.touchCooldown = 0;
        this.attackAnimTimer = 0;

        this.isCorpse = false;
        this.hasRevived = false;
        this.corpseTimer = 0;
        this.corpseHp = CORPSE_HP;
        this.combatSystem = null;
    }

    takeDamage(amount, knockback) {
        // 尸体阶段：伤害打在尸体血上，打碎则真死（不复活）
        if (this.isCorpse) {
            this.corpseHp -= amount;
            this.hitFlashTimer = 5;
            this.hpBarTimer = 120;
            if (this.corpseHp <= 0) {
                this.isCorpse = false;
                this.hp = 0; // 真死 → WorldSystem 清扫掉落 + onKill
            }
            return;
        }

        super.takeDamage(amount, knockback);

        // 首次致死 → 进入尸体状态（保持存活，跳过死亡清扫），而非真死
        if (this.hp <= 0 && !this.hasRevived) {
            this.hp = 1;               // 关键：>0 使 WorldSystem 不触发掉落/onKill
            this.isCorpse = true;
            this.corpseTimer = CORPSE_DURATION;
            this.corpseHp = CORPSE_HP;
            this.knockbackX = 0;
            this.knockbackY = 0;
            this.state = 'corpse';
        }
        // 若已复活过：hp<=0 保持，交由死亡清扫真死（正常掉落）
    }

    _revive() {
        this.isCorpse = false;
        this.hasRevived = true;
        this.hp = Math.max(1, Math.round(this.maxHp * REVIVE_HP_FRAC));
        this.speed = this.baseSpeed * REVIVE_SPEED_MULT;
        this.hpBarTimer = 120;
        this._spawnBlackMist(18);
    }

    _spawnBlackMist(n = 12) {
        const particles = this.combatSystem && this.combatSystem.particles;
        if (!particles) return;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = Math.random() * 1.8 + 0.4;
            particles.push({
                type: 'smoke',
                x: this.x + (Math.random() - 0.5) * 10,
                y: this.y + (Math.random() - 0.5) * 8,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd - 0.6,
                size: Math.random() * 8 + 5,
                color: Math.random() > 0.5 ? '#2a2233' : '#140f1c',
                life: 30 + Math.random() * 20,
                alpha: 0.75
            });
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        this.combatSystem = combatSystem;

        // 尸体阶段：不动不攻击，倒计时到点复活
        if (this.isCorpse) {
            this.animationTimer++;
            if (this.hitFlashTimer > 0) this.hitFlashTimer--;
            if (this.hpBarTimer > 0) this.hpBarTimer--;
            this.corpseTimer--;
            if (this.corpseTimer <= 0) this._revive();
            return;
        }

        super.update(player, walls, wallQuery);
        if (this.frozenTimer > 0) return;

        if (this.touchCooldown > 0) this.touchCooldown--;
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;
        this.facingRight = player.x > this.x;

        // 近战接触伤害
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy < TOUCH_RANGE * TOUCH_RANGE
            && this.touchCooldown <= 0
            && player.state !== 'roll' && player.state !== 'driving'
            && player.takeDamage) {
            const a = Math.atan2(dy, dx);
            const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
            player.takeDamage(Math.round(TOUCH_DAMAGE * mult), { x: Math.cos(a) * 5, y: Math.sin(a) * 5 });
            this.touchCooldown = TOUCH_COOLDOWN;
            this.attackAnimTimer = 24;
        }

        const ctx = {
            enemy: this, player, walls, wallQuery,
            getFlowDirection, getNavDirection, moveResolver, combatSystem
        };

        // [tension-batch:ai] 冲刺扑击优先：距离带内概率蓄力后 1.5x 直线扑击（接触伤害已在上方照常结算）
        if (this.pounce.update(ctx)) {
            if (this.pounce.dirX !== 0 || this.pounce.dirY !== 0) {
                this.facingRight = this.pounce.dirX > 0;
            }
            // 蓄力保持扑咬姿态（attackAnim），扑击/硬直走奔跑动画
            if (this.pounce.isTelegraphing) this.attackAnimTimer = Math.max(this.attackAnimTimer, 2);
            this.state = 'run';
            return;
        }

        this.chase.update(ctx);
        this.state = 'run';
    }

    _frameSet() {
        const a = Assets.revenant;
        if (!a) return null;
        return this.hasRevived ? a.revived : a.normal;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        if (this.isCorpse) {
            this._drawCorpse(ctx);
            return;
        }

        // [tension-batch:ai] 扑击蓄力方向预警线（紫，随蓄力渐亮）
        const pounceLine = this.pounce && this.pounce.getTelegraphLine(this);
        if (pounceLine) {
            ctx.save();
            ctx.globalAlpha = 0.25 + pounceLine.progress * 0.5;
            ctx.strokeStyle = '#b04dff';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(pounceLine.x1, pounceLine.y1);
            ctx.lineTo(pounceLine.x2, pounceLine.y2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        const set = this._frameSet();
        if (!set) { this.drawHpBar(ctx); return; }
        const frames = this.attackAnimTimer > 0 ? set.attack : (this.state === 'run' ? set.run : set.idle);
        if (!frames || frames.length === 0) { this.drawHpBar(ctx); return; }

        let frameIndex;
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / 24;
            frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
        } else {
            frameIndex = Math.floor(this.animationTimer / 7) % frames.length;
        }
        const sprite = frames[frameIndex];

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(this.facingRight ? -s : s, s);
        ctx.drawImage(sprite, -16, -16);
        if (this.hitFlashTimer > 0) {
            ctx.save();
            ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
            ctx.drawImage(sprite, -16, -16);
            ctx.restore();
        }
        // [tension-batch:ai] 扑击蓄力：紫色脉冲变色预警
        if (this.pounce && this.pounce.isTelegraphing) {
            const ph = this.pounce.getPhase();
            ctx.save();
            ctx.globalAlpha = 0.3 + 0.35 * (ph ? ph.progress : 0);
            ctx.filter = 'brightness(160%) sepia(100%) saturate(500%) hue-rotate(230deg)';
            ctx.drawImage(sprite, -16, -16);
            ctx.restore();
        }
        ctx.restore();

        this.drawHpBar(ctx);
    }

    /** 尸体：倒地的憔悴躯壳（旋转压暗的待机帧）+ 复活临近的红光抽搐。 */
    _drawCorpse(ctx) {
        const idle = (Assets.revenant && Assets.revenant.normal.idle) || null;
        const sprite = idle && idle[0];
        const nearRevive = this.corpseTimer < 60; // 最后 1s 抽搐预警
        const twitch = nearRevive ? Math.round((Math.random() - 0.5) * 2) : 0;

        ctx.save();
        ctx.translate(Math.floor(this.x) + twitch, Math.floor(this.y) + 8);
        ctx.rotate(Math.PI / 2 - 0.25); // 倒地
        const s = this.spriteScale || 1;
        ctx.scale(s, s);
        if (sprite) {
            ctx.globalAlpha = 0.9;
            ctx.drawImage(sprite, -16, -16);
            // 压暗
            ctx.globalCompositeOperation = 'source-atop';
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = '#0c0812';
            ctx.fillRect(-16, -16, 32, 32);
            // 复活临近的红光
            if (nearRevive) {
                ctx.globalAlpha = 0.25 + 0.25 * Math.sin(this.animationTimer * 0.6);
                ctx.fillStyle = '#ff2a1a';
                ctx.fillRect(-16, -16, 32, 32);
            }
        }
        ctx.restore();

        this._drawCorpseBar(ctx);
    }

    _drawCorpseBar(ctx) {
        const barWidth = 22;
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y + 16);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#8a2be2';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.corpseHp / CORPSE_HP), barHeight);
        // 复活倒计时条（底部）
        const t = 1 - this.corpseTimer / CORPSE_DURATION;
        ctx.fillStyle = 'rgba(255,60,40,0.7)';
        ctx.fillRect(x, y + 4, barWidth * t, 1);
    }

    getLightOccluderSprites() {
        return [];
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0) return;
        const barWidth = 24;
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 24);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = this.hasRevived ? '#ff5a4a' : '#aeb89a';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
    }
}
