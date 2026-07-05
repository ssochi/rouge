// Burrower —— 掘地虫：潜地无敌接近，破土 AoE 后露头，露头窗口才可被击杀。
// 循环状态机：submerged(潜地追踪·无敌) → warning(破土预警圈) → exposed(出土AoE + 2s露头可打)。
import { Enemy } from './Enemy.js';
import { Assets } from '../../graphics/Assets.js';
import { steerToward } from './behaviors/BehaviorUtils.js';

const SUBMERGE_DURATION = 150; // 潜地追踪 2.5s
const WARNING_DURATION = 36;   // 破土预警 0.6s
const EXPOSED_DURATION = 120;  // 露头可打窗口 2s
const EMERGE_ANIM = 14;        // 出土爆发动画帧长
const AOE_RADIUS = 50;         // 出土 AoE 半径
const AOE_DAMAGE = 12;         // 出土 AoE 伤害
const AOE_KNOCK = 4;
const TRACK_SPEED = 1.35;

export class Burrower extends Enemy {
    constructor(x, y) {
        super(x, y, 26, 26, 45, TRACK_SPEED);

        this.spriteScale = 1.25;
        this.phase = 'submerged';      // submerged | warning | exposed
        this.phaseTimer = 0;
        this.attackAnimTimer = 0;      // 出土爆发帧
        this.moundPhase = 0;           // 地表隆起土痕动画相位
        this.combatSystem = null;
    }

    _enterPhase(name) {
        this.phase = name;
        this.phaseTimer = 0;
        if (name === 'submerged') {
            // 潜地：免疫控制 + 清除残留 DOT，实现真正无敌
            this.frozenTimer = 0;
            this.slowTimer = 0;
            this.slowAmount = 0;
            this.burnTimer = 0;
            this.poisonTimer = 0;
            this.bleedTimer = 0;
            this.needleTimer = 0;
            this.needleStacks = 0;
            this.knockbackX = 0;
            this.knockbackY = 0;
        }
    }

    // 潜地/预警阶段无敌：直接吞掉一切来自 takeDamage 的伤害（子弹另经 hurtbox=null 拦截）。
    takeDamage(amount, knockback) {
        if (this.phase !== 'exposed') return;
        super.takeDamage(amount, knockback);
    }

    // 潜地/预警时清空 hurtbox → 子弹判定跳过（露头才可命中）。
    getBulletHurtbox() {
        if (this.phase !== 'exposed') return null;
        return super.getBulletHurtbox();
    }

    _emergeAoE() {
        if (!this.combatSystem || !this.combatSystem.spawnGroundSlam) return;
        const mult = Number.isFinite(this.damageMult) ? this.damageMult : 1;
        this.combatSystem.spawnGroundSlam(
            this.x, this.y,
            Math.round(AOE_DAMAGE * mult),
            AOE_RADIUS, AOE_KNOCK,
            '#6b573b'
        );
    }

    _spawnTrailDirt() {
        const particles = this.combatSystem && this.combatSystem.particles;
        if (!particles) return;
        const a = Math.random() * Math.PI * 2;
        particles.push({
            x: this.x + (Math.random() - 0.5) * 12,
            y: this.y + 10,
            vx: Math.cos(a) * 0.6,
            vy: -Math.random() * 1.2 - 0.3,
            life: 14 + Math.random() * 8,
            color: Math.random() > 0.5 ? '#6b573b' : '#463726',
            size: Math.random() * 2 + 1,
            gravity: 0.12,
            friction: 0.95
        });
    }

    update(player, walls, wallQuery, getFlowDirection, getNearbyEnemies, getNavDirection, combatSystem, moveResolver) {
        if (this.hp <= 0) return;
        super.update(player, walls, wallQuery);
        this.combatSystem = combatSystem;

        this.phaseTimer++;
        this.moundPhase = (this.moundPhase + 0.06) % 1;
        if (this.attackAnimTimer > 0) this.attackAnimTimer--;
        this.facingRight = player.x > this.x;

        const ctx = {
            enemy: this, player, walls, wallQuery,
            getFlowDirection, getNavDirection, moveResolver, combatSystem
        };

        if (this.phase === 'submerged') {
            // 潜地追踪（无视冰冻控制，恒速逼近）；地表留隆起土痕 + 泥屑
            steerToward(ctx, player.x, player.y, 1, true);
            if (this.phaseTimer % 4 === 0) this._spawnTrailDirt();
            if (this.phaseTimer >= SUBMERGE_DURATION) this._enterPhase('warning');
            return;
        }

        if (this.phase === 'warning') {
            // 原地蓄力，显示破土预警圈
            if (this.phaseTimer >= WARNING_DURATION) {
                this._enterPhase('exposed');
                this.attackAnimTimer = EMERGE_ANIM;
                this._emergeAoE();
            }
            return;
        }

        // exposed：露头可打，基本不动；窗口结束重新潜地
        if (this.frozenTimer > 0) return;
        if (this.phaseTimer >= EXPOSED_DURATION) {
            this._enterPhase('submerged');
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        // 潜地 / 预警：只画地表隆起土痕（+ 预警圈），不画虫体
        if (this.phase === 'submerged' || this.phase === 'warning') {
            this._drawMound(ctx);
            if (this.phase === 'warning') this._drawWarningRing(ctx);
            return;
        }

        // exposed：破土虫体（出土用 attack 爆发帧，之后 idle）
        const frames = this.attackAnimTimer > 0 ? Assets.burrower?.attack : Assets.burrower?.idle;
        if (!frames || frames.length === 0) return;

        let frameIndex;
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / EMERGE_ANIM;
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
        ctx.restore();

        this.drawHpBar(ctx);
    }

    _drawMound(ctx) {
        const x = Math.floor(this.x);
        const y = Math.floor(this.y) + 10;
        const bump = Math.sin(this.moundPhase * Math.PI * 2) * 1.2;
        ctx.save();
        ctx.fillStyle = '#463726';
        ctx.beginPath();
        ctx.ellipse(x, y, 9, 3 + bump, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6b573b';
        ctx.beginPath();
        ctx.ellipse(x, y - 1, 6, 2 + bump * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 顶部小裂痕（隆起感）
        ctx.strokeStyle = '#2f261a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 3, y - 1);
        ctx.lineTo(x + 3, y - 1);
        ctx.stroke();
        ctx.restore();
    }

    _drawWarningRing(ctx) {
        const x = Math.floor(this.x);
        const y = Math.floor(this.y) + 8;
        const prog = Math.min(1, this.phaseTimer / WARNING_DURATION);
        const r = AOE_RADIUS * (0.4 + prog * 0.6);
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.4 * Math.sin(prog * Math.PI * 6) * 0.5 + 0.3;
        ctx.strokeStyle = '#ff6a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        // 内圈填充预警
        ctx.globalAlpha = 0.12 * prog;
        ctx.fillStyle = '#ff8a3a';
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    getLightOccluderSprites() {
        return []; // 破土/潜地形态不参与静态光照遮挡
    }

    drawHpBar(ctx) {
        if (this.hpBarTimer <= 0 || this.phase !== 'exposed') return;
        const barWidth = 26;
        const barHeight = 4;
        const x = Math.floor(this.x - barWidth / 2);
        const y = Math.floor(this.y - 26);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#c9a86a';
        ctx.fillRect(x, y, barWidth * Math.max(0, this.hp / this.maxHp), barHeight);
    }
}
