// Spinner —— 焰旋妖：悬浮火焰陀螺妖。Kite 拉扯 + spiral 螺旋弹幕（旋转扫射）。
// 径向对称，无左右翻转；开火期间切高速旋转 attack 帧。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';
import { RangedPatternBehavior } from './behaviors/RangedPatternBehavior.js';

export class Spinner extends Enemy {
    constructor(x, y) {
        super(x, y, 22, 22, 45, 0.8);

        this.spriteScale = 1.3;
        this.kite = new KiteBehavior({ near: 150, far: 260 });
        this.pattern = new RangedPatternBehavior({
            patterns: [
                { kind: 'spiral', count: 14, interval: 4, stepRad: 0.45, speed: 2.8, damage: 7, color: '#ff7a1e', size: 5, life: 130, weight: 1 }
            ],
            cooldown: 150,
            range: 300
        });
        this.combatSystem = null;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

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

        const firing = this.pattern.update(ctx);
        if (firing) {
            this.state = 'combat';
        } else {
            this.kite.update(ctx);
            this.state = 'run';
        }
    }

    _currentFrames() {
        const assets = Assets.spinner;
        if (!assets) return null;
        if (this.pattern.isFiring) return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        const s = this.spriteScale || 1;
        ctx.scale(s, s); // 径向对称，不翻转

        const frames = this._currentFrames();
        if (frames) {
            // 开火高速旋转（帧步进更快）
            const div = this.pattern.isFiring ? 4 : 7;
            const frameIndex = Math.floor(this.animationTimer / div) % frames.length;
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
        const sprite = frames[Math.floor(this.animationTimer / 7) % frames.length];
        if (!sprite) return [];
        return [{
            kind: 'sprite',
            sprite,
            pivotX: this.x,
            pivotY: this.y,
            originX: 16,
            originY: 16,
            rotation: 0,
            flipX: false
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
        ctx.fillStyle = '#ff7a1e';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#4a1c08';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
