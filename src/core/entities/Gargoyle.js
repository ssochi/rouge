// Gargoyle —— 地牢石像鬼：伏击怪。初始石化静立（可被攻击），受击或玩家逼近则破石苏醒 → 追击接触。
// 混入石雕的陷阱怪：dormant 期完全不动、伪装成场景雕像，苏醒后展翼扑击。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';

const WAKE_RANGE = 140;
const WAKE_FRAMES = 20;
const TOUCH_DAMAGE = 10;
const TOUCH_RANGE = 24;
const TOUCH_COOLDOWN = 55;
const SHARD_COUNT = 6;
const SHARD_COLORS = ['#5d6370', '#727986', '#454b56'];

export class Gargoyle extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 30, 1.6);

        this.spriteScale = 1.3;
        this.chase = new ChaseBehavior();
        this.dormant = true;   // 石化伏击态
        this.wakeTimer = 0;    // >0 破石苏醒动画中
        this.awake = false;
        this.touchCooldown = 0;
        this.combatSystem = null;
        this._lastPlayer = null;
    }

    takeDamage(amount, knockback) {
        super.takeDamage(amount, knockback);
        // 受击即苏醒（仍照常结算伤害）
        if (this.hp > 0 && this.dormant) this._wake();
    }

    /** 破石苏醒：进入苏醒动画并向四周喷灰色碎石粒子。 */
    _wake() {
        if (!this.dormant) return;
        this.dormant = false;
        this.wakeTimer = WAKE_FRAMES;
        if (this._lastPlayer) this.facingRight = this._lastPlayer.x > this.x;
        const cs = this.combatSystem;
        if (cs && cs.particles) {
            for (let i = 0; i < SHARD_COUNT; i++) {
                const a = (Math.PI * 2 / SHARD_COUNT) * i + Math.random() * 0.4;
                const spd = Math.random() * 1.5 + 1;
                cs.particles.push({
                    x: this.x,
                    y: this.y - 4,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd - 0.5,
                    size: Math.random() * 2 + 1.5,
                    color: SHARD_COLORS[i % SHARD_COLORS.length],
                    life: 22 + Math.floor(Math.random() * 10),
                    friction: 0.9
                });
            }
        }
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        this._lastPlayer = player;
        if (this.frozenTimer > 0) return;

        // 石化态：静立不动，仅监测玩家逼近
        if (this.dormant) {
            this.state = 'dormant';
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if (dx * dx + dy * dy < WAKE_RANGE * WAKE_RANGE) this._wake();
            return;
        }

        // 破石苏醒动画：定身播放
        if (this.wakeTimer > 0) {
            this.wakeTimer--;
            this.state = 'wake';
            this.facingRight = player.x > this.x;
            if (this.wakeTimer <= 0) this.awake = true;
            return;
        }

        // 苏醒后：追击 + 接触伤害
        this.facingRight = player.x > this.x;
        if (this.touchCooldown > 0) this.touchCooldown--;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        if (dx * dx + dy * dy < TOUCH_RANGE * TOUCH_RANGE
            && this.touchCooldown <= 0
            && player.state !== 'roll' && player.state !== 'driving') {
            if (player.takeDamage) {
                const a = Math.atan2(dy, dx);
                const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
                player.takeDamage(Math.round(TOUCH_DAMAGE * mult), {
                    x: Math.cos(a) * 6,
                    y: Math.sin(a) * 6
                });
            }
            this.touchCooldown = TOUCH_COOLDOWN;
        }

        const ctx = {
            enemy: this,
            player,
            walls,
            wallQuery,
            getFlowDirection,
            getNavDirection,
            moveResolver,
            combatSystem
        };
        this.chase.update(ctx);
        this.state = 'run';
    }

    _currentFrames() {
        const assets = Assets.gargoyle;
        if (!assets) return null;
        if (this.state === 'dormant') return assets.dormant;
        if (this.state === 'wake') return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(this.facingRight ? -s : s, s);

        const frames = this._currentFrames();
        if (frames) {
            let frameIndex;
            if (this.state === 'wake') {
                // 破石动画用 Attack 帧前段（按苏醒进度推进）
                const progress = 1 - this.wakeTimer / WAKE_FRAMES;
                frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
            } else if (this.state === 'dormant') {
                frameIndex = 0;
            } else {
                frameIndex = Math.floor(this.animationTimer / (this.state === 'run' ? 5 : 7)) % frames.length;
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

    getLightOccluderSprites() {
        if (this.hp <= 0 || this.blocksLight === false) return [];
        const frames = this._currentFrames();
        if (!frames || frames.length === 0) return [];
        const idx = frames.length === 1 ? 0 : Math.floor(this.animationTimer / 6) % frames.length;
        const sprite = frames[idx];
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
        const barWidth = 26;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 24);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#8a909a';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
