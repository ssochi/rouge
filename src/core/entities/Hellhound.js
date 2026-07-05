// Hellhound —— 地牢狱火犬：预警冲锋（红线）+ 冲锋撞击 + 非冲锋时贴近追击。
// 高机动压迫怪：远处逼近，进入触发距离后亮预警线 → 高速直线冲锋撞飞玩家。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { ChaseBehavior } from './behaviors/ChaseBehavior.js';
import { TelegraphedChargeBehavior } from './behaviors/TelegraphedChargeBehavior.js';

const CHARGE_HIT_RANGE = 24;
const CHARGE_DAMAGE = 12;
const CHARGE_KNOCKBACK = 11;

export class Hellhound extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 32, 1.4);

        this.spriteScale = 1.3;
        this.chase = new ChaseBehavior();
        this.charge = new TelegraphedChargeBehavior({
            triggerRange: 200,
            speedMult: 4.5,
            telegraphTime: 35,
            chargeTime: 24,
            recoverTime: 40,
            cooldown: 150,
            lineLength: 200
        });
        this.chargeHitDone = false; // 本次冲锋是否已命中（命中一次即止）
        this.combatSystem = null;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        // 冲锋中不翻转朝向（锁定冲锋方向），否则面向玩家
        if (this.charge.state !== 'charge' && this.charge.state !== 'telegraph') {
            this.facingRight = player.x > this.x;
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

        const took = this.charge.update(ctx);

        if (this.charge.state === 'charge') {
            this.state = 'attack';
            // 冲锋命中判定（每次冲锋只结算一次）
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if (!this.chargeHitDone
                && dx * dx + dy * dy < CHARGE_HIT_RANGE * CHARGE_HIT_RANGE
                && player.state !== 'roll' && player.state !== 'driving'
                && player.takeDamage) {
                const a = Math.atan2(dy, dx);
                const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
                player.takeDamage(Math.round(CHARGE_DAMAGE * mult), {
                    x: Math.cos(a) * CHARGE_KNOCKBACK,
                    y: Math.sin(a) * CHARGE_KNOCKBACK
                });
                this.chargeHitDone = true;
            }
        } else {
            this.chargeHitDone = false; // 非冲锋态复位，供下一次冲锋
            this.state = this.charge.state === 'telegraph' ? 'attack' : 'run';
        }

        // 预警/冲锋/恢复期实体不再自行移动；空闲时贴近追击
        if (!took) {
            this.chase.update(ctx);
            this.state = 'run';
        }
    }

    _currentFrames() {
        const assets = Assets.hellhound;
        if (!assets) return null;
        if (this.state === 'attack') return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        // 冲锋预警线（world 空间，红色半透明，随蓄力渐亮）
        const line = this.charge.getTelegraphLine(this);
        if (line) {
            ctx.save();
            ctx.globalAlpha = 0.2 + line.progress * 0.5;
            ctx.strokeStyle = '#ff4530';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(this.facingRight ? -s : s, s);

        const frames = this._currentFrames();
        if (frames) {
            let frameIndex;
            if (this.state === 'attack') {
                frameIndex = Math.floor(this.animationTimer / 4) % frames.length;
            } else {
                frameIndex = Math.floor(this.animationTimer / (this.state === 'run' ? 4 : 6)) % frames.length;
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
        const sprite = frames[Math.floor(this.animationTimer / 5) % frames.length];
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
        const barHeight = 3;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 22);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#ff8a3a';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
    }
}
