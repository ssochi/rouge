// Summoner —— 地牢召唤师：Kite 远离 + 周期召唤僵尸小队（上限控制）。
// 召唤物经 DungeonManager.registerSpawnedEnemy 计入当前房间清除判定并应用楼层缩放。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { KiteBehavior } from './behaviors/KiteBehavior.js';
import { SummonBehavior } from './behaviors/SummonBehavior.js';
import { TILE_SIZE } from '../../utils/Constants.js';

export class Summoner extends Enemy {
    constructor(x, y) {
        super(x, y, 20, 20, 35, 0.8);

        this.kite = new KiteBehavior({ near: 190, far: 300 });
        this.summon = new SummonBehavior({
            interval: 300,
            batch: 2,
            cap: 4,
            castTime: 48,
            range: 430,
            onSummon: (index) => this._summonMinion(index)
        });
        this.combatSystem = null;
        this.worldSystem = null; // spawnEnemy 统一注入
    }

    _summonMinion(index) {
        if (!this.worldSystem) return null;

        // 在自身周围找落点（6 次尝试）
        for (let attempt = 0; attempt < 6; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 28 + Math.random() * 30;
            const tx = Math.floor((this.x + Math.cos(angle) * dist) / TILE_SIZE);
            const ty = Math.floor((this.y + Math.sin(angle) * dist) / TILE_SIZE);
            const minion = this.worldSystem.spawnEnemy('zombie', { tileX: tx, tileY: ty, strict: true });
            if (minion) {
                // 计入当前房间（清除判定）+ 楼层缩放
                if (this.worldSystem.dungeonManager) {
                    this.worldSystem.dungeonManager.registerSpawnedEnemy(minion, this);
                }
                this._spawnSummonParticles(minion.x, minion.y);
                return minion;
            }
        }
        return null;
    }

    _spawnSummonParticles(x, y) {
        const particles = this.combatSystem && this.combatSystem.particles;
        if (!particles) return;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            particles.push({
                x,
                y: y - 6,
                vx: Math.cos(a) * 1.6,
                vy: Math.sin(a) * 1.6 - 0.8,
                life: 22,
                color: i % 2 === 0 ? '#7eff8e' : '#d8ffd8',
                size: 3,
                friction: 0.9
            });
        }
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

        const casting = this.summon.update(ctx);
        if (casting) {
            this.state = 'combat'; // 施法定身
            return;
        }

        this.kite.update(ctx);
        this.state = 'run';
    }

    _currentFrames() {
        const assets = Assets.summoner;
        if (!assets) return null;
        if (this.summon.isCasting) return assets.attack;
        if (this.state === 'run') return assets.run;
        return assets.idle;
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        if (this.facingRight) ctx.scale(-1, 1);

        const frames = this._currentFrames();
        if (frames) {
            let frameIndex;
            if (this.summon.isCasting) {
                frameIndex = Math.min(frames.length - 1, Math.floor(this.summon.castProgress * frames.length));
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
        ctx.fillStyle = '#7eff8e';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
