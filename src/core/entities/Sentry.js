// Sentry —— 地牢哨戒炮：固定点区域封锁。索敌 → 蓄力（炮口聚能）→ 持续弹流压制 → 冷却。
// 不移动、免疫击退；拆掉它本身就是房间的子目标。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';

const SCAN_RANGE = 340;
const WINDUP_FRAMES = 55;
const FIRING_FRAMES = 140;
const FIRE_INTERVAL = 6;
const COOLDOWN_FRAMES = 100;

export class Sentry extends Enemy {
    constructor(x, y) {
        super(x, y, 22, 22, 45, 0);

        this.mode = 'scan'; // scan | windup | firing | cooldown
        this.modeTimer = 0;
        this.combatSystem = null;
        this.hitboxWidth = 18;
        this.hitboxHeight = 10;
    }

    takeDamage(amount) {
        // 固定炮台：免疫击退
        super.takeDamage(amount, null);
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        switch (this.mode) {
            case 'scan': {
                this.state = 'idle';
                if (distSq < SCAN_RANGE * SCAN_RANGE) {
                    this.mode = 'windup';
                    this.modeTimer = WINDUP_FRAMES;
                }
                break;
            }
            case 'windup': {
                this.state = 'combat';
                this.modeTimer--;
                if (this.modeTimer <= 0) {
                    this.mode = 'firing';
                    this.modeTimer = FIRING_FRAMES;
                }
                break;
            }
            case 'firing': {
                this.state = 'combat';
                this.modeTimer--;
                if (this.modeTimer % FIRE_INTERVAL === 0 && combatSystem && combatSystem.spawnEnemyBullet) {
                    const aim = Math.atan2(player.y - this.y, player.x - this.x);
                    // 小散布持续弹流
                    const spread = (Math.random() - 0.5) * 0.12;
                    combatSystem.spawnEnemyBullet({
                        x: this.x - (this.facingRight ? -10 : 10),
                        y: this.y - 2,
                        angle: aim + spread,
                        damage: 6,
                        speed: 4.6,
                        color: '#ffb347',
                        size: 3,
                        life: 110,
                        owner: this
                    });
                }
                if (this.modeTimer <= 0) {
                    this.mode = 'cooldown';
                    this.modeTimer = COOLDOWN_FRAMES;
                }
                break;
            }
            case 'cooldown': {
                this.state = 'idle';
                this.modeTimer--;
                if (this.modeTimer <= 0) {
                    this.mode = 'scan';
                }
                break;
            }
            default:
                this.mode = 'scan';
        }
    }

    _currentFrames() {
        const assets = Assets.sentry;
        if (!assets) return null;
        if (this.mode === 'windup' || this.mode === 'firing') return assets.attack;
        return assets.idle;
    }

    _currentFrameIndex(frames) {
        if (this.mode === 'windup') {
            // 蓄力段映射前 5 帧
            const progress = 1 - this.modeTimer / WINDUP_FRAMES;
            return Math.min(4, Math.floor(progress * 5));
        }
        if (this.mode === 'firing') {
            // 开火段循环后 3 帧
            return 5 + (Math.floor(this.animationTimer / 4) % 3);
        }
        return Math.floor(this.animationTimer / 9) % frames.length;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        if (this.facingRight) ctx.scale(-1, 1);

        const frames = this._currentFrames();
        if (frames) {
            const frameIndex = this._currentFrameIndex(frames);
            const sprite = frames[Math.min(frameIndex, frames.length - 1)];
            ctx.drawImage(sprite, -16, -16);

            if (this.hitFlashTimer > 0) {
                ctx.save();
                ctx.filter = 'brightness(500%) sepia(100%) saturate(0%)';
                ctx.drawImage(sprite, -16, -16);
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
        const sprite = frames[Math.min(this._currentFrameIndex(frames), frames.length - 1)];
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
        ctx.fillStyle = '#ffb347';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
