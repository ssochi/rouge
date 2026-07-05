// Weeper —— 怨眼：漂浮巨眼。Kite 拉扯 + wave_volley 波浪泪弹（幽蓝蛇形弹）。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';
import { RangedPatternBehavior } from './behaviors/RangedPatternBehavior.js';

export class Weeper extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 24, 40, 0.7);

        this.spriteScale = 1.3;
        this.kite = new KiteBehavior({ near: 180, far: 300 });
        this.pattern = new RangedPatternBehavior({
            patterns: [
                { kind: 'wave_volley', count: 3, spreadDeg: 14, speed: 3, damage: 8, color: '#8fd4ff', size: 6, life: 160, waveAmplitude: 16, waveFrequency: 0.13, weight: 1 }
            ],
            cooldown: 130,
            range: 320
        });
        this.attackAnimTimer = 0;
        this.combatSystem = null;
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;
        if (this.frozenTimer > 0) return;

        this.facingRight = player.x > this.x;

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
            this.attackAnimTimer = 28; // 泪涌动画时长
            this.state = 'combat';
        } else {
            this.kite.update(ctx);
            this.state = 'run';
        }
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;
    }

    _currentFrames() {
        const assets = Assets.weeper;
        if (!assets) return null;
        if (this.attackAnimTimer > 0) return assets.attack;
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
            if (this.attackAnimTimer > 0) {
                const progress = 1 - this.attackAnimTimer / 28;
                frameIndex = Math.min(frames.length - 1, Math.floor(progress * frames.length));
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
        ctx.fillStyle = '#8fd4ff';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#1e3a4a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
