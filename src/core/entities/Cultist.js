// Cultist —— 地牢炼狱僧侣：距离带拉扯（kite）+ 蓄力后三发幽焰弹幕。
// 慢速大弹（与 archer 快箭区分）：蓄力可见，锁定后玩家侧移穿隙即可躲。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';

const CAST_RANGE = 300;
const CAST_FRAMES = 30;     // 蓄力总帧
const LOCK_FRAMES = 8;      // 末段锁定方向
const CAST_COOLDOWN = 110;
const BOLT_COUNT = 3;
const BOLT_SPREAD = 0.25;   // 三发角度间隔（弧度）
const BOLT_DAMAGE = 10;
const BOLT_SPEED = 2.2;
const BOLT_SIZE = 7;
const BOLT_LIFE = 160;
const BOLT_COLOR = '#7ef7d4';

export class Cultist extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 20, 0.9);

        this.spriteScale = 1.3;
        this.kite = new KiteBehavior({ near: 170, far: 280 });
        this.castTimer = 0;     // >0 蓄力中
        this.castAngle = 0;
        this.castCooldown = Math.floor(CAST_COOLDOWN * 0.5);
        this.combatSystem = null;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;

        // 蓄力施法：前段跟踪玩家、末段锁定方向，结束齐射三弹
        if (this.castTimer > 0) {
            this.castTimer--;
            this.state = 'combat';
            if (this.castTimer > LOCK_FRAMES) {
                this.castAngle = Math.atan2(player.y - 4 - this.y, player.x - this.x);
            }
            if (this.castTimer === 0) {
                this._cast(combatSystem);
                this.castCooldown = CAST_COOLDOWN;
            }
            return; // 施法时定身
        }

        if (this.castCooldown > 0) this.castCooldown--;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        if (this.castCooldown <= 0 && distSq < CAST_RANGE * CAST_RANGE) {
            const canSee = !combatSystem || !combatSystem.canShootFrom
                ? true
                : combatSystem.canShootFrom(this, { x: this.x, y: this.y - 4 }, player);
            if (canSee) {
                this.castTimer = CAST_FRAMES;
                this.state = 'combat';
                return;
            }
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
        this.kite.update(ctx);
        this.state = 'run';
    }

    /** 齐射三发大而慢的幽焰弹（等角度散开）。 */
    _cast(combatSystem) {
        if (!combatSystem || !combatSystem.spawnEnemyBullet) return;
        const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
        for (let i = 0; i < BOLT_COUNT; i++) {
            const angle = this.castAngle + (i - (BOLT_COUNT - 1) / 2) * BOLT_SPREAD;
            combatSystem.spawnEnemyBullet({
                x: this.x + Math.cos(angle) * 12,
                y: this.y - 4 + Math.sin(angle) * 12,
                angle,
                damage: Math.round(BOLT_DAMAGE * mult),
                speed: BOLT_SPEED,
                color: BOLT_COLOR,
                size: BOLT_SIZE,
                life: BOLT_LIFE,
                owner: this
            });
        }
    }

    _currentFrames() {
        const assets = Assets.cultist;
        if (!assets) return null;
        if (this.castTimer > 0) return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        // 蓄力提示线（幽绿，渐亮，锁定段定格）
        if (this.castTimer > 0) {
            const progress = 1 - this.castTimer / CAST_FRAMES;
            const locked = this.castTimer <= LOCK_FRAMES;
            const len = 200;
            ctx.save();
            ctx.globalAlpha = locked ? 0.75 : 0.15 + progress * 0.3;
            ctx.strokeStyle = locked ? '#7ef7d4' : '#4fbfa2';
            ctx.lineWidth = 1;
            ctx.setLineDash(locked ? [] : [4, 4]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 4);
            ctx.lineTo(this.x + Math.cos(this.castAngle) * len, this.y - 4 + Math.sin(this.castAngle) * len);
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
            if (this.castTimer > 0) {
                const progress = 1 - this.castTimer / CAST_FRAMES;
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
        ctx.fillStyle = '#7ef7d4';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#22383a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
