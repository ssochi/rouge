// RainArcher —— 雨幕射手：不打直线弹，朝天抛射。举弓蓄力(明显前摇)后撒放，
// 2s 抛射飞行后在玩家「撒放瞬间所在位置及周边」落下 3 个箭雨预警圈：
// 红圈半径 36、显示 0.8s 后落箭 AoE 伤 10，三圈错开 0.3s——人潮中被迫边躲圈边挤位。
// 延迟 AoE 经 WorldSystem.spawnDelayedAoe 登记（脱离射手独立结算，射手中途死亡箭雨照落）。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';

const AIM_RANGE = 340;
const AIM_FRAMES = 45;       // 举弓朝天前摇（明显动作 ~0.75s）
const SHOT_COOLDOWN = 150;   // 抛射间冷却 ~2.5s

const ARROW_TRAVEL = 120;    // 抛射滞空（不可见）~2s
const WARN_FRAMES = 48;      // 预警红圈显示时长 ~0.8s
const STRIKE_STAGGER = 18;   // 三圈落点错开 ~0.3s
const STRIKE_COUNT = 3;
const STRIKE_RADIUS = 36;
const STRIKE_DAMAGE = 10;
const STRIKE_KNOCK = 3;
const STRIKE_COLOR = '#ff5040';

export class RainArcher extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 26, 0.85);

        this.spriteScale = 1.3; // 体型与角色同级
        this.kite = new KiteBehavior({ near: 160, far: 280 });
        this.aimTimer = 0;      // >0 举弓蓄力中
        this.shotCooldown = Math.floor(SHOT_COOLDOWN * 0.5);
        this.combatSystem = null;
        this.worldSystem = null;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;

        // 举弓朝天蓄力：定身完成前摇，撒放帧登记箭雨
        if (this.aimTimer > 0) {
            this.aimTimer--;
            this.state = 'combat';
            if (this.aimTimer === 0) {
                this._loose(player);
                this.shotCooldown = SHOT_COOLDOWN;
            }
            return; // 蓄力定身
        }

        if (this.shotCooldown > 0) this.shotCooldown--;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        // 进入抛射距离即起手（抛射越掩体，无需视线）
        if (this.shotCooldown <= 0 && distSq < AIM_RANGE * AIM_RANGE) {
            this.aimTimer = AIM_FRAMES;
            this.state = 'combat';
            return;
        }

        const ctx = {
            enemy: this, player, walls, wallQuery,
            getFlowDirection, getNavDirection, moveResolver, combatSystem
        };
        this.kite.update(ctx);
        this.state = 'run';
    }

    /** 撒放：以玩家当前位置为中心，登记 3 个错开的延迟箭雨 AoE。 */
    _loose(player) {
        const ws = this.worldSystem;
        if (!ws || !ws.spawnDelayedAoe) return;
        const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
        const damage = Math.round(STRIKE_DAMAGE * mult);

        for (let i = 0; i < STRIKE_COUNT; i++) {
            // 第 0 圈落在玩家脚下，其余散布在周边（28~52px）
            let ox = 0;
            let oy = 0;
            if (i > 0) {
                const a = Math.random() * Math.PI * 2;
                const r = 28 + Math.random() * 24;
                ox = Math.cos(a) * r;
                oy = Math.sin(a) * r;
            }
            ws.spawnDelayedAoe({
                x: player.x + ox,
                y: player.y + oy,
                radius: STRIKE_RADIUS,
                delay: ARROW_TRAVEL + WARN_FRAMES + i * STRIKE_STAGGER,
                warnFrames: WARN_FRAMES,
                damage,
                knockback: STRIKE_KNOCK,
                color: STRIKE_COLOR
            });
        }

        // 撒放的弦颤粒子
        const particles = this.combatSystem && this.combatSystem.particles;
        if (particles) {
            for (let i = 0; i < 4; i++) {
                particles.push({
                    x: this.x - 6,
                    y: this.y - 6,
                    vx: -0.4 - Math.random() * 0.6,
                    vy: -1.4 - Math.random(),
                    life: 14,
                    color: '#e6e0cf',
                    size: 1,
                    gravity: 0.05,
                    friction: 0.95
                });
            }
        }
    }

    _currentFrames() {
        const assets = Assets.rainArcher;
        if (!assets) return null;
        if (this.aimTimer > 0) return assets.attack;
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
            if (this.aimTimer > 0) {
                const progress = 1 - this.aimTimer / AIM_FRAMES;
                frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
            } else {
                frameIndex = Math.floor(this.animationTimer / 9) % frames.length;
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
        const sprite = frames[Math.floor(this.animationTimer / 9) % frames.length];
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
        const y = Math.floor(this.y - 25);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#c9bfa0';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
