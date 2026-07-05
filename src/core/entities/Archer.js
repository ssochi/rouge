// Archer —— 地牢骷髅弩手（狱卒亡骨）：蓄力瞄准线 + 锁定后击发直线快箭。
// F1 的「公平远程」教学怪：瞄准线全程可见，锁定后侧移即可躲开——
// 玩家反馈枪兵（真枪连射）压制过强，弩手用「单发-重预警-高伤」替代其生态位。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';

const AIM_RANGE = 330;
const AIM_FRAMES = 55;      // 蓄力总帧数
const LOCK_FRAMES = 14;     // 末段锁定（瞄准线定格，可侧躲）
const SHOT_COOLDOWN = 95;
const BOLT_DAMAGE = 12;
const BOLT_SPEED = 8;

export class Archer extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 22, 0.85);

        this.spriteScale = 1.3; // 体型与角色同级
        this.kite = new KiteBehavior({ near: 150, far: 250 }); // [tension-batch:ai] 远程走位：距离带 150-250（<150 后撤 / >250 逼近）
        this.aimTimer = 0;      // >0 蓄力瞄准中
        this.aimAngle = 0;
        this.shotCooldown = Math.floor(SHOT_COOLDOWN * 0.5);
        this.combatSystem = null;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;

        // 蓄力瞄准：前段跟踪玩家，末段锁定方向（玩家侧移可躲）
        if (this.aimTimer > 0) {
            this.aimTimer--;
            this.state = 'combat';
            if (this.aimTimer > LOCK_FRAMES) {
                this.aimAngle = Math.atan2(player.y - 4 - this.y, player.x - this.x);
            }
            if (this.aimTimer === 0) {
                this._fire(combatSystem);
                this.shotCooldown = SHOT_COOLDOWN;
            }
            return; // 瞄准时定身
        }

        if (this.shotCooldown > 0) this.shotCooldown--;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        if (this.shotCooldown <= 0 && distSq < AIM_RANGE * AIM_RANGE) {
            // 有视线才开始瞄准
            const canSee = !combatSystem || !combatSystem.canShootFrom
                ? true
                : combatSystem.canShootFrom(this, { x: this.x, y: this.y - 4 }, player);
            if (canSee) {
                this.aimTimer = AIM_FRAMES;
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

    _fire(combatSystem) {
        if (!combatSystem || !combatSystem.spawnEnemyBullet) return;
        combatSystem.spawnEnemyBullet({
            x: this.x + Math.cos(this.aimAngle) * 12,
            y: this.y - 4 + Math.sin(this.aimAngle) * 12,
            angle: this.aimAngle,
            damage: BOLT_DAMAGE,
            speed: BOLT_SPEED,
            color: '#ffd23e',
            size: 3,
            life: 90,
            owner: this
        });
    }

    _currentFrames() {
        const assets = Assets.archer;
        if (!assets) return null;
        if (this.aimTimer > 0) return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        // 瞄准线（world 空间）：蓄力渐亮，锁定段定格变红
        if (this.aimTimer > 0) {
            const progress = 1 - this.aimTimer / AIM_FRAMES;
            const locked = this.aimTimer <= LOCK_FRAMES;
            const len = 240;
            ctx.save();
            ctx.globalAlpha = locked ? 0.8 : 0.18 + progress * 0.35;
            ctx.strokeStyle = locked ? '#ff5040' : '#ffd23e';
            ctx.lineWidth = 1;
            ctx.setLineDash(locked ? [] : [4, 4]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 4);
            ctx.lineTo(this.x + Math.cos(this.aimAngle) * len, this.y - 4 + Math.sin(this.aimAngle) * len);
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
        ctx.fillStyle = '#d8d2c0';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
